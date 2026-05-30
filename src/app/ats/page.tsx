import type { Metadata } from 'next';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import AtsScanner from '@/components/AtsScanner';
import { config } from '@/lib/config';
import type { SkillDef } from '@/lib/ats';

export const metadata: Metadata = {
  title: 'ATS Match Scanner — Arnab Dutta',
  description: 'Paste a job description and score it against my skills, experience, and projects.',
};

const DATA = join(process.cwd(), 'data');

// Read a gitignored data file, falling back to the committed .example so local
// dev / a first deploy without the secret still works.
function readData<T>(name: string): T | null {
  const real = join(DATA, `${name}.json`);
  const example = join(DATA, `${name}.example.json`);
  const path = existsSync(real) ? real : existsSync(example) ? example : null;
  if (!path) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function loadSkills(): SkillDef[] {
  return readData<SkillDef[]>('ats-skills') ?? [];
}

// Lowercased blob of the candidate's real work, used to mark which matched
// skills are PROVEN in experience vs merely listed in the skills dictionary.
function loadEvidence(): string {
  const parts: string[] = [];

  const experience = readData<Array<Record<string, unknown>>>('experience') ?? [];
  for (const e of experience) {
    parts.push(String(e.role ?? ''), String(e.company ?? ''));
    if (Array.isArray(e.highlights)) parts.push(...e.highlights.map(String));
    if (Array.isArray(e.stack)) parts.push(...e.stack.map(String));
  }

  const projects = readData<Array<Record<string, unknown>>>('projects') ?? [];
  for (const p of projects) {
    parts.push(String(p.name ?? ''), String(p.desc ?? ''), String(p.category ?? ''));
    if (Array.isArray(p.stack)) parts.push(...p.stack.map(String));
  }

  return parts.join(' \n ').toLowerCase();
}

export default function AtsPage() {
  // Candidate's years of experience, from NEXT_PUBLIC_XP_YEARS (e.g. "3+" → 3).
  const candidateYears = parseInt(String(config.xpYears), 10) || 3;
  return <AtsScanner skills={loadSkills()} evidence={loadEvidence()} candidateYears={candidateYears} />;
}
