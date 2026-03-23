"use client";

import Link from "next/link";
import Image from "next/image";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WhatIsPure({ content }: { content?: Record<string, any> }) {
  const heading = content?.heading || "What is Pure dog food?";
  const description = content?.description || "A natural, healthy dog food designed to take the stress out of meal times.\n\nSimply add water and stir to quickly rehydrate the food and create a healthy, nutritious meal your pup will love.";
  const image = content?.image || "https://www.datocms-assets.com/55536/1689943504-healthy-dog-food-subscription.jpg?auto=format&fit=crop&h=600&w=1000";

  const paragraphs = description.split("\n\n");

  return (
    <section className="relative">
      <div className="flex flex-col md:flex-row">
        {/* Image Left Side - smaller */}
        <div className="w-full md:w-[42%] relative min-h-[400px] md:min-h-[500px]">
          <Image
            src={image}
            alt="Preparing Pure dog food"
            fill
            unoptimized
            className="object-cover"
          />
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-16 h-16">
            <svg viewBox="0 0 60 60" className="w-full h-full">
              <circle cx="30" cy="30" r="25" fill="#E65A1E" opacity="0.6" />
            </svg>
          </div>
          <div className="absolute bottom-8 left-8 w-12 h-12">
            <svg viewBox="0 0 50 50" className="w-full h-full">
              <path d="M25 5 L30 20 L45 25 L30 30 L25 45 L20 30 L5 25 L20 20 Z" fill="#274C46" opacity="0.3" />
            </svg>
          </div>
        </div>

        {/* Text Right Side - larger */}
        <div className="w-full md:w-[58%] flex items-center bg-off-white">
          <div className="px-8 md:px-16 py-12 md:py-0 max-w-[560px]">
            <h2 className="text-[36px] md:text-[40px] font-semibold text-deep-green leading-tight mb-6 font-rubik">
              {heading}
            </h2>
            <div className="space-y-4 mb-8">
              {paragraphs.map((paragraph: string, index: number) => (
                <p key={index} className="text-[18px] text-deep-green leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            <Link
              href="/signup"
              className="inline-block border-2 border-deep-green text-deep-green px-7 py-3 rounded-[5px] font-semibold text-[18px] hover:bg-deep-green hover:text-white transition-all duration-300"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative carrot/veggie illustration top right */}
      <div className="hidden md:block absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <ellipse cx="90" cy="30" rx="30" ry="12" fill="#E65A1E" opacity="0.5" transform="rotate(30 90 30)" />
          <path d="M80 20 Q95 5 100 15 Q90 10 85 25" fill="#274C46" opacity="0.4" />
          <path d="M95 15 Q110 0 112 12 Q102 8 98 28" fill="#274C46" opacity="0.3" />
        </svg>
      </div>
    </section>
  );
}
