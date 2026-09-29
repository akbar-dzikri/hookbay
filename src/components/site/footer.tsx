import Link from 'next/link';
import { Logo } from '@/components/ui/primitives';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '/demo', label: 'Live sandbox' },
      { href: '/#how', label: 'How it works' },
      { href: '/#pricing', label: 'Pricing' },
      { href: '/app', label: 'Console' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { href: '/docs', label: 'API reference' },
      { href: '/docs#ingest', label: 'Ingest contract' },
      { href: '/docs#relay', label: 'Relay & replay' },
      { href: '/api/health', label: 'Health check' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/signup', label: 'Create account' },
      { href: '/login', label: 'Sign in' },
    ],
  },
];

export function SiteFooter(): React.JSX.Element {
  return (
    <footer className="border-t border-line bg-bg-off">
      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-[34ch] text-[13px] leading-relaxed text-ink-3">
            A webhook inbox you can actually read. Capture, inspect, replay, and relay.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div className="flex flex-col gap-3" key={column.title}>
            <h3 className="font-mono text-[11px] tracking-[0.16em] text-ink-3 uppercase">
              {column.title}
            </h3>
            <ul className="flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    className="text-[13px] text-ink-2 transition-colors hover:text-ink"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-5 py-5 text-[12px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Hookbay — one-shot build for the DeepSeek V4.1 showcase.</span>
          <span className="font-mono">Next.js · SQLite · Server-Sent Events</span>
        </div>
      </div>
    </footer>
  );
}
