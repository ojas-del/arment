"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EditorOverlay from "@/components/EditorOverlay";

const recipes = [
  {
    name: "Chicken",
    subtitle: "with garden greens & strawberry pieces",
    image: "https://www.datocms-assets.com/55536/1685633706-chicken-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "general",
  },
  {
    name: "Duck",
    subtitle: "with a medley of veggies & bursts of blueberry",
    image: "https://www.datocms-assets.com/55536/1685633740-duck-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "general",
  },
  {
    name: "Game",
    subtitle: "with duck, turkey & a trio of greens",
    image: "https://www.datocms-assets.com/55536/1685633767-game-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "general",
  },
  {
    name: "Herring",
    subtitle: "with white fish and a medley of garden greens",
    image: "https://www.datocms-assets.com/55536/1685633801-herring-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "general",
  },
  {
    name: "Lamb",
    subtitle: "with a hint of coconut and sweet potato",
    image: "https://www.datocms-assets.com/55536/1685633826-lamb-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "general",
  },
  {
    name: "Salmon",
    subtitle: "with white fish & garden greens",
    image: "https://www.datocms-assets.com/55536/1685633857-salmon-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "general",
  },
  {
    name: "Turkey",
    subtitle: "with broccoli, spinach and flavoursome fruit",
    image: "https://www.datocms-assets.com/55536/1685633882-turkey-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "general",
  },
  {
    name: "Chicken",
    subtitle: "with gentle veggies for sensitive tummies",
    image: "https://www.datocms-assets.com/55536/1685633888-sensitive-chicken-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "sensitive",
  },
  {
    name: "Turkey",
    subtitle: "with calming sweet potato & pumpkin",
    image: "https://www.datocms-assets.com/55536/1685633882-turkey-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "sensitive",
  },
  {
    name: "Salmon",
    subtitle: "with soothing fish oils & vegetables",
    image: "https://www.datocms-assets.com/55536/1685633857-salmon-web-1.jpg?auto=format&fit=crop&h=400&w=400",
    category: "renal",
  },
];

const filterTabs = ["general", "sensitive", "renal"];

interface RecipesPageClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections: Record<string, any>;
}

