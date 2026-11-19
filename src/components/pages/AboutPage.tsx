import { ArrowRight, IndianRupee, Leaf, ShieldCheck, Users } from 'lucide-react';
import type { ActiveRoute } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface AboutPageProps {
  onNavigate: (route: ActiveRoute, options?: { authMode?: string }) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
            About Krishi Market
          </p>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-[#1F2B23] leading-tight [text-wrap:balance]">
            Rebuilding India’s Food Supply Chain Around the Grower
          </h1>
          <p className="text-base text-[#1F2B23]/78 leading-relaxed">
            In traditional agricultural supply chains, produce passes through up to four brokers
            before reaching a city kitchen—reducing farmer margins while adding days of transit
            spoilage. Krishi Market connects smallholder farmers across Karnataka directly with
            households.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="px-5 py-3 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('auth', { authMode: 'register-farmer' })}
              className="px-5 py-3 rounded-xl border border-[#1F2B23]/20 bg-white text-[#1F2B23] text-sm font-semibold hover:border-[#1F6B45] cursor-pointer"
            >
              Partner With Us
            </button>
          </div>
        </div>

        <div className="lg:col-span-6">
          <div className="rounded-3xl overflow-hidden aspect-[4/3] bg-[#EAE6D8]">
            <ImageWithFallback
              src="/src/assets/images/farmer_portrait_lakshmi_1795104334305.jpg"
              alt="Lakshmi Devi in her Mysuru farm orchard"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            icon: IndianRupee,
            title: 'Fair Farm-Gate Pricing',
            desc: 'Farmers retain 94% of order value with transparent 6% platform logistics commission.',
          },
          {
            icon: Leaf,
            title: 'Honest Cultivation Labels',
            desc: 'Clear separation between certified organic plots and responsible conventional farms.',
          },
          {
            icon: ShieldCheck,
            title: 'Verified Onboarding',
            desc: 'Every farmer account undergoes admin verification of farm location and crop profile.',
          },
          {
            icon: Users,
            title: 'District Cluster Hubs',
            desc: 'Focused regional sourcing across Kolar, Mysuru, Mandya, Ramanagara, and Bengaluru.',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-[#DFF0C8] text-[#1F6B45] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-[#1F2B23]">{card.title}</h2>
              <p className="text-sm text-[#1F2B23]/75 leading-relaxed">{card.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
