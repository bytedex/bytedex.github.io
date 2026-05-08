export const config = {
  name: process.env.NEXT_PUBLIC_FULL_NAME || 'Your Name',
  firstName: process.env.NEXT_PUBLIC_FIRST_NAME || 'your',
  lastName: process.env.NEXT_PUBLIC_LAST_NAME || 'name',
  handle: process.env.NEXT_PUBLIC_HANDLE || '@handle',
  role: process.env.NEXT_PUBLIC_ROLE || 'software developer',
  xpYears: process.env.NEXT_PUBLIC_XP_YEARS || '3+',
  availability: process.env.NEXT_PUBLIC_AVAILABILITY || 'available',
  tagline: process.env.NEXT_PUBLIC_TAGLINE || 'building things that ship.',

  email: process.env.NEXT_PUBLIC_EMAIL || 'hello@example.com',
  resumeUrl: process.env.NEXT_PUBLIC_RESUME_URL || '#',

  github: {
    url: process.env.NEXT_PUBLIC_GITHUB_URL || '#',
    handle: process.env.NEXT_PUBLIC_GITHUB_HANDLE || 'github/user',
  },
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || '#',
  website: process.env.NEXT_PUBLIC_WEBSITE_URL || '#',
  readcv: process.env.NEXT_PUBLIC_READCV_URL || '#',

  stats: {
    commits: parseInt(process.env.NEXT_PUBLIC_GH_COMMITS || '0', 10),
    repos: parseInt(process.env.NEXT_PUBLIC_GH_REPOS || '0', 10),
    stars: parseInt(process.env.NEXT_PUBLIC_GH_STARS || '0', 10),
    prs: parseInt(process.env.NEXT_PUBLIC_GH_PRS || '0', 10),
    latestCommit: process.env.NEXT_PUBLIC_GH_LATEST_COMMIT || 'initial commit',
    latestRepo: process.env.NEXT_PUBLIC_GH_LATEST_REPO || 'user/repo',
    latestTime: process.env.NEXT_PUBLIC_GH_LATEST_TIME || 'just now',
  },

  profile: {
    alias: process.env.NEXT_PUBLIC_PROFILE_ALIAS || '@dev',
    focus: (process.env.NEXT_PUBLIC_PROFILE_FOCUS || 'backend,frontend').split(','),
    languages: (process.env.NEXT_PUBLIC_PROFILE_LANGUAGES || 'TypeScript').split(','),
    runtimes: (process.env.NEXT_PUBLIC_PROFILE_RUNTIMES || 'Node').split(','),
    clouds: (process.env.NEXT_PUBLIC_PROFILE_CLOUDS || 'AWS').split(','),
    databases: (process.env.NEXT_PUBLIC_PROFILE_DATABASES || 'Postgres').split(','),
    reading: process.env.NEXT_PUBLIC_PROFILE_READING || 'SICP',
  },

  hero: {
    line1: process.env.NEXT_PUBLIC_HERO_LINE1 || 'your',
    line2: process.env.NEXT_PUBLIC_HERO_LINE2 || 'name.',
    greeting: process.env.NEXT_PUBLIC_HERO_GREETING || "hey, i'm",
  },

  typedRoles: (process.env.NEXT_PUBLIC_TYPED_ROLES || 'distributed_systems').split(','),
};

export type ExperienceEntry = {
  year: string;
  role: string;
  company: string;
  highlights: string[];
  stack: string[];
};

export type AchievementEntry = {
  year: string;
  title: string;
  description: string;
};

export type CpMeta = { label: string; value: string; accent?: boolean };

export type CpCard = {
  icon: string;
  platform: string;
  cornerTag: string;
  handle: string;
  url: string;
  tier: string;
  badge?: string;
  rating: string;
  ratingMeta: [string, string];
  spark: { line: string; area: string };
  meta: CpMeta[];
};

export type CpSummaryItem = { label: string; value: string };

export type CpProfileData = {
  intro: string;
  cards: CpCard[];
  summary: CpSummaryItem[];
};

export type ProjectStat = { value: string; label?: string };

export type Project = {
  num: string;
  year: string;
  category: string;
  name: string;
  desc: string;
  stack: string[];
  featured?: boolean;
  stats?: ProjectStat[];
};
