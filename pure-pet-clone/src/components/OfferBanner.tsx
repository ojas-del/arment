"use client";

import Link from "next/link";

const Sparkle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="inline-block"
    aria-hidden="true"
  >
    <path
      d="M8 0L9.4 6.6L16 8L9.4 9.4L8 16L6.6 9.4L0 8L6.6 6.6L8 0Z"
      fill="currentColor"
    />
  </svg>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function OfferBanner({ content }: { content?: Record<string, any> }) {
  const primaryText = content?.primary_text || "25% off your first box";
  const secondaryText = content?.secondary_text || "10% off your next box";
  const linkUrl = content?.link_url || "/signup";
  const bgColor = content?.background_color || "#5F295E";

  return (
    <Link
      href={linkUrl}
      className="block w-full hover:opacity-90 transition-colors duration-200 py-3 text-center text-white"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-center justify-center gap-3 px-4">
        <Sparkle />
        <p className="text-lg leading-snug">
          <span className="font-bold">{primaryText}</span>
          <span className="mx-1.5">+</span>
          <span className="font-medium text-base text-white/90">
            {secondaryText}
          </span>
        </p>
        <Sparkle />
      </div>
    </Link>
  );
}
