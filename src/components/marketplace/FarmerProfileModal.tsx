import { CheckCircle2, MapPin, Sprout, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Farmer, Product, Review } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface FarmerProfileModalProps {
  farmerId: string | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function FarmerProfileModal({
  farmerId,
  onClose,
  onAddToCart,
}: FarmerProfileModalProps) {
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!farmerId) return;
    setLoading(true);
    api
      .getFarmerDetail(farmerId)
      .then((res) => {
        setFarmer(res.farmer);
        setProducts(res.products);
        setReviews(res.reviews);
      })
      .finally(() => setLoading(false));
  }, [farmerId]);

  if (!farmerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#1F2B23]/55 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-[#FBFAF5] rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto border border-[#1F2B23]/15 shadow-2xl p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-[#1F2B23] flex items-center justify-center border border-[#1F2B23]/10 cursor-pointer"
          aria-label="Close farmer profile"
        >
          <X className="w-4 h-4" />
        </button>

        {loading || !farmer ? (
          <div className="py-12 text-center text-sm text-[#1F2B23]/65">Loading farm profile...</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center pb-6 border-b border-[#1F2B23]/10">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-[#DFF0C8]">
                <ImageWithFallback
                  src={farmer.profileImage}
                  alt={farmer.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-[#1F6B45] font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {farmer.verificationStatus === 'approved'
                      ? 'Verified Krishi Market Grower'
                      : 'Pending Verification'}{' '}
                    · {farmer.farmingMethod}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold text-[#1F2B23]">{farmer.farmName}</h2>
                <p className="text-sm text-[#1F2B23]/75">
                  Run by {farmer.fullName} ·{' '}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {farmer.farmLocation}, {farmer.district}, {farmer.state}
                  </span>
                </p>
                <div className="flex items-center gap-4 text-xs text-[#1F2B23]/75 pt-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#1F2B23] tabular-nums">
                    <Star className="w-3.5 h-3.5 text-[#E58B42] fill-[#E58B42]" />
                    {farmer.rating.toFixed(1)} ({farmer.reviewCount} reviews)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5 text-[#1F6B45]" />
                    Crops: {farmer.cropTypes.join(', ')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#1F2B23]/80 leading-relaxed">{farmer.farmDescription}</p>

            <div>
              <h3 className="text-sm font-semibold text-[#1F2B23] mb-3">
                Current Harvest Available ({products.length})
              </h3>
              {products.length === 0 ? (
                <p className="text-sm text-[#1F2B23]/60">No active harvest listed today.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((prod) => (
                    <div
                      key={prod._id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#1F2B23]/10"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                        <ImageWithFallback
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#1F2B23] truncate">
                          {prod.name}
                        </div>
                        <div className="text-xs text-[#1F2B23]/65 font-mono tabular-nums mt-0.5">
                          ₹{prod.pricePerUnit} / {prod.unit} · {prod.availableQuantity} left
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!prod.isAvailable || prod.availableQuantity <= 0}
                        onClick={() => onAddToCart(prod)}
                        className="px-3 py-1.5 rounded-lg bg-[#1F6B45] text-white text-xs font-semibold hover:bg-[#185536] disabled:opacity-40 cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {reviews.length > 0 && (
              <div className="pt-4 border-t border-[#1F2B23]/10 space-y-3">
                <h3 className="text-sm font-semibold text-[#1F2B23]">Recent Customer Feedback</h3>
                {reviews.slice(0, 3).map((r) => (
                  <div key={r._id} className="p-3 rounded-xl bg-white border border-[#1F2B23]/10 text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#1F2B23]">
                      <span>{r.customerName} · {r.productName}</span>
                      <span className="text-[#E58B42] tabular-nums">{r.farmerRating}.0 ★</span>
                    </div>
                    <p className="text-[#1F2B23]/75 mt-1">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
