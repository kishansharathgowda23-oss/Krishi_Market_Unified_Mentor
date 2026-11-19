import { useCallback, useEffect, useState } from 'react';
import { CartDrawer } from './components/cart/CartDrawer';
import { ToastContainer, type ToastMessage } from './components/common/ToastBanner';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { CustomerDashboard } from './components/dashboards/CustomerDashboard';
import { FarmerDashboard } from './components/dashboards/FarmerDashboard';
import { Footer } from './components/layout/Footer';
import { Navbar } from './components/layout/Navbar';
import { FarmerProfileModal } from './components/marketplace/FarmerProfileModal';
import { ProductDetailModal } from './components/marketplace/ProductDetailModal';
import { AboutPage } from './components/pages/AboutPage';
import { AuthPage } from './components/pages/AuthPage';
import { CategoriesPage } from './components/pages/CategoriesPage';
import { CheckoutModal } from './components/pages/CheckoutModal';
import { FarmersPage } from './components/pages/FarmersPage';
import { LandingPage } from './components/pages/LandingPage';
import { ShopPage } from './components/pages/ShopPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { api } from './services/api';
import type {
  ActiveRoute,
  Category,
  Customer,
  Farmer,
  PlatformSettings,
  Product,
  Review,
} from './types';

function KrishiMarketApp() {
  const { user, profile, setProfile } = useAuth();
  const { addToCart, setDrawerOpen } = useCart();

  const [route, setRoute] = useState<ActiveRoute>('home');
  const [shopCategory, setShopCategory] = useState<string>('All');
  const [authMode, setAuthMode] = useState<'login' | 'register-customer' | 'register-farmer'>(
    'login'
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    commissionPercent: 6,
    deliveryFee: 35,
    freeDeliveryThreshold: 499,
  });
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [marketError, setMarketError] = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((type: 'success' | 'error', text: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadMarketplace = useCallback(async () => {
    setMarketError('');
    try {
      const [cats, prods, frms, revs, pubSettings] = await Promise.all([
        api.getCategories(),
        api.getProducts(),
        api.getFarmers(),
        api.getReviews(),
        api.getPublicSettings(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setFarmers(frms);
      setReviews(revs);
      setSettings(pubSettings);
    } catch (err) {
      setMarketError((err as Error).message || 'Unable to load marketplace data.');
    } finally {
      setLoadingMarket(false);
    }
  }, []);

  useEffect(() => {
    void loadMarketplace();
  }, [loadMarketplace]);

  const handleNavigate = useCallback(
    (nextRoute: ActiveRoute, options?: { category?: string; authMode?: string }) => {
      if (options?.category) {
        setShopCategory(options.category);
      } else if (nextRoute === 'shop' && route !== 'categories') {
        setShopCategory('All');
      }
      if (options?.authMode) {
        setAuthMode(options.authMode as 'login' | 'register-customer' | 'register-farmer');
      }
      setRoute(nextRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [route]
  );

  const handleAddToCart = useCallback(
    (product: Product, quantity = 1) => {
      const res = addToCart(product, quantity);
      notify(res.ok ? 'success' : 'error', res.message);
      if (res.ok) {
        setDrawerOpen(true);
      }
    },
    [addToCart, notify, setDrawerOpen]
  );

  const handleToggleWishlist = useCallback(
    async (productId: string) => {
      if (!user || user.role !== 'customer') {
        notify('error', 'Please sign in as a Customer to save items to your wishlist.');
        return;
      }
      try {
        const res = await api.toggleWishlist(productId);
        setProfile((prev) =>
          prev ? { ...(prev as Customer), wishlistProductIds: res.wishlistProductIds } : prev
        );
        notify('success', res.added ? 'Saved to wishlist.' : 'Removed from wishlist.');
      } catch (err) {
        notify('error', (err as Error).message);
      }
    },
    [notify, setProfile, user]
  );

  const wishlistIds =
    user?.role === 'customer' && profile && 'wishlistProductIds' in profile
      ? profile.wishlistProductIds
      : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFAF5] text-[#1F2B23]">
      <Navbar activeRoute={route} onNavigate={handleNavigate} />

      <main className="flex-1">
        {loadingMarket && route !== 'auth' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-sm text-[#1F2B23]/65">
            Loading fresh farm harvests...
          </div>
        ) : marketError ? (
          <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
            <p className="text-sm text-red-700">{marketError}</p>
            <button
              type="button"
              onClick={() => void loadMarketplace()}
              className="px-4 py-2 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {route === 'home' && (
              <LandingPage
                categories={categories}
                products={products}
                farmers={farmers}
                reviews={reviews}
                wishlistIds={wishlistIds}
                onToggleWishlist={user?.role === 'customer' ? handleToggleWishlist : undefined}
                onAddToCart={handleAddToCart}
                onViewProduct={setSelectedProduct}
                onViewFarmer={setSelectedFarmerId}
                onNavigate={handleNavigate}
              />
            )}

            {route === 'shop' && (
              <ShopPage
                key={shopCategory}
                products={products}
                categories={categories}
                initialCategory={shopCategory}
                wishlistIds={wishlistIds}
                onToggleWishlist={user?.role === 'customer' ? handleToggleWishlist : undefined}
                onAddToCart={handleAddToCart}
                onViewProduct={setSelectedProduct}
                onViewFarmer={setSelectedFarmerId}
              />
            )}

            {route === 'categories' && (
              <CategoriesPage
                categories={categories}
                products={products}
                onSelectCategory={(catName) => handleNavigate('shop', { category: catName })}
              />
            )}

            {route === 'farmers' && (
              <FarmersPage
                farmers={farmers}
                products={products}
                onViewFarmer={setSelectedFarmerId}
              />
            )}

            {route === 'about' && <AboutPage onNavigate={handleNavigate} />}

            {route === 'auth' && (
              <AuthPage
                key={authMode}
                initialMode={authMode}
                onSuccess={() => {
                  notify('success', 'Signed in to Krishi Market.');
                  handleNavigate('dashboard');
                }}
              />
            )}

            {route === 'dashboard' && (
              <>
                {!user ? (
                  <AuthPage
                    initialMode="login"
                    onSuccess={() => {
                      notify('success', 'Signed in to Krishi Market.');
                    }}
                  />
                ) : user.role === 'customer' ? (
                  <CustomerDashboard
                    products={products}
                    categories={categories}
                    onAddToCart={handleAddToCart}
                    onViewProduct={setSelectedProduct}
                    onViewFarmer={setSelectedFarmerId}
                    onOpenCheckout={() => setCheckoutOpen(true)}
                    onNotify={notify}
                    onRefreshMarketplace={loadMarketplace}
                  />
                ) : user.role === 'farmer' ? (
                  <FarmerDashboard
                    categories={categories}
                    onNotify={notify}
                    onRefreshMarketplace={loadMarketplace}
                  />
                ) : (
                  <AdminDashboard
                    onNotify={notify}
                    onRefreshMarketplace={loadMarketplace}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <CartDrawer
        deliveryFee={settings.deliveryFee}
        freeDeliveryThreshold={settings.freeDeliveryThreshold}
        onProceedToCheckout={() => setCheckoutOpen(true)}
        onBrowseShop={() => handleNavigate('shop')}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        deliveryFee={settings.deliveryFee}
        freeDeliveryThreshold={settings.freeDeliveryThreshold}
        onClose={() => setCheckoutOpen(false)}
        onAuthRedirect={() => handleNavigate('auth', { authMode: 'login' })}
        onOrderSuccess={() => {
          notify('success', 'Order placed directly with farm!');
          void loadMarketplace();
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onViewFarmer={setSelectedFarmerId}
      />

      <FarmerProfileModal
        farmerId={selectedFarmerId}
        onClose={() => setSelectedFarmerId(null)}
        onAddToCart={handleAddToCart}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <KrishiMarketApp />
      </CartProvider>
    </AuthProvider>
  );
}
