import {
  AlertTriangle,
  BarChart3,
  Check,
  Download,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Trash2,
  Users,
  Wheat,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type {
  Category,
  Complaint,
  ComplaintStatus,
  Customer,
  Farmer,
  Order,
  PlatformSettings,
  Product,
} from '../../types';

type AdminTab =
  | 'overview'
  | 'farmers'
  | 'customers'
  | 'categories'
  | 'products'
  | 'orders'
  | 'complaints'
  | 'settings';

interface AdminDashboardProps {
  onNotify: (type: 'success' | 'error', text: string) => void;
  onRefreshMarketplace: () => void;
}

export function AdminDashboard({ onNotify, onRefreshMarketplace }: AdminDashboardProps) {
  const { logout } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalFarmers: 0,
    verifiedFarmers: 0,
    pendingFarmers: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCommission: 0,
  });
  const [monthlySales, setMonthlySales] = useState<
    Array<{ month: string; revenue: number; orders: number }>
  >([]);
  const [orderStatusChart, setOrderStatusChart] = useState<
    Array<{ status: string; count: number }>
  >([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    commissionPercent: 6,
    deliveryFee: 35,
    freeDeliveryThreshold: 499,
  });

  // New Category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAdminAnalytics();
      setStats(data.stats);
      setMonthlySales(data.monthlySales);
      setOrderStatusChart(data.orderStatusChart);
      setFarmers(data.farmers);
      setCustomers(data.customers);
      setProducts(data.products);
      setOrders(data.orders);
      setCategories(data.categories);
      setComplaints(data.complaints);
      setSettings(data.settings);
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void loadAdmin();
  }, [loadAdmin]);

  const handleVerifyFarmer = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.verifyFarmer(
        id,
        status,
        status === 'rejected' ? 'Please update farm documentation.' : undefined
      );
      onNotify('success', `Farmer marked as ${status}.`);
      onRefreshMarketplace();
      await loadAdmin();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleToggleCustomer = async (userId: string, currentActive: boolean) => {
    try {
      await api.setCustomerActive(userId, !currentActive);
      onNotify('success', `Customer account ${!currentActive ? 'activated' : 'suspended'}.`);
      await loadAdmin();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createCategory({ name: newCatName, description: newCatDesc });
      setNewCatName('');
      setNewCatDesc('');
      onNotify('success', 'Product category created.');
      onRefreshMarketplace();
      await loadAdmin();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      onNotify('success', 'Category deleted.');
      onRefreshMarketplace();
      await loadAdmin();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleToggleProductFeatured = async (prod: Product) => {
    try {
      await api.adminUpdateProduct(prod._id, { isFeatured: !prod.isFeatured });
      onNotify('success', `Updated featured flag for ${prod.name}.`);
      onRefreshMarketplace();
      await loadAdmin();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.adminDeleteProduct(id);
      onNotify('success', 'Product removed.');
      onRefreshMarketplace();
      await loadAdmin();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleUpdateComplaint = async (id: string, status: ComplaintStatus, adminNotes?: string) => {
    try {
      await api.adminUpdateComplaint(id, { status, adminNotes });
      onNotify('success', `Complaint marked ${status}.`);
      await loadAdmin();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateAdminSettings(settings);
      onNotify('success', 'Platform commission and delivery rates updated.');
      onRefreshMarketplace();
    } catch (err) {
      onNotify('error', (err as Error).message);
    }
  };

  const handleDownloadCsv = () => {
    const header = 'OrderNumber,Customer,Farm,SubtotalINR,CommissionINR,TotalINR,Status,Date\n';
    const rows = orders
      .map(
        (o) =>
          `${o.orderNumber},"${o.customerName}","${o.farmName}",${o.subtotal},${o.platformCommission},${o.totalAmount},${o.status},${o.createdAt}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'krishi_market_sales_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxRev = Math.max(500, ...monthlySales.map((m) => m.revenue));
  const maxStatusCount = Math.max(1, ...orderStatusChart.map((s) => s.count));

  const sidebarItems: Array<{ id: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Analytics Overview', icon: LayoutDashboard },
    { id: 'farmers', label: `Farmers (${farmers.length})`, icon: Wheat },
    { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
    { id: 'categories', label: `Categories (${categories.length})`, icon: FolderTree },
    { id: 'products', label: `All Products (${products.length})`, icon: ShoppingBag },
    { id: 'orders', label: `Orders Monitor (${orders.length})`, icon: Package },
    { id: 'complaints', label: `Complaints (${complaints.length})`, icon: AlertTriangle },
    { id: 'settings', label: 'Commissions & Reports', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-3 bg-white rounded-2xl border border-[#1F2B23]/10 p-4 space-y-1 lg:sticky lg:top-24">
          <div className="px-3 py-3 mb-2 border-b border-[#1F2B23]/10">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#E58B42]">
              Admin Control
            </div>
            <div className="text-base font-bold text-[#1F2B23] mt-0.5">Krishi Market Ops</div>
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-700 hover:bg-red-50 mt-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout</span>
          </button>
        </aside>

        <main className="lg:col-span-9 space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-10 text-center text-sm text-[#1F2B23]/65">
              Loading platform analytics...
            </div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Total Farmers</div>
                      <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                        {stats.totalFarmers}
                      </div>
                      <div className="text-xs text-[#1F6B45] mt-1 tabular-nums">
                        {stats.verifiedFarmers} verified · {stats.pendingFarmers} pending
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Total Customers</div>
                      <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                        {stats.totalCustomers}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Total Products</div>
                      <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                        {stats.totalProducts}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Total Orders</div>
                      <div className="text-2xl font-bold font-mono tabular-nums mt-1">
                        {stats.totalOrders}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Gross Marketplace Revenue</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#1F6B45] mt-1">
                        ₹{stats.totalRevenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-5">
                      <div className="text-xs text-[#1F2B23]/65">Platform Commission</div>
                      <div className="text-2xl font-bold font-mono tabular-nums text-[#E58B42] mt-1">
                        ₹{stats.totalCommission.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                      <h2 className="text-base font-semibold text-[#1F2B23] flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#1F6B45]" />
                        <span>Monthly Sales Revenue (₹)</span>
                      </h2>
                      <div className="grid grid-cols-6 gap-3 items-end h-48 pt-4 border-b border-[#1F2B23]/10 pb-2">
                        {monthlySales.map((m) => {
                          const h = Math.max(8, Math.round((m.revenue / maxRev) * 100));
                          return (
                            <div key={m.month} className="flex flex-col items-center h-full justify-end gap-1.5">
                              <span className="text-[10px] font-mono tabular-nums text-[#1F2B23]/70">
                                ₹{m.revenue}
                              </span>
                              <div
                                className="w-full max-w-[32px] rounded-t-md bg-[#1F6B45]"
                                style={{ height: `${h}%` }}
                              />
                              <span className="text-xs font-medium">{m.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                      <h2 className="text-base font-semibold text-[#1F2B23]">
                        Order Status Distribution
                      </h2>
                      <div className="space-y-3">
                        {orderStatusChart.map((row) => (
                          <div key={row.status} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-[#1F2B23]">{row.status}</span>
                              <span className="font-mono tabular-nums text-[#1F2B23]/75">
                                {row.count}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[#FBFAF5] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#E58B42]"
                                style={{ width: `${Math.round((row.count / maxStatusCount) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'farmers' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    Partner Farmers & Verification
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#1F2B23]/10 text-xs text-[#1F2B23]/65">
                          <th className="py-3 pr-4">Farmer & Farm</th>
                          <th className="py-3 pr-4">District</th>
                          <th className="py-3 pr-4">Method</th>
                          <th className="py-3 pr-4">Status</th>
                          <th className="py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2B23]/8">
                        {farmers.map((f) => (
                          <tr key={f._id}>
                            <td className="py-3 pr-4">
                              <div className="font-semibold">{f.farmName}</div>
                              <div className="text-xs text-[#1F2B23]/65">
                                {f.fullName} · {f.phone}
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-xs">
                              {f.district}, {f.state}
                            </td>
                            <td className="py-3 pr-4 text-xs">{f.farmingMethod}</td>
                            <td className="py-3 pr-4 text-xs font-semibold capitalize">
                              {f.verificationStatus}
                            </td>
                            <td className="py-3 text-right space-x-2">
                              {f.verificationStatus !== 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyFarmer(f._id, 'approved')}
                                  className="px-3 py-1.5 rounded-lg bg-[#1F6B45] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}
                              {f.verificationStatus !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyFarmer(f._id, 'rejected')}
                                  className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'customers' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    Registered Customers
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#1F2B23]/10 text-xs text-[#1F2B23]/65">
                          <th className="py-3 pr-4">Customer</th>
                          <th className="py-3 pr-4">Phone</th>
                          <th className="py-3 pr-4">District</th>
                          <th className="py-3 pr-4">Account</th>
                          <th className="py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2B23]/8">
                        {customers.map((c) => (
                          <tr key={c._id}>
                            <td className="py-3 pr-4">
                              <div className="font-semibold">{c.fullName}</div>
                              <div className="text-xs text-[#1F2B23]/65">{c.email}</div>
                            </td>
                            <td className="py-3 pr-4 font-mono text-xs tabular-nums">{c.phone}</td>
                            <td className="py-3 pr-4 text-xs">{c.preferredDistrict || 'Bengaluru'}</td>
                            <td className="py-3 pr-4 text-xs font-semibold">
                              {c.isActive !== false ? 'Active' : 'Suspended'}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleCustomer(c.userId, c.isActive !== false)
                                }
                                className="px-3 py-1.5 rounded-lg border border-[#1F2B23]/15 text-xs font-semibold cursor-pointer"
                              >
                                {c.isActive !== false ? 'Suspend' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'categories' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-6">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    Product Categories
                  </h2>

                  <form onSubmit={handleCreateCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Category Name"
                      className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="Short description"
                      className="h-10 px-3 rounded-xl border border-[#1F2B23]/15 text-sm"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-xl bg-[#1F6B45] text-white text-xs font-semibold cursor-pointer"
                    >
                      + Add Category
                    </button>
                  </form>

                  <div className="divide-y divide-[#1F2B23]/10">
                    {categories.map((cat) => (
                      <div key={cat._id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">{cat.name}</div>
                          <div className="text-xs text-[#1F2B23]/65">{cat.description}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat._id)}
                          className="p-2 text-[#1F2B23]/60 hover:text-red-600 cursor-pointer"
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'products' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    Marketplace Products
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#1F2B23]/10 text-xs text-[#1F2B23]/65">
                          <th className="py-3 pr-4">Product</th>
                          <th className="py-3 pr-4">Farm</th>
                          <th className="py-3 pr-4 text-right">Price</th>
                          <th className="py-3 pr-4 text-right">Stock</th>
                          <th className="py-3 pr-4">Featured</th>
                          <th className="py-3 text-right">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2B23]/8">
                        {products.map((p) => (
                          <tr key={p._id}>
                            <td className="py-3 pr-4 font-semibold">{p.name}</td>
                            <td className="py-3 pr-4 text-xs">{p.farmName}</td>
                            <td className="py-3 pr-4 text-right font-mono tabular-nums">
                              ₹{p.pricePerUnit}/{p.unit}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono tabular-nums">
                              {p.availableQuantity}
                            </td>
                            <td className="py-3 pr-4">
                              <button
                                type="button"
                                onClick={() => handleToggleProductFeatured(p)}
                                className="text-xs font-semibold text-[#1F6B45] hover:underline cursor-pointer"
                              >
                                {p.isFeatured ? 'Featured' : 'Standard'}
                              </button>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p._id)}
                                className="p-1.5 text-red-600 cursor-pointer"
                                aria-label={`Delete ${p.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'orders' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    All Platform Orders
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-[#1F2B23]/10 text-xs text-[#1F2B23]/65">
                          <th className="py-3 pr-4">Order</th>
                          <th className="py-3 pr-4">Customer</th>
                          <th className="py-3 pr-4">Farm</th>
                          <th className="py-3 pr-4 text-right">Total</th>
                          <th className="py-3 pr-4 text-right">Commission</th>
                          <th className="py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F2B23]/8">
                        {orders.map((o) => (
                          <tr key={o._id}>
                            <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#1F6B45]">
                              {o.orderNumber}
                            </td>
                            <td className="py-3 pr-4 text-xs">{o.customerName}</td>
                            <td className="py-3 pr-4 text-xs">{o.farmName}</td>
                            <td className="py-3 pr-4 text-right font-mono tabular-nums">
                              ₹{o.totalAmount}
                            </td>
                            <td className="py-3 pr-4 text-right font-mono tabular-nums">
                              ₹{o.platformCommission}
                            </td>
                            <td className="py-3 text-xs font-semibold">{o.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {tab === 'complaints' && (
                <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4">
                  <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                    Complaints & Disputes
                  </h2>
                  {complaints.length === 0 ? (
                    <p className="text-sm text-[#1F2B23]/65">No complaints logged.</p>
                  ) : (
                    <div className="space-y-3">
                      {complaints.map((c) => (
                        <div
                          key={c._id}
                          className="p-4 rounded-xl bg-[#FBFAF5] border border-[#1F2B23]/10 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#1F2B23]">
                              {c.subject} {c.orderNumber ? `(${c.orderNumber})` : ''}
                            </span>
                            <span className="font-semibold text-[#E58B42]">{c.status}</span>
                          </div>
                          <p className="text-xs text-[#1F2B23]/75">{c.description}</p>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[11px] text-[#1F2B23]/60">
                              Raised by {c.raisedByName} ({c.raisedByRole})
                            </span>
                            <select
                              value={c.status}
                              onChange={(e) =>
                                handleUpdateComplaint(c._id, e.target.value as ComplaintStatus)
                              }
                              className="h-8 px-2.5 rounded-lg border border-[#1F2B23]/15 bg-white text-xs"
                            >
                              <option value="Open">Open</option>
                              <option value="Investigating">Investigating</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'settings' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleSaveSettings}
                    className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 space-y-4"
                  >
                    <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                      Platform Commissions & Logistics Rates
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Commission Rate (%)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={settings.commissionPercent}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              commissionPercent: Number(e.target.value),
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Standard Delivery Fee (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={settings.deliveryFee}
                          onChange={(e) =>
                            setSettings({ ...settings, deliveryFee: Number(e.target.value) })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">
                          Free Delivery Threshold (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={settings.freeDeliveryThreshold}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              freeDeliveryThreshold: Number(e.target.value),
                            })
                          }
                          className="w-full h-10 px-3 rounded-xl border border-[#1F2B23]/15 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold cursor-pointer"
                    >
                      Save Commission Settings
                    </button>
                  </form>

                  <div className="bg-white rounded-2xl border border-[#1F2B23]/10 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-[#1F2B23]">
                        Export Sales & Commission Report
                      </h3>
                      <p className="text-xs text-[#1F2B23]/65 mt-0.5">
                        Download complete order ledger in CSV format for accounting.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      className="px-4 py-2.5 rounded-xl border border-[#1F6B45] text-[#1F6B45] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#DFF0C8]/40 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
