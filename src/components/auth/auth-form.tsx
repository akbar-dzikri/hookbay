'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Spinner } from '@/components/ui/motion';
import { Logo } from '@/components/ui/primitives';
import { apiPost, isApiError, type ApiError } from '@/lib/client/api';
import type { SessionUser } from '@/lib/types';

const COPY = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to open your webhook console.',
    submit: 'Sign in',
    switchText: 'No account yet?',
    switchLabel: 'Create one',
    switchHref: '/signup',
  },
  signup: {
    title: 'Create your inbox',
    subtitle: 'Free forever for solo projects. No card required.',
    submit: 'Create account',
    switchText: 'Already have an account?',
    switchLabel: 'Sign in',
    switchHref: '/login',
  },
};

export function AuthForm({ mode }: { mode: 'login' | 'signup' }): React.JSX.Element {
  const copy = COPY[mode];
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await apiPost<{ user: SessionUser['user'] }>(
        mode === 'signup' ? '/auth/signup' : '/auth/login',
        mode === 'signup' ? { name, email, password } : { email, password },
      );
      router.push('/app');
      router.refresh();
    } catch (caught) {
      setError(
        isApiError(caught)
          ? caught
          : { message: 'Something went wrong', code: 'ERR', status: 0, fields: [] },
      );
      setPending(false);
    }
  }

  function fieldError(field: string): string | undefined {
    return error?.fields.find((item) => item.field === field)?.message;
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-line bg-bg-off p-10 lg:flex">
        <div aria-hidden className="grid-layer pointer-events-none absolute inset-0" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative flex flex-col gap-5">
          <h2 className="max-w-[16ch] text-3xl leading-tight font-semibold tracking-tight text-ink">
            The webhook inbox that explains itself.
          </h2>
          <ul className="flex flex-col gap-3 text-[13.5px] text-ink-2">
            {[
              'Capture every method, header, and byte.',
              'Watch requests stream in live over one connection.',
              'Replay and relay with signed delivery attempts.',
            ].map((item) => (
              <li className="flex gap-2.5" key={item}>
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative font-mono text-[11px] text-ink-3">
          Next.js · SQLite · Server-Sent Events
        </p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-[380px]">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{copy.title}</h1>
          <p className="mt-2 text-[13.5px] text-ink-2">{copy.subtitle}</p>

          <form className="mt-8 flex flex-col gap-4" onSubmit={submit}>
            {mode === 'signup' && (
              <label className="flex flex-col gap-2">
                <span className="text-[12px] font-medium text-ink-2">Name</span>
                <input
                  autoComplete="name"
                  className="field"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ada Lovelace"
                  required
                  type="text"
                  value={name}
                />
                {fieldError('name') && (
                  <span className="text-[11px] text-[var(--danger)]">{fieldError('name')}</span>
                )}
              </label>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-medium text-ink-2">Email</span>
              <input
                autoComplete="email"
                className="field"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
                type="email"
                value={email}
              />
              {fieldError('email') && (
                <span className="text-[11px] text-[var(--danger)]">{fieldError('email')}</span>
              )}
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-medium text-ink-2">Password</span>
              <input
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className="field"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                required
                type="password"
                value={password}
              />
              {fieldError('password') && (
                <span className="text-[11px] text-[var(--danger)]">{fieldError('password')}</span>
              )}
            </label>

            {error && error.fields.length === 0 && (
              <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-[12.5px] text-[var(--danger)]">
                {error.message}
              </p>
            )}

            <button className="btn btn-primary mt-1 w-full" disabled={pending} type="submit">
              {pending ? <Spinner /> : <ArrowRight size={15} weight="bold" />}
              {pending ? 'Working…' : copy.submit}
            </button>
          </form>

          <p className="mt-6 text-[13px] text-ink-2">
            {copy.switchText}{' '}
            <Link
              className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-[var(--accent)]"
              href={copy.switchHref}
            >
              {copy.switchLabel}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
