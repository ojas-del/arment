"use client";

import { useRef } from "react";

const videos = [
  { src: "https://pure-website.s3.eu-west-2.amazonaws.com/Product+Benefits+Social+9X16.mp4", duration: "0:55", title: "Pure vs kibble & raw" },
  { src: "https://pure-website.s3.eu-west-2.amazonaws.com/Preparing+Pure+9X16.mp4", duration: "0:38", title: "Feeding Pure really is simple!" },
  { src: "https://pure-website.s3.eu-west-2.amazonaws.com/Why+Pure+Works+Compressed.mp4", duration: "0:54", title: "We've done the research" },
  { src: "https://pure-website.s3.eu-west-2.amazonaws.com/Ugc+April+Video+-+Why+Pure+Works.mp4", duration: "0:37", title: "Fully flexible to work around you" },
  { src: "https://pure-website.s3.eu-west-2.amazonaws.com/Fussy+Eater+Ugc(2).mp4", duration: "0:38", title: "Rudy goes from fussy to foodie" },
  { src: "https://pure-website.s3.eu-west-2.amazonaws.com/Julian+Social+H265.mp4", duration: "0:37", title: "Backed by The Yorkshire Vet" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function VideoTestimonials({ content }: { content?: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-off-white py-16 pb-12">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-[36px] md:text-[40px] font-semibold text-deep-green font-rubik mb-3">
            {content?.heading || "Don't just take our word for it"}
          </h2>
          <p className="text-[18px] text-deep-green">
            {content?.subheading || 'Listen to what others have to say about it'}
          </p>
        </div>

        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors -ml-2"
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Video Carousel */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-8"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {videos.map((video, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-[260px] cursor-pointer group"
              >
                <div className="relative rounded-xl overflow-hidden mb-3 aspect-[3/4] bg-deep-green/10">
                  <video
                    src={video.src}
                    muted
                    loop
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center group-hover:bg-white transition-colors">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#274C46">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white text-sm px-2 py-0.5 rounded">
                    {video.duration}
                  </div>
                </div>
                <p className="text-deep-green font-medium text-[15px]">
                  {video.title}
                </p>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors -mr-2"
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#274C46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
