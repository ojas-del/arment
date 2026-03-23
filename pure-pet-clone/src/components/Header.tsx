"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const aboutDropdown = [
  { label: "Our story", href: "/about" },
  { label: "How Pure works", href: "/about" },
  { label: "Pet panel", href: "/about" },
];

const communityDropdown = [
  { label: "Social Feed", href: "/community" },
  { label: "Swipe & Match", href: "/swipe" },
  { label: "Find Owners", href: "/find-owners" },
  { label: "Messages", href: "/messages" },
];

const healthDropdown = [
  { label: "Colitis", href: "/benefits" },
  { label: "Digestion issues", href: "/benefits" },
  { label: "Hypoallergenic", href: "/benefits" },
  { label: "Pancreatitis", href: "/benefits" },
  { label: "Weight management", href: "/benefits" },
];

const defaultNavItems = [
  { label: "About", href: "/about", hasDropdown: true, dropdown: aboutDropdown },
  { label: "Community", href: "/community", hasDropdown: true, dropdown: communityDropdown },
  { label: "Shop", href: "/products", hasDropdown: false, dropdown: [] },
  { label: "Reviews", href: "/reviews", hasDropdown: false, dropdown: [] },
  { label: "Health & breeds", href: "/benefits", hasDropdown: true, dropdown: healthDropdown },
];

const ChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 48 48"
    style={{ fill: 'currentcolor' }}
    className="ml-1 inline-block"
  >
    <path d="m24 30.75-12-12 2.15-2.15L24 26.5l9.85-9.85L36 18.8Z" />
  </svg>
);

const HamburgerIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 6H21M3 12H21M3 18H21"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Header({ content }: { content?: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const logoText = content?.logo_text ?? "PURE";
  const ctaText = content?.cta_text ?? "Create plan";
  const ctaUrl = content?.cta_url ?? "/signup";
  const helpUrl = content?.help_url ?? "/help";
  const loginUrl = content?.login_url ?? "/login";

  const navItems = content
    ? [
        { label: content.nav_1_label ?? "About", href: content.nav_1_url ?? "/about", hasDropdown: true, dropdown: aboutDropdown },
        { label: content.nav_2_label ?? "Community", href: content.nav_2_url ?? "/community", hasDropdown: true, dropdown: communityDropdown },
        { label: content.nav_3_label ?? "Shop", href: content.nav_3_url ?? "/products", hasDropdown: false, dropdown: [] as { label: string; href: string }[] },
        { label: content.nav_4_label ?? "Reviews", href: content.nav_4_url ?? "/reviews", hasDropdown: false, dropdown: [] as { label: string; href: string }[] },
        { label: content.nav_5_label ?? "Health & breeds", href: content.nav_5_url ?? "/benefits", hasDropdown: true, dropdown: healthDropdown },
      ]
    : defaultNavItems;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* Main header bar */}
      <div className="bg-deep-green h-[64px] lg:h-[80px] header-zigzag-bottom">
        <div className="max-w-[1400px] mx-auto h-full px-5 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="bg-gold text-deep-green rounded-lg px-3 py-1.5 flex items-center gap-0.5 font-rubik font-bold text-[22px] tracking-wide select-none">
              <span>{logoText}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="inline-block ml-0.5">
                <ellipse cx="8" cy="6.5" rx="2.2" ry="2.8" />
                <ellipse cx="16" cy="6.5" rx="2.2" ry="2.8" />
                <ellipse cx="4.5" cy="12" rx="2" ry="2.5" />
                <ellipse cx="19.5" cy="12" rx="2" ry="2.5" />
                <path d="M7.5 16.5C7.5 14 9.5 12.5 12 12.5C14.5 12.5 16.5 14 16.5 16.5C16.5 19 14.5 21 12 21C9.5 21 7.5 19 7.5 16.5Z" />
              </svg>
            </div>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className="text-white text-[18px] font-rubik font-medium hover:opacity-80 transition-opacity flex items-center whitespace-nowrap py-6"
                >
                  {item.label}
                  {item.hasDropdown && <ChevronDown />}
                </Link>
                {item.hasDropdown && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 bg-deep-green rounded-b-lg shadow-xl min-w-[220px] py-2 z-50">
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className="block px-5 py-2.5 text-white text-[16px] hover:bg-white/10 transition-colors"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center gap-6">
            {!scrolled && (
              <>
                <Link
                  href={helpUrl}
                  className="text-white text-[18px] font-rubik font-medium hover:opacity-80 transition-opacity"
                >
                  Help
                </Link>
                <Link
                  href={loginUrl}
                  className="text-white text-[18px] font-rubik font-medium hover:opacity-80 transition-opacity"
                >
                  Login
                </Link>
              </>
            )}
            <Link
              href={ctaUrl}
              className="bg-gold text-deep-green text-[18px] font-rubik font-semibold px-6 py-2.5 rounded-lg hover:bg-[#d99500] transition-colors whitespace-nowrap"
            >
              {ctaText}
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="lg:hidden flex items-center justify-center p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-deep-green border-t border-white/10">
          <nav className="flex flex-col px-6 py-6 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-white text-[18px] font-rubik font-medium py-3 flex items-center justify-between border-b border-white/10 hover:opacity-80 transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>{item.label}</span>
                {item.hasDropdown && <ChevronDown />}
              </Link>
            ))}

            <div className="border-b border-white/10" />

            <Link
              href={helpUrl}
              className="text-white text-[18px] font-rubik font-medium py-3 hover:opacity-80 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Help
            </Link>
            <Link
              href={loginUrl}
              className="text-white text-[18px] font-rubik font-medium py-3 hover:opacity-80 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Login
            </Link>

            <Link
              href={ctaUrl}
              className="bg-gold text-deep-green text-[18px] font-rubik font-semibold px-6 py-3 rounded-lg hover:bg-[#d99500] transition-colors text-center mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              {ctaText}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