export default function RecipesPageClient({ sections }: RecipesPageClientProps) {
  const [activeFilter, setActiveFilter] = useState("general");

  const filteredRecipes = recipes.filter((r) => r.category === activeFilter);

  return (
    <>
      <EditorOverlay />
      <Header />
      <main>
        {/* Hero Section */}
        <div data-section-index={0} data-section-name="Hero">
          <section
            className="relative w-full overflow-hidden"
            style={{ minHeight: "520px", paddingTop: "80px" }}
          >
            <div className="absolute inset-0">
              <Image
                src={sections[0]?.hero_image || "https://www.datocms-assets.com/55536/1673603893-personalised-dog-food-subscription.jpg?auto=format&fit=crop&h=800&w=1920"}
                alt="Delicious natural dog food ingredients"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-deep-green/80 via-deep-green/50 to-transparent" />
            </div>
            <div className="relative z-10 max-w-container mx-auto px-6 py-16 md:py-24">
              <div className="max-w-[520px]">
                <h1 className="font-rubik text-white text-[42px] md:text-[52px] font-semibold leading-[1.1] mb-4">
                  {sections[0]?.heading ?? "Real goodness"}<br />
                  <span className="text-gold italic">
                    {sections[0]?.heading_highlight ?? "Real food"}
                  </span>
                </h1>
                <p className="text-white/90 text-[17px] leading-relaxed mb-8 max-w-[400px]">
                  {sections[0]?.subheading ?? "After all, your pet should be eating like one of the family too."}
                </p>

                {/* Dropdown + CTA */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <select className="px-4 py-3 rounded-[5px] bg-white text-deep-green text-[15px] outline-none cursor-pointer min-w-[260px] border border-gray-200">
                    <option>What do you currently feed your dog?</option>
                    <option>Dry kibble</option>
                    <option>Wet/canned food</option>
                    <option>Raw food</option>
                    <option>Home cooked</option>
                    <option>Other</option>
                  </select>
                  <button className="bg-gold text-deep-green px-6 py-3 rounded-[5px] font-semibold text-[15px] hover:bg-[#d99500] transition-colors whitespace-nowrap">
                    See our healthy options
                  </button>
                </div>

                {/* Trustpilot */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <span
                        key={i}
                        className="inline-flex h-[22px] w-[22px] items-center justify-center"
                        style={{ backgroundColor: "#00B67A" }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                      </span>
                    ))}
                    <span
                      className="relative inline-flex h-[22px] w-[22px] items-center justify-center overflow-hidden"
                      style={{ backgroundColor: "#DCE8E2" }}
                    >
                      <span
                        className="absolute inset-0"
                        style={{ backgroundColor: "#00B67A", width: "70%" }}
                      />
                      <svg
                        className="relative z-10"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="white"
                      >
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    Excellent
                  </span>
                  <span className="text-sm text-white/70">4.7 out of 5</span>
                  <span className="text-xs text-white/60">Trustpilot</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Offer Banner */}
        <div data-section-index={1} data-section-name="Offer Banner">
          <Link
            href={sections[1]?.link_url ?? "/signup"}
            className="block w-full bg-[#E65A1E] hover:bg-[#D04E15] transition-colors duration-200 py-3 text-center text-white"
          >
            <p className="text-lg leading-snug">
              <span className="font-bold">
                {sections[1]?.primary_text ?? "25% off your first box"}
              </span>
              <span className="mx-1.5">+</span>
              <span className="font-medium text-base text-white/90">
                {sections[1]?.secondary_text ?? "10% off your next box"}
              </span>
            </p>
          </Link>
        </div>

        {/* Personalised to your dog - asymmetrical */}
        <div data-section-index={2} data-section-name="Personalised Section">
          <section className="relative">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[42%] relative min-h-[400px] md:min-h-[480px]">
                <Image
                  src={sections[2]?.image || "https://www.datocms-assets.com/55536/1673604512-delicious-dog-food.jpg?auto=format&fit=crop&h=600&w=1000"}
                  alt="Personalised dog food"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <div className="w-full md:w-[58%] flex items-center bg-off-white">
                <div className="px-8 md:px-12 lg:px-16 py-12 max-w-[540px]">
                  <h2 className="text-[32px] md:text-[38px] font-semibold text-deep-green leading-tight mb-1 font-rubik">
                    {sections[2]?.heading ?? "Personalised"}
                  </h2>
                  <p className="text-gold text-[30px] md:text-[36px] font-semibold font-rubik mb-6 italic">
                    {sections[2]?.subtitle ?? "to your dog"}
                  </p>
                  <p className="text-[16px] text-deep-green/80 leading-[1.7]">
                    {sections[2]?.description ?? "We\u2019ll create your dog\u2019s tailored menu designed to meet the needs of your pup down to a tee. You can then select up to two personalised recipes for each dog food delivery, helping you invest in the health of your dog for a long, paw-some life!"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Natural health, just add water - asymmetrical */}
        <div data-section-index={3} data-section-name="Natural Health">
          <section className="relative overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[380px]">
              <div className="w-full md:w-[58%] bg-deep-green flex items-center relative">
                <div className="px-8 md:px-12 lg:px-16 py-12 max-w-[540px]">
                  <h2 className="text-[30px] md:text-[38px] font-semibold text-white font-rubik leading-tight mb-1">
                    {sections[3]?.heading ?? "Natural health"}
                  </h2>
                  <p className="text-gold text-[28px] md:text-[34px] font-semibold font-rubik mb-6 italic">
                    {sections[3]?.subtitle ?? "just add water"}
                  </p>
                  <p className="text-white/85 text-[16px] leading-[1.7]">
                    {sections[3]?.description ?? "Lovingly prepared in Yorkshire, we don\u2019t use any weird ingredients or anything even remotely strange, it\u2019s just good, honest food that your dog will love! All you need to do is add water, stir and serve."}
                  </p>
                </div>
              </div>
              <div className="w-full md:w-[42%] relative min-h-[320px] md:min-h-[380px]">
                <Image
                  src={sections[3]?.image || "https://www.datocms-assets.com/55536/1673604556-just-add-water-dog-food.jpg?auto=format&fit=crop&h=600&w=1000"}
                  alt="Natural healthy dog food"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Recipe Grid */}
        <div data-section-index={4} data-section-name="Recipe Grid">
          <section className="bg-off-white py-16 md:py-20">
            <div className="max-w-[1100px] mx-auto px-6">
              <div className="text-center mb-2">
                <h2 className="text-[28px] md:text-[36px] font-semibold text-deep-green font-rubik mb-3">
                  {sections[4]?.heading ?? "Our drool-worthy menu of recipes"}
                </h2>
                <p className="text-deep-green/70 text-[15px] max-w-2xl mx-auto leading-relaxed">
                  {sections[4]?.subheading ?? "We\u2019ll tailor your menu specifically to your needs and make sure your dog gets the very best nutrition for them."}
                </p>
              </div>

              {/* Filter Tabs - underline style matching reference */}
              <div className="flex justify-center gap-6 my-8 border-b border-deep-green/10">
                {filterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-3 pb-3 text-[15px] font-medium capitalize transition-colors relative ${
                      activeFilter === tab
                        ? "text-deep-green"
                        : "text-deep-green/50 hover:text-deep-green/70"
                    }`}
                  >
                    {tab}
                    {activeFilter === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gold rounded-t-sm" />
                    )}
                  </button>
                ))}
              </div>

              {/* Recipe Cards - 4 columns on desktop matching reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredRecipes.map((recipe, i) => (
                  <div
                    key={i}
                    className="bg-white overflow-hidden border border-gray-100 hover:shadow-md transition-shadow group"
                  >
                    <div className="relative h-[180px] overflow-hidden">
                      <Image
                        src={recipe.image}
                        alt={recipe.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="border-t-[3px] border-gold" />
                    <div className="p-4 pb-5">
                      <h3 className="font-semibold text-deep-green text-[18px] font-rubik mb-1">
                        {recipe.name}
                      </h3>
                      <p className="text-deep-green/60 text-[13px] leading-relaxed mb-3 min-h-[36px]">
                        {recipe.subtitle}
                      </p>
                      <Link
                        href="/signup"
                        className="text-deep-green text-[14px] font-medium underline underline-offset-2 decoration-deep-green/40 hover:decoration-deep-green transition-colors"
                      >
                        More info
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Carefully prepared - with image on left, deep-green box on right (matching reference) */}
        <div data-section-index={5} data-section-name="Carefully Prepared">
          <section className="relative overflow-hidden bg-off-white">
            <div className="max-w-[1100px] mx-auto px-6 py-12 md:py-16">
              <div className="flex flex-col md:flex-row rounded-md overflow-hidden shadow-sm">
                <div className="w-full md:w-1/2 relative min-h-[320px] md:min-h-[380px]">
                  <Image
                    src={sections[5]?.image || "https://www.datocms-assets.com/55536/1673604627-healthy-dog-food-ingredients.jpg?auto=format&fit=crop&h=600&w=1000"}
                    alt="Carefully prepared dog food"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="w-full md:w-1/2 bg-deep-green flex items-center">
                  <div className="px-8 md:px-12 py-10 md:py-12">
                    <h2 className="text-[28px] md:text-[34px] font-semibold text-white font-rubik leading-tight mb-1">
                      {sections[5]?.heading ?? "Carefully prepared"}
                    </h2>
                    <p className="text-gold text-[26px] md:text-[32px] font-semibold font-rubik mb-5 italic">
                      {sections[5]?.subtitle ?? "with your dog in mind"}
                    </p>
                    <div className="space-y-4">
                      <p className="text-white/85 text-[15px] leading-[1.7]">
                        {sections[5]?.text_1 ?? "We take delicious, natural ingredients, chop them up really small to make everything a bit easier on the doggy digestive system and then remove the moisture from the food."}
                      </p>
                      <p className="text-white/85 text-[15px] leading-[1.7]">
                        {sections[5]?.text_2 ?? "This way, the nutrients in the food are carefully protected and naturally preserved, meaning that every bite is bursting with goodness and flavour."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Dogs deserve better - standalone text section matching reference */}
        <div data-section-index={6} data-section-name="Dogs Deserve Better">
          <section className="bg-white py-14 md:py-16">
            <div className="max-w-[800px] mx-auto px-6">
              <h2 className="text-[28px] md:text-[36px] font-semibold text-deep-green font-rubik leading-tight mb-5">
                {sections[6]?.heading ?? "Dogs deserve better"}
              </h2>
              <p className="text-deep-green/75 text-[16px] leading-[1.8]">
                {sections[6]?.description ?? "Other pet foods contain additives, preservatives and things you just wouldn\u2019t want to feed your dog. Our dogs are part of our family, so why wouldn\u2019t we feed them natural, healthy ingredients?"}
              </p>
            </div>
          </section>
        </div>

        {/* What if my dry dog food has good ingredients */}
        <div data-section-index={7} data-section-name="Dry Food Q&A">
          <section className="bg-off-white py-14 md:py-20 relative overflow-hidden">
            <div className="max-w-[800px] mx-auto px-6 relative z-10">
              <h2 className="text-[26px] md:text-[34px] font-semibold text-deep-green font-rubik leading-tight mb-8 text-center">
                {sections[7]?.heading ?? "What if my dry dog food has good ingredients?"}
              </h2>
              <div className="space-y-5 text-left">
                <p className="text-deep-green/75 text-[16px] leading-[1.8]">
                  {sections[7]?.text_1 ?? "Good ingredients are at the very core of good food, naturally. However, what it takes to get those great ingredients into a burnt, brown ball of kibble is pretty intense."}
                </p>
                <p className="text-deep-green/75 text-[16px] leading-[1.8]">
                  {sections[7]?.text_2 ?? "The ingredients are processed beyond recognition using a processing method called extrusion, which is where the food is put under harmfully high heats and then squished, prodded and shaped into those little brown balls we\u2019ve come to recognise as the norm for dog food. It\u2019s those extreme temperatures that can kill all the vital nutrients that were originally in the ingredients, making the quality of the initial ingredients not as important as you\u2019d think."}
                </p>
                <p className="text-deep-green/75 text-[16px] leading-[1.8]">
                  {sections[7]?.text_3 ?? "Our gently air-dried process locks in up to 5x more nutrients than traditional kibble, preserving the quality of the initial ingredients for your dog\u2019s benefit."}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Personalise your dog's food CTA - asymmetrical, purple bg */}
        <div data-section-index={8} data-section-name="Personalise CTA">
          <section className="relative overflow-hidden bg-[#5F295E]">
            <div className="flex flex-col md:flex-row min-h-[380px]">
              <div className="w-full md:w-[55%] flex items-center">
                <div className="px-8 md:px-12 lg:px-16 py-12 max-w-[540px]">
                  <h2 className="text-[30px] md:text-[38px] font-semibold text-white font-rubik leading-tight mb-1">
                    {sections[8]?.heading ?? "Personalise your"}
                  </h2>
                  <p className="text-gold text-[28px] md:text-[36px] font-semibold font-rubik mb-6 italic">
                    {sections[8]?.subtitle ?? "dog\u2019s food"}
                  </p>
                  <p className="text-white/85 text-[16px] leading-[1.7] mb-8">
                    {sections[8]?.description ?? "Proactively invest in your pet\u2019s health with a nutritious, vet-approved dog food that\u2019s trusted by thousands. Discover your dog\u2019s recipe today."}
                  </p>
                  <Link
                    href={sections[8]?.button_url ?? "/signup"}
                    className="inline-block bg-gold text-deep-green px-7 py-3 rounded-[5px] font-semibold text-[16px] hover:bg-[#d99500] transition-colors"
                  >
                    {sections[8]?.button_text ?? "Discover your dog\u2019s menu"}
                  </Link>
                </div>
              </div>
              <div className="w-full md:w-[45%] relative min-h-[320px] md:min-h-[380px]">
                <Image
                  src={sections[8]?.image || "https://www.datocms-assets.com/55536/1673543479-healthy-dog-food.jpg?auto=format&fit=crop&h=600&w=1000"}
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
