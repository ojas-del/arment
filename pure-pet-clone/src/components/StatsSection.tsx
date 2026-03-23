"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StatsSection({ content }: { content?: any }) {
  const mealsServed = content?.meals_served ?? 92905251;
  const stat1Value = content?.stat_1_value ?? "94%";
  const stat1Label = content?.stat_1_label ?? "of customers have seen an improvement in their dog\u2019s ailment";
  const stat2Value = content?.stat_2_value ?? "91%";
  const stat2Label = content?.stat_2_label ?? "of customers have seen overall health improvements since switching to Pure";

  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const startAnimation = useCallback(() => {
    const end = mealsServed;
    const duration = 2500;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
  }, [mealsServed]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          startAnimation();
          setHasAnimated(true);
        }
      },
      { threshold: 0.3 }
    );

    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [hasAnimated, startAnimation]);

  return (
    <section ref={sectionRef} className="section-spacing bg-off-white relative overflow-hidden">
      {/* Decorative elements - right side */}
      <div className="absolute right-0 top-0 h-full pointer-events-none hidden md:block">
        <svg viewBox="0 0 160 400" className="absolute right-0 top-0 w-40 h-full">
          {/* Green leaf */}
          <ellipse cx="130" cy="80" rx="25" ry="50" fill="#274C46" opacity="0.15" transform="rotate(-20 130 80)" />
          <ellipse cx="145" cy="120" rx="20" ry="40" fill="#274C46" opacity="0.12" transform="rotate(10 145 120)" />
          {/* Orange splash */}
          <path d="M120 240 Q145 220 155 245 Q145 265 125 260 Q110 255 120 240Z" fill="#E65A1E" opacity="0.4" />
          {/* Yellow shapes */}
          <ellipse cx="140" cy="320" rx="12" ry="8" fill="#F2A900" opacity="0.5" transform="rotate(30 140 320)" />
        </svg>
      </div>
      {/* Decorative elements - left side */}
      <div className="absolute left-0 top-0 h-full pointer-events-none hidden md:block">
        <svg viewBox="0 0 120 400" className="absolute left-0 top-0 w-28 h-full">
          {/* Pink splash */}
          <path d="M-10 100 Q15 80 30 100 Q15 120 0 115 Q-10 110 -10 100Z" fill="#E88B7D" opacity="0.35" />
          {/* Purple circle */}
          <circle cx="30" cy="260" r="18" fill="#5F295E" opacity="0.2" />
        </svg>
      </div>
      <div className="max-w-[1200px] mx-auto px-6 text-center relative z-10">
        <h2 className="text-[36px] md:text-[40px] font-semibold text-deep-green font-rubik mb-4">
          We&apos;ve delivered
        </h2>

        <div className="text-[48px] md:text-[64px] font-bold text-gold font-rubik mb-4 leading-tight">
          {count.toLocaleString()}
        </div>

        <p className="text-[18px] text-deep-green max-w-xl mx-auto mb-10">
          meals and changed the lives of tens of thousands of dogs for the better
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-beige-light rounded-xl p-6 flex items-center gap-4">
            <span className="text-[42px] md:text-[48px] font-bold text-gold font-rubik shrink-0">
              {stat1Value}
            </span>
            <p className="text-left text-[16px] font-semibold text-deep-green leading-snug">
              {stat1Label}
            </p>
          </div>

          <div className="bg-beige-light rounded-xl p-6 flex items-center gap-4">
            <span className="text-[42px] md:text-[48px] font-bold text-gold font-rubik shrink-0">
              {stat2Value}
            </span>
            <p className="text-left text-[16px] font-semibold text-deep-green leading-snug">
              {stat2Label}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
