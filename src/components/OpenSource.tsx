'use client';

import { useEffect, useRef, useMemo } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import RevealSection from './RevealSection';
import SectionHeader from './SectionHeader';
import type { ResolvedSection } from '@/lib/sections';

type Stats = {
  totalContributions: number;
  commits: number;
  pullRequests: number;
  codeReview: number;
  issues: number;
  repos: number;
  stars: number;
  latestCommit: string;
  latestRepo: string;
  latestTime: string;
  contributions: number[] | null;
};

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, target, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.floor(v).toLocaleString() + (v >= target ? suffix : '');
      },
    });
    return () => controls.stop();
  }, [inView, target, suffix]);

  return <div className="num" ref={ref}>0</div>;
}

function ContribGrid({ contributions }: { contributions: number[] | null }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.3 });

  const cells = useMemo(() => {
    const total = 53 * 7;
    const LEVEL_MAP = ['', 'l1', 'l2', 'l3', 'l4'];

    if (contributions && contributions.length > 0) {
      const data = contributions.length >= total
        ? contributions.slice(0, total)
        : [...new Array(total - contributions.length).fill(0), ...contributions];

      return data.map((level) => LEVEL_MAP[Math.min(level, 4)] || '');
    }

    return Array.from({ length: total }, () => {
      const r = Math.random();
      if (r > 0.7) return 'l4';
      if (r > 0.5) return 'l3';
      if (r > 0.3) return 'l2';
      if (r > 0.15) return 'l1';
      return '';
    });
  }, [contributions]);

  return (
    <motion.div
      ref={gridRef}
      className="contrib-grid"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
    >
      {cells.map((cls, i) => (
        <motion.div
          key={i}
          className={`cell ${cls}`}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 + (i % 53) * 0.015 + Math.floor(i / 53) * 0.02, duration: 0.3 }}
        />
      ))}
    </motion.div>
  );
}

const statVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function OpenSource({ cfg, stats }: { cfg: ResolvedSection; stats: Stats }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.3 });

  const statItems = [
    { target: stats.totalContributions, label: 'contributions / yr', suffix: '' },
    { target: stats.pullRequests, label: 'commits', suffix: '' },
    { target: stats.codeReview, label: 'code reviews', suffix: '' },
  ];

  return (
    <RevealSection id="oss">
      <SectionHeader num={cfg.num} title={cfg.title} hint={cfg.hint} />

      <div className="gh-grid" ref={gridRef}>
        {statItems.map((s, i) => (
          <motion.div
            key={i}
            className="stat"
            custom={i}
            variants={statVariants}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <AnimatedCounter target={s.target} suffix={s.suffix} />
            <div className="lbl">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <ContribGrid contributions={stats.contributions} />

      <motion.div
        className="now-playing"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="live"><span className="blip" />LIVE</span>
        <span className="commit">
          just pushed: <span style={{ color: 'var(--accent)' }}>
            {stats.latestCommit.includes(':') ? stats.latestCommit.split(':')[0] + ':' : ''}
          </span>
          {stats.latestCommit.includes(':') ? stats.latestCommit.split(':').slice(1).join(':') : stats.latestCommit}
        </span>
        <span className="repo">→ {stats.latestRepo} · {stats.latestTime}</span>
      </motion.div>
    </RevealSection>
  );
}
