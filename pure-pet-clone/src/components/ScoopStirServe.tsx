"use client";

import Image from "next/image";

export default function ScoopStirServe() {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
      <Image
        src="https://www.datocms-assets.com/55536/1689943504-healthy-dog-food-subscription.jpg?auto=format&fit=crop&h=700&w=1600"
        alt="Simply scoop, stir and serve Pure pet food"
        fill
        unoptimized
        className="object-cover object-center"
      />
      {/* Subtle dark overlay */}
      <div className="absolute inset-0 bg-black/20" />
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" fill="none" viewBox="0 0 48 48">
            <path fill="#fff" d="m19.586 32.5 13.35-8.5-13.35-8.5zm4.85 11.5q-4.1 0-7.75-1.575t-6.375-4.3-4.3-6.375T4.436 24q0-4.15 1.575-7.8t4.3-6.35q2.726-2.7 6.375-4.275T24.436 4q4.15 0 7.8 1.575t6.35 4.275 4.275 6.35 1.575 7.8q0 4.1-1.575 7.75t-4.275 6.375-6.35 4.3-7.8 1.575" opacity="0.75" />
          </svg>
        </div>
      </div>
    </section>
  );
}
