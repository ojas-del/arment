'use client';

import Link from 'next/link';
import { useState } from 'react';

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

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
}

export default function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compare_at_price! - product.price) / product.compare_at_price!) * 100)
    : 0;

  const imageUrl = product.images?.[0] && !imgError
    ? product.images[0]
    : "https://www.datocms-assets.com/55536/1685633706-chicken-web-1.jpg?auto=format&fit=crop&h=400&w=400";

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-gold/30">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-beige-light">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-orange-brand text-white text-xs font-bold px-3 py-1.5 rounded-full">
              -{discountPercent}%
            </span>
          )}
          {/* Paw overlay on hover */}
          <div className="absolute inset-0 bg-deep-green/0 group-hover:bg-deep-green/10 transition-colors duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gold text-deep-green font-semibold text-sm px-5 py-2 rounded-full shadow-lg">
              View Product
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-deep-green text-base leading-tight mb-1 group-hover:text-gold transition-colors line-clamp-2">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="text-sm text-deep-green/60 mb-3 line-clamp-2">{product.short_description}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-deep-green">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-sm text-deep-green/40 line-through">{formatPrice(product.compare_at_price!)}</span>
            )}
          </div>
          {/* Star rating placeholder */}
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-4 h-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-deep-green/50 ml-1">(4.9)</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
