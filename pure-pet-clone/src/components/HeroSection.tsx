"use client";

import Image from "next/image";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HeroSection({ content }: { content?: Record<string, any> }) {
  const heading = content?.heading || "The easiest way to feed healthy,";
  const headingHighlight = content?.heading_highlight || "natural dog food";
  const subheading = content?.subheading || "Enjoy fresh food without the fuss, from only 89p a day";
  const buttonText = content?.button_text || "Get started today";
  const buttonUrl = content?.button_url || "/signup";
  const bgImage = content?.background_image || "https://www.datocms-assets.com/55536/1758880069-hertestdesktop.png?auto=format&fit=crop&h=800&w=1920";
  return (
    <>
    <section
      className="relative w-full overflow-hidden min-h-[480px] lg:min-h-[600px] pt-[76px] lg:pt-[92px]"
    >
      {/* Background image - fills entire section */}
      <div className="absolute inset-0">
        <Image
          src={bgImage}
          alt="Happy dog eating fresh food from a bowl with product packages"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        {/* Warm overlay to give a kitchen scene feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-off-white via-off-white/95 via-45% to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-container items-center px-6 lg:px-8">
        <div className="w-full max-w-[560px] py-12 md:py-16">
          {/* H1 Heading */}
          <h1
            className="font-rubik text-deep-green"
            style={{
              fontSize: "50px",
              fontWeight: 600,
              lineHeight: "52px",
            }}
          >
            {heading}
            <br />
            <span className="text-gold">{headingHighlight}</span>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 font-rubik text-deep-green"
            style={{
              fontSize: "20px",
              fontWeight: 600,
              lineHeight: "28px",
            }}
          >
            {subheading}
          </p>

          {/* CTA Button */}
          <div className="mt-8">
            <a
              href={buttonUrl}
              className="btn-gold inline-block font-rubik transition-all duration-300 hover:shadow-lg"
            >
              {buttonText}
            </a>
          </div>

          {/* Trustpilot-style badge */}
          <div className="mt-6 flex items-center gap-2">
            {/* Trustpilot star icon */}
            <div className="flex items-center gap-0.5">
              {/* 4 full green stars */}
              {[...Array(4)].map((_, i) => (
                <span
                  key={i}
                  className="inline-flex h-[22px] w-[22px] items-center justify-center"
                  style={{ backgroundColor: "#00B67A" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </span>
              ))}
              {/* 5th star - partially filled for 4.7 rating */}
              <span
                className="relative inline-flex h-[22px] w-[22px] items-center justify-center overflow-hidden"
                style={{ backgroundColor: "#DCE8E2" }}
              >
                <span
                  className="absolute inset-0"
                  style={{
                    backgroundColor: "#00B67A",
                    width: "70%",
                  }}
                />
                <svg
                  className="relative z-10"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </span>
            </div>

            {/* Rating text */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-deep-green">
                Excellent
              </span>
              <span className="text-sm text-deep-green/70">
                4.6 out of 5
              </span>
              {/* Trustpilot logo */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#00B67A"
                />
              </svg>
              <span className="text-xs font-medium text-deep-green/60">
                Trustpilot
              </span>
            </div>
          </div>
        </div>
      </div>

    </section>
    {/* Clean transition - no zigzag */}
    </>
  );
}
