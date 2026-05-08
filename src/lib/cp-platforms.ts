import 'server-only';
import type { CpCard, CpProfileData, CpMeta } from './config';
import type { GitHubStats } from './github';

export type CpOverride = Partial<Pick<CpCard, 'rating' | 'ratingMeta' | 'tier' | 'badge' | 'cornerTag'>> & {
  meta?: CpMeta[];
};

const FETCH_OPTS: RequestInit & { next?: { revalidate: number } } = {
  headers: { 'User-Agent': 'portfolio-site' },
  next: { revalidate: 3600 },
};

async function safeJson<T>(url: string, init: RequestInit = FETCH_OPTS): Promise<T | null> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------- Codeforces ----------

type CfUserInfo = { status: string; result: Array<{ handle: string; rating?: number; maxRating?: number; rank?: string }> };
type CfRating = { status: string; result: Array<{ oldRating: number; newRating: number }> };
type CfStatus = { status: string; result: Array<{ verdict?: string; problem: { contestId?: number; index: string } }> };

export async function fetchCodeforces(handle: string): Promise<CpOverride | null> {
  const [info, rating, status] = await Promise.all([
    safeJson<CfUserInfo>(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`),
    safeJson<CfRating>(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`),
    safeJson<CfStatus>(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`),
  ]);

  if (info?.status !== 'OK' || !info.result?.[0]) return null;
  const u = info.result[0];

  const cur = u.rating ?? 0;
  const max = u.maxRating ?? cur;
  const rank = u.rank ?? 'unrated';

  // Last contest delta
  let deltaLine = '';
  if (rating?.status === 'OK' && rating.result.length > 0) {
    const last = rating.result[rating.result.length - 1];
    const d = last.newRating - last.oldRating;
    deltaLine = `Δ ${d >= 0 ? '+' : ''}${d} last contest`;
  }

  const contestsPlayed = rating?.status === 'OK' ? rating.result.length : 0;

  // Unique solved problems (verdict OK), keyed by contestId-index
  let solved = 0;
  if (status?.status === 'OK') {
    const set = new Set<string>();
    for (const s of status.result) {
      if (s.verdict === 'OK') {
        const key = `${s.problem.contestId ?? 'g'}-${s.problem.index}`;
        set.add(key);
      }
    }
    solved = set.size;
  }

  return {
    rating: String(cur),
    ratingMeta: [`max ${max}`, deltaLine || 'no contests yet'],
    tier: rank,
    badge: String(cur),
    cornerTag: rank,
    meta: [
      { label: 'solved', value: String(solved), accent: true },
      { label: 'contests', value: String(contestsPlayed) },
      { label: 'max', value: String(max) },
    ],
  };
}

// ---------- LeetCode ----------

type LcGraphQL = {
  data?: {
    matchedUser?: {
      submitStats?: {
        acSubmissionNum?: Array<{ difficulty: string; count: number }>;
      };
    };
    userContestRanking?: {
      rating?: number;
      attendedContestsCount?: number;
      topPercentage?: number;
    } | null;
    userContestRankingHistory?: Array<{ rating: number; attended: boolean }> | null;
  };
};

const LC_QUERY = `
  query userInfo($username: String!) {
    matchedUser(username: $username) {
      submitStats { acSubmissionNum { difficulty count } }
    }
    userContestRanking(username: $username) {
      rating
      attendedContestsCount
      topPercentage
    }
    userContestRankingHistory(username: $username) {
      rating
      attended
    }
  }
`;

export async function fetchLeetCode(handle: string): Promise<CpOverride | null> {
  let data: LcGraphQL | null = null;
  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'portfolio-site',
        Referer: `https://leetcode.com/u/${encodeURIComponent(handle)}/`,
      },
      body: JSON.stringify({ query: LC_QUERY, variables: { username: handle } }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    data = (await res.json()) as LcGraphQL;
  } catch {
    return null;
  }

  if (!data?.data?.matchedUser) return null;

  const totalSolved = data.data.matchedUser.submitStats?.acSubmissionNum?.find(s => s.difficulty === 'All')?.count ?? 0;
  const ranking = data.data.userContestRanking;
  const history = data.data.userContestRankingHistory ?? [];

  const ratingNum = ranking?.rating ? Math.round(ranking.rating) : null;
  const contests = ranking?.attendedContestsCount ?? history.filter(h => h.attended).length;
  const topPct = ranking?.topPercentage;

  // Last contest delta
  let deltaLine = '';
  const attended = history.filter(h => h.attended);
  if (attended.length >= 2) {
    const d = Math.round(attended[attended.length - 1].rating - attended[attended.length - 2].rating);
    deltaLine = `Δ ${d >= 0 ? '+' : ''}${d} last contest`;
  }

  const ratingStr = ratingNum != null ? String(ratingNum) : '—';

  return {
    rating: ratingStr,
    ratingMeta: [
      topPct != null ? `top ${topPct.toFixed(1)}%` : 'unrated',
      deltaLine || 'no contests yet',
    ],
    badge: ratingStr,
    meta: [
      { label: 'solved', value: String(totalSolved), accent: true },
      { label: 'contests', value: String(contests) },
      { label: 'top', value: topPct != null ? `${topPct.toFixed(1)}%` : '—' },
    ],
  };
}

// ---------- GitHub (reuses existing fetchGitHubStats data) ----------

export function cpFromGitHub(stats: GitHubStats | null): CpOverride | null {
  if (!stats) return null;

  const formatK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n));

  return {
    rating: formatK(stats.totalContributions),
    ratingMeta: [
      'contributions / yr',
      `Δ +${stats.commits} commits`,
    ],
    meta: [
      { label: 'repos', value: String(stats.repos), accent: true },
      { label: 'stars', value: formatK(stats.stars) },
      { label: 'prs', value: String(stats.pullRequests) },
    ],
  };
}

// ---------- Merge ----------

export function applyOverride(card: CpCard, override: CpOverride | null | undefined): CpCard {
  if (!override) return card;
  return {
    ...card,
    rating: override.rating ?? card.rating,
    ratingMeta: override.ratingMeta ?? card.ratingMeta,
    tier: override.tier ?? card.tier,
    badge: override.badge ?? card.badge,
    cornerTag: override.cornerTag ?? card.cornerTag,
    meta: override.meta ?? card.meta,
  };
}

/**
 * Apply all live overrides to a CpProfileData. Performs three fetches in parallel.
 * Cards for codeforces / leetcode / github are matched by `card.platform`.
 */
export async function applyLiveCpData(
  data: CpProfileData,
  githubStats: GitHubStats | null,
): Promise<CpProfileData> {
  const codeforcesCard = data.cards.find(c => c.platform === 'codeforces');
  const leetcodeCard = data.cards.find(c => c.platform === 'leetcode');

  const [cfOverride, lcOverride] = await Promise.all([
    codeforcesCard ? fetchCodeforces(codeforcesCard.handle) : Promise.resolve(null),
    leetcodeCard ? fetchLeetCode(leetcodeCard.handle) : Promise.resolve(null),
  ]);
  const ghOverride = cpFromGitHub(githubStats);

  const cards = data.cards.map(card => {
    if (card.platform === 'codeforces') return applyOverride(card, cfOverride);
    if (card.platform === 'leetcode') return applyOverride(card, lcOverride);
    if (card.platform === 'github') return applyOverride(card, ghOverride);
    return card;
  });

  return { ...data, cards };
}
