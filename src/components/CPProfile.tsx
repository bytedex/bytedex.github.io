'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import RevealSection from './RevealSection';
import SectionHeader from './SectionHeader';
import type { ResolvedSection } from '@/lib/sections';
import type { CpProfileData } from '@/lib/config';

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.96, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { delay: 0.08 + i * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  }),
};

type Props = { cfg: ResolvedSection; data: CpProfileData };

export default function CPProfile({ cfg, data }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.15 });

  return (
    <RevealSection id={cfg.id}>
      <SectionHeader num={cfg.num} title={cfg.title} hint={cfg.hint} />
      <p className="cp-intro">
        <span className="acc">$</span> {data.intro}
      </p>
      <div className="cp-grid" ref={gridRef}>
        {data.cards.map((c, i) => (
          <motion.article
            key={c.platform}
            className="cp-card"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <span className="corner-tag">{c.cornerTag}</span>
            <div className="platform">
              <div className="icon">{c.icon}</div>
              <span className="name">{c.platform}</span>
              <span className="live">live</span>
            </div>
            <div className="handle"><span className="at">@</span>{c.handle}</div>
            <div className="tier">
              {c.tier}
              {c.badge && <span className="badge">{c.badge}</span>}
            </div>
            <div className="rating-row">
              <div className="rating">{c.rating}</div>
              <div className="rating-meta">
                {c.ratingMeta[0]}<br/><span className="delta">{c.ratingMeta[1]}</span>
              </div>
            </div>
            <div className="spark">
              <svg viewBox="0 0 200 48" preserveAspectRatio="none">
                <path className="ar" d={c.spark.area} />
                <path className="ln" d={c.spark.line} />
              </svg>
            </div>
            <div className="meta-row">
              {c.meta.map((m) => (
                <div key={m.label} className="m">
                  <div className="l">{m.label}</div>
                  <div className="v">{m.accent ? <span className="acc">{m.value}</span> : m.value}</div>
                </div>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
      <div className="cp-summary">
        {data.summary.map((s) => (
          <div key={s.label} className="s">
            <div className="l">{s.label}</div>
            <div className="v">{s.value}</div>
          </div>
        ))}
      </div>
    </RevealSection>
  );
}
