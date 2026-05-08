'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { AchievementEntry } from '@/lib/config';
import RevealSection from './RevealSection';
import SectionHeader from './SectionHeader';
import type { ResolvedSection } from '@/lib/sections';

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.92, filter: 'blur(6px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      delay: 0.15 + i * 0.12,
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -12 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      delay: 0.3 + i * 0.12,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export default function Achievements({ cfg, entries }: { cfg: ResolvedSection; entries: AchievementEntry[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.15 });

  return (
    <RevealSection id="achievements">
      <SectionHeader num={cfg.num} title={cfg.title} hint={cfg.hint} />
      <div className="ach-grid" ref={gridRef}>
        {entries.map((entry, i) => (
          <motion.div
            key={i}
            className="ach"
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <motion.div
              className="badge"
              custom={i}
              variants={badgeVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              [{String(i + 1).padStart(3, '0')}]
            </motion.div>
            <motion.div
              className="yr"
              initial={{ opacity: 0, x: -10 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.35 + i * 0.12, duration: 0.4 }}
            >
              {entry.year}
            </motion.div>
            <motion.div
              className="t"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 + i * 0.12, duration: 0.5 }}
            >
              {entry.title}
            </motion.div>
            <motion.div
              className="d"
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.12, duration: 0.5 }}
            >
              {entry.description}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </RevealSection>
  );
}
