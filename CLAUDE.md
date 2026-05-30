# CLAUDE.md — bytedex.github.io

## Project Overview

Static developer portfolio built with **Next.js 15**, **React 19**, **TypeScript**, and **Framer Motion**. Exports to pure HTML/CSS/JS via `output: 'export'` and deploys to GitHub Pages.

## Quick Reference

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Static export to ./out
npm run lint     # Next.js linter
```

## Architecture

- **Static site** — no server runtime, all data resolved at build time
- **Data sources**: JSON files in `data/` (gitignored) + live API fetches (GitHub, Codeforces, LeetCode)
- **Config**: all identity/content via `NEXT_PUBLIC_*` env vars in `.env.local` (gitignored)
- **Styling**: CSS custom properties in `globals.css`, no Tailwind

## Key Directories

```
src/app/          # Next.js App Router — layout.tsx, page.tsx, globals.css
src/components/   # All UI components (Hero, About, Experience, CPProfile, etc.)
src/lib/          # Data fetching & config (github.ts, cp-platforms.ts, config.ts, sections.ts)
data/             # JSON data files (gitignored) — see data/*.example.json for schemas
.github/workflows # deploy.yml — manual-trigger-only GitHub Pages deploy
```

## Data Flow

1. `page.tsx` (server component) reads JSON from `data/` via `fs.readFileSync`
2. `lib/github.ts` scrapes GitHub contributions page + REST API (no auth token)
3. `lib/cp-platforms.ts` fetches Codeforces API + LeetCode GraphQL (no auth)
4. Sections rendered conditionally based on `sections.json` enabled flags
5. Components receive data as props — all client interactivity is animation/UI only

## CI/CD

- **Deploy workflow**: manual trigger only (`workflow_dispatch`), no auto-deploy on push
- **Secrets injected at build time**: `ENV_LOCAL`, `EXPERIENCE_JSON`, `ACHIEVEMENTS_JSON`, `CP_PROFILE_JSON`, `PROJECTS_JSON`, `SECTIONS_JSON`, `ATS_SKILLS_JSON`
- Data files and `.env.local` are gitignored — CI creates them from secrets
- `ATS_SKILLS_JSON` is **optional**: if unset, CI falls back to committed `data/ats-skills.example.json`

## Types (defined in lib/config.ts)

- `ExperienceEntry` — year, role, company, highlights[], stack[]
- `AchievementEntry` — year, title, description
- `CpCard` / `CpProfileData` — competitive programming platform cards
- `Project` — num, year, category, name, desc, stack[], featured?, stats?
- `SkillDef` (lib/ats.ts) — canonical, aliases[], category, has (HAVE/GAP); powers `/ats` scanner

## /ats route

- Client-side ATS scorer (`/ats`): paste a JD → keyword-coverage score vs skills. Logic in `lib/ats.ts` (port of job-hunter's `ats_scorer.py`), UI in `components/AtsScanner.tsx`. Skill dictionary read server-side from `data/ats-skills.json` and passed as a prop.

## Easter Eggs

- Press `~` to open hidden terminal overlay
- Konami code (up up down down left right left right B A) triggers glitch effect

## Commit Conventions

- Prefixes: `feat:`, `fix:`, `enh:`, `ci:`, `docs:`
- Explicitly add `Co-Authored-By` lines if commits are not authored by the user
