'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { config } from '@/lib/config';
import RevealSection from './RevealSection';
import SectionHeader from './SectionHeader';
import type { ResolvedSection } from '@/lib/sections';

const lineVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.3 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function About({ cfg }: { cfg: ResolvedSection }) {
  const { profile, xpYears } = config;
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.2 });

  const terminalLines = [
    { type: 'com', text: '// generated: now' },
    { type: 'cmd', text: '$ cat profile.json' },
    { type: 'raw', text: '{' },
    { type: 'kv', key: '"alias"', val: `"${profile.alias}"` },
    { type: 'kv', key: '"focus"', val: `[${profile.focus.map(f => `"${f}"`).join(', ')}]` },
    { type: 'kv', key: '"languages"', val: `[${profile.languages.map(l => `"${l}"`).join(', ')}]` },
    { type: 'kv', key: '"runtimes"', val: `[${profile.runtimes.map(r => `"${r}"`).join(', ')}]` },
    { type: 'kv', key: '"clouds"', val: `[${profile.clouds.map(c => `"${c}"`).join(', ')}]` },
    { type: 'kv', key: '"databases"', val: `[${profile.databases.map(d => `"${d}"`).join(', ')}]` },
    { type: 'kv', key: '"currently_reading"', val: `"${profile.reading}"` },
    { type: 'kvb', key: '"open_to_work"', val: 'true' },
    { type: 'raw', text: '}' },
    { type: 'cursor', text: '$ _' },
  ];

  return (
    <RevealSection id="about">
      <SectionHeader num={cfg.num} title={cfg.title} hint={cfg.hint} />
      <div className="about-grid" ref={gridRef}>
        <div className="about-copy">
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Software developer, <span className="accent">{xpYears} years</span> in. I write code that has to survive production traffic, junior engineers, and my own future self.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            I work across the stack — from <span className="accent">low-level systems</span> to <span className="accent">pixel-perfect interfaces</span> — and I care about the small details: cold-start times, error budgets, and the way a button feels under your finger.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
            transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            Currently obsessed with developer tooling, real-time systems, and making the boring parts of software <span className="accent">delightful</span>.
          </motion.p>
          <motion.div
            className="signature"
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.75, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            — signed, // last_pushed: 2 hours ago
          </motion.div>
        </div>
        <motion.div
          className="terminal-card"
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="tbar">
            <span className="dot dot-r" />
            <span className="dot dot-y" />
            <span className="dot dot-g" />
            <span className="label">~/whoami.json</span>
          </div>
          <div className="tbody">
            {terminalLines.map((line, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={lineVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
              >
                {line.type === 'com' && <span className="com">{line.text}</span>}
                {line.type === 'cmd' && <><span className="prompt">$</span> cat profile.json</>}
                {line.type === 'raw' && line.text}
                {line.type === 'kv' && (
                  <span className="indent">
                    <span className="key">{line.key}</span>: <span className="str">{line.val}</span>,
                  </span>
                )}
                {line.type === 'kvb' && (
                  <span className="indent">
                    <span className="key">{line.key}</span>: <span style={{ color: 'var(--accent)' }}>{line.val}</span>
                  </span>
                )}
                {line.type === 'cursor' && <><span className="prompt">$</span> _<span className="cursor-blink" /></>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </RevealSection>
  );
}
