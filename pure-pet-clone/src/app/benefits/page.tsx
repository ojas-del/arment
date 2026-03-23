import { getPageSections } from "@/lib/get-page-sections";
import BenefitsPageClient from "./client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BenefitsPage() {
  const sectionData = await getPageSections("/benefits");

  // Convert Map to plain object for serialization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections: Record<string, any> = {};
  sectionData.forEach((v, k) => {
    sections[k] = v;
  });

  return <BenefitsPageClient sections={sections} />;
}
