"use client";

import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EditorOverlay from "@/components/EditorOverlay";

/* Decorative SVG components */
function LeafShape({ className = "", fill = "#274C46", opacity = 0.2, style }: { className?: string; fill?: string; opacity?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 60 120" className={className} style={{ opacity, ...style }}>
      <path d="M30 0 C50 20 55 50 50 80 C45 100 35 115 30 120 C25 115 15 100 10 80 C5 50 10 20 30 0Z" fill={fill} />
    </svg>
  );
}

function OrangeBlob({ className = "", size = 40, style }: { className?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 50 50" width={size} height={size} className={className} style={style}>
      <path d="M25 5 Q40 8 45 25 Q40 42 25 45 Q10 42 5 25 Q10 8 25 5Z" fill="#E65A1E" opacity="0.7" />
    </svg>
  );
}

function GoldDot({ className = "", size = 12, style }: { className?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} className={className} style={style}>
      <circle cx="10" cy="10" r="8" fill="#F2A900" opacity="0.6" />
    </svg>
  );
}

function PurpleDot({ className = "", size = 10, style }: { className?: string; size?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} className={className} style={style}>
      <circle cx="10" cy="10" r="8" fill="#5F295E" opacity="0.5" />
    </svg>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AboutPageClient({ sections }: { sections: Record<string, any> }) {
  const s = sections; // shorthand

  const timeline = [
    {
      year: s[1]?.year ?? "2012",
      title: s[1]?.title ?? "It started with a simple question",
      content: [
        s[1]?.content_1 ?? "\"Little brown biscuits – we wouldn't eat these for every meal, every day, so why should our pets?\"",
        s[1]?.content_2 ?? "This is the question that led us on a journey to change the face of pet food for the better, offering up a service entirely different for dog owners all over the country.",
      ],
      image: null as string | null,
      bgColor: "bg-off-white",
      contentItalic: [true, false] as boolean[],
      sectionIndex: 1,
      sectionName: "2012 Timeline",
    },
    {
      year: s[2]?.year ?? "2013",
      title: s[2]?.title ?? "A food",
      titleHighlight: s[2]?.title_highlight ?? "revelation",
      content: [
        s[2]?.content ?? "Months of research led us to an age-old preservation method of removing the moisture from food, resulting in natural, high-quality, convenient meals without using the harmful extrusion process used to make traditional dry biscuit food.",
      ],
      image: s[2]?.image || "https://placedog.net/400/300?id=80",
      bgColor: "bg-off-white",
      imageRight: true,
      sectionIndex: 2,
      sectionName: "2013 Timeline",
    },
    {
      year: s[3]?.year ?? "2014",
      title: s[3]?.title ?? "Memorable",
      titleHighlight: s[3]?.title_highlight ?? "milestones",
      content: [
        s[3]?.content ?? "In 2014, our co-founders entered the Dragons' Den and we were lucky enough to win over two dragons! Despite the fantastic offers, the terms didn't quite suit us, and thanks to Pure's success, it's certainly not a decision we regret.",
      ],
      image: s[3]?.image || "https://placedog.net/400/300?id=81",
      bgColor: "bg-off-white",
      imageRight: false,
      sectionIndex: 3,
      sectionName: "2014 Timeline",
    },
    {
      year: s[4]?.year ?? "2017",
      title: s[4]?.title ?? "Hosting a",
      titleHighlight: s[4]?.title_highlight ?? "royal visit",
      content: [
        s[4]?.content ?? "Her Royal Highness Princess Anne, a keen animal lover, visited us here in West Yorkshire in 2017. After a tour around, we couldn't let her go without a few treats for her own dogs!",
      ],
      image: s[4]?.image || "https://placedog.net/400/300?id=82",
      bgColor: "bg-off-white",
      imageRight: true,
      sectionIndex: 4,
      sectionName: "2017 Timeline",
    },
    {
      year: s[5]?.year ?? "2024",
      title: s[5]?.title ?? "Where we are",
      titleHighlight: s[5]?.title_highlight ?? "today",
      content: [
        s[5]?.content_1 ?? "We've come a long way from creating recipes in Dan's kitchen. Pure Pet Food has moved into bigger and better facilities in West Yorkshire, working alongside industry-leading vets and nutritionists to cultivate one of the best, natural dog food brands in the UK. Although we may have grown, what drives us remains the same: to provide happier, healthier and longer lives for our pets.",
        s[5]?.content_2 ?? "So you could say that in many ways, this is only the beginning!",
      ],
      image: null as string | null,
      bgColor: "bg-off-white",
      sectionIndex: 5,
      sectionName: "2024 Timeline",
    },
  ];

  return (
    <>
      <EditorOverlay />
      <Header />
      <main>
        {/* Hero Video Section */}
        <div data-section-index={0} data-section-name="Hero">
          <section
            className="relative w-full overflow-hidden"
            style={{ minHeight: "520px", paddingTop: "80px" }}
          >
            <div className="absolute inset-0">
              <Image
                src={s[0]?.hero_image || "https://placedog.net/1600/700?id=85"}
                alt="Pure Pet Food founders"
                fill
                unoptimized
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
            {/* Play button - centered */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-[72px] h-[72px] bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition-colors shadow-lg group">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#274C46" className="ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </section>
        </div>

        {/* Clean transition - no zigzag divider */}

        {/* Timeline */}
        <div className="relative">
          {timeline.map((item, index) => (
            <div key={index} data-section-index={item.sectionIndex} data-section-name={item.sectionName}>
              <section
                className={`${item.bgColor} relative overflow-hidden`}
                style={{ paddingTop: index === 0 ? "48px" : "56px", paddingBottom: index === timeline.length - 1 ? "56px" : "56px" }}
              >
                {/* ---- Decorative elements per section ---- */}

                {/* Section 0 (2012): orange blob + green leaves on right */}
                {index === 0 && (
                  <div className="absolute right-0 top-0 h-full pointer-events-none hidden lg:block" style={{ width: "160px" }}>
                    <OrangeBlob className="absolute" style={{ top: "60px", right: "30px" } as React.CSSProperties} size={45} />
                    <OrangeBlob className="absolute" style={{ top: "120px", right: "60px" } as React.CSSProperties} size={30} />
                    <LeafShape className="absolute w-[30px] h-[60px]" style={{ top: "200px", right: "20px" } as React.CSSProperties} fill="#274C46" opacity={0.15} />
                    <LeafShape className="absolute w-[22px] h-[44px]" style={{ top: "290px", right: "50px" } as React.CSSProperties} fill="#274C46" opacity={0.12} />
                    <GoldDot className="absolute" style={{ top: "160px", right: "80px" } as React.CSSProperties} size={10} />
                  </div>
                )}

                {/* Section 1 (2013): small gold dots on left */}
                {index === 1 && (
                  <div className="absolute left-0 top-0 h-full pointer-events-none hidden lg:block" style={{ width: "120px" }}>
                    <GoldDot className="absolute" style={{ top: "40px", left: "30px" } as React.CSSProperties} size={12} />
                    <GoldDot className="absolute" style={{ top: "80px", left: "50px" } as React.CSSProperties} size={8} />
                    <PurpleDot className="absolute" style={{ top: "120px", left: "20px" } as React.CSSProperties} size={10} />
                  </div>
                )}

                {/* Section 2 (2014): orange blob + dots on right */}
                {index === 2 && (
                  <div className="absolute right-0 top-0 h-full pointer-events-none hidden lg:block" style={{ width: "140px" }}>
                    <OrangeBlob className="absolute" style={{ top: "30px", right: "20px" } as React.CSSProperties} size={35} />
                    <GoldDot className="absolute" style={{ top: "90px", right: "55px" } as React.CSSProperties} size={10} />
                    <LeafShape className="absolute w-[20px] h-[40px]" style={{ top: "130px", right: "30px" } as React.CSSProperties} fill="#274C46" opacity={0.12} />
                  </div>
                )}

                {/* Section 3 (2017): leaves on left */}
                {index === 3 && (
                  <div className="absolute left-0 top-0 h-full pointer-events-none hidden lg:block" style={{ width: "120px" }}>
                    <LeafShape className="absolute w-[24px] h-[48px]" style={{ top: "50px", left: "20px" } as React.CSSProperties} fill="#274C46" opacity={0.15} />
                    <GoldDot className="absolute" style={{ top: "120px", left: "40px" } as React.CSSProperties} size={10} />
                    <OrangeBlob className="absolute" style={{ bottom: "40px", left: "25px" } as React.CSSProperties} size={28} />
                  </div>
                )}

                {/* Section 4 (2024): orange blobs + leaves on right, gold dots on left */}
                {index === 4 && (
                  <>
                    <div className="absolute right-0 top-0 h-full pointer-events-none hidden lg:block" style={{ width: "160px" }}>
                      <OrangeBlob className="absolute" style={{ top: "40px", right: "25px" } as React.CSSProperties} size={40} />
                      <OrangeBlob className="absolute" style={{ top: "100px", right: "55px" } as React.CSSProperties} size={25} />
                      <LeafShape className="absolute w-[28px] h-[56px]" style={{ top: "160px", right: "20px" } as React.CSSProperties} fill="#274C46" opacity={0.15} />
                      <LeafShape className="absolute w-[20px] h-[40px]" style={{ top: "240px", right: "50px" } as React.CSSProperties} fill="#274C46" opacity={0.12} />
                      <GoldDot className="absolute" style={{ top: "300px", right: "35px" } as React.CSSProperties} size={10} />
                    </div>
                    <div className="absolute left-0 bottom-0 pointer-events-none hidden lg:block" style={{ width: "120px" }}>
                      <GoldDot className="absolute" style={{ bottom: "80px", left: "30px" } as React.CSSProperties} size={14} />
                      <GoldDot className="absolute" style={{ bottom: "50px", left: "55px" } as React.CSSProperties} size={10} />
                      <LeafShape className="absolute w-[22px] h-[44px]" style={{ bottom: "100px", left: "15px" } as React.CSSProperties} fill="#274C46" opacity={0.1} />
                    </div>
                  </>
                )}

                <div className="max-w-[900px] mx-auto px-6">
                  {!item.image ? (
                    /* Text-only section (centered) */
                    <div className="text-center max-w-[650px] mx-auto">
                      <p className="text-gold font-semibold text-[15px] tracking-wide mb-3 uppercase" style={{ letterSpacing: "0.05em" }}>
                        {item.year}
                      </p>
                      <h2 className="text-[28px] md:text-[36px] font-semibold text-deep-green font-rubik leading-tight mb-6">
                        {item.title}
                        {item.titleHighlight && (
                          <>
                            <br />
                            <span className="text-gold">{item.titleHighlight}</span>
                          </>
                        )}
                      </h2>
                      <div className="space-y-4">
                        {item.content.map((para, pIdx) => (
                          <p
                            key={pIdx}
                            className={`text-deep-green text-[16px] leading-[1.75] ${
                              item.contentItalic?.[pIdx] ? "italic" : ""
                            }`}
                          >
                            {para}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Text + Image section */
                    <div
                      className={`flex flex-col ${
                        item.imageRight ? "md:flex-row" : "md:flex-row-reverse"
                      } items-center gap-10 md:gap-12`}
                    >
                      <div className="w-full md:w-1/2">
                        <p className="text-gold font-semibold text-[15px] tracking-wide mb-3 uppercase" style={{ letterSpacing: "0.05em" }}>
                          {item.year}
                        </p>
                        <h2 className="text-[26px] md:text-[34px] font-semibold text-deep-green font-rubik leading-tight mb-4">
                          {item.title}
                          {item.titleHighlight && (
                            <>
                              <br />
                              <span className="text-gold">
                                {item.titleHighlight}
                              </span>
                            </>
                          )}
                        </h2>
                        <div className="space-y-4">
                          {item.content.map((para, pIdx) => (
                            <p
                              key={pIdx}
                              className="text-deep-green text-[15px] leading-[1.75]"
                            >
                              {para}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="w-full md:w-1/2">
                        <div className="relative">
                          {/* Subtle background tint behind image */}
                          <div
                            className="absolute -inset-3 rounded-3xl opacity-30"
                            style={{
                              backgroundColor:
                                index === 1 ? "#D4B896" :
                                index === 2 ? "#C9B99A" :
                                index === 3 ? "#D4B896" : "#C9B99A",
                            }}
                          />
                          <div className="relative h-[260px] md:h-[280px] rounded-2xl overflow-hidden">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ))}
        </div>

        {/* Stats Section - clean, no zigzag dividers */}
        <div data-section-index={6} data-section-name="Stats">
          <section className="bg-deep-green py-16 md:py-20">
            <div className="max-w-[1200px] mx-auto px-6 text-center">
              <h2 className="text-[24px] md:text-[28px] font-semibold text-white font-rubik mb-1">
                {s[6]?.heading ?? "Since 2012"}
              </h2>
              <p className="text-gold text-[22px] md:text-[28px] font-semibold font-rubik mb-5">
                {s[6]?.subtitle ?? "we\u2019ve delivered"}
              </p>
              <div className="text-[52px] md:text-[72px] lg:text-[80px] font-bold text-gold font-rubik mb-5 leading-none tracking-tight">
                {s[6]?.number ?? "92,871,751"}
              </div>
              <p className="text-[16px] text-white/80 max-w-lg mx-auto leading-relaxed">
                {s[6]?.description ?? "meals and changed the lives of thousands of pets for the better"}
              </p>
            </div>
          </section>
        </div>

        {/* Learn more about Pure - asymmetrical layout */}
        <div data-section-index={7} data-section-name="Learn More">
          <section className="relative overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[440px]">
              <div className="w-full md:w-[42%] relative min-h-[360px] md:min-h-[440px]">
                <Image
                  src={s[7]?.image || "https://placedog.net/700/400?id=86"}
                  alt="Learn more about Pure"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="w-full md:w-[58%] bg-off-white flex items-center">
                <div className="px-8 md:px-14 lg:px-20 py-12 md:py-16">
                  <h2 className="text-[28px] md:text-[36px] font-semibold text-deep-green font-rubik leading-tight mb-1">
                    {s[7]?.heading ?? "Learn more"}
                  </h2>
                  <p className="text-gold text-[26px] md:text-[34px] font-semibold font-rubik mb-6">
                    {s[7]?.subtitle ?? "about Pure"}
                  </p>
                  <p className="text-deep-green text-[15px] leading-[1.8]">
                    {s[7]?.description ?? "Our dogs are a part of the family, so they deserve the best food. After all, healthy dogs live longer lives! Just tell us about your dog and we\u2019ll create tailored recipes so they can always enjoy healthy, delicious food that\u2019s delivered straight to your door. Simply add water, stir and serve."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Personalise your dog's food CTA - asymmetrical, purple bg */}
        <div data-section-index={8} data-section-name="Personalise CTA">
          <section className="relative overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[420px]">
              <div className="w-full md:w-[55%] bg-[#5F295E] flex items-center">
                <div className="px-8 md:px-14 lg:px-20 py-12 md:py-16">
                  <h2 className="text-[30px] md:text-[38px] font-semibold text-white font-rubik leading-tight mb-1">
                    {s[8]?.heading ?? "Personalise your"}
                  </h2>
                  <p className="text-gold text-[26px] md:text-[34px] font-semibold font-rubik mb-6">
                    {s[8]?.subtitle ?? "dog\u2019s food"}
                  </p>
                  <p className="text-white/85 text-[15px] leading-[1.8] mb-8 max-w-md">
                    {s[8]?.description ?? "Proactively invest in your pet\u2019s health with a nutritious, vet-approved dog food that\u2019s trusted by thousands. Discover your dog\u2019s recipe today."}
                  </p>
                  <Link
                    href={s[8]?.button_url ?? "/signup"}
                    className="inline-block bg-gold text-deep-green px-7 py-3 rounded-[5px] font-semibold text-[16px] hover:bg-[#d99500] transition-colors"
                  >
                    {s[8]?.button_text ?? "Discover your dog\u2019s menu"}
                  </Link>
                </div>
              </div>
              <div className="w-full md:w-[45%] relative min-h-[350px] md:min-h-[420px]">
                <Image
                  src={s[8]?.image || "https://placedog.net/700/400?id=87"}
                  alt="Personalise your dog's food"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
