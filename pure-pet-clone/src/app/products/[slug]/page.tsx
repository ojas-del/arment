'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  images: string[] | null;
  weight: number | null;
  weight_unit: string | null;
  status: string;
  category_id: string | null;
  created_at: string;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
}

/* ------------------------------------------------------------------ */
/* Accordion                                                          */
/* ------------------------------------------------------------------ */
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-deep-green/10">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left group">
        <h2 className="text-lg font-semibold text-deep-green">{title}</h2>
        <svg className={`w-5 h-5 text-deep-green/50 transition-transform duration-200 ${open ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[600px] pb-5' : 'max-h-0'}`}>
        <div className="text-deep-green/70 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vet Testimonial Card                                               */
/* ------------------------------------------------------------------ */
function VetCard({ vet }: { vet: { name: string; role: string; text: string; product: string; productSlug: string } }) {
  return (
    <div className="min-w-[340px] max-w-[340px] bg-beige-light rounded-2xl p-6 snap-start flex flex-col">
      <div className="mb-3">
        <h4 className="font-bold text-deep-green text-base">{vet.name}</h4>
        <span className="text-sm text-deep-green/50">{vet.role}</span>
      </div>
      <p className="text-sm text-deep-green/70 leading-relaxed flex-1 mb-4">{vet.text}</p>
      <Link href={`/products/${vet.productSlug}`} className="flex items-center gap-3 mt-auto pt-4 border-t border-deep-green/10">
        <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0">
          <img src={`https://placedog.net/80/80?id=${vet.productSlug}`} alt="" className="w-full h-full object-cover" />
        </div>
        <span className="text-xs font-medium text-deep-green line-clamp-2">{vet.product}</span>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review Card                                                        */
/* ------------------------------------------------------------------ */
function ReviewCard({ review }: { review: { name: string; date: string; rating: number; text: string; variant?: string; verified: boolean } }) {
  return (
    <div className="border border-deep-green/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-deep-green text-sm">{review.name}</span>
        {review.verified && (
          <span className="inline-flex items-center gap-1 text-xs text-gold">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Verified
          </span>
        )}
      </div>
      <div className="text-xs text-deep-green/40 mb-2">{review.date}</div>
      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-gold' : 'text-deep-green/15'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <p className="text-sm text-deep-green/70">{review.text}</p>
      {review.variant && <p className="text-xs text-deep-green/40 mt-2">Item type: {review.variant}</p>}
    </div>
  );
}

/* ================================================================== */
/* Main Page                                                          */
/* ================================================================== */
export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [purchaseMode, setPurchaseMode] = useState<'subscribe' | 'onetime'>('subscribe');
  const [deliveryInterval, setDeliveryInterval] = useState('2 weeks');
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const vetScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      const { data } = await supabase.from('products').select('*').eq('slug', slug).eq('status', 'active').single();
      if (data) {
        setProduct(data);
        const { data: rel } = await supabase
          .from('products')
          .select('id, name, slug, short_description, price, compare_at_price, images, status')
          .eq('status', 'active')
          .neq('id', data.id)
          .limit(4);
        if (rel) setRelated(rel);
      }
      setLoading(false);
    }
    if (slug) fetchProduct();
  }, [slug]);

  const hasDiscount = product?.compare_at_price && product.compare_at_price > product.price;
  const subscribePrice = product ? product.price * 0.85 : 0;

  const getImageUrl = (idx: number) => {
    if (product?.images?.[idx] && !imgErrors.has(idx)) return product.images[idx];
    return `https://placedog.net/600/600?id=${product?.id?.slice(0, 8) ?? 'x'}${idx}`;
  };

  const images = product?.images?.length ? product.images : [`https://placedog.net/600/600?id=${product?.id?.slice(0, 8) ?? '1'}`];

  /* Loading state */
  if (loading) {
    return (
      <><Header /><main className="pt-24"><div className="max-w-[1400px] mx-auto px-4 py-16"><div className="grid grid-cols-1 lg:grid-cols-2 gap-12"><div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" /><div className="space-y-4"><div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" /><div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" /><div className="h-4 bg-gray-200 rounded w-full animate-pulse" /><div className="h-12 bg-gray-200 rounded w-48 animate-pulse mt-8" /></div></div></div></main><Footer /></>
    );
  }

  /* 404 */
  if (!product) {
    return (
      <><Header /><main className="pt-24"><div className="max-w-[1200px] mx-auto px-4 py-20 text-center"><div className="text-6xl mb-4">🐾</div><h1 className="text-3xl font-bold text-deep-green mb-3">Product Not Found</h1><p className="text-deep-green/60 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p><Link href="/products" className="btn-gold">Browse Products</Link></div></main><Footer /></>
    );
  }

  const reviews = [
    { name: 'Russell M.', date: '21/03/2026', rating: 5, text: 'My dog absolutely devours this! Great quality and you can tell the ingredients are fresh. Very fine product!', variant: product.name, verified: true },
    { name: 'Trang H.', date: '20/03/2026', rating: 5, text: 'Quick delivery. My fussy eater actually finished the whole bowl. Will definitely order again.', variant: product.name, verified: true },
    { name: 'Kelly W.', date: '02/03/2026', rating: 5, text: 'I love finding a quality dog food that my pup actually enjoys. His coat is shinier and he has more energy since we switched.', variant: product.name, verified: true },
    { name: 'Susan S.', date: '28/02/2026', rating: 4, text: 'Doesn\'t upset my dog\'s sensitive stomach and the only food he can eat while on an elimination diet.', variant: product.name, verified: true },
    { name: 'S S.', date: '26/02/2026', rating: 5, text: 'Fast delivery and very delicious - my dog cleaned the bowl in seconds. Smooth texture, great product.', variant: product.name, verified: true },
  ];

  const vets = [
    { name: 'Dr. Sarah Wilson, BVSc', role: 'Veterinary Nutritionist', text: 'As a veterinary nutritionist, I emphasize the importance of choosing food that supports a dog\'s overall balance. This is why I trust and confidently recommend Pure to my patients. Their commitment to natural ingredients and rigorous quality testing provides a clean, supportive feeding experience.', product: product.name, productSlug: product.slug },
    { name: 'Dr. James Chen, DVM', role: 'Veterinary Dermatologist', text: 'I\'ve seen remarkable improvements in skin and coat conditions since recommending Pure to my patients. The natural, hypoallergenic recipes are a game-changer for dogs with sensitivities.', product: 'Salmon & Potato Grain-Free', productSlug: 'salmon-potato-grain-free' },
    { name: 'Emma Richards', role: 'Canine Behaviourist', text: 'As a canine behaviourist, I see the link between nutrition and behaviour daily. Dogs on Pure are calmer, more focused, and have better energy regulation throughout the day. It makes a real difference.', product: product.name, productSlug: product.slug },
    { name: 'Dr. Hannah Brooks, MRCVS', role: 'Small Animal Vet', text: 'It is extremely important to me to recommend clean products. Pure is a brand I can trust is clean and has the research to back it up. The flavour quality is outstanding — dogs genuinely love it. I recommend it to all my patients!', product: 'Puppy Growth Formula', productSlug: 'puppy-growth-formula' },
    { name: 'Dr. Oliver Patel, BVM&S', role: 'Holistic Veterinarian', text: 'As a holistic vet, I greatly appreciate having a food I can recommend to clients managing chronic conditions. Pure\'s careful ingredient sourcing and gentle processing is exactly what these dogs need.', product: product.name, productSlug: product.slug },
  ];

  const scrollVets = (dir: 'left' | 'right') => {
    vetScrollRef.current?.scrollBy({ left: dir === 'left' ? -370 : 370, behavior: 'smooth' });
  };

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* ============================================================ */}
        {/* SECTION 1 — Product Hero (Gallery + Info)                    */}
        {/* ============================================================ */}
        <section className="bg-white">
          <div className="max-w-[1400px] mx-auto px-4 py-8 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
              {/* --- Gallery --- */}
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-beige-light mb-4 group">
                  <img src={getImageUrl(selectedImage)} alt={product.name} className="w-full h-full object-cover" onError={() => setImgErrors(p => new Set(p).add(selectedImage))} />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setSelectedImage((selectedImage - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5 text-deep-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={() => setSelectedImage((selectedImage + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5 text-deep-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setSelectedImage(i)} className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-deep-green shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        <img src={getImageUrl(i)} alt="" className="w-full h-full object-cover" onError={() => setImgErrors(p => new Set(p).add(i))} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* --- Product Info --- */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-deep-green mb-4 leading-tight">{product.name}</h1>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-2xl font-bold text-deep-green">{formatPrice(product.price)}</span>
                  {hasDiscount && <span className="text-base text-deep-green/40 line-through ml-2">{formatPrice(product.compare_at_price!)}</span>}
                </div>
                <p className="text-sm text-deep-green/50 mb-5">Shipping calculated at checkout.</p>

                {/* Description */}
                {product.short_description && (
                  <div className="mb-6">
                    <p className="font-semibold text-deep-green mb-1">Premium nutrition — nothing hidden.</p>
                    <p className="text-deep-green/70 text-sm leading-relaxed">{product.short_description}</p>
                  </div>
                )}

                {/* --- Purchase options (Subscribe & Save / One-time) --- */}
                <div className="border border-deep-green/10 rounded-2xl overflow-hidden mb-6">
                  {/* Subscribe */}
                  <div className={`p-4 cursor-pointer transition-colors ${purchaseMode === 'subscribe' ? 'bg-gold/5' : 'hover:bg-beige-light'}`} onClick={() => setPurchaseMode('subscribe')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseMode === 'subscribe' ? 'border-gold' : 'border-deep-green/30'}`}>
                          {purchaseMode === 'subscribe' && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                        </div>
                        <span className="font-semibold text-deep-green">Subscribe & Save</span>
                      </div>
                      <div className="text-right">
                        {purchaseMode === 'subscribe' && <span className="text-xs font-bold text-white bg-gold px-2 py-0.5 rounded-full mr-2">Get 15% Off</span>}
                        <span className="text-deep-green/40 line-through text-sm mr-1">{formatPrice(product.price)}</span>
                        <span className="font-bold text-deep-green">{formatPrice(subscribePrice)}</span>
                      </div>
                    </div>
                    {purchaseMode === 'subscribe' && (
                      <div className="mt-4 ml-8">
                        <ul className="text-sm text-deep-green/70 space-y-1 mb-4">
                          <li className="flex items-center gap-2"><svg className="w-4 h-4 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>You save 15%</li>
                          <li className="flex items-center gap-2"><svg className="w-4 h-4 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Fresh meals, delivered on your schedule</li>
                          <li className="flex items-center gap-2"><svg className="w-4 h-4 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Skip, cancel or change any time</li>
                        </ul>
                        <div className="text-xs font-semibold text-deep-green mb-2">Deliver every:</div>
                        <div className="flex flex-wrap gap-2">
                          {['2 weeks', '3 weeks', '4 weeks', '6 weeks', '8 weeks'].map(interval => (
                            <button key={interval} onClick={(e) => { e.stopPropagation(); setDeliveryInterval(interval); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${deliveryInterval === interval ? 'bg-deep-green text-white' : 'bg-white border border-deep-green/15 text-deep-green hover:border-deep-green/30'}`}>
                              <span>{interval}</span>
                              <span className="block text-[10px] opacity-70">save 15%</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* One-time */}
                  <div className={`p-4 cursor-pointer border-t border-deep-green/10 transition-colors ${purchaseMode === 'onetime' ? 'bg-gold/5' : 'hover:bg-beige-light'}`} onClick={() => setPurchaseMode('onetime')}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${purchaseMode === 'onetime' ? 'border-gold' : 'border-deep-green/30'}`}>
                          {purchaseMode === 'onetime' && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                        </div>
                        <span className="font-semibold text-deep-green">One-time purchase</span>
                      </div>
                      <span className="font-bold text-deep-green">{formatPrice(product.price)}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity + Add to Cart */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center bg-beige-light rounded-xl">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 text-deep-green/50 hover:text-deep-green transition font-medium text-lg" disabled={quantity <= 1}>−</button>
                    <span className="px-4 py-3 font-semibold text-deep-green min-w-[48px] text-center">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 text-deep-green/50 hover:text-deep-green transition font-medium text-lg">+</button>
                  </div>
                  <button className="flex-1 bg-deep-green text-white font-semibold py-3.5 rounded-full hover:bg-deep-green/90 transition text-base">Add to Cart</button>
                </div>

                {/* Lab tested badge */}
                <div className="border border-deep-green/10 rounded-xl p-4 flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-deep-green">Vet Approved & Lab Tested <span className="text-[10px] font-bold bg-gold/20 text-deep-green px-1.5 py-0.5 rounded ml-1">2026</span></p>
                    <p className="text-xs text-deep-green/50">All ingredients tested for quality & safety →</p>
                  </div>
                </div>

                {/* Accordions */}
                <Accordion title="Ingredients & Nutrition" defaultOpen>
                  {product.description ? (
                    <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <p>Made with natural, human-grade ingredients carefully selected by veterinary nutritionists.</p>
                  )}
                </Accordion>
                <Accordion title="Feeding Guide">
                  <p className="mb-2">Serve based on your dog&apos;s weight:</p>
                  <ul className="space-y-1">
                    <li><strong>Small dogs (up to 10kg):</strong> 100-200g per day</li>
                    <li><strong>Medium dogs (10-25kg):</strong> 200-400g per day</li>
                    <li><strong>Large dogs (25kg+):</strong> 400-600g per day</li>
                  </ul>
                  <p className="mt-2">Always ensure fresh water is available. Transition gradually over 7-10 days.</p>
                </Accordion>
                <Accordion title="Shipping & Returns">
                  <p><strong>Free UK delivery</strong> on all orders. Orders placed before 2pm are dispatched same day.</p>
                  <p className="mt-2">Standard delivery: 2-3 working days. Express delivery available at checkout.</p>
                  <p className="mt-2">Not happy? Full refund within 30 days — no questions asked.</p>
                </Accordion>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2 — "The Pure Difference" badge row                  */}
        {/* ============================================================ */}
        <section className="bg-off-white py-14 border-t border-b border-deep-green/5">
          <div className="max-w-[1200px] mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-10 italic">The Pure Difference</h2>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {[
                'Vet Approved', 'Natural Ingredients', 'Grain-Free Options', 'Lab Tested',
                'Human Grade', 'Gentle on Tummies', 'Nutrient-Rich'
              ].map(badge => (
                <div key={badge} className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span className="text-deep-green font-medium text-sm">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 3 — Nutrition Highlights (image + text)              */}
        {/* ============================================================ */}
        <section className="bg-deep-green">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">
            <div className="aspect-square lg:aspect-auto overflow-hidden">
              <img src="https://www.purepetfood.com/cdn/images/pure_food_bowl.webp" alt="Pure food in bowl" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://placedog.net/700/700?id=nutrition`; }} />
            </div>
            <div className="flex items-center p-8 lg:p-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 italic">Fresh. Balanced. Irresistible.</h2>
                <div className="space-y-4 text-white/80 text-sm leading-relaxed">
                  <p><strong className="text-gold">Protein Profile:</strong> High-quality, single-source animal protein for lean muscle maintenance and sustained energy.</p>
                  <p><strong className="text-gold">Nutrition Highlights:</strong> Rich in omega-3 fatty acids for a glossy coat, prebiotics for gut health, and essential vitamins for immune support.</p>
                  <p><strong className="text-gold">Preparation:</strong> Gently air-dried to lock in nutrients. Just add warm water, stir, and serve — ready in 10 seconds.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 4 — Customer Reviews                                 */}
        {/* ============================================================ */}
        <section className="bg-white py-16">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-green text-center mb-10 italic">Customer Reviews</h2>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex">{Array.from({ length: 5 }).map((_, i) => <svg key={i} className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
                <span className="text-deep-green font-medium">130 Reviews</span>
              </div>
              <button className="btn-outline text-sm py-2 px-4">Write a review</button>
            </div>
            <div className="space-y-4">
              {reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 5 — "Learn The Science" CTA                         */}
        {/* ============================================================ */}
        <section className="bg-off-white">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">
            <div className="aspect-video lg:aspect-auto overflow-hidden">
              <img src="https://placedog.net/800/500?id=science" alt="The science behind Pure" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center p-8 lg:p-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-4">Learn The Science Behind Pure</h2>
                <p className="text-deep-green/70 mb-6">Developed with veterinary nutritionists, every recipe is backed by science to deliver optimal nutrition.</p>
                <Link href="/benefits" className="btn-gold">Learn More</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 6 — Trusted by Vets (horizontal scroll)             */}
        {/* ============================================================ */}
        <section className="bg-beige-light py-16">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-deep-green italic">Trusted by Vets & Nutritionists</h2>
              <div className="hidden md:flex gap-2">
                <button onClick={() => scrollVets('left')} className="w-10 h-10 rounded-full border border-deep-green/20 flex items-center justify-center hover:bg-deep-green hover:text-white transition text-deep-green"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                <button onClick={() => scrollVets('right')} className="w-10 h-10 rounded-full border border-deep-green/20 flex items-center justify-center hover:bg-deep-green hover:text-white transition text-deep-green"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
              </div>
            </div>
            <div ref={vetScrollRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              {vets.map((v, i) => <VetCard key={i} vet={v} />)}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 7 — "Food that fuels their best days" (image + text) */}
        {/* ============================================================ */}
        <section className="relative">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">
            <div className="aspect-square lg:aspect-auto overflow-hidden">
              <img src="https://placedog.net/800/800?id=lifestyle" alt="Happy dog" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center bg-off-white p-8 lg:p-16">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-6 italic">Food that fuels their best days</h2>
                <div className="space-y-3 text-deep-green/70">
                  <p><strong className="text-deep-green">At Pure, the mission is simple:</strong></p>
                  <p>Create food that makes your dog feel as good as it tastes.</p>
                  <p>Always fresh, natural & vet-approved.</p>
                  <p>It&apos;s the kind they love, crave, and sprint to the bowl for every single time — for boundless energy, a shiny coat, and a happier, healthier life.</p>
                  <p>Pure is for the devoted pet parents simply seeking more for their best friend.</p>
                </div>
                <Link href="/signup" className="btn-gold mt-6 inline-block">Try Pure</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 8 — "Why We Started Pure" (image + text)            */}
        {/* ============================================================ */}
        <section className="bg-white">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2">
            <div className="flex items-center p-8 lg:p-16 order-2 lg:order-1">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-6 italic">Why We Started Pure</h2>
                <div className="space-y-3 text-deep-green/70">
                  <p>We didn&apos;t start this brand for the trend.</p>
                  <p>We started Pure because our own dogs deserved better — and so does yours.</p>
                  <p>When we looked at what was in most commercial dog food, we were shocked. Fillers, preservatives, mysterious &ldquo;meat derivatives&rdquo; — making our dogs worse, not better.</p>
                  <p>They needed a better option — so we created one.</p>
                </div>
                <Link href="/about" className="btn-outline mt-6 inline-block">Learn More</Link>
              </div>
            </div>
            <div className="aspect-square lg:aspect-auto overflow-hidden order-1 lg:order-2">
              <img src="https://placedog.net/800/800?id=founders" alt="The Pure team" className="w-full h-full object-cover" />
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 9 — Our Mission quote                                */}
        {/* ============================================================ */}
        <section className="bg-deep-green py-20">
          <div className="max-w-[900px] mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 italic">Our Mission</h2>
            <p className="text-xl md:text-2xl text-white/80 leading-relaxed italic">&ldquo;To create food that helps your dog feel their best, so they can keep doing what they love — being your best friend.&rdquo;</p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 10 — Full-width lifestyle banner                     */}
        {/* ============================================================ */}
        <section className="relative h-[400px] lg:h-[500px] overflow-hidden">
          <img src="https://placedog.net/1400/500?id=banner" alt="Happy healthy dogs" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-green/70 to-transparent flex items-center">
            <div className="max-w-[1400px] mx-auto px-4 w-full">
              <h2 className="text-3xl md:text-5xl font-bold text-white max-w-lg italic leading-tight">Boundless Energy, Shiny Coat, Happier Days</h2>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 11 — Related Products                                */}
        {/* ============================================================ */}
        {related.length > 0 && (
          <section className="bg-off-white py-16">
            <div className="max-w-[1200px] mx-auto px-4">
              <h2 className="text-2xl font-bold text-deep-green mb-8">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
