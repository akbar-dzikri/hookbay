'use client';

import { useState } from 'react';
import { ArrowsClockwise, Trash } from '@phosphor-icons/react/dist/ssr';
import { CopyButton } from '@/components/ui/interactive';
import { Spinner } from '@/components/ui/motion';
import { apiPost, isApiError } from '@/lib/client/api';
import { useDeleteEndpoint, useMe, useUpdateEndpoint } from '@/lib/client/hooks';
import { useConsoleStore } from '@/lib/client/store';
import type { EndpointWithStats } from '@/lib/types';

export function EndpointSettings({
  endpoint,
  onClose,
}: {
  endpoint: EndpointWithStats;
  onClose: () => void;
}): React.JSX.Element {
  const update = useUpdateEndpoint();
  const remove = useDeleteEndpoint();
  const selectEndpoint = useConsoleStore((state) => state.selectEndpoint);
  const { data: session } = useMe();
  const [name, setName] = useState(endpoint.name);
  const [forwardUrl, setForwardUrl] = useState(endpoint.forwardUrl ?? '');
  const [forwardEnabled, setForwardEnabled] = useState(endpoint.forwardEnabled);
  const [secret, setSecret] = useState(endpoint.secret);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDemo = endpoint.isDemo;
  const plan = session?.workspace.plan ?? 'free';

  function save(): void {
    setError(null);
    update.mutate(
      {
        id: endpoint.id,
        patch: {
          name,
          forwardUrl: forwardUrl.trim(),
          forwardEnabled,
        },
      },
      {
        onError: (caught) => setError(isApiError(caught) ? caught.message : 'Save failed'),
      },
    );
  }

  function rotate(): void {
    update.mutate(
      { id: endpoint.id, patch: { rotateSecret: true } },
      {
        onSuccess: (data) => setSecret(data.endpoint.secret),
      },
    );
  }

  function destroy(): void {
    remove.mutate(endpoint.id, {
      onSuccess: () => {
        selectEndpoint(null);
        onClose();
      },
      onError: (caught) => setError(isApiError(caught) ? caught.message : 'Delete failed'),
    });
  }

  async function switchPlan(): Promise<void> {
    await apiPost('/workspace/plan', { plan: plan === 'pro' ? 'free' : 'pro' });
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="panel flex w-full max-w-[560px] flex-col gap-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-medium text-ink">Endpoint settings</h2>
            <p className="mt-1 font-mono text-[11.5px] text-ink-3">/in/{endpoint.slug}</p>
          </div>
          <button className="btn btn-ghost !px-3 !py-1.5" onClick={onClose} type="button">
            Close
          </button>
        </div>

        {isDemo ? (
          <p className="rounded-lg border border-line bg-bg-off px-3 py-2.5 text-[12.5px] text-ink-2">
            This is the shared public sandbox endpoint. It is read-only, so settings stay put.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-medium text-ink-2">Name</span>
              <input
                className="field"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[12px] font-medium text-ink-2">Forward to</span>
              <input
                className="field"
                onChange={(event) => setForwardUrl(event.target.value)}
                placeholder="https://api.yourservice.com/webhooks"
                type="url"
                value={forwardUrl}
              />
              <span className="text-[11px] text-ink-3">
                Every capture is relayed here with retries and signed headers.
              </span>
            </label>

            <button
              aria-pressed={forwardEnabled}
              className="flex items-center justify-between rounded-lg border border-line bg-bg-off px-3 py-2.5 text-left transition-colors hover:border-line-strong"
              onClick={() => setForwardEnabled((value) => !value)}
              type="button"
            >
              <span className="flex flex-col">
                <span className="text-[13px] text-ink">Relay enabled</span>
                <span className="text-[11px] text-ink-3">
                  {forwardEnabled
                    ? 'Captures are forwarded automatically'
                    : 'Capture only, no forwarding'}
                </span>
              </span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  forwardEnabled ? 'bg-[var(--accent)]' : 'bg-line-strong'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-[var(--bg)] transition-all ${
                    forwardEnabled ? 'left-[18px]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>

            <div className="flex flex-col gap-2 rounded-lg border border-line bg-bg-off px-3 py-2.5">
              <span className="text-[12px] font-medium text-ink-2">Signing secret</span>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-ink-2">
                  {secret}
                </code>
                <CopyButton label="copy" value={secret} />
                <button className="btn btn-ghost !px-2.5 !py-1.5" onClick={rotate} type="button">
                  <ArrowsClockwise size={13} />
                  Rotate
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-[12.5px] text-[var(--danger)]">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                className="btn btn-primary"
                disabled={update.isPending}
                onClick={save}
                type="button"
              >
                {update.isPending ? <Spinner /> : null}
                Save changes
              </button>
              {confirmDelete ? (
                <button className="btn btn-danger" onClick={destroy} type="button">
                  Confirm delete
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={() => setConfirmDelete(true)}
                  type="button"
                >
                  <Trash size={14} />
                  Delete endpoint
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-line pt-5">
          <span className="font-mono text-[11px] tracking-[0.14em] text-ink-3 uppercase">
            plan preview
          </span>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-bg-off px-3 py-3">
            <div className="flex flex-col">
              <span className="text-[13px] text-ink">Currently on {plan}</span>
              <span className="text-[11.5px] text-ink-3">
                {plan === 'pro'
                  ? '25 endpoints · 5,000 requests kept per endpoint'
                  : '4 endpoints · 300 requests kept per endpoint'}
              </span>
            </div>
            <button
              className="btn btn-ghost !py-1.5 text-[12px]"
              onClick={switchPlan}
              type="button"
            >
              Switch to {plan === 'pro' ? 'Free' : 'Pro'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
