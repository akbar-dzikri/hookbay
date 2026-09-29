import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const grotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
});

const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4310';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Hookbay — Inspect, replay and relay webhooks',
    template: '%s · Hookbay',
  },
  description:
    'Hookbay gives every webhook a URL you can read. Capture requests live, inspect the exact bytes, replay them, and relay to your real endpoint.',
  keywords: ['webhooks', 'debugging', 'request inspector', 'webhook relay', 'api development'],
  openGraph: {
    title: 'Hookbay — Inspect, replay and relay webhooks',
    description: 'Capture any webhook to a URL, watch it live, then replay or relay it.',
    type: 'website',
  },
};

const themeScript = `(function(){try{var s=localStorage.getItem('hookbay-theme');if(!s){s=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',s);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html
      className={`${grotesk.variable} ${mono.variable}`}
      data-theme="dark"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-[100dvh] antialiased">
        <div aria-hidden className="noise-layer pointer-events-none fixed inset-0 z-[70]" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
