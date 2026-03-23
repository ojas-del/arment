import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import OfferBanner from "@/components/OfferBanner";
import WhatIsPure from "@/components/WhatIsPure";
import BenefitsBar from "@/components/BenefitsBar";
import ProductHighlights from "@/components/ProductHighlights";
import TrendingProducts from "@/components/TrendingProducts";
import VideoTestimonials from "@/components/VideoTestimonials";
import HowPlanWorks from "@/components/HowPlanWorks";
import StatsSection from "@/components/StatsSection";
import ComparisonTable from "@/components/ComparisonTable";
import YorkshireVet from "@/components/YorkshireVet";
import DragonsDen from "@/components/DragonsDen";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import EditorOverlay from "@/components/EditorOverlay";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionContent = Record<string, any>;

async function getSectionContents(): Promise<Map<number, SectionContent>> {
  noStore();
  const map = new Map<number, SectionContent>();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: pages } = await supabase
      .from("pages")
      .select("id")
      .or("slug.eq.home,slug.eq.homepage,slug.eq./,slug.eq.")
      .limit(1);
    const pageId = pages?.[0]?.id;
    if (!pageId) {
      const { data: firstPage } = await supabase
        .from("pages")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1);
      if (!firstPage?.[0]?.id) return map;
      const { data: sections } = await supabase
        .from("page_sections")
        .select("content")
        .eq("page_id", firstPage[0].id);
      sections?.forEach((s) => {
        const idx = s.content?._homepage_index;
        if (idx !== undefined && idx !== null) map.set(Number(idx), s.content);
      });
      return map;
    }
    const { data: sections } = await supabase
      .from("page_sections")
      .select("content")
      .eq("page_id", pageId);
    sections?.forEach((s) => {
      const idx = s.content?._homepage_index;
      if (idx !== undefined && idx !== null) map.set(Number(idx), s.content);
    });
  } catch {
    // Fallback to hardcoded defaults on error
  }
  return map;
}

export default async function Home() {
  const sectionData = await getSectionContents();

  return (
    <>
      <EditorOverlay />
      <div data-section-index="0" data-section-name="Header">
        <Header content={sectionData.get(0)} />
      </div>
      <main>
        <div data-section-index="1" data-section-name="Hero Section">
          <HeroSection content={sectionData.get(1)} />
        </div>
        <div data-section-index="2" data-section-name="Offer Banner">
          <OfferBanner content={sectionData.get(2)} />
        </div>
        <div data-section-index="3" data-section-name="What is Pure">
          <WhatIsPure content={sectionData.get(3)} />
        </div>
        <div data-section-index="4" data-section-name="Benefits Bar">
          <BenefitsBar content={sectionData.get(4)} />
        </div>
        <div data-section-index="5" data-section-name="Product Highlights">
          <ProductHighlights content={sectionData.get(5)} />
        </div>
        <div data-section-index="6" data-section-name="Trending Products">
          <TrendingProducts content={sectionData.get(6)} />
        </div>
        <div data-section-index="7" data-section-name="Video Testimonials">
          <VideoTestimonials content={sectionData.get(7)} />
        </div>
        <div data-section-index="8" data-section-name="How It Works">
          <HowPlanWorks content={sectionData.get(8)} />
        </div>
        <div data-section-index="9" data-section-name="Stats">
          <StatsSection content={sectionData.get(9)} />
        </div>
        <div data-section-index="10" data-section-name="Comparison Table">
          <ComparisonTable content={sectionData.get(10)} />
        </div>
        <div data-section-index="11" data-section-name="Yorkshire Vet">
          <YorkshireVet content={sectionData.get(11)} />
        </div>
        <div data-section-index="12" data-section-name="Dragons Den">
          <DragonsDen content={sectionData.get(12)} />
        </div>
        <div data-section-index="13" data-section-name="FAQ">
          <FAQSection content={sectionData.get(13)} />
        </div>
      </main>
      <div data-section-index="14" data-section-name="Footer">
        <Footer content={sectionData.get(14)} />
      </div>
    </>
  );
}
