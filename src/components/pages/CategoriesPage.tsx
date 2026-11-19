import { ArrowRight } from 'lucide-react';
import type { Category, Product } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface CategoriesPageProps {
  categories: Category[];
  products: Product[];
  onSelectCategory: (categoryName: string) => void;
}

export function CategoriesPage({ categories, products, onSelectCategory }: CategoriesPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
          Curated Agricultural Aisles
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F2B23] mt-1.5">
          Explore Produce Categories
        </h1>
        <p className="text-sm sm:text-base text-[#1F2B23]/75 mt-2">
          Browse farm-direct produce grouped by harvest aisle. Every item ships from verified
          district farms across Karnataka.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = products.filter((p) => p.categoryName === cat.name).length;
          return (
            <button
              key={cat._id}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className="group text-left bg-white rounded-2xl border border-[#1F2B23]/10 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col cursor-pointer"
            >
              <div className="aspect-[4/3] bg-[#F3F1E8] overflow-hidden">
                <ImageWithFallback
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="text-xs font-medium text-[#1F6B45] tabular-nums">
                  {count} Active Listings
                </div>
                <h2 className="font-display text-2xl font-bold text-[#1F2B23] mt-1 group-hover:text-[#1F6B45] transition-colors">
                  {cat.name}
                </h2>
                <p className="text-sm text-[#1F2B23]/75 mt-2 leading-relaxed flex-1">
                  {cat.description}
                </p>
                <div className="mt-5 pt-4 border-t border-[#1F2B23]/10 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F6B45]">
                  <span>Shop {cat.name}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
