import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface CartDrawerProps {
  deliveryFee: number;
  freeDeliveryThreshold: number;
  onProceedToCheckout: () => void;
  onBrowseShop: () => void;
}

export function CartDrawer({
  deliveryFee,
  freeDeliveryThreshold,
  onProceedToCheckout,
  onBrowseShop,
}: CartDrawerProps) {
  const { items, isDrawerOpen, setDrawerOpen, updateQuantity, removeFromCart, subtotal } =
    useCart();

  if (!isDrawerOpen) return null;

  const appliedDelivery = subtotal >= freeDeliveryThreshold || subtotal === 0 ? 0 : deliveryFee;
  const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);
  const total = subtotal + appliedDelivery;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#1F2B23]/45 backdrop-blur-[2px]"
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className="relative w-full max-w-md bg-[#FBFAF5] h-full flex flex-col border-l border-[#1F2B23]/15 shadow-2xl"
        aria-label="Shopping Basket"
      >
        <div className="px-6 py-5 border-b border-[#1F2B23]/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[#1F2B23]">Your Harvest Basket</h2>
            <p className="text-xs text-[#1F2B23]/65 mt-0.5 tabular-nums">
              {items.reduce((s, i) => s + i.quantity, 0)} items selected directly from farms
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#1F2B23]/70 hover:bg-[#1F2B23]/5 cursor-pointer"
            aria-label="Close basket"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {subtotal > 0 && (
          <div className="px-6 py-3 bg-[#DFF0C8]/55 border-b border-[#1F6B45]/15 text-xs text-[#1F2B23]">
            {remainingForFree === 0 ? (
              <span className="font-medium text-[#1F6B45]">
                Free direct farm delivery unlocked on this order.
              </span>
            ) : (
              <span>
                Add <strong className="tabular-nums">₹{remainingForFree}</strong> more for free
                delivery (Orders above ₹{freeDeliveryThreshold}).
              </span>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#DFF0C8]/70 text-[#1F6B45] flex items-center justify-center">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-[#1F2B23]">Your harvest basket is empty</p>
                <p className="text-sm text-[#1F2B23]/65 mt-1">
                  Explore morning-picked vegetables, orchard fruits, and A2 dairy directly from
                  local growers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onBrowseShop();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] transition-colors cursor-pointer"
              >
                Explore Products
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product._id}
                className="flex gap-4 pb-4 border-b border-[#1F2B23]/10 last:border-b-0"
              >
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F1EFE7] shrink-0">
                  <ImageWithFallback
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#1F2B23] truncate">
                      {product.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeFromCart(product._id)}
                      className="text-[#1F2B23]/45 hover:text-red-600 p-0.5 cursor-pointer"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[#1F2B23]/65 mt-0.5">
                    {product.farmName} · ₹{product.pricePerUnit}/{product.unit}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#1F2B23]/15 rounded-lg bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product._id, quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#1F2B23] hover:bg-[#1F2B23]/5 cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-semibold tabular-nums">
                        {quantity} {product.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product._id, quantity + 1)}
                        disabled={quantity >= product.availableQuantity}
                        className="w-8 h-8 flex items-center justify-center text-[#1F2B23] hover:bg-[#1F2B23]/5 disabled:opacity-40 cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-[#1F2B23] tabular-nums">
                      ₹{product.pricePerUnit * quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-[#1F2B23]/10 bg-white space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#1F2B23]/75">
                <span>Produce Subtotal</span>
                <span className="font-mono tabular-nums">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#1F2B23]/75">
                <span>Farm-to-Door Delivery</span>
                <span className="font-mono tabular-nums">
                  {appliedDelivery === 0 ? 'Free' : `₹${appliedDelivery}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base text-[#1F2B23] pt-2 border-t border-[#1F2B23]/10">
                <span>Total Payable</span>
                <span className="font-mono tabular-nums">₹{total}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onProceedToCheckout();
              }}
              className="w-full py-3 px-5 rounded-xl bg-[#1F6B45] text-white font-semibold text-sm hover:bg-[#185536] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
