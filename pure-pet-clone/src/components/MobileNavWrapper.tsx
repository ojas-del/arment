"use client";

import { usePathname } from "next/navigation";
import BottomNavBar from "./BottomNavBar";
import { useIsMobile } from "@/lib/useIsMobile";

// Pages where we DON'T show the bottom nav (admin, auth, signup flow)
const EXCLUDED_PATHS = ["/admin", "/auth"];

export default function MobileNavWrapper() {
  const { isMobile, isLoaded } = useIsMobile();
  const pathname = usePathname();

  if (!isLoaded || !isMobile) return null;
  if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) return null;

  return <BottomNavBar />;
}
