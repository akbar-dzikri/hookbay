'use client';

import { Check, Copy, MoonIcon, SunIcon } from '@phosphor-icons/react/dist/ssr';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function CopyButton({
  value,
  label,
  className = '',
}: {
  value: string;
  label?: string;
  className?: string;
}): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      aria-label={copied ? 'Copied' : `Copy ${label ?? 'value'}`}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-ink-2 transition-colors hover:bg-mono-bg hover:text-ink ${className}`}
      onClick={copy}
      type="button"
    >
      {copied ? <Check className="text-accent" size={13} weight="bold" /> : <Copy size={13} />}
      {label && <span>{copied ? 'copied' : label}</span>}
    </button>
  );
}

export function Magnetic({
  children,
  className = '',
  strength = 0.22,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}): React.JSX.Element {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 260, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 20, mass: 0.4 });

  function handleMove(event: React.PointerEvent<HTMLSpanElement>): void {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function reset(): void {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      className={`inline-block ${className}`}
      onPointerLeave={reset}
      onPointerMove={handleMove}
      ref={ref}
      style={reduce ? undefined : { x: springX, y: springY }}
    >
      {children}
    </motion.span>
  );
}

export function ThemeToggle(): React.JSX.Element {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'light' ? 'light' : 'dark');
  }, []);

  function toggle(): void {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('hookbay-theme', next);
    } catch {
      // storage unavailable
    }
  }

  return (
    <button
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
      onClick={toggle}
      type="button"
    >
      {theme === 'dark' ? <SunIcon size={15} /> : <MoonIcon size={15} />}
    </button>
  );
}
