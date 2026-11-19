import { Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface ProductCardProps {
  product: Product;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onViewFarmer: (farmerId: string) => void;
}

export function ProductCard({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onAddToCart,
  onViewProduct,
  onViewFarmer,
}: ProductCardProps) {
  const outOfStock = !product.isAvailable || product.availableQuantity <= 0;

  return (
    <article className="group bg-white rounded-2xl border border-[#1F2B23]/10 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-[#F3F1E8] overflow-hidden">
        <button
          type="button"
          onClick={() => onViewProduct(product)}
          className="w-full h-full block text-left cursor-pointer"
        >
          <ImageWithFallback
            src={product.images[0]}
            alt={product.name}
            fallbackLabel={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </button>

        {onToggleWishlist && (
          <button
            type="button"
            onClick={() => onToggleWishlist(product._id)}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isWishlisted
                ? 'bg-[#E58B42] text-white'
                : 'bg-white/90 text-[#1F2B23] hover:text-[#E58B42]'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Zero-Pill Metadata Line */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#1F2B23]/65">
          <span className="truncate">
            {product.categoryName} · {product.farmingMethod}
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-[#1F2B23] shrink-0 tabular-nums">
            <Star className="w-3.5 h-3.5 text-[#E58B42] fill-[#E58B42]" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onViewProduct(product)}
          className="mt-2 text-left cursor-pointer"
        >
          <h3 className="text-base font-semibold text-[#1F2B23] leading-snug group-hover:text-[#1F6B45] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </button>

        <button
          type="button"
          onClick={() => onViewFarmer(product.farmerId)}
          className="mt-1.5 text-left text-xs text-[#1F6B45] hover:underline truncate cursor-pointer"
        >
          {product.farmerName} · {product.district}
        </button>

        <div className="mt-auto pt-4 flex items-end justify-between gap-3 border-t border-[#1F2B23]/8">
          <div>
            <div className="text-lg font-bold text-[#1F2B23] font-mono tabular-nums">
              ₹{product.pricePerUnit}
              <span className="text-xs font-sans font-normal text-[#1F2B23]/65">
                {' '}
                / {product.unit}
              </span>
            </div>
            <div className="text-[11px] text-[#1F2B23]/60 tabular-nums mt-0.5">
              {outOfStock
                ? 'Currently sold out'
                : `${product.availableQuantity} ${product.unit} in stock`}
            </div>
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onAddToCart(product)}
            className="px-3.5 py-2 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold hover:bg-[#185536] disabled:bg-[#1F2B23]/15 disabled:text-[#1F2B23]/45 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{outOfStock ? 'Sold Out' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
