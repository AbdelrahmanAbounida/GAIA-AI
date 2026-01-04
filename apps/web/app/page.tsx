import { LandingNavbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { ProvidersSection } from "@/components/landing/providers-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { ServicesSection } from "@/components/landing/services-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";
import { FeaturesSection } from "@/components/landing/features-section2";
import { redirect } from "next/navigation";

export default function HomePage() {
  // check if curernt server is vercel redirect to /projects
  if (process.env.VERCEL_ENV === "production") {
    return redirect("/projects");
  }

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
