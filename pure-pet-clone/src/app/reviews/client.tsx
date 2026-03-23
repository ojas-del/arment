"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EditorOverlay from "@/components/EditorOverlay";

const reviews = [
  {
    name: "Stacey",
    initial: "S",
    rating: 5,
    title: "New lease of life",
    text: "Rosie has been on Pure Food for 6 weeks now & OMG what a difference! You have given our 12 year old American Bulldog a whole new lease of life, her energy levels have raised & you can tell she is feeling better in herself. Her coat is so shiny her fur is really soft, looks like puppy fur again.",
  },
  {
    name: "Dani",
    initial: "D",
    rating: 5,
    title: "Thank you for changing our lives",
    text: "We have a fussy almost 2-yr old GSD. Researched a ton about the right food for him, found Pure and thought let's give it a try! He bloody loves it - breakfast & dinner are now his favourite part of the day. Thank you for changing our lives, we have struggled so much - his coat and weight is already better!",
  },
  {
    name: "Sophie",
    initial: "S",
    rating: 5,
    title: "The nutrition is excellent",
    text: "Since swapping food my dogs coat has become less greasy. The nutrition is excellent and I like that there's variety in flavours to the food without causing stomach issues. Her stool is brilliant. Cannot fault the food. The pricing is slightly more expensive than some store providers but for the best nutrition it is certainly worth it.",
  },
  {
    name: "Kelly",
    initial: "K",
    rating: 5,
    title: "Back to his cheeky self",
    text: "This food has been fantastic for my Sprocker Ruger. He was diagnosed with pancreatitis. He has been on Pure Pet Food for a while and his stools have firmed up and no longer contain blood. He is now back to his cheeky self which I am very thankful for as it was a horrible time.",
  },
  {
    name: "Dottie",
    initial: "D",
    rating: 5,
    title: "Highly recommended",
    text: "My dog is in love with pure food I've never seen him lick the bowl clean everytime like he dose with pure dog food. His fur-skin and health have improved so much in a short space of time with eating pure food. I've highly recommended to other dog owners - that's how impressed I am.",
  },
  {
    name: "Robyn",
    initial: "R",
    rating: 5,
    title: "Their stomach has gotten so much better",
    text: "My dog has always had a sensitive stomach but since switching to Pure it has gotten so much better! I started a subscription initially due to the multiple good reviews for dogs with similar issues. Overall recommend Pure and will be transitioning my second (less fussy) dog once his current food runs low.",
  },
  {
    name: "Jean",
    initial: "J",
    rating: 5,
    title: "So glad we gave it a go",
    text: "I am so pleased with this food. Not only does my dog love to eat it, her stomach tolerates it really well. She gets bouts of colitis and this food has improved it dramatically. So glad we gave it a go.",
  },
  {
    name: "Laura",
    initial: "L",
    rating: 5,
    title: "Nothing but positive comments",
    text: "They have now been on the food for two months and I have nothing but positive comments... Such a great idea to add water afterwards to reduce packaging and transport weight, best of both worlds for us as it is convenient plus the dogs get enough moisture, as one of ours is a very thirsty pup!",
  },
  {
    name: "Jilly",
    initial: "J",
    rating: 5,
    title: "Much much better quality",
    text: "I did some research and started my boxer on Pure, which he has been on for about 2 months now which doesn't cost me any more than the wet tray food but is much much better quality. His stomach has improved lots and his coat is nicer than it has ever been, it's soft, smooth and shiny! I would highly recommend.",
  },
];

const categories = [
  "Fussy dogs",
  "Anal gland problems",
  "Colitis",
  "Happy healthy dogs",
  "Pancreatitis",
  "Oral health",
  "Sensitive skin",
  "Sensitive stomach",
  "Kidney disease",
  "Arthritis",
  "Tear stains",
  "Weight management",
];

