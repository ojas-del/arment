"use client";

import Image from "next/image";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function YorkshireVet({ content }: { content?: any }) {
  return (
    <section className="relative overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[480px]">
        {/* Text Left Side - larger */}
        <div className="w-full md:w-[58%] bg-off-white flex items-center relative">
          {/* Decorative illustrations on left */}
          <div className="absolute left-0 top-0 w-full h-full pointer-events-none overflow-hidden">
            <svg viewBox="0 0 400 450" className="absolute left-0 top-0 w-48 h-full opacity-60">
              {/* Pink splash */}
              <path d="M-20 120 Q20 80 60 110 Q80 70 50 40 Q80 20 110 50 Q130 30 100 0 L0 0 Z" fill="#E88B7D" opacity="0.5" />
              {/* Green leaf */}
              <ellipse cx="40" cy="320" rx="30" ry="50" fill="#274C46" opacity="0.3" transform="rotate(-20 40 320)" />
              <ellipse cx="60" cy="360" rx="20" ry="40" fill="#274C46" opacity="0.25" transform="rotate(10 60 360)" />
              {/* Yellow kibble shapes */}
              <ellipse cx="50" cy="200" rx="12" ry="8" fill="#F2A900" opacity="0.6" transform="rotate(30 50 200)" />
              <ellipse cx="30" cy="230" rx="10" ry="7" fill="#F2A900" opacity="0.5" transform="rotate(-20 30 230)" />
              <ellipse cx="65" cy="250" rx="11" ry="7" fill="#F2A900" opacity="0.5" transform="rotate(45 65 250)" />
              {/* Purple circle */}
              <circle cx="70" cy="290" r="20" fill="#5F295E" opacity="0.6" />
              <path d="M62 284 Q70 276 78 284 L78 286 Q74 282 70 286 Q66 282 62 286 Z" fill="white" opacity="0.8" />
            </svg>
          </div>

          <div className="px-12 md:px-16 lg:px-24 py-12 relative z-10">
            <h2 className="text-[32px] md:text-[40px] font-semibold text-deep-green font-rubik leading-tight mb-2">
              {content?.heading || <>Backed by The<br />Yorkshire Vet</>}
            </h2>
            <p className="text-[#6B8E3A] text-[32px] md:text-[38px] font-semibold font-rubik mb-6">
              {content?.author || "Julian Norton"}
            </p>
            <p className="text-deep-green text-[18px] leading-relaxed max-w-md italic">
              {content?.quote || "\u201cI\u2019ve been a vet for almost 30 years. Recently I\u2019ve suggested Pure for some of my patients, often with great results.\u201d"}
            </p>
          </div>
        </div>

        {/* Image Right Side - smaller */}
        <div className="w-full md:w-[42%] relative min-h-[350px] md:min-h-[480px]">
          <Image
            src={content?.image || "https://www.datocms-assets.com/55536/1749463347-046-pure-pet-food-yorkshire-vet.jpg?auto=format&fit=crop&h=600&w=1000"}
            alt="Julian Norton - The Yorkshire Vet with Pure Pet Food"
            fill
            unoptimized
            className="object-cover"
          />
          {/* Vertical zigzag on left edge - off-white teeth pointing RIGHT into image */}
          <div
            className="hidden md:block absolute left-0 top-0 h-full z-10"
            style={{
              width: '12px',
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 24'%3E%3Cpath d='M0,0 L12,12 L0,24 Z' fill='%23EAE5DC'/%3E%3C/svg%3E\")",
              backgroundSize: '12px 24px',
              backgroundRepeat: 'repeat-y',
            }}
          />
        </div>
      </div>
    </section>
  );
}
