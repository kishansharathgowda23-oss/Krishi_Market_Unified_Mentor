import {
  CheckCircle2,
  Heart,
  Home,
  LogOut,
  MapPin,
  MessageSquarePlus,
  Package,
  Search,
  ShoppingBag,
  Star,
  Truck,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import type { Address, Category, Customer, Order, Product, Review } from '../../types';
import { ProductCard } from '../marketplace/ProductCard';
import { ShopPage } from '../pages/ShopPage';

type CustomerTab =
  | 'home'
  | 'browse'
  | 'search'
  | 'cart'
  | 'wishlist'
  | 'orders'
  | 'tracking'
  | 'profile';

interface CustomerDashboardProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onViewFarmer: (farmerId: string) => void;
  onOpenCheckout: () => void;
  onNotify: (type: 'success' | 'error', text: string) => void;
  onRefreshMarketplace: () => void;
}

const TRACKING_STEPS = [
  'New Order',
  'Accepted',
  'Processing',
  'Ready for Pickup',
  'Shipped',
  'Delivered',
];

export function CustomerDashboard({
  products,
  categories,
  onAddToCart,
  onViewProduct,
  onViewFarmer,
  onOpenCheckout,
  onNotify,
  onRefreshMarketplace,
}: CustomerDashboardProps) {
  const { user, logout, setProfile } = useAuth();
  const { items: cartItems, subtotal, updateQuantity, removeFromCart } = useCart();

  const [tab, setTab] = useState<CustomerTab>('home');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');

  // Review modal state
  const [reviewModalOrder, setReviewModalOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [farmerRating, setFarmerRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Complaint modal state
  const [complaintOrder, setComplaintOrder] = useState<Order | null>(null);
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpDescription, setCmpDescription] = useState('');

  // Profile edit state
  const [profName, setProfName] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profDistrict, setProfDistrict] = useState('Bengaluru');

  // New Address state
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('Bengaluru');
  const [addrState, setAddrState] = useState('Karnataka');
  const [addrPincode, setAddrPincode] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getCustomerDashboard();
      setCustomer(data.customer);
      setProfile(data.customer);
      setOrders(data.orders);
      setAddresses(data.addresses);
      setWishlist(data.wishlist);
      setReviews(data.reviews);
      setProfName(data.customer.fullName);
      setProfPhone(data.customer.phone);
      setProfDistrict(data.customer.preferredDistrict || 'Bengaluru');
      if (data.orders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(data.orders[0]._id);
      }
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [onNotify, selectedOrderId, setProfile]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleToggleWishlist = async (productId: string) => {
    try {
      const res = await api.toggleWishlist(productId);
      onNotify('success', res.added ? 'Saved to wishlist.' : 'Removed from wishlist.');
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      await api.confirmDelivery(orderId);
      onNotify('success', 'Delivery confirmed! You can now review this farm order.');
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.cancelOrder(orderId);
      onNotify('success', 'Order cancelled and produce stock restored.');
      onRefreshMarketplace();
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalOrder) return;
    try {
      await api.submitReview({
        orderId: reviewModalOrder._id,
        productId: reviewModalOrder.items[0].productId,
        rating: reviewRating,
        farmerRating,
        comment: reviewComment,
      });
      onNotify('success', 'Thank you! Your review has been published.');
      setReviewModalOrder(null);
      setReviewComment('');
      onRefreshMarketplace();
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleRaiseComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintOrder) return;
    try {
      await api.createComplaint({
        orderId: complaintOrder._id,
        orderNumber: complaintOrder.orderNumber,
        subject: cmpSubject,
        description: cmpDescription,
      });
      onNotify('success', 'Support ticket logged with Krishi Market Admin.');
      setComplaintOrder(null);
      setCmpSubject('');
      setCmpDescription('');
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateCustomerProfile({
        fullName: profName,
        phone: profPhone,
        preferredDistrict: profDistrict,
      });
      onNotify('success', 'Customer profile updated.');
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAddress({
        label: addrLabel,
        fullName: profName || user?.name || '',
        phone: profPhone || user?.phone || '',
        street: addrStreet,
        district: addrDistrict,
        state: addrState,
        pincode: addrPincode,
        isDefault: addresses.length === 0,
      });
      setAddrStreet('');
      setAddrPincode('');
      onNotify('success', 'Delivery address saved.');
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const sidebarItems: Array<{ id: CustomerTab; label: string; icon: typeof Home }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'browse', label: 'Browse Products', icon: ShoppingBag },
    { id: 'search', label: 'Search Products', icon: Search },
    { id: 'cart', label: `Shopping Cart (${cartItems.length})`, icon: ShoppingBag },
    { id: 'wishlist', label: `Wishlist (${wishlist.length})`, icon: Heart },
    { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
    { id: 'tracking', label: 'Order Tracking', icon: Truck },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const trackedOrder = orders.find((o) => o._id === selectedOrderId) || orders[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Workspace Sidebar */}
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-[#1F2B23]/10 p-4 space-y-1 lg:sticky lg:top-24">
          <div className="px-3 py-3 mb-2 border-b border-[#1F2B23]/10">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
              Customer Account
            </div>
            <div className="text-base font-bold text-[#1F2B23] mt-0.5 truncate">
              {customer?.fullName || user?.name}
            </div>
            <div className="text-xs text-[#1F2B23]/60 truncate">{user?.email}</div>
          </div>

          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1F6B45] text-white'
                    : 'text-[#1F2B23]/80 hover:bg-[#DFF0C8]/45 hover:text-[#1F2B23]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50 transition-colors mt-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-10 text-center text-sm text-[#1F2B23]/65">
              Loading your customer dashboard...
            </div>
          ) : (
            <>
              {tab === 'home' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="font-display text-2xl font-bold text-[#1F2B23]">
                        Namaste, {customer?.fullName}
                      </h1>
                      <p className="text-sm text-[#1F2B23]/70 mt-1">
                        Preferred delivery region: {customer?.preferredDistrict || 'Bengaluru'} ·{' '}
                        {orders.length} orders placed directly with local farms.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('browse')}
                      className="px-4 py-2.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] cursor-pointer whitespace-nowrap"
                    >
                      Shop Fresh Harvest
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Active Orders</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#1F2B23] mt-1">
                        {orders.filter((o) => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Saved Wishlist</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#1F2B23] mt-1">
                        {wishlist.length}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Saved Addresses</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#1F2B23] mt-1">
                        {addresses.length}
                      </div>
                    </div>
                  </div>

                  {orders.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-[#1F2B23]">Recent Orders</h2>
                        <button
                          type="button"
                          onClick={() => setTab('orders')}
                          className="text-xs font-semibold text-[#1F6B45] hover:underline cursor-pointer"
                        >
                          View All Orders
                        </button>
                      </div>
                      <div className="divide-y divide-[#1F2B23]/10">
                        {orders.slice(0, 3).map((ord) => (
                          <div
                            key={ord._id}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                          >
                            <div>
                              <span className="font-mono font-semibold text-[#1F6B45]">
                                {ord.orderNumber}
                              </span>{' '}
                              <span className="text-[#1F2B23]/75">· {ord.farmName}</span>
                              <div className="text-xs text-[#1F2B23]/60 mt-0.5">
                                {ord.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="text-xs font-semibold text-[#1F2B23]">
                                {ord.status}
                              </span>
                              <span className="font-mono font-semibold tabular-nums">
                                ₹{ord.totalAmount}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(tab === 'browse' || tab === 'search') && (
                <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-10">
                  <ShopPage
                    products={products}
                    categories={categories}
                    wishlistIds={customer?.wishlistProductIds || []}
                    onToggleWishlist={handleToggleWishlist}
                    onAddToCart={onAddToCart}
                    onViewProduct={onViewProduct}
                    onViewFarmer={onViewFarmer}
                  />
                </div>
              )}

              {tab === 'cart' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-5">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    Shopping Basket
                  </h2>
                  {cartItems.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <p className="text-sm text-[#1F2B23]/70">Your shopping basket is empty.</p>
                      <button
                        type="button"
                        onClick={() => setTab('browse')}
                        className="px-4 py-2 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold cursor-pointer"
                      >
                        Browse Produce
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-[#1F2B23]/10">
                        {cartItems.map(({ product, quantity }) => (
                          <div
                            key={product._id}
                            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div>
                              <div className="text-sm font-semibold text-[#1F2B23]">
                                {product.name}
                              </div>
                              <div className="text-xs text-[#1F2B23]/65">
                                {product.farmName} · ₹{product.pricePerUnit}/{product.unit}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="inline-flex items-center border border-[#1F2B23]/15 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product._id, quantity - 1)}
                                  className="px-3 py-1.5 text-sm cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="px-3 text-xs font-semibold tabular-nums">
                                  {quantity} {product.unit}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(product._id, quantity + 1)}
                                  className="px-3 py-1.5 text-sm cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-mono font-semibold text-sm tabular-nums w-20 text-right">
                                ₹{product.pricePerUnit * quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFromCart(product._id)}
                                className="text-xs text-red-600 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="pt-4 border-t border-[#1F2B23]/10 flex items-center justify-between">
                        <div className="text-base font-bold text-[#1F2B23] tabular-nums">
                          Subtotal: ₹{subtotal}
                        </div>
                        <button
                          type="button"
                          onClick={onOpenCheckout}
                          className="px-5 py-2.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] cursor-pointer"
                        >
                          Proceed to Checkout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === 'wishlist' && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">Saved Wishlist</h2>
                  {wishlist.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-10 text-center text-sm text-[#1F2B23]/65">
                      No saved items yet. Tap the heart icon on any farm product to bookmark it.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {wishlist.map((prod) => (
                        <ProductCard
                          key={prod._id}
                          product={prod}
                          isWishlisted={true}
                          onToggleWishlist={handleToggleWishlist}
                          onAddToCart={onAddToCart}
                          onViewProduct={onViewProduct}
                          onViewFarmer={onViewFarmer}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'orders' && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">My Orders</h2>
                  {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-10 text-center text-sm text-[#1F2B23]/65">
                      You have not placed any orders yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((ord) => {
                        const alreadyReviewed = reviews.some((r) => r.orderId === ord._id);
                        return (
                          <div
                            key={ord._id}
                            className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5 space-y-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1F2B23]/10">
                              <div>
                                <span className="font-mono font-bold text-sm text-[#1F6B45]">
                                  {ord.orderNumber}
                                </span>
                                <span className="text-xs text-[#1F2B23]/65 ml-2">
                                  · {ord.farmName} · {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-[#1F2B23]">
                                  Status: {ord.status}
                                </span>
                                <span className="font-mono font-bold text-sm tabular-nums">
                                  ₹{ord.totalAmount}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-sm">
                              {ord.items.map((item) => (
                                <div key={item.productId} className="flex justify-between">
                                  <span>
                                    {item.productName} × {item.quantity} {item.unit}
                                  </span>
                                  <span className="font-mono tabular-nums text-[#1F2B23]/80">
                                    ₹{item.subtotal}
                                  </span>
                                </div>
                              ))}
                              <div className="text-xs text-[#1F2B23]/65 pt-1">
                                Slot: {ord.deliverySlot} · {ord.paymentMethod}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderId(ord._id);
                                  setTab('tracking');
                                }}
                                className="px-3.5 py-2 rounded-xl border border-[#1F2B23]/15 text-xs font-semibold hover:border-[#1F6B45] cursor-pointer"
                              >
                                Track Order
                              </button>

                              {ord.status === 'Shipped' && !ord.customerConfirmedDelivery && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDelivery(ord._id)}
                                  className="px-3.5 py-2 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold hover:bg-[#185536] cursor-pointer"
                                >
                                  Confirm Delivery Received
                                </button>
                              )}

                              {(ord.status === 'New Order' || ord.status === 'Accepted') && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(ord._id)}
                                  className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 cursor-pointer"
                                >
                                  Cancel Order
                                </button>
                              )}

                              {ord.status === 'Delivered' && !alreadyReviewed && (
                                <button
                                  type="button"
                                  onClick={() => setReviewModalOrder(ord)}
                                  className="px-3.5 py-2 rounded-xl bg-[#E58B42] text-white text-xs font-semibold hover:opacity-90 cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                  <span>Rate & Review</span>
                                </button>
                              )}

                              {alreadyReviewed && (
                                <span className="text-xs text-[#1F6B45] font-medium inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Reviewed
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => setComplaintOrder(ord)}
                                className="ml-auto text-xs text-[#1F2B23]/65 hover:text-[#1F2B23] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <MessageSquarePlus className="w-3.5 h-3.5" />
                                <span>Report Issue</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {tab === 'tracking' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                        Live Order Tracking
                      </h2>
                      <p className="text-xs text-[#1F2B23]/65 mt-0.5">
                        Follow farm packing and dispatch progress step by step.
                      </p>
                    </div>
                    {orders.length > 0 && (
                      <select
                        value={trackedOrder?._id || ''}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm font-mono"
                      >
                        {orders.map((o) => (
                          <option key={o._id} value={o._id}>
                            {o.orderNumber} — {o.status}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {!trackedOrder ? (
                    <p className="text-sm text-[#1F2B23]/65">No orders available to track.</p>
                  ) : (
                    <div className="space-y-6">
                      {trackedOrder.status === 'Cancelled' ? (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-900">
                          Order {trackedOrder.orderNumber} was cancelled.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                          {TRACKING_STEPS.map((step, idx) => {
                            const currentIdx = TRACKING_STEPS.indexOf(trackedOrder.status);
                            const completed = idx <= currentIdx;
                            return (
                              <div
                                key={step}
                                className={`p-3 rounded-xl border text-center ${
                                  completed
                                    ? 'bg-[#DFF0C8]/55 border-[#1F6B45]/40 text-[#1F2B23]'
                                    : 'bg-[#FBFAF5] border-[#1F2B23]/10 text-[#1F2B23]/45'
                                }`}
                              >
                                <div className="text-[11px] font-mono font-bold tabular-nums">
                                  0{idx + 1}
                                </div>
                                <div className="text-xs font-semibold mt-1">{step}</div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="border-t border-[#1F2B23]/10 pt-4 space-y-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1F2B23]/60">
                          Activity Log
                        </h3>
                        {trackedOrder.timeline.map((entry, idx) => (
                          <div key={idx} className="flex items-start justify-between gap-4 text-xs">
                            <div>
                              <span className="font-semibold text-[#1F2B23]">{entry.status}</span>
                              <span className="text-[#1F2B23]/75 ml-2">— {entry.note}</span>
                            </div>
                            <span className="font-mono text-[#1F2B23]/55 shrink-0 tabular-nums">
                              {new Date(entry.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'profile' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleSaveProfile}
                    className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4"
                  >
                    <h2 className="font-display text-2xl font-bold text-[#1F2B23]">My Profile</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#1F2B23]/75 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profName}
                          onChange={(e) => setProfName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1F2B23]/75 mb-1">
                          Phone (+91)
                        </label>
                        <input
                          type="tel"
                          value={profPhone}
                          onChange={(e) => setProfPhone(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#1F2B23]/75 mb-1">
                          Preferred District
                        </label>
                        <input
                          type="text"
                          value={profDistrict}
                          onChange={(e) => setProfDistrict(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </form>

                  <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-5">
                    <h3 className="text-base font-semibold text-[#1F2B23] flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#1F6B45]" />
                      <span>Saved Delivery Addresses</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr._id}
                          className="p-4 rounded-xl bg-[#FBFAF5] border border-[#1F2B23]/10 text-xs space-y-1"
                        >
                          <div className="font-semibold text-[#1F2B23]">{addr.label}</div>
                          <div className="text-[#1F2B23]/75">
                            {addr.street}, {addr.district}, {addr.state} – {addr.pincode}
                          </div>
                        </div>
                      ))}
                    </div>

                    <form
                      onSubmit={handleAddAddress}
                      className="pt-4 border-t border-[#1F2B23]/10 grid grid-cols-1 sm:grid-cols-2 gap-3"
                    >
                      <input
                        type="text"
                        required
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        placeholder="Label (Home / Office)"
                        className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={addrPincode}
                        onChange={(e) => setAddrPincode(e.target.value)}
                        placeholder="PIN Code"
                        className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        placeholder="Full Street Address"
                        className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm sm:col-span-2"
                      />
                      <input
                        type="text"
                        required
                        value={addrDistrict}
                        onChange={(e) => setAddrDistrict(e.target.value)}
                        placeholder="District"
                        className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        placeholder="State"
                        className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold sm:col-span-2 w-fit cursor-pointer"
                      >
                        Add Delivery Address
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Review Modal */}
      {reviewModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2B23]/55">
          <form
            onSubmit={handleSubmitReview}
            className="bg-[#FBFAF5] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#1F2B23]/15 shadow-2xl"
          >
            <h3 className="font-display text-xl font-bold text-[#1F2B23]">
              Review {reviewModalOrder.farmName}
            </h3>
            <p className="text-xs text-[#1F2B23]/70">
              Order {reviewModalOrder.orderNumber} · {reviewModalOrder.items[0]?.productName}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Produce Rating (1–5)</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Stars
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Farmer Rating (1–5)</label>
                <select
                  value={farmerRating}
                  onChange={(e) => setFarmerRating(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} Stars
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Your Feedback</label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share freshness, packaging, and taste..."
                className="w-full p-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#1F2B23]/15 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold cursor-pointer"
              >
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2B23]/55">
          <form
            onSubmit={handleRaiseComplaint}
            className="bg-[#FBFAF5] rounded-2xl max-w-md w-full p-6 space-y-4 border border-[#1F2B23]/15 shadow-2xl"
          >
            <h3 className="font-display text-xl font-bold text-[#1F2B23]">
              Report Order Issue
            </h3>
            <p className="text-xs text-[#1F2B23]/70">
              Order {complaintOrder.orderNumber} · {complaintOrder.farmName}
            </p>
            <input
              type="text"
              required
              value={cmpSubject}
              onChange={(e) => setCmpSubject(e.target.value)}
              placeholder="Issue subject (e.g., Late slot, Damaged crate)"
              className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
            />
            <textarea
              rows={3}
              required
              value={cmpDescription}
              onChange={(e) => setCmpDescription(e.target.value)}
              placeholder="Describe what happened so our operations team can resolve it..."
              className="w-full p-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setComplaintOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#1F2B23]/15 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold cursor-pointer"
              >
                Submit Issue
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
