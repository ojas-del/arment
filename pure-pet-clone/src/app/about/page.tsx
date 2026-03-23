import { getPageSections } from "@/lib/get-page-sections";
import AboutPageClient from "./client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const sectionData = await getPageSections("/about");

  // Convert Map to plain object for serialization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections: Record<string, any> = {};
  sectionData.forEach((v, k) => {
    sections[k] = v;
  });

  return <AboutPageClient sections={sections} />;
}
