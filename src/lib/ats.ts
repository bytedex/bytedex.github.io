// ATS match scorer — client-side port of scripts/ats_scorer.py, adapted to
// score a raw pasted JD against the candidate's profile + real experience.
//
// Beyond the base "have / (have + gap)" direction, scoring is WEIGHTED by JD
// emphasis — a skill the JD repeats (or lists as required) weighs more:
//
//   weight = min(mentions, 3)
//   ATS %  = Σ weight(have) / Σ weight(have + gap) × 100
//
// Each matched HAVE skill is also tagged `evidenced` when it appears in the
// candidate's experience/projects — purely informational (it does NOT change
// the score), since any skill can be backed by a tailored bullet on demand.
//
// Skills are matched via synonyms/aliases (golang → Go, nodejs → Node.js, …).
// The skill dictionary lives in the gitignored data/ats-skills.json (injected
// from the ATS_SKILLS_JSON secret); experience evidence comes from
// experience.json + projects.json. Both are read server-side and passed in.

export type SkillDef = {
  /** Canonical display name. */
  canonical: string;
  /** Lowercase aliases/synonyms searched for in the JD. */
  aliases: string[];
  /** Bucket shown in the UI. */
  category: string;
  /** true = candidate has it (HAVE); false = known gap (GAP). */
  has: boolean;
};

// Build one boundary-aware, GLOBAL regex per alias. Boundary excludes word
// chars plus the symbols that appear inside tech tokens (+ #) so "go" never
// matches "category" and "c++" never matches "c+++". "." is a separator (not
// excluded) so a skill ending a sentence ("…on AWS.") still matches and ".net"
// won't match inside "asp.net". Global flag lets us count mentions.
function aliasRegex(alias: string): RegExp {
  const body = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\w+#])${body}(?![\\w+#])`, 'gi');
}

type CompiledSkill = { def: SkillDef; regexes: RegExp[] };

function compile(skills: SkillDef[]): CompiledSkill[] {
  return skills.map((s) => ({ def: s, regexes: s.aliases.map(aliasRegex) }));
}

// Collect the char offsets of every alias hit in the JD (positions let us
// decide whether a mention sits in a "must-have" vs "nice-to-have" region).
// Dedupe by start offset so overlapping aliases of the SAME skill ("spring
// boot" + "spring" on one phrase) count as one mention, not two.
function findMentions(text: string, regexes: RegExp[]): number[] {
  const seen = new Set<number>();
  for (const re of regexes) {
    for (const m of text.matchAll(re)) {
      if (m.index !== undefined) seen.add(m.index);
    }
  }
  return [...seen].sort((a, b) => a - b);
}

// === REQUIREMENT TIER =======================================================
// Mirrors the job-hunter weighted methodology (lib/ats.weighted_score):
//   weighted ATS% = (w_req·|req ∩ have| + w_pref·|pref ∩ have|)
//                 / (w_req·|req|       + w_pref·|pref|)
// with w_req = 1.0, w_pref = 0.3. The canonical pass uses an LLM to label each
// JD skill required/preferred; here we label deterministically from the JD text
// via (1) section headers that flip the tier of everything after them, and
// (2) inline cues in a small window around each mention. A skill with no
// req/pref signal defaults to full weight (treated as required, never softened).
// Set-based: each skill counts once — no term-frequency weighting.
export type ReqTier = 'required' | 'neutral' | 'preferred';

// neutral defaults to w_req (an unlabelled JD skill is a real requirement
// unless explicitly softened to "nice to have").
const TIER_FACTOR: Record<ReqTier, number> = { required: 1, neutral: 1, preferred: 0.3 };
const TIER_RANK: Record<ReqTier, number> = { required: 2, neutral: 1, preferred: 0 };

// Check preferred BEFORE required so "preferred qualifications" isn't caught by
// the "qualifications" half of the required pattern.
const PREFERRED_HEADER = /(preferred qualifications|preferred skills|nice[\s-]?to[\s-]?have[s]?|good[\s-]?to[\s-]?have[s]?|bonus(?:\s+points)?|desirable|desired skills|pluses|preferred:)/gi;
const REQUIRED_HEADER = /(must[\s-]?have[s]?|minimum qualifications|basic qualifications|required qualifications|requirements|key requirements|what you('|’)?ll need|what we('|’)?re looking for|essential|mandatory|required skills|required:)/gi;

const PREFERRED_CUE = /(nice[\s-]?to[\s-]?have|good[\s-]?to[\s-]?have|\ba plus\b|\bbonus\b|\bpreferred\b|\bdesirable\b|would be (?:great|nice|a plus)|is a plus)/i;
const REQUIRED_CUE = /(\brequired\b|\bmust\b|\bmandatory\b|\bessential\b|\bminimum\b|\bat least\b|\bproven\b|\bstrong\b)/i;

type Marker = { index: number; tier: ReqTier };

