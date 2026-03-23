import { createClient } from "@supabase/supabase-js";
import { unstable_noStore as noStore } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SectionContent = Record<string, any>;

export async function getPageSections(pageSlug: string): Promise<Map<number, SectionContent>> {
  noStore();
  const map = new Map<number, SectionContent>();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Normalize slug — homepage can be multiple slugs
    let slugFilter: string;
    if (pageSlug === "/" || pageSlug === "home" || pageSlug === "homepage" || pageSlug === "") {
      slugFilter = "slug.eq.home,slug.eq.homepage,slug.eq./,slug.eq.";
    } else {
      // For other pages, try both with and without leading slash
      const withSlash = pageSlug.startsWith("/") ? pageSlug : `/${pageSlug}`;
      const withoutSlash = pageSlug.startsWith("/") ? pageSlug.slice(1) : pageSlug;
      slugFilter = `slug.eq.${withSlash},slug.eq.${withoutSlash}`;
    }

    const { data: pages } = await supabase
      .from("pages")
      .select("id")
      .or(slugFilter)
      .limit(1);

    const pageId = pages?.[0]?.id;
    if (!pageId) return map;

    const { data: sections } = await supabase
      .from("page_sections")
      .select("content")
      .eq("page_id", pageId);

    sections?.forEach((s) => {
      // Support both _section_index (new) and _homepage_index (legacy)
      const idx = s.content?._section_index ?? s.content?._homepage_index;
      if (idx !== undefined && idx !== null) map.set(Number(idx), s.content);
    });
  } catch {
    // Fallback to hardcoded defaults on error
  }
  return map;
}
