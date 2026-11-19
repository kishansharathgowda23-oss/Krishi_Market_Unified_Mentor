import { ArrowRight, CheckCircle2, MapPin, ShieldCheck, Sprout, Star, Truck } from 'lucide-react';
import type { ActiveRoute, Category, Farmer, Product, Review } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { ProductCard } from '../marketplace/ProductCard';

interface LandingPageProps {
  categories: Category[];
  products: Product[];
  farmers: Farmer[];
  reviews: Review[];
  wishlistIds: string[];
  onToggleWishlist?: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onViewFarmer: (farmerId: string) => void;
  onNavigate: (route: ActiveRoute, options?: { category?: string; authMode?: string }) => void;
}

export function LandingPage({
  categories,
  products,
  farmers,
  reviews,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onViewProduct,
  onViewFarmer,
  onNavigate,
}: LandingPageProps) {
  const bestSellers = products.slice(0, 6);
  const featuredFarmers = farmers.slice(0, 4);

  return (
    <div className="space-y-20 pb-8">
      {/* 1. Hero Section + 4-Column Direct-Trade Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center py-4 lg:py-8">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#1F6B45]">
              Direct Karnataka Farm Collective · Harvested Daily
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-[#1F2B23] leading-[1.08] tracking-tight mt-4 [text-wrap:balance]">
              Good Food. Fairer Farms.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#1F2B23]/78 leading-relaxed max-w-xl">
              Fresh from local farms, delivered directly to your doorstep. Support farmers while
              enjoying quality produce at fair prices.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="px-6 py-3.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('auth', { authMode: 'register-farmer' })}
                className="px-6 py-3.5 rounded-xl border border-[#1F2B23]/20 bg-white text-[#1F2B23] text-sm font-semibold hover:border-[#1F6B45] hover:text-[#1F6B45] transition-colors cursor-pointer"
              >
                Become a Farmer
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden bg-[#ECE8DB] aspect-[4/3] lg:aspect-auto lg:h-full min-h-[340px]">
              <ImageWithFallback
                src="/src/assets/images/hero_harvest_basket_1795104333542.jpg"
                alt="Freshly harvested organic vegetables and fruits in a woven bamboo basket from Karnataka farms"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Full-width 4-Column Proof Strip */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-[#1F2B23]/10">
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#1F6B45]">94%</div>
            <div className="text-sm font-semibold text-[#1F2B23] mt-1">Direct Farmer Share</div>
            <p className="text-xs text-[#1F2B23]/65 mt-0.5">
              Zero mandi middlemen; growers keep 94% of every rupee spent.
            </p>
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#1F6B45]">&lt; 18 hrs</div>
            <div className="text-sm font-semibold text-[#1F2B23] mt-1">Harvest to Kitchen</div>
            <p className="text-xs text-[#1F2B23]/65 mt-0.5">
              Picked at dawn across Kolar, Mandya, and Mysuru for morning slots.
            </p>
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#1F6B45]">100%</div>
            <div className="text-sm font-semibold text-[#1F2B23] mt-1">Origin Traceability</div>
            <p className="text-xs text-[#1F2B23]/65 mt-0.5">
              Every listing shows farm name, district, farming method, and harvest date.
            </p>
          </div>
          <div>
            <div className="text-xl font-bold font-mono tabular-nums text-[#1F6B45]">₹499+</div>
            <div className="text-sm font-semibold text-[#1F2B23] mt-1">Free Direct Delivery</div>
            <p className="text-xs text-[#1F2B23]/65 mt-0.5">
              Insulated farm-to-door delivery with Cash or UPI on arrival.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Featured Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
              Seasonal Harvest Aisles
            </p>
            <h2 className="font-display text-3xl font-bold text-[#1F2B23] mt-1.5">
              Shop by Category
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('categories')}
            className="text-sm font-semibold text-[#1F6B45] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => onNavigate('shop', { category: cat.name })}
              className="group text-left bg-white rounded-2xl border border-[#1F2B23]/10 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
            >
              <div className="aspect-[4/3] bg-[#F3F1E8] overflow-hidden">
                <ImageWithFallback
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold text-[#1F2B23] group-hover:text-[#1F6B45] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[#1F2B23]/65 mt-1 line-clamp-2">{cat.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Best-Selling Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
              Picked This Morning
            </p>
            <h2 className="font-display text-3xl font-bold text-[#1F2B23] mt-1.5">
              Best-Selling Farm Produce
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="text-sm font-semibold text-[#1F6B45] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Browse Full Market</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestSellers.map((prod) => (
            <ProductCard
              key={prod._id}
              product={prod}
              isWishlisted={wishlistIds.includes(prod._id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              onViewProduct={onViewProduct}
              onViewFarmer={onViewFarmer}
            />
          ))}
        </div>
      </section>

      {/* 4. Featured Local Farmers */}
      <section className="bg-[#DFF0C8]/45 border-y border-[#1F6B45]/10 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
                Verified Partner Growers
              </p>
              <h2 className="font-display text-3xl font-bold text-[#1F2B23] mt-1.5">
                Meet Our Farmers
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('farmers')}
              className="text-sm font-semibold text-[#1F6B45] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>All Partner Farms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredFarmers.map((farmer) => (
              <div
                key={farmer._id}
                className="bg-[#FBFAF5] rounded-2xl border border-[#1F2B23]/10 p-5 flex flex-col"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-[#DFF0C8]">
                    <ImageWithFallback
                      src={farmer.profileImage}
                      alt={farmer.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-[#1F2B23] truncate">
                      {farmer.fullName}
                    </h3>
                    <p className="text-xs font-medium text-[#1F6B45] truncate">{farmer.farmName}</p>
                    <p className="text-xs text-[#1F2B23]/65 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {farmer.district}, {farmer.state}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-[#1F2B23]/75 leading-relaxed line-clamp-3">
                  {farmer.farmDescription}
                </p>

                <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#1F2B23]/10 text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1F2B23] tabular-nums">
                    <Star className="w-3.5 h-3.5 text-[#E58B42] fill-[#E58B42]" />
                    {farmer.rating.toFixed(1)} · {farmer.farmingMethod}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewFarmer(farmer._id)}
                    className="font-semibold text-[#1F6B45] hover:underline cursor-pointer"
                  >
                    Visit Farm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Krishi Market & How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
                Why Choose Krishi Market
              </p>
              <h2 className="font-display text-3xl font-bold text-[#1F2B23] mt-1.5">
                Transparent Pricing. Verifiable Freshness.
              </h2>
            </div>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#DFF0C8] text-[#1F6B45] flex items-center justify-center shrink-0">
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1F2B23]">
                    Zero Cold-Storage Aging
                  </h3>
                  <p className="text-sm text-[#1F2B23]/75 mt-1 leading-relaxed">
                    Farmers list exact harvest quantities each morning. Produce travels straight
                    from district farm hubs to your kitchen without weeks in wholesale warehouses.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#DFF0C8] text-[#1F6B45] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1F2B23]">
                    Verified Growers & Honest Methods
                  </h3>
                  <p className="text-sm text-[#1F2B23]/75 mt-1 leading-relaxed">
                    Every farmer onboarding is reviewed by our agronomy team, clearly distinguishing
                    organic cultivation from conventional integrated farming.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#DFF0C8] text-[#1F6B45] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1F2B23]">
                    Higher Earnings for Rural Families
                  </h3>
                  <p className="text-sm text-[#1F2B23]/75 mt-1 leading-relaxed">
                    Growers set fair farm-gate rates and earn up to 35% more per kilo compared to
                    traditional commission mandis while keeping household prices affordable.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white rounded-3xl border border-[#1F2B23]/10 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#E58B42]">
              How It Works
            </p>
            <h3 className="font-display text-2xl font-bold text-[#1F2B23] mt-1.5 mb-6">
              From Soil to Dining Table in 4 Steps
            </h3>

            <ol className="space-y-5">
              {[
                {
                  step: '01',
                  title: 'Farmers List Fresh Harvest',
                  desc: 'Verified growers publish morning stock, harvest dates, and farm-gate INR prices.',
                },
                {
                  step: '02',
                  title: 'Browse & Build Your Basket',
                  desc: 'Filter by district, organic method, or category and choose a convenient delivery slot.',
                },
                {
                  step: '03',
                  title: 'Farmer Packs & Dispatches',
                  desc: 'Growers accept your order directly, pack in breathable crates, and update live status.',
                },
                {
                  step: '04',
                  title: 'Confirm Delivery & Review',
                  desc: 'Receive fresh produce at your doorstep, confirm receipt, and rate the farm.',
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4 items-start">
                  <span className="font-mono text-sm font-bold text-[#1F6B45] bg-[#DFF0C8]/70 w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-[#1F2B23]">{item.title}</h4>
                    <p className="text-xs text-[#1F2B23]/70 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 6. Attributable Customer Testimonials */}
      {reviews.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
              Verified Household Feedback
            </p>
            <h2 className="font-display text-3xl font-bold text-[#1F2B23] mt-1.5">
              Trusted by Kitchens Across Karnataka
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.slice(0, 2).map((rev) => (
              <blockquote
                key={rev._id}
                className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4"
              >
                <div className="flex items-center justify-between text-xs text-[#1F2B23]/65">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#1F6B45]">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Order · {rev.productName}
                  </span>
                  <span className="font-semibold text-[#E58B42] tabular-nums">
                    {rev.rating}.0 ★
                  </span>
                </div>
                <p className="text-sm sm:text-base text-[#1F2B23] leading-relaxed">
                  “{rev.comment}”
                </p>
                <footer className="text-xs font-semibold text-[#1F2B23]">
                  {rev.customerName} · Krishi Market Member
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
