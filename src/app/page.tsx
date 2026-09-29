import { Hero } from '@/components/marketing/hero';
import {
  Faq,
  Features,
  FinalCta,
  HowItWorks,
  Pricing,
  RelaySection,
  SourceStrip,
} from '@/components/marketing/sections';
import { SiteFooter } from '@/components/site/footer';
import { SiteNav } from '@/components/site/nav';

export default function HomePage(): React.JSX.Element {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <SourceStrip />
        <HowItWorks />
        <Features />
        <RelaySection />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
