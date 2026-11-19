import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Category, Product } from '../../types';
import { ProductCard } from '../marketplace/ProductCard';

interface ShopPageProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  wishlistIds: string[];
  onToggleWishlist?: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onViewFarmer: (farmerId: string) => void;
}

const DISTRICTS = ['All', 'Kolar', 'Mysuru', 'Mandya', 'Ramanagara', 'Bengaluru'];

export function ShopPage({
  products,
  categories,
  initialCategory = 'All',
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onViewProduct,
  onViewFarmer,
}: ShopPageProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [district, setDistrict] = useState('All');
  const [method, setMethod] = useState('All');
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sort, setSort] = useState('featured');

  const categoryTabs = useMemo(
    () => ['All', ...categories.map((c) => c.name)],
    [categories]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => {
      if (category !== 'All' && p.categoryName !== category) return false;
      if (district !== 'All' && p.district !== district) return false;
      if (method !== 'All' && p.farmingMethod !== method) return false;
      if (p.pricePerUnit > maxPrice) return false;
      if (q) {
        const hay = `${p.name} ${p.categoryName} ${p.farmerName} ${p.farmName} ${p.district}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...list];
    if (sort === 'price_asc') sorted.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
    else if (sort === 'price_desc') sorted.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
    else if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === 'newest') sorted.sort((a, b) => b.harvestDate.localeCompare(a.harvestDate));
    else sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.soldCount - a.soldCount);
    return sorted;
  }, [products, search, category, district, method, maxPrice, sort]);

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setDistrict('All');
    setMethod('All');
    setMaxPrice(1000);
    setSort('featured');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1F2B23]/10 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
            Direct Farm Marketplace
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F2B23] mt-1">
            Fresh Harvest Catalogue
          </h1>
        </div>
        <p className="text-sm text-[#1F2B23]/70 tabular-nums">
          Showing <strong>{filtered.length}</strong> of {products.length} farm listings
        </p>
      </div>

      {/* Category Segmented Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {categoryTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setCategory(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              category === tab
                ? 'bg-[#1F6B45] text-white'
                : 'bg-white border border-[#1F2B23]/12 text-[#1F2B23]/80 hover:border-[#1F6B45]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
        <div className="lg:col-span-4">
          <label className="block text-xs font-medium text-[#1F2B23]/70 mb-1.5">
            Search Produce or Farmer
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-[#1F2B23]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tomatoes, A2 milk, Ragi, Kolar..."
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm focus:outline-none focus:border-[#1F6B45]"
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-[#1F2B23]/70 mb-1.5">District</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm focus:outline-none focus:border-[#1F6B45]"
          >
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Districts' : d}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-[#1F2B23]/70 mb-1.5">
            Farming Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm focus:outline-none focus:border-[#1F6B45]"
          >
            <option value="All">Organic & Conventional</option>
            <option value="Organic">Organic Only</option>
            <option value="Conventional">Conventional</option>
          </select>
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-[#1F2B23]/70 mb-1.5 tabular-nums">
            Max Price: ₹{maxPrice}
          </label>
          <input
            type="range"
            min={50}
            max={1000}
            step={25}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-[#1F6B45] h-10 cursor-pointer"
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-xs font-medium text-[#1F2B23]/70 mb-1.5">Sort By</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm focus:outline-none focus:border-[#1F6B45]"
          >
            <option value="featured">Best Selling</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Latest Harvest</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#1F2B23]/10 py-16 px-6 text-center space-y-4">
          <SlidersHorizontal className="w-8 h-8 text-[#1F6B45] mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-[#1F2B23]">No matching harvest found</h3>
            <p className="text-sm text-[#1F2B23]/65 mt-1">
              Try widening your price cap or clearing district filters to view more farms.
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isWishlisted={wishlistIds.includes(product._id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              onViewProduct={onViewProduct}
              onViewFarmer={onViewFarmer}
            />
          ))}
        </div>
      )}
    </div>
  );
}