const categoryTestimonials = [
  {
    name: "Janet & Bunty",
    image: "https://www.datocms-assets.com/55536/1639735109-bunty-janet-cowie1.jpg?auto=format&fit=crop&h=400&w=400",
    text: "My Maltese was becoming a fussy eater. The ad for Pure popped up on Instagram and I placed an order. I'm so glad I did, I had to contact them for further advice and their customer service was brilliant.",
  },
  {
    name: "Louise & Echo",
    image: "https://www.datocms-assets.com/55536/1639744500-echo-web.jpg?auto=format&fit=crop&h=400&w=400",
    text: "Was a tad sceptical at first that any dog will love this food, even the fussy ones as I have an extremely fussy dog! We tried the starter pack and Echo actually loved it from day one.",
  },
  {
    name: "Julie & Alfie",
    image: "https://www.datocms-assets.com/55536/1639668122-alfie-lauren.jpg?auto=format&fit=crop&h=400&w=400",
    text: "Brilliant I was debating to try yet another food as my chi is very fussy, so glad I did. I have only had him a few months and he was originally on cheap horrible food.",
  },
  {
    name: "Alejandra & Coco",
    image: "https://www.datocms-assets.com/55536/1639739384-coco-1.jpg?auto=format&fit=crop&h=400&w=400",
    text: "My dog is a very fussy eater and she loved loved loved this food straight away! Now she sits and happily waits for her food to be prepared. This food even smells good!",
  },
];

const TrustpilotBadge = () => (
  <div className="flex items-center gap-1.5">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 0L14.59 8.41H24L16.71 13.59L19.29 22L12 16.82L4.71 22L7.29 13.59L0 8.41H9.41L12 0Z" fill="#00B67A"/>
    </svg>
    <span className="text-[11px] font-semibold text-deep-green/60">Trustpilot</span>
  </div>
);

const StarRating = ({ count }: { count: number }) => (
  <div className="flex gap-0.5">
    {[...Array(count)].map((_, i) => (
      <span
        key={i}
        className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-[1px]"
        style={{ backgroundColor: "#00B67A" }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </span>
    ))}
  </div>
);

const PlayButton = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-[72px] h-[72px] bg-gold rounded-full flex items-center justify-center cursor-pointer hover:bg-[#d99500] transition-colors shadow-lg">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="white"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  </div>
);

interface ReviewsPageClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sections: Record<string, any>;
}