// Sorted list of section-header positions and the tier each one starts.
function buildSectionMarkers(text: string): Marker[] {
  const markers: Marker[] = [];
  for (const m of text.matchAll(PREFERRED_HEADER)) {
    if (m.index !== undefined) markers.push({ index: m.index, tier: 'preferred' });
  }
  for (const m of text.matchAll(REQUIRED_HEADER)) {
    if (m.index !== undefined) markers.push({ index: m.index, tier: 'required' });
  }
  markers.sort((a, b) => a.index - b.index);
  return markers;
}

function sectionTierAt(idx: number, markers: Marker[]): ReqTier {
  let tier: ReqTier = 'neutral';
  for (const mk of markers) {
    if (mk.index <= idx) tier = mk.tier;
    else break;
  }
  return tier;
}

// Tier of a single position: inline cue (window clamped to the current section
// so a neighbouring section's cue doesn't leak across) else the section tier.
function tierAtIndex(idx: number, text: string, markers: Marker[]): ReqTier {
  let lo = 0;
  let hi = text.length;
  for (const mk of markers) {
    if (mk.index <= idx) lo = mk.index;
    else { hi = mk.index; break; }
  }
  const win = text.slice(Math.max(idx - 45, lo), Math.min(idx + 45, hi));
  if (REQUIRED_CUE.test(win)) return 'required';
  if (PREFERRED_CUE.test(win)) return 'preferred';
  return sectionTierAt(idx, markers);
}

// Strongest tier across all of a skill's mentions (required > neutral > preferred).
function skillTier(idxs: number[], text: string, markers: Marker[]): ReqTier {
  let best: ReqTier = 'preferred';
  for (const idx of idxs) {
    const t = tierAtIndex(idx, text, markers);
    if (TIER_RANK[t] > TIER_RANK[best]) best = t;
  }
  return best;
}

export type DetectedSkill = {
  canonical: string;
  category: string;
  has: boolean;
  /** How many times any alias appeared in the JD (JD emphasis). */
  mentions: number;
  /** must-have / nice-to-have / neutral, from JD section + inline cues. */
  tier: ReqTier;
  /** Contribution to the weighted score. */
  weight: number;
  /** HAVE skills only: proven in the candidate's experience/projects. */
  evidenced: boolean;
};

/** Years-of-experience fit. Caps the score ONLY when the requirement sits in a
 *  required/must-have context; a preferred years bar stays advisory. */
export type YoeFit = {
  requiredMin: number;
  requiredMax: number | null;
  candidateYears: number;
  gapYears: number; // years short of the JD's minimum (0 if met)
  meets: boolean;
  tier: ReqTier; // required / neutral / preferred (where the years phrase sits)
  capped: boolean; // true when this gap actually reduced the score
  raw: string; // the JD phrase matched, e.g. "7-12 years"
};

export type AtsResult = {
  score: number; // 0-100, final (coverage, capped by a required YoE gap)
  coverageScore: number; // 0-100, weighted skill coverage BEFORE any YoE cap
  band: 'strong' | 'good' | 'low' | 'none';
  have: DetectedSkill[];
  gap: DetectedSkill[];
  /** Missing full-weight skills (required/neutral) — the ones that drag the score. */
  criticalGaps: DetectedSkill[];
  /** null when the JD states no parseable experience requirement. */
  yoe: YoeFit | null;
  /** JD mentions < 3 known skills — score is low-signal / unreliable. */
  lowSignal: boolean;
  haveCount: number;
  gapCount: number;
  totalDetected: number;
};

// Matches "7 years", "7+ years", "7-12 years", "7 to 12 yrs", etc. as one unit
// (so "7-12 years" yields lower bound 7, not a stray "12 years").
const YEAR_RE = /(\d{1,2})\s*(?:\+|\s*(?:-|–|—|to)\s*(\d{1,2}))?\s*\+?\s*(?:years?|yrs?)/gi;
// Experience-context words used to reject noise like "5 years ago".
const YOE_CONTEXT = /(experience|exp\b|professional|industry|relevant|hands-?on|working|develop|building|engineering|software|career|background|track record)/i;

type YearMatch = { min: number; max: number | null; raw: string; index: number };

function parseRequiredYears(text: string): YearMatch | null {
  let best: YearMatch | null = null;
  for (const m of text.matchAll(YEAR_RE)) {
    const raw = m[0];
    const min = parseInt(m[1], 10);
    if (!Number.isFinite(min) || min <= 0 || min > 50) continue;
    const hasRange = m[2] !== undefined;
    const max = hasRange ? parseInt(m[2], 10) : null;
    const hasPlus = raw.includes('+');
    const start = m.index ?? 0;
    const ahead = text.slice(start + raw.length, start + raw.length + 32);
    const behind = text.slice(Math.max(0, start - 28), start);
    const inContext = YOE_CONTEXT.test(ahead) || YOE_CONTEXT.test(behind);
    // Accept ranges / "N+" outright (almost always requirements); a bare
    // "N years" only counts when an experience word sits next to it.
    if (!(hasRange || hasPlus || inContext)) continue;
    // The bar is the MINIMUM years the JD mentions (the hard requirement);
    // higher numbers are usually "preferred". Candidate passes at this minimum.
    if (!best || min < best.min) best = { min, max, raw: raw.replace(/\s+/g, ' ').trim(), index: start };
  }
  return best;
}

