'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import RevealSection from './RevealSection';
import SectionHeader from './SectionHeader';
import type { ResolvedSection } from '@/lib/sections';
import type { Project } from '@/lib/config';

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { delay: 0.08 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

type Props = { cfg: ResolvedSection; items: Project[] };

export default function Projects({ cfg, items }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.12 });

  return (
    <RevealSection id={cfg.id}>
      <SectionHeader num={cfg.num} title={cfg.title} hint={cfg.hint} />
      <div className="proj-grid" ref={gridRef}>
        {items.map((p, i) => (
          <motion.article
            key={p.name}
            className={`proj${p.featured ? ' featured' : ''}`}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <span className="num-badge">{p.num}</span>
            <div className="preview" aria-hidden="true" />
            <div className="meta">
              <span className="yr">{p.year}</span>
              <span>{p.category}</span>
            </div>
            <div className="name">{p.name}</div>
            <div className="desc">{p.desc}</div>
            {p.stats && (
              <div className="stats">
                {p.stats.map((s, j) => (
                  <span key={j}>
                    {s.label
                      ? <><span className="acc">{s.value}</span> {s.label}</>
                      : <span className="acc">{s.value}</span>}
                  </span>
                ))}
              </div>
            )}
            <div className="stack">
              {p.stack.map((s) => <span key={s} className="chip">{s}</span>)}
            </div>
            <span className="arrow">view ↗</span>
          </motion.article>
        ))}
      </div>
    </RevealSection>
  );
}
