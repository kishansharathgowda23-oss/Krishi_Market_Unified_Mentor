import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Edit3,
  LayoutDashboard,
  LogOut,
  Package,
  PlusCircle,
  Star,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type {
  Category,
  Farmer,
  FarmingMethod,
  Order,
  OrderStatus,
  Product,
  ProductUnit,
  Review,
} from '../../types';
import { ImageWithFallback } from '../common/ImageWithFallback';

type FarmerTab =
  | 'overview'
  | 'products'
  | 'add-product'
  | 'orders'
  | 'analytics'
  | 'reviews'
  | 'profile';

interface FarmerDashboardProps {
  categories: Category[];
  onNotify: (type: 'success' | 'error', text: string) => void;
  onRefreshMarketplace: () => void;
}

const ORDER_STATUSES: OrderStatus[] = [
  'New Order',
  'Accepted',
  'Processing',
  'Ready for Pickup',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const SAMPLE_PRODUCE_IMAGES = [
  { label: 'Fresh Vegetables', url: '/src/assets/images/cat_vegetables_1795104333947.jpg' },
  { label: 'Orchard Fruits', url: '/src/assets/images/cat_fruits_1795104334361.jpg' },
  { label: 'Farm Dairy', url: '/src/assets/images/cat_dairy_grains_1795104333947.jpg' },
  { label: 'Leafy Greens', url: '/src/assets/images/product_farm_greens_1795104333902.jpg' },
  { label: 'Heirloom Grains', url: '/src/assets/images/product_heirloom_grains_1795104333595.jpg' },
];

export function FarmerDashboard({
  categories,
  onNotify,
  onRefreshMarketplace,
}: FarmerDashboardProps) {
  const { logout, setProfile } = useAuth();
  const [tab, setTab] = useState<FarmerTab>('overview');
  const [loading, setLoading] = useState(true);

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    availableProducts: 0,
    monthlyEarnings: 0,
  });
  const [monthlyChart, setMonthlyChart] = useState<Array<{ month: string; earnings: number }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Add / Edit Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState(categories[0]?._id || 'cat_veg');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('60');
  const [prodQty, setProdQty] = useState('50');
  const [prodUnit, setProdUnit] = useState<ProductUnit>('kg');
  const [prodMethod, setProdMethod] = useState<FarmingMethod>('Organic');
  const [prodHarvestDate, setProdHarvestDate] = useState('2026-11-19');
  const [prodImage, setProdImage] = useState(SAMPLE_PRODUCE_IMAGES[0].url);
  const [prodAvailable, setProdAvailable] = useState(true);

  // Farmer Profile Form
  const [profFarmName, setProfFarmName] = useState('');
  const [profLocation, setProfLocation] = useState('');
  const [profDistrict, setProfDistrict] = useState('');
  const [profCrops, setProfCrops] = useState('');
  const [profDesc, setProfDesc] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getFarmerDashboard();
      setFarmer(data.farmer);
      setProfile(data.farmer);
      setStats(data.stats);
      setMonthlyChart(data.monthlyChart);
      setProducts(data.products);
      setOrders(data.orders);
      setReviews(data.reviews);

      setProfFarmName(data.farmer.farmName);
      setProfLocation(data.farmer.farmLocation);
      setProfDistrict(data.farmer.district);
      setProfCrops(data.farmer.cropTypes.join(', '));
      setProfDesc(data.farmer.farmDescription);
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [onNotify, setProfile]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const resetProductForm = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCategoryId(categories[0]?._id || 'cat_veg');
    setProdDesc('');
    setProdPrice('60');
    setProdQty('50');
    setProdUnit('kg');
    setProdMethod('Organic');
    setProdHarvestDate('2026-11-19');
    setProdImage(SAMPLE_PRODUCE_IMAGES[0].url);
    setProdAvailable(true);
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProductId(prod._id);
    setProdName(prod.name);
    setProdCategoryId(prod.categoryId);
    setProdDesc(prod.description);
    setProdPrice(String(prod.pricePerUnit));
    setProdQty(String(prod.availableQuantity));
    setProdUnit(prod.unit);
    setProdMethod(prod.farmingMethod);
    setProdHarvestDate(prod.harvestDate);
    setProdImage(prod.images[0] || SAMPLE_PRODUCE_IMAGES[0].url);
    setProdAvailable(prod.isAvailable);
    setTab('add-product');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: prodName,
        categoryId: prodCategoryId,
        description: prodDesc,
        pricePerUnit: Number(prodPrice),
        availableQuantity: Number(prodQty),
        unit: prodUnit,
        farmingMethod: prodMethod,
        harvestDate: prodHarvestDate,
        images: [prodImage],
        isAvailable: prodAvailable,
      };
      if (editingProductId) {
        await api.updateFarmerProduct(editingProductId, payload);
        onNotify('success', 'Product listing updated.');
      } else {
        await api.createFarmerProduct(payload);
        onNotify('success', 'New harvest listed on Krishi Market!');
      }
      resetProductForm();
      setTab('products');
      onRefreshMarketplace();
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteFarmerProduct(id);
      onNotify('success', 'Product removed from listings.');
      onRefreshMarketplace();
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleToggleAvailability = async (prod: Product) => {
    try {
      await api.updateFarmerProduct(prod._id, { isAvailable: !prod.isAvailable });
      onNotify(
        'success',
        `${prod.name} marked as ${!prod.isAvailable ? 'Available' : 'Paused'}.`
      );
      onRefreshMarketplace();
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleOrderStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await api.updateFarmerOrderStatus(orderId, nextStatus);
      onNotify('success', `Order updated to ${nextStatus}.`);
      onRefreshMarketplace();
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleUploadProductImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await api.uploadImage(String(reader.result), 'krishi_products');
        setProdImage(res.url);
        onNotify('success', 'Product photo uploaded.');
      } catch (err) {
        onNotify('error', (err as Error).message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateFarmerProfile({
        farmName: profFarmName,
        farmLocation: profLocation,
        district: profDistrict,
        cropTypes: profCrops
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        farmDescription: profDesc,
      });
      onNotify('success', 'Farm profile updated.');
      onRefreshMarketplace();
      await loadDashboard();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const maxEarnings = Math.max(1000, ...monthlyChart.map((m) => m.earnings));

  const sidebarItems: Array<{ id: FarmerTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'products', label: `My Products (${products.length})`, icon: Package },
    { id: 'add-product', label: 'Add New Product', icon: PlusCircle },
    { id: 'orders', label: `Manage Orders (${orders.length})`, icon: ClipboardList },
    { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
    { id: 'reviews', label: `Customer Reviews (${reviews.length})`, icon: Star },
    { id: 'profile', label: 'Farmer Profile', icon: User },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-[#1F2B23]/10 p-4 space-y-1 lg:sticky lg:top-24">
          <div className="px-3 py-3 mb-2 border-b border-[#1F2B23]/10">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#1F6B45]">
              Farmer Workspace
            </div>
            <div className="text-base font-bold text-[#1F2B23] mt-0.5 truncate">
              {farmer?.farmName || 'Loading...'}
            </div>
            <div className="text-xs text-[#1F2B23]/65 mt-0.5">
              Status:{' '}
              <span className="font-semibold capitalize text-[#1F6B45]">
                {farmer?.verificationStatus || 'pending'}
              </span>
            </div>
          </div>

          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'add-product' && tab !== 'add-product') resetProductForm();
                  setTab(item.id);
                }}
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50 mt-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </aside>

        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-10 text-center text-sm text-[#1F2B23]/65">
              Loading your farm workspace...
            </div>
          ) : (
            <>
              {farmer?.verificationStatus === 'pending' && (
                <div className="p-4 rounded-2xl bg-[#DFF0C8]/65 border border-[#1F6B45]/25 text-sm text-[#1F2B23]">
                  Your farm registration is currently <strong>pending admin verification</strong>.
                  You can prepare product listings and review orders while verification completes.
                </div>
              )}

              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Total Farm Sales</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#1F6B45] mt-1">
                        ₹{stats.totalSales.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Total Orders</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#1F2B23] mt-1">
                        {stats.totalOrders}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Available Products</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#1F2B23] mt-1">
                        {stats.availableProducts}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">November Earnings</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#E58B42] mt-1">
                        ₹{stats.monthlyEarnings.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-[#1F2B23]">
                        Recent Farm Orders
                      </h2>
                      <button
                        type="button"
                        onClick={() => setTab('orders')}
                        className="text-xs font-semibold text-[#1F6B45] hover:underline cursor-pointer"
                      >
                        Manage All Orders
                      </button>
                    </div>
                    {orders.length === 0 ? (
                      <p className="text-sm text-[#1F2B23]/65">No orders received yet.</p>
                    ) : (
                      <div className="divide-y divide-[#1F2B23]/10">
                        {orders.slice(0, 4).map((ord) => (
                          <div
                            key={ord._id}
                            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                          >
                            <div>
                              <span className="font-mono font-semibold text-[#1F6B45]">
                                {ord.orderNumber}
                              </span>{' '}
                              <span>· {ord.customerName}</span>
                              <div className="text-xs text-[#1F2B23]/65">
                                {ord.items.map((i) => `${i.productName} (${i.quantity} ${i.unit})`).join(', ')}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-semibold">{ord.status}</span>
                              <span className="font-mono font-semibold tabular-nums">
                                ₹{ord.farmerPayout}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'products' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold text-[#1F2B23]">My Products</h2>
                    <button
                      type="button"
                      onClick={() => {
                        resetProductForm();
                        setTab('add-product');
                      }}
                      className="px-4 py-2 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold cursor-pointer"
                    >
                      + Add New Product
                    </button>
                  </div>

                  {products.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <p className="text-sm text-[#1F2B23]/65">
                        You have not listed any produce yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTab('add-product')}
                        className="px-4 py-2 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold cursor-pointer"
                      >
                        List First Harvest
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-[#1F2B23]/10 text-xs text-[#1F2B23]/65">
                            <th className="py-3 pr-4">Product</th>
                            <th className="py-3 pr-4">Category</th>
                            <th className="py-3 pr-4 text-right">Price</th>
                            <th className="py-3 pr-4 text-right">Stock</th>
                            <th className="py-3 pr-4">Harvest Date</th>
                            <th className="py-3 pr-4">Status</th>
                            <th className="py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F2B23]/8">
                          {products.map((prod) => (
                            <tr key={prod._id} className="hover:bg-[#FBFAF5]">
                              <td className="py-3 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                    <ImageWithFallback
                                      src={prod.images[0]}
                                      alt={prod.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-[#1F2B23]">{prod.name}</div>
                                    <div className="text-xs text-[#1F2B23]/60">
                                      {prod.farmingMethod}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 pr-4 text-xs">{prod.categoryName}</td>
                              <td className="py-3 pr-4 text-right font-mono tabular-nums">
                                ₹{prod.pricePerUnit}/{prod.unit}
                              </td>
                              <td className="py-3 pr-4 text-right font-mono tabular-nums">
                                {prod.availableQuantity} {prod.unit}
                              </td>
                              <td className="py-3 pr-4 font-mono text-xs tabular-nums">
                                {prod.harvestDate}
                              </td>
                              <td className="py-3 pr-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAvailability(prod)}
                                  className={`text-xs font-semibold cursor-pointer ${
                                    prod.isAvailable ? 'text-[#1F6B45]' : 'text-[#E58B42]'
                                  }`}
                                >
                                  {prod.isAvailable ? 'Available' : 'Paused'}
                                </button>
                              </td>
                              <td className="py-3 text-right">
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditProduct(prod)}
                                    className="p-1.5 text-[#1F2B23]/70 hover:text-[#1F6B45] cursor-pointer"
                                    aria-label={`Edit ${prod.name}`}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(prod._id)}
                                    className="p-1.5 text-[#1F2B23]/70 hover:text-red-600 cursor-pointer"
                                    aria-label={`Delete ${prod.name}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'add-product' && (
                <form
                  onSubmit={handleSaveProduct}
                  className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-5"
                >
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    {editingProductId ? 'Edit Product Listing' : 'Add New Harvest Listing'}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Product Name</label>
                      <input
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="e.g. Heirloom Nati Tomatoes"
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Category</label>
                      <select
                        value={prodCategoryId}
                        onChange={(e) => setProdCategoryId(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Price per Unit (₹)
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Available Quantity
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={prodQty}
                        onChange={(e) => setProdQty(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Unit</label>
                      <select
                        value={prodUnit}
                        onChange={(e) => setProdUnit(e.target.value as ProductUnit)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                      >
                        <option value="kg">kg</option>
                        <option value="gram">gram</option>
                        <option value="litre">litre</option>
                        <option value="dozen">dozen</option>
                        <option value="packet">packet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Cultivation Method
                      </label>
                      <select
                        value={prodMethod}
                        onChange={(e) => setProdMethod(e.target.value as FarmingMethod)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                      >
                        <option value="Organic">Organic</option>
                        <option value="Conventional">Conventional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">Harvest Date</label>
                      <input
                        type="date"
                        required
                        value={prodHarvestDate}
                        onChange={(e) => setProdHarvestDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5">
                        Availability Status
                      </label>
                      <select
                        value={prodAvailable ? 'yes' : 'no'}
                        onChange={(e) => setProdAvailable(e.target.value === 'yes')}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                      >
                        <option value="yes">Available for Order</option>
                        <option value="no">Paused / Out of Season</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Product Image (Upload via Cloudinary or Choose Farm Studio Photo)
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={prodImage}
                        onChange={(e) => setProdImage(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                      >
                        {SAMPLE_PRODUCE_IMAGES.map((img) => (
                          <option key={img.url} value={img.url}>
                            {img.label}
                          </option>
                        ))}
                      </select>
                      <label className="h-10 px-4 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer hover:border-[#1F6B45]">
                        <Upload className="w-4 h-4 text-[#1F6B45]" />
                        <span>Upload Custom Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadProductImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5">
                      Product Description
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Describe taste, harvesting method, and storage guidance..."
                      className="w-full p-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] cursor-pointer"
                    >
                      {editingProductId ? 'Update Listing' : 'Publish Product'}
                    </button>
                    {editingProductId && (
                      <button
                        type="button"
                        onClick={() => {
                          resetProductForm();
                          setTab('products');
                        }}
                        className="px-5 py-2.5 rounded-xl border border-[#1F2B23]/15 text-sm font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {tab === 'orders' && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    Manage Farm Orders
                  </h2>
                  {orders.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-10 text-center text-sm text-[#1F2B23]/65">
                      No customer orders yet.
                    </div>
                  ) : (
                    orders.map((ord) => (
                      <div
                        key={ord._id}
                        className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5 space-y-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1F2B23]/10">
                          <div>
                            <span className="font-mono font-bold text-sm text-[#1F6B45]">
                              {ord.orderNumber}
                            </span>
                            <span className="text-xs text-[#1F2B23]/70 ml-2">
                              · {ord.customerName} ({ord.customerPhone})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#1F2B23]/65">Farmer Payout:</span>
                            <span className="font-mono font-bold text-sm text-[#1F6B45] tabular-nums">
                              ₹{ord.farmerPayout}
                            </span>
                          </div>
                        </div>

                        <div className="text-sm space-y-1">
                          {ord.items.map((item) => (
                            <div key={item.productId} className="flex justify-between">
                              <span>
                                {item.productName} × {item.quantity} {item.unit}
                              </span>
                              <span className="font-mono tabular-nums">₹{item.subtotal}</span>
                            </div>
                          ))}
                          <div className="text-xs text-[#1F2B23]/65 pt-1">
                            Deliver to: {ord.deliveryAddress.street}, {ord.deliveryAddress.district} –{' '}
                            {ord.deliveryAddress.pincode} · Slot: {ord.deliverySlot}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <span className="text-xs font-semibold text-[#1F2B23]">
                            Current Status: {ord.status}
                          </span>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-[#1F2B23]/65">Update Status:</label>
                            <select
                              value={ord.status}
                              disabled={ord.status === 'Cancelled' || ord.status === 'Delivered'}
                              onChange={(e) =>
                                handleOrderStatusChange(ord._id, e.target.value as OrderStatus)
                              }
                              className="h-9 px-3 rounded-xl border border-[#1F2B23]/15 bg-[#FBFAF5] text-xs font-semibold"
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {tab === 'analytics' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                      Sales & Payout Analytics
                    </h2>
                    <p className="text-xs text-[#1F2B23]/65 mt-1">
                      Net farmer payout across recent monthly harvest cycles (INR).
                    </p>
                  </div>

                  <div className="grid grid-cols-6 gap-4 items-end h-56 pt-6 border-b border-[#1F2B23]/10 pb-2">
                    {monthlyChart.map((entry) => {
                      const heightPct = Math.max(8, Math.round((entry.earnings / maxEarnings) * 100));
                      return (
                        <div key={entry.month} className="flex flex-col items-center h-full justify-end gap-2">
                          <span className="text-[11px] font-mono tabular-nums text-[#1F2B23]/75">
                            ₹{entry.earnings}
                          </span>
                          <div
                            className="w-full max-w-[44px] rounded-t-lg bg-[#1F6B45] transition-all duration-300"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-xs font-semibold text-[#1F2B23]">{entry.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === 'reviews' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    Customer Reviews
                  </h2>
                  {reviews.length === 0 ? (
                    <p className="text-sm text-[#1F2B23]/65">No reviews yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <div
                          key={rev._id}
                          className="p-4 rounded-xl bg-[#FBFAF5] border border-[#1F2B23]/10 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span>
                              {rev.customerName} · {rev.productName}
                            </span>
                            <span className="text-[#E58B42] tabular-nums">{rev.rating}.0 ★</span>
                          </div>
                          <p className="text-sm text-[#1F2B23]/80">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'profile' && (
                <form
                  onSubmit={handleSaveProfile}
                  className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                      Farmer Profile
                    </h2>
                    {farmer?.verificationStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F6B45]">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified Farm
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Farm Name</label>
                      <input
                        type="text"
                        value={profFarmName}
                        onChange={(e) => setProfFarmName(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">District</label>
                      <input
                        type="text"
                        value={profDistrict}
                        onChange={(e) => setProfDistrict(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Farm Location</label>
                      <input
                        type="text"
                        value={profLocation}
                        onChange={(e) => setProfLocation(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">
                        Crop Types (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={profCrops}
                        onChange={(e) => setProfCrops(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Farm Description</label>
                      <textarea
                        rows={3}
                        value={profDesc}
                        onChange={(e) => setProfDesc(e.target.value)}
                        className="w-full p-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold cursor-pointer"
                  >
                    Save Farm Profile
                  </button>
                </form>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