export function scoreJD(
  jd: string,
  skills: SkillDef[],
  evidence = '',
  candidateYears: number | null = null,
): AtsResult {
  const text = jd || '';
  const evi = evidence || '';
  const compiled = compile(skills);
  const markers = buildSectionMarkers(text);
  const have: DetectedSkill[] = [];
  const gap: DetectedSkill[] = [];

  for (const { def, regexes } of compiled) {
    const idxs = findMentions(text, regexes);
    if (idxs.length === 0) continue;

    const mentions = idxs.length; // tracked for display only — NOT scored
    const tier = skillTier(idxs, text, markers); // required / neutral / preferred
    const evidenced = def.has ? regexes.some((re) => evi.match(re) !== null) : false;
    // Set-based weight (job-hunter methodology): each skill counts once at its
    // tier weight — required/neutral = 1.0, preferred = 0.3.
    const weight = TIER_FACTOR[tier];

    (def.has ? have : gap).push({
      canonical: def.canonical,
      category: def.category,
      has: def.has,
      mentions,
      tier,
      weight,
      evidenced,
    });
  }

  const haveW = have.reduce((a, d) => a + d.weight, 0);
  const gapW = gap.reduce((a, d) => a + d.weight, 0);
  const total = haveW + gapW;
  const coverageScore = total === 0 ? 0 : Math.round((haveW / total) * 100);

  // Years-of-experience. A years bar in a REQUIRED/must-have context is a hard
  // knockout → cap the score (~15%/yr short, floored at 0.3×). A bar in a
  // PREFERRED context stays advisory and does not change the score. (A bar with
  // no marker defaults to required, consistent with neutral-skill weighting.)
  const reqY = parseRequiredYears(text);
  let yoe: YoeFit | null = null;
  let factor = 1;
  if (reqY && typeof candidateYears === 'number') {
    const gapYears = Math.max(0, reqY.min - candidateYears);
    const tier = tierAtIndex(reqY.index, text, markers);
    const capped = gapYears > 0 && tier !== 'preferred';
    if (capped) factor = Math.max(0.3, 1 - gapYears * 0.15);
    yoe = {
      requiredMin: reqY.min,
      requiredMax: reqY.max,
      candidateYears,
      gapYears,
      meets: gapYears === 0,
      tier,
      capped,
      raw: reqY.raw,
    };
  }
  const score = Math.round(coverageScore * factor);

  // Proven-first, then by weight; gaps by weight desc.
  have.sort((a, b) => Number(b.evidenced) - Number(a.evidenced) || b.weight - a.weight);
  gap.sort((a, b) => b.weight - a.weight);

  // Critical = missing full-weight skills (required/neutral) — the ones that
  // actually drag the score; preferred (0.3) misses are minor.
  const criticalGaps = gap.filter((g) => g.tier !== 'preferred');

  // Low-signal: JD mentions fewer than 3 known skills → score is unreliable.
  const lowSignal = have.length + gap.length < 3;

  let band: AtsResult['band'] = 'none';
  if (total === 0) band = 'none';
  else if (score >= 80) band = 'strong';
  else if (score >= 60) band = 'good';
  else band = 'low';

  return {
    score,
    coverageScore,
    band,
    have,
    gap,
    criticalGaps,
    yoe,
    lowSignal,
    haveCount: have.length,
    gapCount: gap.length,
    totalDetected: have.length + gap.length,
  };
}

// Compact, stable shape for programmatic / AI consumption (query-param mode,
// window.__ATS__). Drops internal weights; keeps the signal an API client wants.
export type ApiSkill = { skill: string; tier: ReqTier; mentions: number; evidenced?: boolean };
export type ApiResult = {
  score: number;
  coverageScore: number;
  band: AtsResult['band'];
  lowSignal: boolean;
  yoe: {
    required: string;
    requiredMin: number;
    candidateYears: number;
    gapYears: number;
    meets: boolean;
    tier: ReqTier;
    capped: boolean;
  } | null;
  counts: { have: number; gap: number; detected: number };
  have: ApiSkill[];
  criticalGaps: ApiSkill[];
  gaps: ApiSkill[];
};

export function toApiResult(r: AtsResult): ApiResult {
  const map = (arr: DetectedSkill[]): ApiSkill[] =>
    arr.map((s) => ({
      skill: s.canonical,
      tier: s.tier,
      mentions: s.mentions,
      ...(s.has ? { evidenced: s.evidenced } : {}),
    }));
  return {
    score: r.score,
    coverageScore: r.coverageScore,
    band: r.band,
    lowSignal: r.lowSignal,
    yoe: r.yoe
      ? {
          required: r.yoe.raw,
          requiredMin: r.yoe.requiredMin,
          candidateYears: r.yoe.candidateYears,
          gapYears: r.yoe.gapYears,
          meets: r.yoe.meets,
          tier: r.yoe.tier,
          capped: r.yoe.capped,
        }
      : null,
    counts: { have: r.haveCount, gap: r.gapCount, detected: r.totalDetected },
    have: map(r.have),
    criticalGaps: map(r.criticalGaps),
    gaps: map(r.gap),
  };
}
