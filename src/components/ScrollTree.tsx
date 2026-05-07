'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import type { ResolvedSection } from '@/lib/sections';

const SVG_NS = 'http://www.w3.org/2000/svg';
const W = 80;

export default function ScrollTree({ sections }: { sections: ResolvedSection[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const trunkRef = useRef<SVGPathElement | null>(null);
  const trunkLenRef = useRef(0);
  const nodesRef = useRef<Array<{
    node: SVGCircleElement;
    label: SVGTextElement;
    leaf: SVGCircleElement;
    branch: SVGPathElement;
    y: number;
  }>>([]);

  const { scrollYProgress } = useScroll();

  const layout = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const docH = document.documentElement.scrollHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${docH}`);
    svg.style.height = `${docH}px`;
    svg.innerHTML = '';

    const trunkX = 40;
    const startY = window.innerHeight * 0.5;
    const endY = docH - 80;

    let d = `M ${trunkX} ${startY}`;
    const segs = 24;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const y = startY + (endY - startY) * t;
      const sway = Math.sin(t * Math.PI * 3) * 6;
      const cx = trunkX + sway;
      const cy = y - (endY - startY) / segs / 2;
      d += ` Q ${cx} ${cy} ${trunkX + Math.sin(t * Math.PI * 3) * 4} ${y}`;
    }

    const trunkPath = document.createElementNS(SVG_NS, 'path');
    trunkPath.setAttribute('class', 'trunk');
    trunkPath.setAttribute('d', d);
    trunkPath.style.fill = 'none';
    trunkPath.style.stroke = 'var(--accent)';
    trunkPath.style.strokeWidth = '1.2';
    trunkPath.style.filter = 'drop-shadow(0 0 4px var(--accent-glow))';
    svg.appendChild(trunkPath);

    const trunkLen = trunkPath.getTotalLength();
    trunkPath.style.strokeDasharray = `${trunkLen}`;
    trunkPath.style.strokeDashoffset = `${trunkLen}`;
    trunkPath.style.transition = 'stroke-dashoffset 0.08s linear';
    trunkRef.current = trunkPath;
    trunkLenRef.current = trunkLen;

    const nodes: typeof nodesRef.current = [];

    sections.forEach((s, i) => {
      const sec = document.getElementById(s.id);
      if (!sec) return;
      const r = sec.getBoundingClientRect();
      const yAbs = r.top + window.scrollY + 80;
      const trunkProg = Math.max(0, Math.min(1, (yAbs - startY) / (endY - startY)));
      const pt = trunkPath.getPointAtLength(trunkProg * trunkLen);

      const bEndX = 70;
      const bEndY = pt.y;
      const branch = document.createElementNS(SVG_NS, 'path');
      const cpX = pt.x + 14, cpY = pt.y + (i % 2 === 0 ? -10 : 10);
      branch.setAttribute('d', `M ${pt.x} ${pt.y} Q ${cpX} ${cpY} ${bEndX} ${bEndY}`);
      branch.style.fill = 'none';
      branch.style.stroke = 'var(--accent)';
      branch.style.strokeWidth = '1';
      branch.style.opacity = '0';
      const blen = branch.getTotalLength();
      branch.style.strokeDasharray = `${blen}`;
      branch.style.strokeDashoffset = `${blen}`;
      branch.style.transition = 'opacity 0.5s ease, stroke-dashoffset 0.9s cubic-bezier(.2,.8,.2,1)';
      svg.appendChild(branch);

      const leaf = document.createElementNS(SVG_NS, 'circle');
      leaf.setAttribute('cx', `${bEndX}`);
      leaf.setAttribute('cy', `${bEndY}`);
      leaf.setAttribute('r', '2.2');
      leaf.style.fill = 'var(--accent)';
      leaf.style.opacity = '0';
      leaf.style.transition = 'opacity 0.5s ease';
      svg.appendChild(leaf);

      const node = document.createElementNS(SVG_NS, 'circle');
      node.setAttribute('cx', `${pt.x}`);
      node.setAttribute('cy', `${pt.y}`);
      node.setAttribute('r', '4');
      node.style.fill = 'var(--bg)';
      node.style.stroke = 'var(--accent)';
      node.style.strokeWidth = '1.2';
      node.style.transformOrigin = 'center';
      node.style.transformBox = 'fill-box';
      node.style.transform = 'scale(0.4)';
      node.style.transition = 'transform 0.4s cubic-bezier(.2,.8,.2,1), fill 0.3s';
      svg.appendChild(node);

      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('x', `${pt.x - 8}`);
      label.setAttribute('y', `${pt.y - 8}`);
      label.setAttribute('text-anchor', 'end');
      label.textContent = s.treeLabel;
      label.style.fontFamily = 'var(--mono)';
      label.style.fontSize = '9px';
      label.style.fill = 'var(--fg-dim)';
      label.style.letterSpacing = '0.1em';
      label.style.textTransform = 'uppercase';
      label.style.opacity = '0';
      label.style.transition = 'opacity 0.5s ease 0.2s';
      svg.appendChild(label);

      nodes.push({ node, label, leaf, branch, y: yAbs });
    });

    nodesRef.current = nodes;
  }, [sections]);

  useEffect(() => {
    const t1 = setTimeout(layout, 200);
    const t2 = setTimeout(layout, 1000);
    const onResize = () => { clearTimeout((window as any).__treeT); (window as any).__treeT = setTimeout(layout, 150); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', onResize); };
  }, [layout]);

  useMotionValueEvent(scrollYProgress, 'change', (prog) => {
    if (trunkRef.current) {
      trunkRef.current.style.strokeDashoffset = `${trunkLenRef.current * (1 - prog)}`;
    }

    const scrollTop = window.scrollY;
    const triggerLine = scrollTop + window.innerHeight * 0.65;

    nodesRef.current.forEach((n) => {
      const active = triggerLine >= n.y;
      n.node.style.transform = active ? 'scale(1)' : 'scale(0.4)';
      n.node.style.fill = active ? 'var(--accent)' : 'var(--bg)';
      n.label.style.opacity = active ? '0.7' : '0';
      n.leaf.style.opacity = active ? '0.8' : '0';
      n.branch.style.opacity = active ? '0.5' : '0';
      n.branch.style.strokeDashoffset = active ? '0' : n.branch.style.strokeDasharray;
    });
  });

  return (
    <div className="scroll-tree" aria-hidden="true">
      <svg ref={svgRef} preserveAspectRatio="none" viewBox={`0 0 ${W} 1000`} />
    </div>
  );
}
