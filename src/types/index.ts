export type UserRole = 'farmer' | 'customer' | 'admin';
export type FarmingMethod = 'Organic' | 'Conventional';
export type ProductUnit = 'kg' | 'gram' | 'litre' | 'dozen' | 'packet';
export type FarmerVerificationStatus = 'pending' | 'approved' | 'rejected';
export type OrderStatus =
  | 'New Order'
  | 'Accepted'
  | 'Processing'
  | 'Ready for Pickup'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type ComplaintStatus = 'Open' | 'Investigating' | 'Resolved' | 'Closed';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Farmer {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  farmName: string;
  farmLocation: string;
  district: string;
  state: string;
  cropTypes: string[];
  farmingMethod: FarmingMethod;
  farmDescription: string;
  profileImage: string;
  verificationStatus: FarmerVerificationStatus;
  rejectionReason?: string;
  rating: number;
  reviewCount: number;
  totalEarnings: number;
  createdAt: string;
}

export interface Customer {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  preferredDistrict?: string;
  wishlistProductIds: string[];
  isActive?: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
}

export interface Product {
  _id: string;
  farmerId: string;
  farmerName: string;
  farmName: string;
  farmLocation: string;
  district: string;
  state: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  images: string[];
  pricePerUnit: number;
  availableQuantity: number;
  unit: ProductUnit;
  farmingMethod: FarmingMethod;
  harvestDate: string;
  isAvailable: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  farmerId: string;
  farmName: string;
  quantity: number;
  unit: ProductUnit;
  pricePerUnit: number;
  subtotal: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  landmark?: string;
  district: string;
  state: string;
  pincode: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  farmerId: string;
  farmName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  commissionRate: number;
  platformCommission: number;
  farmerPayout: number;
  totalAmount: number;
  deliveryAddress: DeliveryAddress;
  deliverySlot: string;
  paymentMethod: 'Cash on Delivery' | 'UPI on Delivery';
  status: OrderStatus;
  customerConfirmedDelivery: boolean;
  timeline: OrderTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  customerId: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  landmark?: string;
  district: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Review {
  _id: string;
  orderId: string;
  productId: string;
  productName: string;
  farmerId: string;
  customerId: string;
  customerName: string;
  rating: number;
  farmerRating: number;
  comment: string;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'verification' | 'review' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface Complaint {
  _id: string;
  orderId?: string;
  orderNumber?: string;
  raisedByUserId: string;
  raisedByName: string;
  raisedByRole: UserRole;
  subject: string;
  description: string;
  status: ComplaintStatus;
  adminNotes?: string;
  createdAt: string;
}

export interface PlatformSettings {
  commissionPercent: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
}

export type ActiveRoute =
  | 'home'
  | 'shop'
  | 'categories'
  | 'farmers'
  | 'about'
  | 'auth'
  | 'dashboard';
