"use client";

import { useState } from "react";
import Link from "next/link";
import EditorOverlay from "@/components/EditorOverlay";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SignupPageClient({ sections }: { sections: Record<string, any> }) {
  const [dogName, setDogName] = useState("");

  return (
    <div className="min-h-screen flex flex-col bg-off-white">
      <EditorOverlay />

      {/* Header */}
      <div data-section-index={0} data-section-name="Header">
        <header className="bg-deep-green relative zigzag-bottom">
          <div className="flex items-center justify-between px-6 py-6 max-w-[1400px] mx-auto relative z-10">
            {/* Left decorative elements */}
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[320px] pointer-events-none overflow-hidden">
              <svg viewBox="0 0 320 110" className="w-full h-full" preserveAspectRatio="xMinYMid slice">
                {/* Large prominent leaf - top left corner */}
                <ellipse cx="15" cy="5" rx="28" ry="50" fill="#4A7A3E" opacity="0.8" transform="rotate(-40 15 5)" />
                <ellipse cx="55" cy="0" rx="20" ry="40" fill="#6B8E3A" opacity="0.6" transform="rotate(-15 55 0)" />
                {/* Lower left leaf cluster */}
                <ellipse cx="0" cy="60" rx="25" ry="42" fill="#3D6B32" opacity="0.7" transform="rotate(-60 0 60)" />
                <ellipse cx="30" cy="80" rx="14" ry="26" fill="#6B8E3A" opacity="0.5" transform="rotate(-25 30 80)" />
                {/* Leaf vein details */}
                <line x1="15" y1="-30" x2="15" y2="45" stroke="#3D6B32" strokeWidth="1.2" opacity="0.3" transform="rotate(-40 15 5)" />
                {/* Small purple dots / berries */}
                <circle cx="85" cy="90" r="7" fill="#5F295E" opacity="0.65" />
                <circle cx="73" cy="100" r="5" fill="#5F295E" opacity="0.5" />
                <circle cx="97" cy="97" r="4" fill="#5F295E" opacity="0.45" />
                {/* Orange splash / carrot */}
                <path d="M120 10 Q138 -8 148 14 Q142 30 127 24 Q115 20 120 10Z" fill="#E65A1E" opacity="0.7" />
                <line x1="142" y1="2" x2="155" y2="-12" stroke="#4A7A3E" strokeWidth="2.5" opacity="0.55" strokeLinecap="round" />
                <line x1="148" y1="6" x2="162" y2="-4" stroke="#4A7A3E" strokeWidth="2" opacity="0.45" strokeLinecap="round" />
                {/* Yellow spoon */}
                <ellipse cx="165" cy="60" rx="12" ry="6" fill="#F2A900" opacity="0.75" transform="rotate(45 165 60)" />
                <line x1="172" y1="53" x2="192" y2="33" stroke="#F2A900" strokeWidth="4" opacity="0.75" strokeLinecap="round" />
                {/* Small green elements */}
                <circle cx="115" cy="80" r="6" fill="#6B8E3A" opacity="0.45" />
                <ellipse cx="50" cy="95" rx="10" ry="20" fill="#6B8E3A" opacity="0.4" transform="rotate(25 50 95)" />
              </svg>
            </div>

            {/* Logo centered */}
            <div className="flex-1" />
            <Link href="/" className="flex-shrink-0">
              <div className="bg-gold text-deep-green rounded-lg px-5 py-2.5 flex items-center gap-1 font-rubik font-bold text-[26px] tracking-wide select-none shadow-sm">
                <span>PURE</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#274C46">
                  <ellipse cx="8" cy="6.5" rx="2.2" ry="2.8" />
                  <ellipse cx="16" cy="6.5" rx="2.2" ry="2.8" />
                  <ellipse cx="4.5" cy="12" rx="2" ry="2.5" />
                  <ellipse cx="19.5" cy="12" rx="2" ry="2.5" />
                  <path d="M7.5 16.5C7.5 14 9.5 12.5 12 12.5C14.5 12.5 16.5 14 16.5 16.5C16.5 19 14.5 21 12 21C9.5 21 7.5 19 7.5 16.5Z" />
                </svg>
              </div>
            </Link>
            <div className="flex-1 flex justify-end relative z-20">
              {/* Offer badge */}
              <div className="hidden sm:block bg-[#E65A1E] text-white px-6 py-3 rounded-lg text-[14px] font-semibold max-w-[260px] text-center leading-snug">
                {sections[0]?.offer_text ?? '25% off your first box + 10% off your next box'}
              </div>
            </div>

            {/* Right decorative elements */}
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[320px] pointer-events-none overflow-hidden">
              <svg viewBox="0 0 320 110" className="w-full h-full" preserveAspectRatio="xMaxYMid slice">
                {/* Large leaf cluster - top right */}
                <ellipse cx="290" cy="5" rx="26" ry="45" fill="#4A7A3E" opacity="0.75" transform="rotate(35 290 5)" />
                <ellipse cx="260" cy="0" rx="18" ry="35" fill="#6B8E3A" opacity="0.55" transform="rotate(10 260 0)" />
                <ellipse cx="310" cy="55" rx="22" ry="38" fill="#3D6B32" opacity="0.65" transform="rotate(55 310 55)" />
                {/* Orange accents */}
                <circle cx="230" cy="85" r="11" fill="#E65A1E" opacity="0.6" />
                <circle cx="248" cy="95" r="7" fill="#E65A1E" opacity="0.45" />
                {/* Yellow dot */}
                <circle cx="278" cy="90" r="8" fill="#F2A900" opacity="0.65" />
                {/* Small green elements */}
                <circle cx="210" cy="20" r="6" fill="#6B8E3A" opacity="0.5" />
                <circle cx="222" cy="32" r="4.5" fill="#6B8E3A" opacity="0.4" />
                {/* Purple berry */}
                <circle cx="195" cy="70" r="5.5" fill="#5F295E" opacity="0.5" />
                {/* Carrot shape */}
                <g transform="translate(245, 40) rotate(25)">
                  <path d="M0 0 Q10 -8 20 0 Q17 10 8 7 Q2 5 0 0Z" fill="#E65A1E" opacity="0.55" />
                  <line x1="17" y1="-4" x2="28" y2="-14" stroke="#4A7A3E" strokeWidth="2" opacity="0.45" strokeLinecap="round" />
                  <line x1="20" y1="-1" x2="30" y2="-8" stroke="#4A7A3E" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
                </g>
                {/* Small leaf bottom right */}
                <ellipse cx="290" cy="90" rx="12" ry="22" fill="#6B8E3A" opacity="0.4" transform="rotate(-20 290 90)" />
              </svg>
            </div>
          </div>
        </header>
      </div>

      {/* Spacer for zigzag */}
      <div className="h-3" />

      {/* Main Content */}
      <div data-section-index={1} data-section-name="Main Content">
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-14 pb-10">
          <div className="w-full max-w-[480px] text-center">
            <h1 className="text-[36px] md:text-[44px] font-bold text-deep-green font-rubik mb-3 leading-tight">
              {sections[1]?.heading ?? "Let's get started"}
            </h1>
            <p className="text-deep-green/50 text-[16px] mb-10 font-rubik">
              {sections[1]?.subtitle ?? 'It only takes 2-3 minutes'}
            </p>

            <div className="mb-8">
              <label className="block text-deep-green font-bold text-[17px] mb-4 font-rubik">
                {sections[1]?.label ?? "What's your dogs name?"}
              </label>
              <input
                type="text"
                value={dogName}
                onChange={(e) => setDogName(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-white text-deep-green text-[16px] outline-none border border-transparent focus:border-deep-green/15 transition-colors shadow-sm font-rubik"
                placeholder=""
              />
            </div>

            {/* Dog icon + helper text */}
            <div className="flex flex-col items-center gap-3 mb-12">
              {/* Sitting dog silhouette with plus sign */}
              <div className="relative">
                <svg viewBox="0 0 40 48" className="w-10 h-12" fill="#274C46">
                  {/* Left ear */}
                  <path d="M10 12 C8 6 6 1 9 0 C12 -0.5 14 5 14 10 C14 12 13 14 12 15Z" />
                  {/* Right ear */}
                  <path d="M26 12 C28 6 30 1 27 0 C24 -0.5 22 5 22 10 C22 12 23 14 24 15Z" />
                  {/* Head */}
                  <ellipse cx="18" cy="16" rx="10" ry="9.5" />
                  {/* Eyes */}
                  <circle cx="14" cy="14.5" r="1.3" fill="#EAE5DC" />
                  <circle cx="22" cy="14.5" r="1.3" fill="#EAE5DC" />
                  {/* Nose */}
                  <ellipse cx="18" cy="18.5" rx="2.2" ry="1.6" fill="#1a332f" />
                  {/* Mouth line */}
                  <path d="M16.5 20.5 Q18 22 19.5 20.5" fill="none" stroke="#1a332f" strokeWidth="0.8" strokeLinecap="round" />
                  {/* Body - sitting position */}
                  <path d="M9 24 C7 28 6 33 7 38 C7.5 40 9 41 11 41 L14 41 L14 36 Q14 33 18 33 Q22 33 22 36 L22 41 L25 41 C27 41 28.5 40 29 38 C30 33 29 28 27 24 Z" />
                  {/* Tail curving up on right */}
                  <path d="M29 30 C31 28 34 25 35 21 C35.5 19 35 18 34 19 C32 21 30 25 28 28" />
                  {/* Paws */}
                  <ellipse cx="12.5" cy="42.5" rx="3.5" ry="2.2" />
                  <ellipse cx="23.5" cy="42.5" rx="3.5" ry="2.2" />
                </svg>
                {/* Plus badge */}
                <div className="absolute -top-0.5 -right-2.5 w-[18px] h-[18px] bg-[#6B8E3A] rounded-full flex items-center justify-center">
                  <svg width="9" height="9" viewBox="0 0 10 10">
                    <path d="M5 2.5 L5 7.5 M2.5 5 L7.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <p className="text-deep-green/50 text-[14px] font-rubik leading-snug">
                {(sections[1]?.add_more_text ?? 'You can add more dogs\nlater if you need to').split('\n').map((line: string, i: number) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </main>

        {/* Fixed bottom button */}
        <div className="border-t border-deep-green/10 bg-off-white px-6 py-5">
          <div className="max-w-[480px] mx-auto">
            <button
              disabled={!dogName.trim()}
              className={`w-full py-4 rounded-xl font-bold text-[18px] font-rubik transition-all duration-200 ${
                dogName.trim()
                  ? "bg-gold text-deep-green hover:bg-[#d99500] cursor-pointer shadow-sm active:scale-[0.99]"
                  : "bg-[#e8d5a0] text-[#b8a878] cursor-not-allowed"
              }`}
            >
              {sections[1]?.button_text ?? 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