export default function ReviewsPageClient({ sections }: ReviewsPageClientProps) {
  const [activeCategory, setActiveCategory] = useState("Fussy dogs");

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
                src={sections[0]?.hero_image || "https://www.datocms-assets.com/55536/1673617327-dog-food-reviews.jpg?auto=format&fit=crop&h=800&w=1920"}
                alt="Dog food reviews"
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-deep-green/90 via-deep-green/70 to-transparent" />
            </div>
            <div className="relative z-10 max-w-container mx-auto px-6 py-16 md:py-24">
              <div className="max-w-[520px]">
                <h1 className="font-rubik text-white text-[40px] md:text-[52px] font-bold leading-[1.1] mb-6">
                  {sections[0]?.heading ?? "Pet's lives we've"}{" "}
                  <span className="text-gold">{sections[0]?.heading_highlight ?? "changed for the better"}</span>
                </h1>
                <p className="text-white/90 text-[17px] leading-relaxed mb-8 max-w-[420px]">
                  {sections[0]?.subheading ?? "Investing in your pet's diet can have a transformational impact on their health and happiness."}
                </p>
                <Link
                  href="/signup"
                  className="inline-block bg-gold text-deep-green px-8 py-3.5 rounded-[5px] font-bold text-[16px] hover:bg-[#d99500] transition-colors"
                >
                  {sections[0]?.button_text ?? "Create a tailored plan"}
                </Link>
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
            <p className="text-[15px] leading-snug tracking-wide">
              <span className="font-bold">{sections[1]?.primary_text ?? "25% off your first box"}</span>
              <span className="mx-2">+</span>
              <span className="font-medium text-[14px] text-white/90">
                {sections[1]?.secondary_text ?? "10% off your next box"}
              </span>
            </p>
          </Link>
        </div>

        {/* Reviews Grid — hardcoded, not editable */}
        <section className="bg-off-white py-14">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-deep-green text-white flex items-center justify-center font-semibold text-[14px] flex-shrink-0">
                        {review.initial}
                      </div>
                      <div>
                        <p className="font-semibold text-deep-green text-[14px] leading-tight">
                          {review.name}
                        </p>
                        <StarRating count={review.rating} />
                      </div>
                    </div>
                    <TrustpilotBadge />
                  </div>
                  <h3 className="font-bold text-deep-green text-[15px] mb-1.5 leading-snug">
                    {review.title}
                  </h3>
                  <p className="text-deep-green/75 text-[13px] leading-[1.6] line-clamp-4">
                    {review.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lulu Story Section */}
        <div data-section-index={2} data-section-name="Lulu's Story">
          <section className="relative overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[500px]">
              <div className="w-full md:w-[58%] bg-off-white flex items-center">
                <div className="px-8 md:px-14 lg:px-20 py-12 max-w-[560px]">
                  <h2 className="text-[34px] md:text-[42px] font-bold text-deep-green font-rubik leading-[1.1] mb-1">
                    {sections[2]?.heading ?? "Lulu is now"}
                  </h2>
                  <p className="text-gold text-[32px] md:text-[40px] font-bold font-rubik mb-6">
                    {sections[2]?.subtitle ?? "a different dog"}
                  </p>
                  <div className="space-y-4">
                    <p className="text-deep-green/90 text-[15px] leading-[1.7]">
                      {sections[2]?.text_1 ?? "We rescued Lulu from the Pro Dogs Direct charity, who were great. She came to us with a whole host of stomach and digestive issues. They were so bad that euthanasia was discussed twice by our vets."}
                    </p>
                    <p className="text-deep-green/90 text-[15px] leading-[1.7]">
                      {sections[2]?.text_2 ?? "We tried tablets, gels, and prescription kibble diets, and by this point, we were at our wits end. We found Pure after seeing a review online, within just 2 days her issues had eased, and now 3 months on she\u2019s a different dog. Thank you so much for saving our dog\u2019s life!"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-[42%] relative min-h-[350px] md:min-h-[500px]">
                <Image
                  src={sections[2]?.image || "https://www.datocms-assets.com/55536/1647940616-800x800-review-lloyd-peter-lulu.jpg?auto=format&fit=crop&h=600&w=1000"}
                  alt="Lulu the rescue dog"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <PlayButton />
              </div>
            </div>
          </section>
        </div>

        {/* Backed by Vets Section */}
        <div data-section-index={3} data-section-name="Backed by Vets">
          <section className="bg-deep-green py-16 relative overflow-hidden">
            <div className="max-w-[1100px] mx-auto px-6">
              <div className="text-center mb-12">
                <h2 className="text-[32px] md:text-[40px] font-bold text-white font-rubik mb-1">
                  {sections[3]?.heading ?? "Backed by vets"}
                </h2>
                <p className="text-gold text-[26px] md:text-[34px] font-bold font-rubik">
                  {sections[3]?.subtitle ?? "Formulated by nutritionists"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vet 1 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col md:flex-row gap-5 items-start">
                  <div className="w-[120px] h-[120px] relative rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
                    <Image
                      src={sections[3]?.vet_1_image || "https://www.datocms-assets.com/55536/1639653590-editorial-process-and-review-julian.jpg?auto=format&fit=crop&h=800&w=800"}
                      alt={sections[3]?.vet_1_name ?? "Dr Julian Norton"}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/90 text-[14px] leading-[1.7] mb-3 italic">
                      &ldquo;{sections[3]?.vet_1_quote ?? "I\u2019ve been a vet for over 30 years and for about the last 5 years I\u2019ve been suggesting Pure to my patients. I\u2019ve found it to be incredibly helpful and some of the dogs have responded dramatically well."}&rdquo;
                    </p>
                    <p className="text-white font-bold text-[13px]">
                      {sections[3]?.vet_1_name ?? "Dr Julian Norton MA VetMB GPcertSAP MRCVS, Partner"}
                    </p>
                  </div>
                </div>

                {/* Vet 2 */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col md:flex-row gap-5 items-start">
                  <div className="w-[120px] h-[120px] relative rounded-full overflow-hidden flex-shrink-0 border-2 border-white/20">
                    <Image
                      src={sections[3]?.vet_2_image || "https://www.datocms-assets.com/55536/1647942964-brendan-600x600.jpg?auto=format&fit=crop&h=800&w=800"}
                      alt={sections[3]?.vet_2_name ?? "Dr Brendan Clark"}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/90 text-[14px] leading-[1.7] mb-3 italic">
                      &ldquo;{sections[3]?.vet_2_quote ?? "When owners are asked what makes a healthy pet food, they often mention ingredients. But what is often not considered is how the food is processed, and this is possibly the most significant factor when choosing a dog food."}&rdquo;
                    </p>
                    <p className="text-white font-bold text-[13px]">
                      {sections[3]?.vet_2_name ?? "Dr Brendan Clark MRCVS"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Meet Nelly & Polly */}
        <div data-section-index={4} data-section-name="Nelly & Polly">
          <section className="relative overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[480px]">
              <div className="w-full md:w-[42%] relative min-h-[350px] md:min-h-[480px]">
                <Image
                  src={sections[4]?.image || "https://www.datocms-assets.com/55536/1647612430-800x800-review-polly.jpg?auto=format&fit=crop&h=600&w=1000"}
                  alt="Nelly the dog"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <PlayButton />
              </div>
              <div className="w-full md:w-[58%] bg-off-white flex items-center">
                <div className="px-8 md:px-14 lg:px-20 py-12 max-w-[560px]">
                  <h2 className="text-[34px] md:text-[42px] font-bold text-deep-green font-rubik leading-[1.1] mb-6">
                    {sections[4]?.heading ?? "Meet Nelly & Polly"}
                  </h2>
                  <div className="space-y-4">
                    <p className="text-deep-green/90 text-[15px] leading-[1.7]">
                      {sections[4]?.text_1 ?? "I rescued Nelly two years ago. She came to me with alopecia; she would itch so much that she had scabs and whiteheads covering her whole body."}
                    </p>
                    <p className="text-deep-green/90 text-[15px] leading-[1.7]">
                      {sections[4]?.text_2 ?? "I couldn\u2019t even stroke her, which was heart-breaking."}
                    </p>
                    <p className="text-deep-green/90 text-[15px] leading-[1.7]">
                      {sections[4]?.text_3 ?? "We switched from brown biscuits to Pure, and after just a week she completely stopped itching, and her skin cleared up. Thank you Pure for giving Nelly her life back."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* We've helped 1000's of dogs */}
        <div data-section-index={5} data-section-name="We've Helped">
          <section className="bg-off-white py-16">
            <div className="max-w-[1100px] mx-auto px-6">
              <div className="text-center mb-8">
                <h2 className="text-[32px] md:text-[40px] font-bold text-deep-green font-rubik mb-0">
                  {sections[5]?.heading ?? "We've helped"}
                </h2>
                <p className="text-gold text-[30px] md:text-[38px] font-bold font-rubik">
                  {sections[5]?.subtitle ?? "1000's of dogs"}
                </p>
              </div>

              {/* Category Tags — hardcoded, not editable */}
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-200 border ${
                      activeCategory === cat
                        ? "bg-deep-green text-white border-deep-green shadow-sm"
                        : "bg-white text-deep-green border-deep-green/20 hover:border-deep-green/40 hover:shadow-sm"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Testimonial Cards — hardcoded, not editable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {categoryTestimonials.map((item, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    <div className="relative h-[200px]">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-deep-green text-[15px] mb-2">
                        {item.name}
                      </p>
                      <p className="text-deep-green/75 text-[13px] leading-[1.6] line-clamp-4">
                        {item.text}
                      </p>
                      <button className="text-gold font-bold text-[13px] mt-2 hover:underline">
                        Show more
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Diesel Story */}
        <div data-section-index={6} data-section-name="Diesel's Story">
          <section className="relative overflow-hidden">
            <div className="flex flex-col md:flex-row min-h-[500px]">
              <div className="w-full md:w-[58%] bg-deep-green flex items-center">
                <div className="px-8 md:px-14 lg:px-20 py-12 max-w-[560px]">
                  <h2 className="text-[34px] md:text-[42px] font-bold text-white font-rubik leading-[1.1] mb-6">
                    {sections[6]?.heading ?? "Diesel's much healthier"}
                  </h2>
                  <div className="space-y-4">
                    <p className="text-white/85 text-[15px] leading-[1.7]">
                      {sections[6]?.text_1 ?? "This is Diesel. For the first two years, he was a happy and healthy pup, it wasn\u2019t until just after his 2nd birthday that he started to develop skin, stomach and bladder problems."}
                    </p>
                    <p className="text-white/85 text-[15px] leading-[1.7]">
                      {sections[6]?.text_2 ?? "We switched to Pure as it\u2019s nutritious and doesn\u2019t have any of the nasty stuff in it. We\u2019ve realised by investing in Diesel\u2019s health we can give him a healthy, happy life."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-[42%] relative min-h-[350px] md:min-h-[500px]">
                <Image
                  src={sections[6]?.image || "https://www.datocms-assets.com/55536/1673543479-healthy-dog-food.jpg?auto=format&fit=crop&h=600&w=1000"}
                  alt="Diesel the dog"
                  fill
                  unoptimized
                  className="object-cover"
                />
                <PlayButton />
              </div>
            </div>
          </section>
        </div>

        {/* Stats Section */}
        <div data-section-index={7} data-section-name="Stats">
          <section className="bg-off-white py-16">
            <div className="max-w-[1200px] mx-auto px-6 text-center">
              <h2 className="text-[34px] md:text-[40px] font-bold text-deep-green font-rubik mb-2">
                {sections[7]?.heading ?? "We've delivered"}
              </h2>
              <div className="text-[52px] md:text-[72px] font-bold text-gold font-rubik mb-3 leading-[1]">
                {sections[7]?.number ?? "92,871,751"}
              </div>
              <p className="text-[16px] text-deep-green/80 max-w-lg mx-auto mb-12">
                {sections[7]?.description ?? "meals and changed the lives of thousands of pets for the better"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <div className="bg-beige-light rounded-xl p-6 flex items-center gap-5">
                  <span className="text-[44px] md:text-[52px] font-bold text-gold font-rubik shrink-0 leading-[1]">
                    {sections[7]?.stat_1_value ?? "94%"}
                  </span>
                  <p className="text-left text-[15px] font-semibold text-deep-green leading-snug">
                    {sections[7]?.stat_1_label ?? "of customers have seen an improvement in their dog's ailment"}
                  </p>
                </div>
                <div className="bg-beige-light rounded-xl p-6 flex items-center gap-5">
                  <span className="text-[44px] md:text-[52px] font-bold text-gold font-rubik shrink-0 leading-[1]">
                    {sections[7]?.stat_2_value ?? "91%"}
                  </span>
                  <p className="text-left text-[15px] font-semibold text-deep-green leading-snug">
                    {sections[7]?.stat_2_label ?? "of customers have seen overall health improvements since switching to Pure"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
