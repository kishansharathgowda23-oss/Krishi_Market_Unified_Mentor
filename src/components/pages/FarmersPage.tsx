import { CheckCircle2, MapPin, Sprout, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Farmer, Product } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface FarmersPageProps {
  farmers: Farmer[];
  products: Product[];
  onViewFarmer: (farmerId: string) => void;
}

export function FarmersPage({ farmers, products, onViewFarmer }: FarmersPageProps) {
  const [district, setDistrict] = useState('All');
  const [method, setMethod] = useState('All');

  const filtered = useMemo(() => {
    return farmers.filter((f) => {
      if (district !== 'All' && f.district !== district) return false;
      if (method !== 'All' && f.farmingMethod !== method) return false;
      return true;
    });
  }, [farmers, district, method]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1F2B23]/10 pb-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
            Know Your Grower
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F2B23] mt-1.5">
            Meet Our Partner Farmers
          </h1>
          <p className="text-sm text-[#1F2B23]/75 mt-2">
            Every grower on Krishi Market is verified by farm location, cultivation method, and
            harvest schedule.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
          >
            <option value="All">All Districts</option>
            <option value="Kolar">Kolar</option>
            <option value="Mysuru">Mysuru</option>
            <option value="Mandya">Mandya</option>
            <option value="Ramanagara">Ramanagara</option>
            <option value="Bengaluru">Bengaluru</option>
          </select>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
          >
            <option value="All">All Methods</option>
            <option value="Organic">Organic</option>
            <option value="Conventional">Conventional</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((farmer) => {
          const itemCount = products.filter((p) => p.farmerId === farmer._id).length;
          return (
            <div
              key={farmer._id}
              className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 flex flex-col sm:flex-row gap-6"
            >
              <div className="w-28 h-28 rounded-2xl overflow-hidden shrink-0 bg-[#DFF0C8]">
                <ImageWithFallback
                  src={farmer.profileImage}
                  alt={farmer.fullName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 text-xs text-[#1F6B45] font-semibold">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified · {farmer.farmingMethod}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#1F2B23] tabular-nums">
                    <Star className="w-3.5 h-3.5 text-[#E58B42] fill-[#E58B42]" />
                    {farmer.rating.toFixed(1)} ({farmer.reviewCount})
                  </span>
                </div>

                <h2 className="font-display text-xl font-bold text-[#1F2B23] mt-1">
                  {farmer.farmName}
                </h2>
                <p className="text-xs text-[#1F2B23]/70 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#1F6B45]" />
                  {farmer.fullName} · {farmer.farmLocation}, {farmer.district}
                </p>

                <p className="text-sm text-[#1F2B23]/80 mt-3 leading-relaxed">
                  {farmer.farmDescription}
                </p>

                <div className="mt-4 flex items-center gap-1.5 text-xs text-[#1F2B23]/70">
                  <Sprout className="w-3.5 h-3.5 text-[#1F6B45] shrink-0" />
                  <span className="truncate">Crops: {farmer.cropTypes.join(', ')}</span>
                </div>

                <div className="mt-5 pt-4 border-t border-[#1F2B23]/10 flex items-center justify-between">
                  <span className="text-xs text-[#1F2B23]/65 tabular-nums">
                    {itemCount} fresh items available
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewFarmer(farmer._id)}
                    className="px-4 py-2 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold hover:bg-[#185536] transition-colors cursor-pointer"
                  >
                    Browse Farm Produce
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
