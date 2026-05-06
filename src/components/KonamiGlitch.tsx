'use client';

import { useEffect, useRef } from 'react';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export default function KonamiGlitch() {
  const idx = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === KONAMI[idx.current]) {
        idx.current++;
        if (idx.current === KONAMI.length) {
          document.body.classList.add('glitching');
          setTimeout(() => document.body.classList.remove('glitching'), 1500);
          idx.current = 0;
        }
      } else {
        idx.current = 0;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return null;
}
