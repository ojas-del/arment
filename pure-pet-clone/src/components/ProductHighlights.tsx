'use client';

import { useEffect, useState } from 'react';
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
export default function ProductHighlights({ content }: { content?: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, short_description, price, compare_at_price, images, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);

      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-16 bg-off-white relative">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-gold/20 text-deep-green text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Our Products
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-deep-green mb-3">
            {content?.heading || 'Handpicked for Your Pup'}
          </h2>
          <p className="text-deep-green/60 max-w-lg mx-auto">
            {content?.subheading || 'Fresh, natural ingredients your dog will love. Every meal made with care.'}
          </p>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-10">
          <a
            href="/products"
            className="btn-gold inline-flex items-center gap-2"
          >
            Shop All Products
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
