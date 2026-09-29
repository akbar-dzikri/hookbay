'use client';

import { ArrowsClockwise } from '@phosphor-icons/react/dist/ssr';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}): React.JSX.Element {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, amount: 0.2 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function KineticHeading({
  text,
  className = '',
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}): React.JSX.Element {
  const reduce = useReducedMotion();
  const words = text.split(' ');

  if (reduce) return <h1 className={className}>{text}</h1>;

  return (
    <h1 className={className}>
      {words.map((word, index) => (
        <span
          className="inline-block overflow-hidden pb-[0.08em] align-bottom"
          key={`${word}-${index}`}
        >
          <motion.span
            animate={{ y: '0%' }}
            className="inline-block"
            initial={{ y: '115%' }}
            transition={{ duration: 0.75, delay: delay + index * 0.045, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
            {index < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

export function Spinner({ size = 14 }: { size?: number }): React.JSX.Element {
  return <ArrowsClockwise className="animate-spin" size={size} />;
}
