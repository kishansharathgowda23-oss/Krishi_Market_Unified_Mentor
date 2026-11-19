import type {
  Address,
  AuthUser,
  Category,
  Complaint,
  ComplaintStatus,
  Customer,
  DeliveryAddress,
  Farmer,
  FarmerVerificationStatus,
  NotificationItem,
  Order,
  OrderStatus,
  PlatformSettings,
  Product,
  Review,
} from '../types';

const TOKEN_KEY = 'krishi_market_jwt';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: AuthUser; profile: Farmer | Customer | null }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerCustomer: (payload: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    preferredDistrict?: string;
  }) =>
    request<{ token: string; user: AuthUser; profile: Customer }>('/auth/register/customer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerFarmer: (payload: {
    fullName: string;
    phone: string;
    email: string;
    password: string;
    farmName: string;
    farmLocation: string;
    district: string;
    state: string;
    cropTypes: string;
    farmingMethod: string;
    farmDescription: string;
    profileImage?: string;
  }) =>
    request<{ token: string; user: AuthUser; profile: Farmer }>('/auth/register/farmer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request<{ user: AuthUser; profile: Farmer | Customer | null }>('/auth/me'),

  // Marketplace
  getCategories: () => request<Category[]>('/categories'),

  getProducts: (params?: Record<string, string | number | undefined>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'All') {
          query.set(k, String(v));
        }
      });
    }
    const qs = query.toString();
    return request<Product[]>(`/products${qs ? `?${qs}` : ''}`);
  },

  getProductDetail: (id: string) =>
    request<{ product: Product; farmer: Farmer | null; reviews: Review[] }>(`/products/${id}`),

  getFarmers: () => request<Farmer[]>('/farmers'),

  getFarmerDetail: (id: string) =>
    request<{ farmer: Farmer; products: Product[]; reviews: Review[] }>(`/farmers/${id}`),

  getReviews: (params?: { productId?: string; farmerId?: string }) => {
    const query = new URLSearchParams();
    if (params?.productId) query.set('productId', params.productId);
    if (params?.farmerId) query.set('farmerId', params.farmerId);
    const qs = query.toString();
    return request<Review[]>(`/reviews${qs ? `?${qs}` : ''}`);
  },

  getPublicSettings: () => request<PlatformSettings>('/settings/public'),

  uploadImage: (imageData: string, folder?: string) =>
    request<{ url: string; provider: string }>('/upload', {
      method: 'POST',
      body: JSON.stringify({ imageData, folder }),
    }),

  // Farmer
  getFarmerDashboard: () =>
    request<{
      farmer: Farmer;
      stats: {
        totalSales: number;
        totalOrders: number;
        availableProducts: number;
        monthlyEarnings: number;
      };
      monthlyChart: Array<{ month: string; earnings: number }>;
      products: Product[];
      orders: Order[];
      reviews: Review[];
    }>('/farmer/dashboard'),

  createFarmerProduct: (payload: Partial<Product>) =>
    request<Product>('/farmer/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateFarmerProduct: (id: string, payload: Partial<Product>) =>
    request<Product>(`/farmer/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteFarmerProduct: (id: string) =>
    request<{ deleted: boolean }>(`/farmer/products/${id}`, { method: 'DELETE' }),

  updateFarmerOrderStatus: (orderId: string, status: OrderStatus, note?: string) =>
    request<Order>(`/farmer/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

  updateFarmerProfile: (payload: Partial<Farmer>) =>
    request<Farmer>('/farmer/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Customer
  getCustomerDashboard: () =>
    request<{
      customer: Customer;
      orders: Order[];
      addresses: Address[];
      wishlist: Product[];
      reviews: Review[];
    }>('/customer/dashboard'),

  updateCustomerProfile: (payload: Partial<Customer>) =>
    request<Customer>('/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  toggleWishlist: (productId: string) =>
    request<{ wishlistProductIds: string[]; added: boolean }>(`/customer/wishlist/${productId}`, {
      method: 'POST',
    }),

  getAddresses: () => request<Address[]>('/addresses'),

  createAddress: (payload: Omit<Address, '_id' | 'customerId'>) =>
    request<Address>('/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteAddress: (id: string) =>
    request<{ deleted: boolean }>(`/addresses/${id}`, { method: 'DELETE' }),

  placeOrder: (payload: {
    items: Array<{ productId: string; quantity: number }>;
    deliveryAddress: DeliveryAddress;
    deliverySlot: string;
    paymentMethod: 'Cash on Delivery' | 'UPI on Delivery';
  }) =>
    request<{ orders: Order[] }>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  confirmDelivery: (orderId: string) =>
    request<Order>(`/orders/${orderId}/confirm-delivery`, { method: 'PATCH' }),

  cancelOrder: (orderId: string) =>
    request<Order>(`/orders/${orderId}/cancel`, { method: 'PATCH' }),

  submitReview: (payload: {
    orderId: string;
    productId: string;
    rating: number;
    farmerRating: number;
    comment: string;
  }) =>
    request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  createComplaint: (payload: {
    orderId?: string;
    orderNumber?: string;
    subject: string;
    description: string;
  }) =>
    request<Complaint>('/complaints', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyComplaints: () => request<Complaint[]>('/complaints/my'),

  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: string) =>
    request<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Admin
  getAdminAnalytics: () =>
    request<{
      stats: {
        totalFarmers: number;
        verifiedFarmers: number;
        pendingFarmers: number;
        totalCustomers: number;
        totalProducts: number;
        totalOrders: number;
        totalRevenue: number;
        totalCommission: number;
      };
      monthlySales: Array<{ month: string; revenue: number; orders: number }>;
      orderStatusChart: Array<{ status: string; count: number }>;
      farmers: Farmer[];
      customers: Customer[];
      products: Product[];
      orders: Order[];
      categories: Category[];
      complaints: Complaint[];
      settings: PlatformSettings;
    }>('/admin/analytics'),

  verifyFarmer: (farmerId: string, status: FarmerVerificationStatus, rejectionReason?: string) =>
    request<Farmer>(`/admin/farmers/${farmerId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    }),

  setCustomerActive: (userId: string, isActive: boolean) =>
    request<{ userId: string; isActive: boolean }>(`/admin/customers/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),

  createCategory: (payload: { name: string; description: string; imageUrl?: string }) =>
    request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCategory: (id: string, payload: Partial<Category>) =>
    request<Category>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCategory: (id: string) =>
    request<{ deleted: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' }),

  adminUpdateProduct: (id: string, payload: Partial<Product>) =>
    request<Product>(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  adminDeleteProduct: (id: string) =>
    request<{ deleted: boolean }>(`/admin/products/${id}`, { method: 'DELETE' }),

  adminUpdateComplaint: (id: string, payload: { status?: ComplaintStatus; adminNotes?: string }) =>
    request<Complaint>(`/admin/complaints/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateAdminSettings: (payload: PlatformSettings) =>
    request<PlatformSettings>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};
