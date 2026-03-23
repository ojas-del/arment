"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const pureLinks = [
  { label: "Reviews", href: "/reviews" },
  { label: "Recipes", href: "/recipes" },
  { label: "Benefits", href: "/benefits" },
  { label: "Pet panel", href: "/about" },
  { label: "Our story", href: "/about" },
  { label: "Puppies", href: "/recipes" },
  { label: "Breeds", href: "/benefits" },
  { label: "Dog professionals", href: "/about" },
  { label: "Careers", href: "/about" },
];

const helpLinks = [
  { label: "Research", href: "/reviews" },
  { label: "Blog", href: "/reviews" },
  { label: "Breeds", href: "/benefits" },
  { label: "Get in touch", href: "/about" },
  { label: "Help centre", href: "/about" },
];

const infoLinks = [
  { label: "My account", href: "/signup" },
  { label: "Delivery information", href: "/about" },
  { label: "Privacy policy", href: "/about" },
  { label: "Terms & conditions", href: "/about" },
  { label: "Returns", href: "/about" },
  { label: "Site security", href: "/about" },
  { label: "Sitemap", href: "/about" },
  { label: "Beyond the bowl", href: "/about" },
  { label: "Pure policies", href: "/about" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Footer({ content }: { content?: any }) {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-deep-green text-off-white pt-12 pb-8">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row gap-12 mb-12">
          {/* VIP + Social */}
          <div className="lg:w-[35%]">
            <h4 className="text-white font-semibold text-[18px] mb-3">{content?.vip_heading || "Join our VIP list"}</h4>
            <p className="text-off-white/80 text-[15px] mb-5 leading-relaxed">
              {content?.vip_description || "Be the first to hear about new product launches, exclusive competitions and helpful dog content."}
            </p>
            <div className="flex gap-2 mb-8">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-[5px] bg-white text-deep-green text-[15px] placeholder-gray-400 outline-none"
              />
              <button className="px-5 py-3 bg-white text-deep-green font-semibold rounded-[5px] hover:bg-off-white transition-colors text-[15px]">
                {content?.signup_button_text || "Sign up"}
              </button>
            </div>

            <h4 className="text-white font-semibold text-[18px] mb-3">{content?.social_heading || "Follow us on social media"}</h4>
            <div className="flex gap-4 items-center">
              {/* Instagram */}
              <a href={content?.instagram_url || "#"} className="opacity-80 hover:opacity-100 transition-opacity">
                <Image
                  src="https://www.purepetfood.com/_next/static/media/Instagram.cfd52eb9.png"
                  alt="Instagram"
                  width={28}
                  height={28}
                  unoptimized
                />
              </a>
              {/* Facebook */}
              <a href={content?.facebook_url || "#"} className="opacity-80 hover:opacity-100 transition-opacity">
                <Image
                  src="https://www.purepetfood.com/_next/static/media/Facebook.fba085d0.png"
                  alt="Facebook"
                  width={28}
                  height={28}
                  unoptimized
                />
              </a>
              {/* TikTok */}
              <a href={content?.tiktok_url || "#"} className="text-off-white hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 48 48">
                  <path fill="#fff" d="M33.2 11.64A8.56 8.56 0 0 1 31.08 6H24.9v24.8a5.18 5.18 0 0 1-5.18 5c-2.84 0-5.2-2.32-5.2-5.2 0-3.44 3.32-6.02 6.74-4.96v-6.32c-6.9-.92-12.94 4.44-12.94 11.28 0 6.66 5.52 11.4 11.38 11.4 6.28 0 11.38-5.1 11.38-11.4V18.02a14.7 14.7 0 0 0 8.6 2.76V14.6s-3.76.18-6.48-2.96" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          <div className="lg:w-[65%] grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* Pure Column */}
            <div>
              <h4 className="text-white font-semibold text-[18px] mb-4">{content?.col1_heading || "Pure"}</h4>
              <ul className="space-y-2.5">
                {pureLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-off-white/80 hover:text-white transition-colors text-[15px]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Column */}
            <div>
              <h4 className="text-white font-semibold text-[18px] mb-4">{content?.col2_heading || "Help"}</h4>
              <ul className="space-y-2.5">
                {helpLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-off-white/80 hover:text-white transition-colors text-[15px]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Information Column */}
            <div>
              <h4 className="text-white font-semibold text-[18px] mb-4">{content?.col3_heading || "Information"}</h4>
              <ul className="space-y-2.5">
                {infoLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-off-white/80 hover:text-white transition-colors text-[15px]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom - Logo + Copyright */}
        <div className="border-t border-white/10 pt-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image
              src="https://www.purepetfood.com/images/logo.png"
              alt="PURE Pet Food"
              width={100}
              height={50}
              unoptimized
              className="brightness-0 invert opacity-80"
            />
          </div>
          <p className="text-off-white/60 text-[14px]">
            {content?.copyright_text || "\u00a9 Pure Pet Food Ltd 2020-2026"}
          </p>
        </div>
      </div>
    </footer>
  );
}
