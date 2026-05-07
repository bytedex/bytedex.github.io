import { readFileSync } from 'fs';
import { join } from 'path';

export type SectionId =
  | 'profile' | 'about' | 'experience' | 'projects'
  | 'oss' | 'achievements' | 'contact';

export type SectionConfig = {
  id: SectionId;
  enabled: boolean;
  title: string;
  hint: string;
  navLabel: string;
  treeLabel: string;
};

export type ResolvedSection = SectionConfig & { num: string };

const KNOWN_IDS: ReadonlySet<SectionId> = new Set([
  'profile', 'about', 'experience', 'projects', 'oss', 'achievements', 'contact',
]);

export function loadSections(): ResolvedSection[] {
  const path = join(process.cwd(), 'data', 'sections.json');
  const raw = JSON.parse(readFileSync(path, 'utf-8')) as SectionConfig[];

  return raw
    .filter((s) => {
      if (!KNOWN_IDS.has(s.id)) {
        console.warn(`[sections] unknown id "${s.id}" — skipping`);
        return false;
      }
      return s.enabled;
    })
    .map((s, i) => ({
      ...s,
      num: `// ${(i + 2).toString().padStart(2, '0')}`,
    }));
}
