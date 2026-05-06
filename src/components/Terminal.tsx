'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { config } from '@/lib/config';

export default function Terminal() {
  const [visible, setVisible] = useState(false);
  const [lines, setLines] = useState<Array<{ html: string; cls: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const log = useCallback((html: string, cls = '') => {
    setLines(prev => [...prev, { html, cls }]);
  }, []);

  const COMMANDS: Record<string, () => string[]> = {
    help: () => ['available commands:', '  about · skills · projects · contact · sudo · clear · exit'],
    about: () => [`software dev · ${config.xpYears} yrs · ships things`],
    skills: () => [config.profile.languages.join(' · ') + ' · ' + config.profile.databases.join(' · ')],
    projects: () => [`→ ${config.website.replace('https://', '')} — personal site`, '→ portfolio — you are here'],
    contact: () => [config.github.url, config.website],
    sudo: () => ['nice try.'],
    clear: () => { setLines([]); return []; },
    exit: () => { setVisible(false); return []; },
  };

  const handleCommand = useCallback((v: string) => {
    log(`<span class="a">$</span> ${v}`);
    if (!v) return;
    const fn = COMMANDS[v.split(' ')[0]];
    if (fn) {
      const out = fn();
      out.forEach(l => log(l, 'd'));
    } else {
      log(`<span class="d">command not found: ${v} · try "help"</span>`);
    }
  }, [log]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') { e.preventDefault(); setVisible(true); }
      if (e.key === 'Escape') setVisible(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (visible && inputRef.current) inputRef.current.focus();
  }, [visible]);

  useEffect(() => {
    if (visible && lines.length === 0) {
      setLines([
        { html: '<span class="a">portfolio.term</span> v26.04 — secret shell', cls: '' },
        { html: '<span class="d">type "help" for commands · esc to close</span>', cls: '' },
        { html: '', cls: '' },
      ]);
    }
  }, [visible, lines.length]);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [lines]);

  return (
    <div
      className={`term-overlay ${visible ? 'show' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <div className="win">
        <div className="tbar">
          <span className="dot" style={{ background: '#ff5f57', width: 10, height: 10, borderRadius: '50%' }} />
          <span className="dot" style={{ background: '#febc2e', width: 10, height: 10, borderRadius: '50%' }} />
          <span className="dot" style={{ background: '#28c840', width: 10, height: 10, borderRadius: '50%' }} />
          <span className="label">portfolio.term · type &apos;help&apos;</span>
        </div>
        <div className="out" ref={outRef}>
          {lines.map((line, i) => (
            <div key={i} className={`ln ${line.cls}`} dangerouslySetInnerHTML={{ __html: line.html }} />
          ))}
        </div>
        <div className="ln-input">
          <span>$</span>
          <input
            ref={inputRef}
            autoComplete="off"
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const v = (e.target as HTMLInputElement).value.trim();
                (e.target as HTMLInputElement).value = '';
                handleCommand(v);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
