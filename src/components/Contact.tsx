'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { config } from '@/lib/config';
import RevealSection from './RevealSection';

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

const socialItem = {
  hidden: { opacity: 0, y: 15, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Contact() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  const socials = [
    { href: config.github.url, label: config.github.handle },
    ...(config.linkedin && config.linkedin !== '#' ? [{ href: config.linkedin, label: 'linkedin' }] : []),
    { href: config.website, label: config.website.replace('https://', '') },
    ...(config.readcv && config.readcv !== '#' ? [{ href: config.readcv, label: 'read.cv' }] : []),
  ];

  return (
    <RevealSection id="contact" className="contact-block">
      <div className="section-head">
        <span className="num">// 06</span>
        <span className="title">contact.exec</span>
        <span className="rule" />
        <span>./run --hire-me</span>
      </div>

      <motion.div
        ref={ref}
        variants={stagger}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        <motion.h2 variants={fadeUp}>
          have an <span className="accent">idea</span>?<br />let&apos;s <span className="accent">ship</span> it.
        </motion.h2>

        <motion.a
          href={`mailto:${config.email}`}
          className="email-link"
          variants={fadeScale}
        >
          {config.email} →
        </motion.a>

        <motion.a
          href={config.resumeUrl}
          className="email-link"
          variants={fadeScale}
        >
          resume.pdf →
        </motion.a>

        <motion.div
          className="socials"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
          }}
        >
          {socials.map((s, i) => (
            <motion.a key={i} href={s.href} variants={socialItem}>
              {s.label}
            </motion.a>
          ))}
        </motion.div>
      </motion.div>
    </RevealSection>
  );
}
