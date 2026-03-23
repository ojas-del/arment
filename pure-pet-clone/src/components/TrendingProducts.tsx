'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TrendingProducts({ content }: { content?: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, short_description, price, compare_at_price, images, status')
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(content?.max_products || 8);

      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 bg-deep-green relative zigzag-bottom zigzag-top">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="inline-block bg-gold/20 text-gold text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Trending Now
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {content?.heading || 'What Pet Parents Love'}
            </h2>
            <p className="text-white/60 max-w-md">
              Our most popular picks, loved by thousands of happy dogs.
            </p>
          </div>
          {/* Navigation arrows */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold text-white hover:text-deep-green transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-gold text-white hover:text-deep-green transition-all flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Row */}
        {loading ? (
          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="min-w-[280px] bg-white/10 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-5 bg-white/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => (
              <div key={product.id} className="min-w-[280px] max-w-[280px] snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
