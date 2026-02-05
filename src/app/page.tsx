"use client";

import { HeroSection } from '@/components/story-sections/hero-section';
import { ValuePropSection } from '@/components/story-sections/value-prop-section';
import { BenefitsSection } from '@/components/story-sections/benefits-section';
import { ExploreProjectsSection } from '@/components/story-sections/explore-projects-section';
import { FloatingThemeToggle } from '@/components/story-sections/floating-theme-toggle';

export default function Home() {
  return (
    <>
      <FloatingThemeToggle />
      <main className="h-screen w-full overflow-y-scroll scroll-smooth bg-[#F8FAFC] dark:bg-[#0A1A3C]" style={{ scrollSnapType: 'y proximity' }}>
        {/* Global Background Layer */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-sky-200/30 dark:bg-sky-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[20%] left-[5%] w-[400px] h-[400px] bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <HeroSection />
          <ValuePropSection />
          <BenefitsSection />
          <ExploreProjectsSection />
        </div>
      </main>
    </>
  );
}