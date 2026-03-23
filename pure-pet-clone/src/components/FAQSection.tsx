"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const faqs = [
  { question: "Am I tied into a subscription?", answer: "Not at all! You can pause, change, or cancel your plan at any time. We believe in our food so much that we don't need to lock you in." },
  { question: "Is Pure expensive compared to other foods?", answer: "Pure starts from only 89p per day. When you consider the health benefits, it's great value compared to vet bills and other premium foods." },
  { question: "Do I pay for delivery?", answer: "No! Delivery is completely free on all orders. We deliver right to your doorstep." },
  { question: "What is the nutritional value, and is it good for my dog?", answer: "Pure is a complete, balanced meal developed with veterinary nutritionists. Every recipe meets FEDIAF guidelines for complete nutrition." },
  { question: "What if my dog doesn\u2019t like it?", answer: "We offer a full money-back guarantee. If your dog doesn't love Pure, we'll refund your first box in full." },
  { question: "Is Pure suitable for my dogs health concern?", answer: "Pure is often recommended for dogs with health concerns. Our recipes are gentle and made with natural, high-quality ingredients." },
  { question: "Is Pure complete dog food?", answer: "Yes! Every Pure recipe is nutritionally complete and balanced, meeting all FEDIAF guidelines for adult dogs and puppies." },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FAQSection({ content }: { content?: any }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden">
      <div className="flex flex-col md:flex-row min-h-[600px]">
        {/* Left side with decorative elements + FAQ */}
        <div className="w-full md:w-[55%] bg-off-white relative">
          {/* Decorative illustrations on far left */}
          <div className="absolute left-0 top-0 w-40 h-full pointer-events-none hidden md:block">
            <svg viewBox="0 0 160 700" className="w-full h-full">
              {/* Yellow kibble shapes */}
              <ellipse cx="60" cy="80" rx="14" ry="9" fill="#F2A900" opacity="0.7" transform="rotate(20 60 80)" />
              <ellipse cx="40" cy="110" rx="12" ry="8" fill="#F2A900" opacity="0.6" transform="rotate(-15 40 110)" />
              <ellipse cx="75" cy="130" rx="13" ry="8" fill="#F2A900" opacity="0.65" transform="rotate(40 75 130)" />
              <ellipse cx="50" cy="160" rx="11" ry="7" fill="#F2A900" opacity="0.5" transform="rotate(-30 50 160)" />
              {/* Purple circle with paw */}
              <circle cx="80" cy="280" r="28" fill="#5F295E" opacity="0.7" />
              <path d="M72 274 Q80 266 88 274 L88 276 Q84 272 80 276 Q76 272 72 276 Z" fill="white" opacity="0.8" />
              {/* Green leaf shapes */}
              <ellipse cx="40" cy="380" rx="25" ry="45" fill="#274C46" opacity="0.25" transform="rotate(-15 40 380)" />
              <ellipse cx="70" cy="420" rx="20" ry="35" fill="#274C46" opacity="0.2" transform="rotate(15 70 420)" />
              {/* Pink splash */}
              <path d="M20 520 Q50 490 80 520 Q60 550 30 560 Q10 550 20 520Z" fill="#E88B7D" opacity="0.4" />
              {/* Red flower/splash at bottom */}
              <path d="M40 620 Q60 590 80 610 Q100 590 90 620 Q110 640 80 650 Q60 670 40 650 Q10 640 40 620Z" fill="#C4342D" opacity="0.4" />
            </svg>
          </div>

          <div className="px-8 md:pl-48 md:pr-12 py-16">
            <h2 className="text-[32px] md:text-[40px] font-semibold text-deep-green font-rubik leading-tight mb-3">
              {content?.heading || "Frequently Asked Questions"}
            </h2>
            <p className="text-[18px] text-deep-green mb-8">
              {content?.subheading || "Everything else you need to know about Pure"}
            </p>

            <div className="space-y-0">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-deep-green/15"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="w-full flex items-center justify-between py-4 text-left group"
                  >
                    <h4 className="text-[17px] font-semibold text-deep-green pr-4">
                      {faq.question}
                    </h4>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 48 48"
                      style={{ fill: '#274C46' }}
                      className={`shrink-0 transition-transform duration-300 ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                    >
                      <path d="m24 30.75-12-12 2.15-2.15L24 26.5l9.85-9.85L36 18.8Z" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openIndex === index ? "max-h-40 pb-4" : "max-h-0"
                    }`}
                  >
                    <p className="text-[16px] text-deep-green/80 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-block bg-gold text-deep-green px-7 py-3 rounded-[5px] font-semibold text-[18px] hover:bg-[#d99500] transition-colors duration-300"
              >
                Get started with 25% off
              </Link>
            </div>
          </div>
        </div>

        {/* Image Right Side */}
        <div className="w-full md:w-[45%] relative min-h-[400px]">
          <Image
            src="https://www.datocms-assets.com/55536/1686824798-good-for-gut-dog-food.jpg?auto=format&fit=crop&h=600&w=1000"
            alt="Happy healthy dog"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
