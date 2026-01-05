import { CTASection } from "@/components/cta-section";
import { FeaturesSection } from "@/components/features-section2";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { LandingNavbar } from "@/components/navbar";
import { ProvidersSection } from "@/components/providers-section";
import { ServicesSection } from "@/components/services-section";
import { UseCasesSection } from "@/components/use-cases-section";

export default function Home() {
  return (
    <main className="min-h-screen bg-gaia-200  dark:bg-gaia-900/80">
      <div className="">
        <LandingNavbar />
        <HeroSection />
        <ProvidersSection />
        <FeaturesSection />
        <UseCasesSection />
        <ServicesSection />
        <CTASection />
        <Footer />
      </div>
    </main>
  );
}
