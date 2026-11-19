import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['farmer', 'customer', 'admin'], required: true },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const farmerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    farmName: { type: String, required: true },
    farmLocation: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    cropTypes: [{ type: String }],
    farmingMethod: { type: String, enum: ['Organic', 'Conventional'], required: true },
    farmDescription: { type: String, required: true },
    profileImage: { type: String, required: true },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const customerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    preferredDistrict: { type: String },
    wishlistProductIds: [{ type: String }],
  },
  { timestamps: true }
);

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const productSchema = new Schema(
  {
    farmerId: { type: String, required: true, index: true },
    farmerName: { type: String, required: true },
    farmName: { type: String, required: true },
    farmLocation: { type: String, required: true },
    district: { type: String, required: true, index: true },
    state: { type: String, required: true },
    categoryId: { type: String, required: true, index: true },
    categoryName: { type: String, required: true },
    name: { type: String, required: true, index: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    pricePerUnit: { type: Number, required: true, min: 1 },
    availableQuantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['kg', 'gram', 'litre', 'dozen', 'packet'], required: true },
    farmingMethod: { type: String, enum: ['Organic', 'Conventional'], required: true },
    harvestDate: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 4.8 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    farmerId: { type: String, required: true, index: true },
    farmName: { type: String, required: true },
    items: [
      {
        productId: String,
        productName: String,
        productImage: String,
        farmerId: String,
        farmName: String,
        quantity: Number,
        unit: String,
        pricePerUnit: Number,
        subtotal: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    platformCommission: { type: Number, required: true },
    farmerPayout: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    deliveryAddress: {
      fullName: String,
      phone: String,
      street: String,
      landmark: String,
      district: String,
      state: String,
      pincode: String,
    },
    deliverySlot: { type: String, required: true },
    paymentMethod: { type: String, enum: ['Cash on Delivery', 'UPI on Delivery'], required: true },
    status: {
      type: String,
      enum: [
        'New Order',
        'Accepted',
        'Processing',
        'Ready for Pickup',
        'Shipped',
        'Delivered',
        'Cancelled',
      ],
      default: 'New Order',
    },
    customerConfirmedDelivery: { type: Boolean, default: false },
    timeline: [
      {
        status: String,
        timestamp: String,
        note: String,
      },
    ],
  },
  { timestamps: true }
);

const reviewSchema = new Schema(
  {
    orderId: { type: String, required: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    farmerId: { type: String, required: true, index: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    farmerRating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const addressSchema = new Schema(
  {
    customerId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    landmark: { type: String },
    district: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const notificationSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['order', 'verification', 'review', 'system'], default: 'system' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const complaintSchema = new Schema(
  {
    orderId: { type: String },
    orderNumber: { type: String },
    raisedByUserId: { type: String, required: true },
    raisedByName: { type: String, required: true },
    raisedByRole: { type: String, enum: ['farmer', 'customer', 'admin'], required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['Open', 'Investigating', 'Resolved', 'Closed'],
      default: 'Open',
    },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

const platformSettingsSchema = new Schema(
  {
    commissionPercent: { type: Number, default: 6 },
    deliveryFee: { type: Number, default: 35 },
    freeDeliveryThreshold: { type: Number, default: 499 },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const FarmerModel = mongoose.models.Farmer || mongoose.model('Farmer', farmerSchema);
export const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
export const CategoryModel = mongoose.models.Category || mongoose.model('Category', categorySchema);
export const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);
export const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export const AddressModel = mongoose.models.Address || mongoose.model('Address', addressSchema);
export const NotificationModel =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const ComplaintModel =
  mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
export const PlatformSettingsModel =
  mongoose.models.PlatformSettings || mongoose.model('PlatformSettings', platformSettingsSchema);
