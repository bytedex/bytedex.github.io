'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { scoreJD, toApiResult, type AtsResult, type SkillDef, type DetectedSkill } from '@/lib/ats';

const BAND_LABEL: Record<AtsResult['band'], string> = {
  strong: 'strong match',
  good: 'decent match',
  low: 'weak match',
  none: 'no skills detected',
};

function tierBadge(d: DetectedSkill) {
  if (d.tier === 'required') return <span className="tier req">must</span>;
  if (d.tier === 'preferred') return <span className="tier pref">nice</span>;
  return null;
}

export default function AtsScanner({
  skills,
  evidence,
  candidateYears,
}: {
  skills: SkillDef[];
  evidence: string;
  candidateYears: number;
}) {
  const [jd, setJd] = useState('');
  const [result, setResult] = useState<AtsResult | null>(null);
  const [jsonMode, setJsonMode] = useState(false);

  const run = () => setResult(scoreJD(jd, skills, evidence, candidateYears));
  const clear = () => {
    setJd('');
    setResult(null);
    if (typeof window !== 'undefined') delete (window as unknown as Record<string, unknown>).__ATS__;
  };

  // API / AI-friendly mode: a JD passed in the URL auto-fills and auto-scores.
  //   /ats?jd=<url-encoded JD>            → auto-scored UI
  //   /ats?jd=<...>&format=json           → clean JSON-only view
  // (Static site: needs JS to run, so this serves browsers / headless agents,
  // not a plain curl. Result is also exposed on window.__ATS__ for scraping.)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('jd') ?? sp.get('q') ?? sp.get('query') ?? '';
    const fmt = (sp.get('format') ?? '').toLowerCase();
    setJsonMode(fmt === 'json' || sp.get('json') === '1' || sp.get('raw') === '1');
    if (q.trim()) {
      setJd(q);
      setResult(scoreJD(q, skills, evidence, candidateYears));
    }
  }, [skills, evidence, candidateYears]);

  // Expose the latest result for programmatic / browser-agent access.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    (window as unknown as Record<string, unknown>).__ATS__ = result ? toApiResult(result) : null;
  }, [result]);

  // JSON-only render for API/AI consumers.
  if (jsonMode) {
    return (
      <main className="ats-wrap">
        <div className="ats-bar">
          <Link href="/" className="ats-back">← ~/arnab.dutta</Link>
          <span className="ats-tag">ats_match.json</span>
        </div>
        <pre className="ats-json" id="ats-json" data-ats-score={result ? result.score : ''}>
          {result
            ? JSON.stringify(toApiResult(result), null, 2)
            : '{ "error": "no jd — pass ?jd=<url-encoded job description>&format=json" }'}
        </pre>
      </main>
    );
  }

  // Nice-to-have (preferred, 0.3×) gaps — shown separately from critical gaps.
  const otherGaps = result ? result.gap.filter((g) => g.tier === 'preferred') : [];

  return (
    <main className="ats-wrap">
      <div className="ats-bar">
        <Link href="/" className="ats-back">← ~/arnab.dutta</Link>
        <span className="ats-tag">ats_match.scan</span>
      </div>

      <header className="ats-head">
        <span className="ats-num">// scan</span>
        <h1>ats match scanner</h1>
        <p className="ats-sub">
          paste a job description — scored against my real skills, experience &amp; projects.
          <br />
          <span className="ats-formula">weighted coverage (my job-hunter methodology): required skills count 1.0, nice-to-haves 0.3. each skill counts once.</span>
        </p>
      </header>

      <textarea
        className="ats-input"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        placeholder="Paste the full job description here…"
        spellCheck={false}
      />

      <div className="ats-actions">
        <button className="ats-btn primary" onClick={run} disabled={!jd.trim()}>score →</button>
        <button className="ats-btn" onClick={clear} disabled={!jd && !result}>clear</button>
      </div>

      <p className="ats-api-hint">
        api/ai: <code>/ats?jd=&lt;url-encoded JD&gt;</code> auto-scores · add <code>&amp;format=json</code> for a JSON
        response · result also on <code>window.__ATS__</code>
      </p>

      {result && (
        <section className="ats-result">
          {result.band === 'none' ? (
            <p className="ats-empty">No known skills found in this text. Paste a real job description to get a score.</p>
          ) : (
            <>
              <div className="ats-scoreline">
                <div className={`ats-score ${result.band}`}>
                  <span className="pct">{result.score}%</span>
                  <span className="band">{BAND_LABEL[result.band]} · weighted</span>
                </div>
                <div className="ats-meta">
                  <div><span className="acc">{result.haveCount}</span> matched</div>
                  <div><span className="gapn">{result.gapCount}</span> gaps</div>
                  <div><span>{result.totalDetected}</span> detected</div>
                </div>
              </div>

              <div className="ats-bar-track" aria-hidden="true">
                <div className={`ats-bar-fill ${result.band}`} style={{ width: `${result.score}%` }} />
              </div>

              {result.lowSignal && (
                <div className="ats-yoe bad">
                  ⚠ low signal: only {result.totalDetected} known skill{result.totalDetected === 1 ? '' : 's'} detected —
                  this score is unreliable. Paste the full job description for a meaningful match.
                </div>
              )}

              {result.yoe && (
                result.yoe.meets ? (
                  <div className="ats-yoe ok">
                    ✓ experience: JD asks <b>{result.yoe.raw}</b> · you have ~{result.yoe.candidateYears} yrs — you meet it.
                  </div>
                ) : result.yoe.capped ? (
                  <div className="ats-yoe bad">
                    ⚠ experience knockout (required): JD asks <b>{result.yoe.raw}</b> · you have ~{result.yoe.candidateYears} yrs —
                    under by {result.yoe.gapYears} yr{result.yoe.gapYears > 1 ? 's' : ''}. A required years gate is a hard filter:
                    coverage {result.coverageScore}% capped to <b>{result.score}%</b>.
                  </div>
                ) : (
                  <div className="ats-yoe bad">
                    ⚠ experience: JD prefers <b>{result.yoe.raw}</b> · you have ~{result.yoe.candidateYears} yrs —
                    under by {result.yoe.gapYears} yr{result.yoe.gapYears > 1 ? 's' : ''}. It&apos;s a <em>preferred</em> bar,
                    so advisory only — score unchanged.
                  </div>
                )
              )}

              {result.criticalGaps.length > 0 && (
                <div className="ats-group crit">
                  <h2>⚠ critical gaps — required / core skills you lack ({result.criticalGaps.length})</h2>
                  <div className="ats-chips">
                    {result.criticalGaps.map((s) => (
                      <span key={s.canonical} className="ats-chip gap crit">{s.canonical} {tierBadge(s)}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.have.length > 0 && (
                <div className="ats-group">
                  <h2>✓ you have ({result.haveCount}) — <span className="proven">● proven in experience</span> · <span className="listed">○ in skills list</span></h2>
                  <div className="ats-chips">
                    {result.have.map((s) => (
                      <span
                        key={s.canonical}
                        className={`ats-chip have ${s.evidenced ? 'proven' : 'listed'}`}
                        title={s.evidenced ? 'proven in your experience/projects' : 'in your skills list'}
                      >
                        {s.evidenced ? '● ' : '○ '}{s.canonical} {tierBadge(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {otherGaps.length > 0 && (
                <div className="ats-group">
                  <h2>✗ nice-to-have gaps — low weight ({otherGaps.length})</h2>
                  <div className="ats-chips">
                    {otherGaps.map((s) => (
                      <span key={s.canonical} className="ats-chip gap">{s.canonical} {tierBadge(s)}</span>
                    ))}
                  </div>
                </div>
              )}

              <p className="ats-note">
                Scans hard skills, CS fundamentals (DSA, OS, CN, DBMS, OOP) <em>and</em> experience keywords (leadership, mentorship, SDLC, ownership…).
                <strong> must</strong> = required-section / cued skill (weight 1.0); <strong> nice</strong> = nice-to-have (0.3).
                Each skill counts once. The ● proven tag shows what&apos;s in my work history; it doesn&apos;t affect the
                score. Synonyms are matched (golang→Go, nodejs→Node.js). A keyword-coverage estimate, not a guarantee.
              </p>

              <details className="ats-disc">
                <summary>how this models a real ATS — and what it can&apos;t see</summary>
                <p>
                  This mirrors the <b>keyword / boolean layer</b> that still drives most recruiter sourcing (Taleo, Lever
                  search, LinkedIn&apos;s Title/Boolean filters): exact-term matching, no automatic acronym expansion — so
                  spelling out both forms (AWS <em>and</em> Amazon Web Services) genuinely matters. Scoring is set-based
                  (each skill once), weighting required skills above nice-to-haves.
                </p>
                <p>
                  It <b>cannot</b> model the newer <b>semantic / LLM layer</b> (Workday Skills Cloud + HiredScore grades,
                  Lever Talent Fit, iCIMS, Workable, LinkedIn embeddings), which credits paraphrases an exact-match
                  scanner misses — your real fit there may be higher. And ATS rarely auto-reject: most output is a
                  recruiter-facing rank/grade, with true auto-knockout limited to configured screening questions (work
                  authorisation, min years). Treat this as directional, not a verdict.
                </p>
              </details>
            </>
          )}
        </section>
      )}
    </main>
  );
}
