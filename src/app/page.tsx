import type { ExperienceEntry, AchievementEntry, CpProfileData, Project } from '@/lib/config';
import { config } from '@/lib/config';
import { fetchGitHubStats } from '@/lib/github';
import { applyLiveCpData } from '@/lib/cp-platforms';
import { loadSections, ResolvedSection, SectionId } from '@/lib/sections';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import CPProfile from '@/components/CPProfile';
import About from '@/components/About';
import Experience from '@/components/Experience';
import Projects from '@/components/Projects';
import OpenSource from '@/components/OpenSource';
import Achievements from '@/components/Achievements';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import ScrollTree from '@/components/ScrollTree';
import Terminal from '@/components/Terminal';
import KonamiGlitch from '@/components/KonamiGlitch';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { JSX } from 'react';

function loadJSON<T>(filename: string): T {
  const path = join(process.cwd(), 'data', filename);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

export default async function Home() {
  const sections = loadSections();
  const experience = loadJSON<ExperienceEntry[]>('experience.json');
  const achievements = loadJSON<AchievementEntry[]>('achievements.json');
  const cpProfile = loadJSON<CpProfileData>('cp-profile.json');
  const projects = loadJSON<Project[]>('projects.json');

  const liveStats = await fetchGitHubStats();
  const cpProfileLive = await applyLiveCpData(cpProfile, liveStats);

  const ghData = {
    totalContributions: liveStats?.totalContributions || config.stats.commits,
    commits: liveStats?.commits || 0,
    pullRequests: liveStats?.pullRequests || config.stats.prs,
    codeReview: liveStats?.codeReview || 0,
    issues: liveStats?.issues || 0,
    repos: liveStats?.repos || config.stats.repos,
    stars: liveStats?.stars || config.stats.stars,
    latestCommit: liveStats?.latestCommit || config.stats.latestCommit,
    latestRepo: liveStats?.latestRepo || config.stats.latestRepo,
    latestTime: liveStats?.latestTime || config.stats.latestTime,
    contributions: liveStats?.contributions || null,
  };

  const renderers: Record<SectionId, (cfg: ResolvedSection) => JSX.Element> = {
    profile:      (c) => <CPProfile     key={c.id} cfg={c} data={cpProfileLive} />,
    about:        (c) => <About         key={c.id} cfg={c} />,
    experience:   (c) => <Experience    key={c.id} cfg={c} entries={experience} />,
    projects:     (c) => <Projects      key={c.id} cfg={c} items={projects} />,
    oss:          (c) => <OpenSource    key={c.id} cfg={c} stats={ghData} />,
    achievements: (c) => <Achievements  key={c.id} cfg={c} entries={achievements} />,
    contact:      (c) => <Contact       key={c.id} cfg={c} />,
  };

  return (
    <>
      <ScrollTree sections={sections} />
      <Nav sections={sections} />
      <Hero />
      {sections.map((s) => renderers[s.id](s))}
      <Footer />
      <Terminal />
      <KonamiGlitch />
    </>
  );
}
