'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function RevealSection({ children, id, className = '' }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <motion.section
      id={id}
      className={`block ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.section>
  );
}
