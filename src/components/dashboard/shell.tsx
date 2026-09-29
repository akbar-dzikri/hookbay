'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Plus, SignOut, SquaresFour } from '@phosphor-icons/react/dist/ssr';
import { Spinner } from '@/components/ui/motion';
import { Logo, StatusDot } from '@/components/ui/primitives';
import { ThemeToggle } from '@/components/ui/interactive';
import { isApiError } from '@/lib/client/api';
import { useCreateEndpoint, useEndpoints, useMe } from '@/lib/client/hooks';
import { useConsoleStore } from '@/lib/client/store';
import { timeAgo } from '@/lib/format';

function CreateEndpointDialog({ onClose }: { onClose: () => void }): React.JSX.Element {
  const create = useCreateEndpoint();
  const selectEndpoint = useConsoleStore((state) => state.selectEndpoint);
  const [name, setName] = useState('');
  const [forwardUrl, setForwardUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);
    create.mutate(
      { name, forwardUrl: forwardUrl.trim().length > 0 ? forwardUrl.trim() : null },
      {
        onSuccess: (data) => {
          selectEndpoint(data.endpoint.id);
          onClose();
        },
        onError: (caught) =>
          setError(isApiError(caught) ? caught.message : 'Could not create endpoint'),
      },
    );
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="panel w-full max-w-[440px] p-5">
        <h2 className="text-[15px] font-medium text-ink">New endpoint</h2>
        <p className="mt-1 text-[13px] text-ink-2">
          You get a URL immediately. Relay is optional and can be set later.
        </p>
        <form className="mt-5 flex flex-col gap-4" onSubmit={submit}>
          <label className="flex flex-col gap-2">
            <span className="text-[12px] font-medium text-ink-2">Name</span>
            <input
              autoFocus
              className="field"
              onChange={(event) => setName(event.target.value)}
              placeholder="Stripe production"
              required
              value={name}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[12px] font-medium text-ink-2">
              Forward to <span className="text-ink-3">(optional)</span>
            </span>
            <input
              className="field"
              onChange={(event) => setForwardUrl(event.target.value)}
              placeholder="https://api.yourservice.com/webhooks"
              type="url"
              value={forwardUrl}
            />
          </label>
          {error && (
            <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-[12.5px] text-[var(--danger)]">
              {error}
            </p>
          )}
          <div className="mt-1 flex justify-end gap-2">
            <button className="btn btn-ghost" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" disabled={create.isPending} type="submit">
              {create.isPending ? <Spinner /> : <Plus size={15} weight="bold" />}
              Create endpoint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }): React.JSX.Element {
  const router = useRouter();
  const { data: session } = useMe();
  const { data, isLoading } = useEndpoints();
  const selectedEndpointId = useConsoleStore((state) => state.selectedEndpointId);
  const selectEndpoint = useConsoleStore((state) => state.selectEndpoint);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const endpoints = data?.endpoints ?? [];
  const workspace = session?.workspace;

  async function logout(): Promise<void> {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="sticky top-0 z-50 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden h-4 w-px bg-line-strong sm:block" />
            <span className="hidden text-[13px] text-ink-2 sm:block">
              {workspace?.name ?? '…'}
              <span className="chip ml-2.5 !py-0.5 align-middle">{workspace?.plan ?? 'free'}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <span className="hidden text-[13px] text-ink-2 md:block">{session?.user.name}</span>
            <button
              aria-label="Sign out"
              className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              disabled={loggingOut}
              onClick={logout}
              type="button"
            >
              <SignOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col lg:flex-row">
        <aside className="flex shrink-0 flex-col border-b border-line lg:w-[264px] lg:border-r lg:border-b-0">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-ink-3 uppercase">
              <SquaresFour size={13} />
              endpoints
            </span>
            <button
              className="grid h-6 w-6 place-items-center rounded-md border border-line text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              onClick={() => setDialogOpen(true)}
              type="button"
            >
              <Plus size={13} weight="bold" />
            </button>
          </div>

          <div className="flex max-h-[300px] flex-col overflow-y-auto lg:max-h-none lg:flex-1">
            {isLoading && (
              <div className="flex flex-col gap-2 px-4 py-2">
                {[0, 1].map((row) => (
                  <div className="h-10 animate-pulse rounded-lg bg-surface-2" key={row} />
                ))}
              </div>
            )}
            {endpoints.map((endpoint) => {
              const active = endpoint.id === selectedEndpointId;
              return (
                <button
                  className={`flex flex-col gap-1 border-l-2 px-4 py-3 text-left transition-colors ${
                    active
                      ? 'border-[var(--accent)] bg-mono-bg'
                      : 'border-transparent hover:bg-mono-bg'
                  }`}
                  key={endpoint.id}
                  onClick={() => selectEndpoint(endpoint.id)}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-ink">
                      {endpoint.name}
                    </span>
                    {endpoint.forwardEnabled && <StatusDot live={false} />}
                  </span>
                  <span className="flex items-center gap-2 font-mono text-[10.5px] text-ink-3">
                    <span>/in/{endpoint.slug}</span>
                    <span>·</span>
                    <span>{endpoint.eventCount}</span>
                    {endpoint.lastEventAt && <span>· {timeAgo(endpoint.lastEventAt)}</span>}
                  </span>
                </button>
              );
            })}

            {!isLoading && endpoints.length === 0 && (
              <button
                className="m-3 flex flex-col items-start gap-1 rounded-lg border border-dashed border-line-strong px-3 py-4 text-left transition-colors hover:border-[var(--accent)]"
                onClick={() => setDialogOpen(true)}
                type="button"
              >
                <span className="text-[13px] text-ink">Create your first endpoint</span>
                <span className="text-[11.5px] text-ink-3">Get a webhook URL in seconds</span>
              </button>
            )}
          </div>

          <div className="mt-auto border-t border-line p-3">
            <div className="flex items-center justify-between rounded-lg border border-line bg-bg-off px-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-[12px] text-ink">
                  {workspace?.plan === 'pro' ? 'Pro plan' : 'Free plan'}
                </span>
                <span className="font-mono text-[10.5px] text-ink-3">
                  {endpoints.length}/{workspace?.plan === 'pro' ? 25 : 4} endpoints
                </span>
              </div>
              <Link
                className="flex items-center gap-1 text-[11.5px] text-ink-2 transition-colors hover:text-ink"
                href="/#pricing"
              >
                Plans
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {dialogOpen && <CreateEndpointDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}
