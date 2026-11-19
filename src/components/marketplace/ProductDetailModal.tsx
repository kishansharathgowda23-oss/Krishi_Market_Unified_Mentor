import { Calendar, MapPin, Minus, Plus, ShoppingBag, Sprout, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Farmer, Product, Review } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onViewFarmer: (farmerId: string) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onViewFarmer,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    api
      .getProductDetail(product._id)
      .then((res) => {
        setFarmer(res.farmer);
        setReviews(res.reviews);
      })
      .catch(() => {
        setFarmer(null);
        setReviews([]);
      });
  }, [product]);

  if (!product) return null;

  const outOfStock = !product.isAvailable || product.availableQuantity <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#1F2B23]/55 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-[#FBFAF5] rounded-2xl max-w-4xl w-full overflow-hidden border border-[#1F2B23]/15 shadow-2xl my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 text-[#1F2B23] flex items-center justify-center hover:bg-white cursor-pointer"
          aria-label="Close product details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="aspect-[4/3] md:aspect-auto md:h-full bg-[#F1EFE7]">
            <ImageWithFallback
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 sm:p-8 flex flex-col max-h-[85vh] overflow-y-auto">
            <div className="text-xs text-[#1F2B23]/65 font-medium">
              {product.categoryName} · {product.farmingMethod} · {product.district}, {product.state}
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2B23] mt-2">
              {product.name}
            </h2>

            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1 font-semibold text-[#1F2B23] tabular-nums">
                <Star className="w-4 h-4 text-[#E58B42] fill-[#E58B42]" />
                {product.rating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
              <span className="text-[#1F2B23]/60 tabular-nums">{product.soldCount} sold</span>
            </div>

            <div className="mt-5 pb-5 border-b border-[#1F2B23]/10 flex items-baseline justify-between">
              <div className="text-3xl font-bold text-[#1F6B45] font-mono tabular-nums">
                ₹{product.pricePerUnit}
                <span className="text-sm font-sans font-normal text-[#1F2B23]/70">
                  {' '}
                  / {product.unit}
                </span>
              </div>
              <div className="text-xs font-medium text-[#1F2B23]/75 tabular-nums">
                {outOfStock
                  ? 'Out of stock'
                  : `${product.availableQuantity} ${product.unit} available`}
              </div>
            </div>

            <p className="mt-5 text-sm text-[#1F2B23]/80 leading-relaxed">{product.description}</p>

            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-[#1F2B23]/80 py-4 border-y border-[#1F2B23]/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1F6B45]" />
                <span>Harvested: {product.harvestDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-[#1F6B45]" />
                <span>Method: {product.farmingMethod}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <MapPin className="w-4 h-4 text-[#1F6B45]" />
                <span>Origin: {product.farmLocation}</span>
              </div>
            </div>

            {/* Farmer link */}
            <div className="mt-4 flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#DFF0C8]">
                  <ImageWithFallback
                    src={farmer?.profileImage}
                    alt={product.farmerName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1F2B23] truncate">
                    {product.farmerName}
                  </div>
                  <div className="text-xs text-[#1F2B23]/65 truncate">{product.farmName}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewFarmer(product.farmerId);
                }}
                className="text-xs font-semibold text-[#1F6B45] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                View Farm Profile
              </button>
            </div>

            {/* Contiguous Purchase Action */}
            <div className="mt-4 flex items-center gap-3">
              <div className="inline-flex items-center border border-[#1F2B23]/20 rounded-xl bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-11 flex items-center justify-center text-[#1F2B23] cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 text-sm font-semibold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(Math.max(1, product.availableQuantity), q + 1))
                  }
                  disabled={quantity >= product.availableQuantity}
                  className="w-10 h-11 flex items-center justify-center text-[#1F2B23] disabled:opacity-40 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="flex-1 h-11 px-5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] disabled:bg-[#1F2B23]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>
                  {outOfStock
                    ? 'Out of Stock'
                    : `Add to Basket · ₹${product.pricePerUnit * quantity}`}
                </span>
              </button>
            </div>

            {reviews.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#1F2B23]/10 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1F2B23]/60">
                  Customer Reviews
                </h4>
                {reviews.slice(0, 3).map((rev) => (
                  <div key={rev._id} className="text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-[#1F2B23]">
                      <span>{rev.customerName}</span>
                      <span className="tabular-nums text-[#E58B42]">{rev.rating}.0 ★</span>
                    </div>
                    <p className="text-[#1F2B23]/75 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
