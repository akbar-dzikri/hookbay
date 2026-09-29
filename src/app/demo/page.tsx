import type { Metadata } from 'next';
import { LiveDemo } from '@/components/demo/live-demo';
import { SiteFooter } from '@/components/site/footer';
import { SiteNav } from '@/components/site/nav';

export const metadata: Metadata = {
  title: 'Live sandbox',
  description:
    'A real Hookbay endpoint, open to the public. Send a request to /in/demo and watch it arrive instantly.',
};

export default function DemoPage(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />
      <main className="flex-1">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-12">
          <header className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[2rem]">
              Live webhook sandbox
            </h1>
            <p className="max-w-[70ch] text-[14px] leading-relaxed text-ink-2">
              This page is wired to a real endpoint at{' '}
              <code className="font-mono text-ink">/in/demo</code>. Send a request from anywhere —
              curl, a provider, or the button below — and it lands here in the same instant the
              server receives it.
            </p>
          </header>
          <LiveDemo />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
