'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/primitives';
import { Magnetic, ThemeToggle } from '@/components/ui/interactive';
import { useMe } from '@/lib/client/hooks';

const LINKS = [
  { href: '/#how', label: 'How it works' },
  { href: '/demo', label: 'Live sandbox' },
  { href: '/docs', label: 'Docs' },
  { href: '/#pricing', label: 'Pricing' },
];

export function SiteNav(): React.JSX.Element {
  const { data } = useMe();
  const authed = Boolean(data);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-[13px] text-ink-2 md:flex">
          {LINKS.map((link) => (
            <Link className="transition-colors hover:text-ink" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5 sm:gap-4">
          <ThemeToggle />
          <Link
            className="hidden text-[13px] text-ink-2 transition-colors hover:text-ink sm:block"
            href={authed ? '/app' : '/login'}
          >
            {authed ? 'Console' : 'Sign in'}
          </Link>
          <Magnetic>
            <Link className="btn btn-primary" href={authed ? '/app' : '/signup'}>
              {authed ? 'Open console' : 'Start free'}
            </Link>
          </Magnetic>
        </div>
      </div>
    </header>
  );
}
