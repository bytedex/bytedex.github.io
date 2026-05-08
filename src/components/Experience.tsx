'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { ExperienceEntry } from '@/lib/config';
import RevealSection from './RevealSection';
import SectionHeader from './SectionHeader';
import type { ResolvedSection } from '@/lib/sections';

const cardVariants = {
  hidden: { opacity: 0, x: 60, scale: 0.94, filter: 'blur(4px)' },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      delay: 0.1 + i * 0.15,
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const chipVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  visible: (j: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: j * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

const listVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (j: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: j * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Experience({ cfg, entries }: { cfg: ResolvedSection; entries: ExperienceEntry[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const inView = useInView(trackRef, { once: true, amount: 0.15 });

  return (
    <RevealSection id="experience">
      <SectionHeader num={cfg.num} title={cfg.title} hint={cfg.hint} />
      <div className="exp-track" ref={trackRef}>
        {entries.map((entry, i) => (
          <motion.article
            key={i}
            className="exp-card"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <motion.div
              className="yr"
              initial={{ opacity: 0, y: -10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
            >
              {entry.year}
            </motion.div>
            <motion.div
              className="role"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
            >
              {entry.role}
            </motion.div>
            <motion.div
              className="co"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.35 + i * 0.15, duration: 0.5 }}
            >
              {entry.company}
            </motion.div>
            <ul>
              {entry.highlights.map((h, j) => (
                <motion.li
                  key={j}
                  custom={j}
                  variants={listVariants}
                  initial="hidden"
                  animate={inView ? 'visible' : 'hidden'}
                  style={{ transitionDelay: `${0.4 + i * 0.15}s` }}
                >
                  {h}
                </motion.li>
              ))}
            </ul>
            <div className="stack">
              {entry.stack.map((s, j) => (
                <motion.span
                  key={j}
                  className="chip"
                  custom={j}
                  variants={chipVariants}
                  initial="hidden"
                  animate={inView ? 'visible' : 'hidden'}
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </motion.article>
        ))}
        <motion.article
          className="exp-card"
          style={{ borderStyle: 'dashed' }}
          initial={{ opacity: 0, scale: 0.9, filter: 'blur(6px)' }}
          animate={inView ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
          transition={{ delay: 0.1 + entries.length * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="yr">2026 — ?</div>
          <div className="role" style={{ color: 'var(--fg-dim)' }}>your team, maybe</div>
          <div className="co">// let&apos;s build something</div>
          <ul>
            <li style={{ color: 'var(--fg-dim)' }}>Available Q3 2026.</li>
            <li style={{ color: 'var(--fg-dim)' }}>Remote or Bengaluru. Full-time.</li>
          </ul>
          <a href="#contact" className="magnetic" style={{ marginTop: '20px', padding: '10px 18px', fontSize: '11px' }}>say_hi →</a>
        </motion.article>
      </div>
    </RevealSection>
  );
}
