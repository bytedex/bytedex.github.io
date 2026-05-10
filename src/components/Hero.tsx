'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { config } from '@/lib/config';

function KineticLine({ text, baseDelay, accentRange }: { text: string; baseDelay: number; accentRange?: [number, number] }) {
  return (
    <span className="line">
      {[...text].map((ch, i) => {
        const isAccent = accentRange && i >= accentRange[0] && i < accentRange[1];
        return (
          <motion.span
            key={i}
            className={`char ${isAccent ? 'accent' : ''}`}
            initial={{ opacity: 0, y: '120%', rotate: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            transition={{
              delay: (baseDelay + i * 40) / 1000,
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        );
      })}
    </span>
  );
}

function TypedRole() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const roles = config.typedRoles;
    let rIdx = 0, cIdx = 0, deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const cur = roles[rIdx];
      if (!deleting) {
        cIdx++;
        if (ref.current) ref.current.textContent = cur.slice(0, cIdx);
        if (cIdx === cur.length) { deleting = true; timer = setTimeout(tick, 2000); return; }
      } else {
        cIdx--;
        if (ref.current) ref.current.textContent = cur.slice(0, cIdx);
        if (cIdx === 0) { deleting = false; rIdx = (rIdx + 1) % roles.length; }
      }
      timer = setTimeout(tick, deleting ? 25 : 65);
    }
    timer = setTimeout(tick, 1400);
    return () => clearTimeout(timer);
  }, []);

  return <span className="typed-tag" ref={ref}>{config.typedRoles[0]}</span>;
}

export default function Hero() {
  const { hero } = config;
  const greetingDelay = 200;
  const line1Delay = greetingDelay + hero.greeting.length * 30 + 300;
  const line2Delay = line1Delay + hero.line1.length * 40 + 150;

  const [asciiText, setAsciiText] = useState('');

  useEffect(() => {
    let text = '';
    for (let r = 0; r < 60; r++) {
      let line = '';
      for (let c = 0; c < 120; c++) line += Math.random() > 0.5 ? '1' : '0';
      text += line + '\n';
    }
    setAsciiText(text);
  }, []);

  return (
    <section className="hero">
      <div className="ascii-bg">{asciiText}</div>
      <div className="ticker">SHIP · ITERATE · SHIP · ITERATE · SHIP</div>

      <motion.div
        className="meta-line"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <span><span className="label">handle:</span> {config.handle}</span>
        <span><span className="label">role:</span> {config.role}</span>
        <span><span className="label">xp:</span> {config.xpYears} yrs</span>
        <span><span className="label">stack:</span> rust · react · haskell · kafka</span>
      </motion.div>

      <h1 className="kinetic">
        <motion.span
          className="hero-greeting"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: greetingDelay / 1000, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {hero.greeting}
        </motion.span>
        <KineticLine text={hero.line1} baseDelay={line1Delay} />
        <KineticLine text={hero.line2} baseDelay={line2Delay} accentRange={[0, hero.line2.length]} />
      </h1>

      <motion.p
        className="role-line"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (line2Delay + hero.line2.length * 40 + 400) / 1000, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="accent">$</span> i build <TypedRole /><span className="cursor-blink" /> &nbsp;·&nbsp; {config.tagline}
      </motion.p>

      <motion.div
        className="cta-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: (line2Delay + hero.line2.length * 40 + 700) / 1000, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <a href="#experience" className="magnetic primary"><span>view_work</span><span className="arrow">→</span></a>
        <a href="#contact" className="magnetic"><span>get_in_touch</span><span className="arrow">→</span></a>
        <span className="terminal-hint">
          press <kbd>~</kbd> for terminal
        </span>
      </motion.div>

      <motion.div
        className="scroll-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1 }}
      >
        scroll · 01 / 06
      </motion.div>
    </section>
  );
}
