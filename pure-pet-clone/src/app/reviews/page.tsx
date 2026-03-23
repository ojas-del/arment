import { getPageSections } from "@/lib/get-page-sections";
import ReviewsPageClient from "./client";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReviewsPage() {
  const sectionData = await getPageSections("/reviews");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections: Record<string, any> = {};
  sectionData.forEach((v, k) => { sections[k] = v; });
  return <ReviewsPageClient sections={sections} />;
}
