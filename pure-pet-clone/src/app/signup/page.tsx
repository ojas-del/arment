import { getPageSections } from "@/lib/get-page-sections";
import SignupPageClient from "./client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SignupPage() {
  const sectionData = await getPageSections("/signup");

  // Convert Map to plain object for serialization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sections: Record<string, any> = {};
  sectionData.forEach((v, k) => {
    sections[k] = v;
  });

  return <SignupPageClient sections={sections} />;
}
