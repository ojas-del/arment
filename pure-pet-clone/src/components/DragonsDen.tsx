"use client";

import Image from "next/image";
import Link from "next/link";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DragonsDen({ content }: { content?: any }) {
  return (
    <section className="relative overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[480px]">
        {/* Image Left Side - ~43% with vertical zigzag right edge */}
        <div className="w-full md:w-[43%] relative min-h-[300px] md:min-h-[480px]">
          <Image
            src={content?.image || "https://www.datocms-assets.com/55536/1680101718-dragons-den-dog-food.jpg?auto=format&fit=crop&h=600&w=1000"}
            alt="Pure Pet Food on Dragons Den"
            fill
            unoptimized
            className="object-cover"
          />
          {/* Decorative elements overlaid on image */}
          <div className="absolute left-0 bottom-0 pointer-events-none hidden md:block">
            <svg viewBox="0 0 120 200" className="w-28 h-48">
              <path d="M-10 140 Q20 110 40 135 Q30 160 10 160 Q-10 155 -10 140Z" fill="#E65A1E" opacity="0.7" />
              <path d="M20 170 Q40 155 55 170 Q45 190 25 185 Q10 180 20 170Z" fill="#E88B7D" opacity="0.6" />
            </svg>
          </div>
          {/* Vertical zigzag on right edge - deep-green teeth pointing LEFT into image */}
          <div
            className="hidden md:block absolute right-0 top-0 h-full z-10"
            style={{
              width: '12px',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 24'%3E%3Cpath d='M12,0 L0,12 L12,24 Z' fill='%23274C46'/%3E%3C/svg%3E\")",
              backgroundSize: '12px 24px',
              backgroundRepeat: 'repeat-y',
            }}
          />
        </div>

        {/* Text Right Side - ~57% */}
        <div className="w-full md:w-[57%] bg-deep-green flex items-center">
          <div className="px-8 md:px-16 lg:px-24 py-12">
            <h2 className="text-[32px] md:text-[40px] font-semibold text-white font-rubik leading-tight mb-6">
              {content?.heading || "Dog food so good we ate it on Dragons\u2019 Den"}
            </h2>
            <p className="text-off-white text-[18px] leading-relaxed mb-8">
              {content?.description || "Pure is complete nutrition from the inside out, and dogs totally love the taste! \u201cIt was possibly the best pitch I have seen in over 10 years of Dragons\u2019 Den\u201d - Duncan Bannatyne"}
            </p>
            <Link
              href={content?.button_url || "/signup"}
              className="inline-block bg-gold text-deep-green px-7 py-3 rounded-[5px] font-semibold text-[18px] hover:bg-[#d99500] transition-colors duration-300"
            >
              {content?.button_text || "Get started today"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
