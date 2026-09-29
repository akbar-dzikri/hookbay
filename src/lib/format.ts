import { format, formatDistanceToNow } from 'date-fns';

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function clockTime(iso: string): string {
  return format(new Date(iso), 'HH:mm:ss.SSS');
}

export function fullTime(iso: string): string {
  return format(new Date(iso), 'PPpp');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function prettyBody(body: string, contentType: string | null): string {
  if (body.length === 0) return '';
  const looksJson = contentType?.includes('json') === true || /^[[{]/.test(body.trim());
  if (!looksJson) return body;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

const METHOD_TONE: Record<string, string> = {
  GET: 'text-[var(--success)] border-[var(--success)]/40 bg-[var(--success)]/10',
  POST: 'text-[var(--accent)] border-[var(--accent)]/40 bg-[var(--accent)]/10',
  PUT: 'text-[var(--warn)] border-[var(--warn)]/40 bg-[var(--warn)]/10',
  PATCH: 'text-[var(--warn)] border-[var(--warn)]/40 bg-[var(--warn)]/10',
  DELETE: 'text-[var(--danger)] border-[var(--danger)]/40 bg-[var(--danger)]/10',
  HEAD: 'text-ink-2 border-line bg-mono-bg',
  OPTIONS: 'text-ink-2 border-line bg-mono-bg',
};

export function methodTone(method: string): string {
  return METHOD_TONE[method.toUpperCase()] ?? 'text-ink-2 border-line bg-mono-bg';
}

export function statusTone(status: string): string {
  if (status === 'success') return 'text-[var(--success)]';
  if (status === 'failed') return 'text-[var(--danger)]';
  return 'text-ink-3';
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}
