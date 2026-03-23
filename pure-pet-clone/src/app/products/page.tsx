'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

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

interface Category {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('id, name, slug, short_description, price, compare_at_price, images, status')
        .eq('status', 'active');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      switch (sortBy) {
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data } = await query.limit(50);
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
  }, [selectedCategory, sortBy, search]);

  return (
    <>
      <Header />
      <main className="pt-24">
        {/* Hero Banner */}
        <section className="bg-deep-green py-16 text-center relative zigzag-bottom">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Shop Our <span className="text-gold">Products</span>
            </h1>
            <p className="text-white/70 max-w-xl mx-auto text-lg">
              Everything your furry friend needs. Premium food, treats, and accessories made with love.
            </p>
          </div>
        </section>

        {/* Filters & Products */}
        <section className="py-16 bg-off-white">
          <div className="max-w-[1200px] mx-auto px-4">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-10 flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-deep-green/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-beige-light border-2 border-transparent focus:border-gold focus:outline-none text-sm"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    !selectedCategory
                      ? 'bg-deep-green text-white'
                      : 'bg-beige-light text-deep-green hover:bg-deep-green/10'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-deep-green text-white'
                        : 'bg-beige-light text-deep-green hover:bg-deep-green/10'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-beige-light border-2 border-transparent focus:border-gold focus:outline-none text-sm text-deep-green cursor-pointer"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-deep-green/60">
                {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🐾</div>
                <h3 className="text-xl font-semibold text-deep-green mb-2">No products found</h3>
                <p className="text-deep-green/60">Try changing your filters or search term.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
