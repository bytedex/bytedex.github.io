# terminal-portfolio

A dark, terminal-themed developer portfolio built with Next.js 15, React 19, and Framer Motion. Features kinetic typography, scroll-driven animations, a live GitHub contribution graph, and hidden easter eggs.

**Live:** [bytedex.github.io](https://bytedex.github.io)

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-FF0055?logo=framer)
![Deploy](https://github.com/bytedex/bytedex.github.io/actions/workflows/deploy.yml/badge.svg)

## Sections

| # | Section | Description |
|---|---------|-------------|
| 01 | **Hero** | Kinetic per-character typography, typed role cycling, binary rain background |
| 02 | **about.md** | Bio + interactive terminal card (`~/whoami.json`) with line-by-line reveal |
| 03 | **experience.timeline** | Horizontal card track with staggered slide-in animations |
| 04 | **open_source.activity** | Live GitHub stats (contributions, commits, code reviews) + contribution calendar grid |
| 05 | **wins.log** | Achievement cards with sequential fade-in, badge pop, blur-to-clear transitions |
| 06 | **contact.exec** | Staggered CTA reveal with social links |

## Features

- **Live GitHub data** — scrapes the public contribution page + REST API. No token required. Includes private contributions if enabled on your GitHub profile.
- **Scroll-driven SVG tree** — grows along the left edge as you scroll
- **Hidden terminal** — press `~` to open an in-page terminal
- **Konami code** — enter the classic cheat code for a glitch effect
- **Dark/light theme** — CSS custom properties design system
- **Fully static** — exports to pure HTML/CSS/JS via `next export`, deploys to GitHub Pages

## Quick start

```bash
git clone https://github.com/bytedex/bytedex.github.io.git
cd bytedex.github.io
npm install
```

### Configure

1. Copy the example files:

```bash
cp .env.example .env.local
cp data/experience.example.json data/experience.json
cp data/achievements.example.json data/achievements.json
```

2. Edit `.env.local` with your details:

```env
NEXT_PUBLIC_FULL_NAME="Your Name"
NEXT_PUBLIC_HANDLE="@your_handle"
NEXT_PUBLIC_EMAIL="hello@example.com"
NEXT_PUBLIC_GITHUB_URL="https://github.com/username"
# ... see .env.example for all options
```

3. Edit the JSON data files:

**`data/experience.json`**
```json
[
  {
    "year": "2024 — present",
    "role": "Senior Engineer",
    "company": "// acme corp",
    "highlights": ["Built X", "Shipped Y"],
    "stack": ["Go", "Postgres", "K8s"]
  }
]
```

**`data/achievements.json`**
```json
[
  {
    "year": "2024",
    "title": "Hackathon Winner",
    "description": "Built a thing in 36 hours."
  }
]
```

### Run

```bash
npm run dev     # http://localhost:3000
npm run build   # static export to ./out
```

## Deploy to GitHub Pages

The repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys on every push to `main`.

### Setup

1. Go to **Settings > Pages > Source** and select **GitHub Actions**

2. Add three repository secrets under **Settings > Secrets and variables > Actions**:

| Secret | Value |
|--------|-------|
| `ENV_LOCAL` | Full contents of your `.env.local` |
| `EXPERIENCE_JSON` | Full contents of `data/experience.json` |
| `ACHIEVEMENTS_JSON` | Full contents of `data/achievements.json` |

3. Push to `main` — the site deploys automatically

### Why secrets?

`.env.local` and the data JSON files are gitignored to keep personal information out of the repo. The CI workflow injects them from GitHub Secrets at build time.

## Project structure

```
src/
  app/
    globals.css       # Design system, all section styles
    layout.tsx        # Root layout with metadata
    page.tsx          # Server component — fetches GitHub data, loads JSON
  components/
    Hero.tsx          # Kinetic typography + typed roles
    About.tsx         # Bio + terminal card with line-by-line animation
    Experience.tsx    # Timeline cards with staggered entrance
    OpenSource.tsx    # GitHub stats + contribution grid
    Achievements.tsx  # Achievement cards with sequential reveal
    Contact.tsx       # CTA section with staggered fade-in
    Nav.tsx           # Sticky nav bar
    Footer.tsx        # Footer
    ScrollTree.tsx    # SVG scroll-driven tree
    Terminal.tsx      # Hidden terminal (press ~)
    KonamiGlitch.tsx  # Konami code easter egg
    RevealSection.tsx # Reusable scroll-reveal wrapper
  lib/
    config.ts         # Typed env var reader
    github.ts         # GitHub data fetcher (no token needed)
data/
  experience.json     # Work history (gitignored)
  achievements.json   # Awards/wins (gitignored)
  *.example.json      # Templates
```

## GitHub stats: how it works

The site fetches live data at build time from two sources:

1. **Contribution page** (`github.com/users/{username}/contributions`) — scraped for:
   - Total contribution count
   - Contribution calendar grid (data-level 0-4)
   - Activity breakdown percentages (commits, PRs, code review, issues)

2. **REST API** (no auth) — `/users/{username}`, `/repos`, `/events/public` for:
   - Repo count, star count
   - Latest commit message and timestamp

Stats are projected from the percentages: e.g., if total is 466 and code review is 48%, it shows 224 code reviews.

## Customization

- **Colors** — edit CSS custom properties in `globals.css` (`:root` and `[data-theme="light"]`)
- **Fonts** — swap the Google Fonts import in `layout.tsx`
- **Sections** — each component is self-contained; add/remove from `page.tsx`
- **Animations** — all use Framer Motion variants; tweak delays/easing in each component

## License

MIT
