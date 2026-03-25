import { HeroSection } from "@/components/landing/HeroSection";
import { AgentsShowcaseClient } from "@/components/landing/AgentsShowcaseClient";
import dynamic from "next/dynamic";

const PainSection = dynamic(
  () =>
    import("@/components/landing/PainSection").then((m) => ({
      default: m.PainSection,
    })),
  { ssr: true },
);
const TransformSection = dynamic(
  () =>
    import("@/components/landing/TransformSection").then((m) => ({
      default: m.TransformSection,
    })),
  { ssr: true },
);
const PatientSection = dynamic(
  () =>
    import("@/components/landing/PatientSection").then((m) => ({
      default: m.PatientSection,
    })),
  { ssr: true },
);
const MethodologySection = dynamic(
  () =>
    import("@/components/landing/MethodologySection").then((m) => ({
      default: m.MethodologySection,
    })),
  { ssr: true },
);

const SocialProofSection = dynamic(
  () =>
    import("@/components/landing/SocialProofSection").then((m) => ({
      default: m.SocialProofSection,
    })),
  { ssr: true },
);
const WhitelistSection = dynamic(
  () =>
    import("@/components/landing/WhitelistSection").then((m) => ({
      default: m.WhitelistSection,
    })),
  { ssr: true },
);
const FinalCTASection = dynamic(
  () =>
    import("@/components/landing/FinalCTASection").then((m) => ({
      default: m.FinalCTASection,
    })),
  { ssr: true },
);
const FooterSection = dynamic(
  () =>
    import("@/components/landing/FooterSection").then((m) => ({
      default: m.FooterSection,
    })),
  { ssr: true },
);

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <PainSection />
      <AgentsShowcaseClient />
      <TransformSection />
      <PatientSection />
      <MethodologySection />

      <SocialProofSection />
      <WhitelistSection />
      <FinalCTASection />
      <FooterSection />
    </main>
  );
}
