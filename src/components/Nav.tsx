'use client';

import { useState, useEffect } from 'react';
import { config } from '@/lib/config';
import type { ResolvedSection } from '@/lib/sections';

export default function Nav({ sections }: { sections: ResolvedSection[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <nav className="top">
      <div className="brand">~/{config.firstName}.{config.lastName}</div>
      <div className="links desktop-links">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`}>{s.navLabel}</a>
        ))}
      </div>
      <div className="status">
        <span className="dot" />
        <span>{config.availability}</span>
      </div>
      <button
        className={`hamburger ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      <div className={`mobile-menu ${open ? 'show' : ''}`} onClick={() => setOpen(false)}>
        <div className="mobile-menu-inner" onClick={(e) => e.stopPropagation()}>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)}>{s.navLabel}</a>
          ))}
        </div>
      </div>
    </nav>
  );
}
