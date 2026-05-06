export type GitHubStats = {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  codeReview: number;
  issues: number;
  repos: number;
  stars: number;
  latestCommit: string;
  latestRepo: string;
  latestTime: string;
  contributions: number[];
};

const GITHUB_USERNAME = (process.env.NEXT_PUBLIC_GITHUB_URL || '').split('/').pop() || 'bytedex';

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'portfolio-site' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function fetchJSON(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-site' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

type ContribPageData = {
  grid: number[];
  totalContributions: number;
  percentages: { commits: number; pullRequests: number; codeReview: number; issues: number };
};

/**
 * Scrapes the full contribution page:
 * - Contribution calendar grid (data-level 0-4, includes private if user enabled it)
 * - Total contributions count
 * - Activity breakdown percentages (Code review, Pull requests, Commits, Issues)
 */
async function fetchContributionPage(): Promise<ContribPageData | null> {
  const html = await fetchText(`https://github.com/users/${GITHUB_USERNAME}/contributions`);
  if (!html) return null;

  // Total contributions
  let totalContributions = 0;
  const totalMatch = html.match(/([\d,]+)\s*\n\s*contributions?\s+in\s+the\s+last\s+year/i)
    || html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i);
  if (totalMatch) {
    totalContributions = parseInt(totalMatch[1].replace(/,/g, ''), 10);
  }

  // Contribution grid levels
  const grid: number[] = [];
  const cellRegex = /data-level="(\d)"/g;
  let match;
  while ((match = cellRegex.exec(html)) !== null) {
    grid.push(parseInt(match[1], 10));
  }

  // Activity breakdown from data-percentages
  let percentages = { commits: 0, pullRequests: 0, codeReview: 0, issues: 0 };
  const pctMatch = html.match(/data-percentages="([^"]+)"/);
  if (pctMatch) {
    const decoded = pctMatch[1].replace(/&quot;/g, '"');
    try {
      const parsed = JSON.parse(decoded);
      percentages = {
        commits: parsed['Commits'] || 0,
        pullRequests: parsed['Pull requests'] || 0,
        codeReview: parsed['Code review'] || 0,
        issues: parsed['Issues'] || 0,
      };
    } catch {}
  }

  if (grid.length === 0 && totalContributions === 0) return null;
  return { grid, totalContributions, percentages };
}

export async function fetchGitHubStats(): Promise<GitHubStats | null> {
  const [user, repos, events, contribPage] = await Promise.all([
    fetchJSON(`https://api.github.com/users/${GITHUB_USERNAME}`),
    fetchJSON(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=pushed`),
    fetchJSON(`https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=50`),
    fetchContributionPage(),
  ]);

  if (!user && !contribPage) return null;

  // Stars and repos from API
  const totalStars = repos
    ? (repos as any[]).reduce((sum: number, r: any) => sum + (r.stargazers_count || 0), 0)
    : 0;
  const repoCount = user?.public_repos || 0;

  // Project real numbers from total contributions × percentages
  const total = contribPage?.totalContributions || 0;
  const pct = contribPage?.percentages || { commits: 0, pullRequests: 0, codeReview: 0, issues: 0 };

  const commits = Math.round(total * (pct.commits / 100));
  const pullRequests = Math.round(total * (pct.pullRequests / 100));
  const codeReview = Math.round(total * (pct.codeReview / 100));
  const issues = Math.round(total * (pct.issues / 100));

  // Latest activity from events
  let latestCommit = 'initial commit';
  let latestRepo = `${GITHUB_USERNAME}/repo`;
  let latestTime = 'just now';

  if (events && Array.isArray(events)) {
    const pushEvents = events.filter((e: any) => e.type === 'PushEvent');
    if (pushEvents.length > 0) {
      const latest = pushEvents[0];
      const commitList = latest.payload?.commits;
      if (commitList && commitList.length > 0) {
        latestCommit = commitList[commitList.length - 1].message.split('\n')[0];
      }
      latestRepo = latest.repo?.name || latestRepo;
      const diff = Date.now() - new Date(latest.created_at).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) latestTime = `${mins}m ago`;
      else if (mins < 1440) latestTime = `${Math.floor(mins / 60)}h ago`;
      else latestTime = `${Math.floor(mins / 1440)}d ago`;
    }
  }

  // Build 53×7 contribution grid
  const targetSize = 53 * 7;
  let contributions: number[];
  if (contribPage && contribPage.grid.length > 0) {
    if (contribPage.grid.length >= targetSize) {
      contributions = contribPage.grid.slice(0, targetSize);
    } else {
      contributions = [...new Array(targetSize - contribPage.grid.length).fill(0), ...contribPage.grid];
    }
  } else {
    contributions = new Array(targetSize).fill(0);
  }

  return {
    totalContributions: total,
    commits,
    pullRequests,
    codeReview,
    issues,
    repos: repoCount,
    stars: totalStars,
    latestCommit,
    latestRepo,
    latestTime,
    contributions,
  };
}
