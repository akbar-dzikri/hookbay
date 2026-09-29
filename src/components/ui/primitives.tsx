import Link from 'next/link';
import type { ReactNode } from 'react';
import { methodTone } from '@/lib/format';
import { highlightJson } from '@/lib/highlight';

export function Logo({ compact = false }: { compact?: boolean }): React.JSX.Element {
  return (
    <Link className="group flex items-center gap-2.5" href="/">
      <span className="relative grid h-7 w-7 place-items-center rounded-[9px] border border-line-strong bg-surface-2">
        <svg aria-hidden height="15" viewBox="0 0 16 16" width="15">
          <path
            d="M2 3.2h5.1M2 8h3.4M2 12.8h5.1"
            stroke="var(--text-secondary)"
            strokeLinecap="round"
            strokeWidth="1.4"
          />
          <path
            d="M10.2 4.4 13 8l-2.8 3.6"
            stroke="var(--accent)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      </span>
      {!compact && (
        <span className="text-[15px] font-semibold tracking-tight text-ink">Hookbay</span>
      )}
    </Link>
  );
}

export function StatusDot({ live = true }: { live?: boolean }): React.JSX.Element {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
        live ? 'live-dot bg-accent' : 'bg-ink-3'
      }`}
    />
  );
}

export function MethodBadge({ method }: { method: string }): React.JSX.Element {
  return (
    <span
      className={`inline-flex min-w-[52px] justify-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider ${methodTone(method)}`}
    >
      {method.toUpperCase()}
    </span>
  );
}

export function Chip({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'danger';
}): React.JSX.Element {
  const toneClass =
    tone === 'accent'
      ? 'text-accent border-[var(--accent)]/35'
      : tone === 'danger'
        ? 'text-[var(--danger)] border-[var(--danger)]/35'
        : '';
  return <span className={`chip ${toneClass}`}>{children}</span>;
}

export function JsonBlock({ content }: { content: string }): React.JSX.Element {
  return (
    <pre
      className="code-block m-0 overflow-x-auto px-4 py-3.5 text-ink"
      // Content is escaped inside highlightJson before any markup is injected.
      dangerouslySetInnerHTML={{ __html: highlightJson(content) }}
    />
  );
}

export function KeyValue({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-40 shrink-0 font-mono text-[11px] tracking-wider text-ink-3 uppercase">
        {label}
      </span>
      <span className={`min-w-0 flex-1 text-sm break-words text-ink ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      {icon && <div className="mb-1 text-ink-3">{icon}</div>}
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="max-w-xs text-[13px] leading-relaxed text-ink-3">{description}</p>
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }): React.JSX.Element {
  return (
    <div className="divide-y divide-[var(--border)]">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="flex items-center gap-3 px-3 py-3" key={index}>
          <div className="h-4 w-12 animate-pulse rounded bg-surface-2" />
          <div className="h-3 flex-1 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
