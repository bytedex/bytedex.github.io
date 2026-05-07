import { config } from '@/lib/config';
import type { ResolvedSection } from '@/lib/sections';

export default function Nav({ sections }: { sections: ResolvedSection[] }) {
  return (
    <nav className="top">
      <div className="brand">~/{config.firstName}.{config.lastName}</div>
      <div className="links">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`}>{s.navLabel}</a>
        ))}
      </div>
      <div className="status">
        <span className="dot" />
        <span>{config.availability}</span>
      </div>
    </nav>
  );
}
