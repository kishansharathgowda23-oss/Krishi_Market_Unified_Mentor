import {
  AddressModel,
  CategoryModel,
  ComplaintModel,
  CustomerModel,
  FarmerModel,
  NotificationModel,
  OrderModel,
  PlatformSettingsModel,
  ProductModel,
  ReviewModel,
  UserModel,
} from '../models/mongooseModels.ts';
import type {
  AddressRecord,
  CategoryRecord,
  ComplaintRecord,
  ComplaintStatus,
  CustomerRecord,
  FarmerRecord,
  FarmerVerificationStatus,
  NotificationRecord,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
  PlatformSettingsRecord,
  ProductRecord,
  ReviewRecord,
  UserRecord,
  UserRole,
} from '../types.ts';
import { db, getLocalStore, isMongoMode, makeId, persistLocalStore } from './store.ts';

const DEFAULT_AVATAR_FARMER = '/src/assets/images/farmer_portrait_ramesh_1795104333655.jpg';

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.trim().toLowerCase();
  if (isMongoMode()) {
    const doc = await UserModel.findOne({ email: normalized });
    return doc ? db.serializeDoc<UserRecord>(doc) : null;
  }
  return getLocalStore().users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (isMongoMode()) {
    const doc = await UserModel.findById(id);
    return doc ? db.serializeDoc<UserRecord>(doc) : null;
  }
  return getLocalStore().users.find((u) => u._id === id) || null;
}

export async function createUser(data: Omit<UserRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<UserRecord> {
  const now = new Date().toISOString();
  if (isMongoMode()) {
    const doc = await UserModel.create(data);
    return db.serializeDoc<UserRecord>(doc);
  }
  const user: UserRecord = { ...data, _id: makeId('usr'), createdAt: now, updatedAt: now };
  getLocalStore().users.push(user);
  persistLocalStore();
  return user;
}

export async function updateUserActive(userId: string, isActive: boolean): Promise<UserRecord | null> {
  if (isMongoMode()) {
    const doc = await UserModel.findByIdAndUpdate(userId, { isActive }, { new: true });
    return doc ? db.serializeDoc<UserRecord>(doc) : null;
  }
  const user = getLocalStore().users.find((u) => u._id === userId);
  if (!user) return null;
  user.isActive = isActive;
  user.updatedAt = new Date().toISOString();
  persistLocalStore();
  return user;
}

export async function findFarmerByUserId(userId: string): Promise<FarmerRecord | null> {
  if (isMongoMode()) {
    const doc = await FarmerModel.findOne({ userId });
    return doc ? db.serializeDoc<FarmerRecord>(doc) : null;
  }
  return getLocalStore().farmers.find((f) => f.userId === userId) || null;
}

export async function findFarmerById(id: string): Promise<FarmerRecord | null> {
  if (isMongoMode()) {
    const doc = await FarmerModel.findById(id);
    return doc ? db.serializeDoc<FarmerRecord>(doc) : null;
  }
  return getLocalStore().farmers.find((f) => f._id === id) || null;
}

export async function listFarmers(includeAll = false): Promise<FarmerRecord[]> {
  if (isMongoMode()) {
    const query = includeAll ? {} : { verificationStatus: 'approved' };
    const docs = await FarmerModel.find(query).sort({ createdAt: -1 });
    return docs.map((d) => db.serializeDoc<FarmerRecord>(d));
  }
  const list = getLocalStore().farmers;
  return includeAll ? [...list] : list.filter((f) => f.verificationStatus === 'approved');
}

export async function createFarmer(
  data: Omit<FarmerRecord, '_id' | 'createdAt' | 'updatedAt' | 'rating' | 'reviewCount' | 'totalEarnings'>
): Promise<FarmerRecord> {
  const now = new Date().toISOString();
  const payload = {
    ...data,
    profileImage: data.profileImage || DEFAULT_AVATAR_FARMER,
    rating: 5.0,
    reviewCount: 0,
    totalEarnings: 0,
  };
  if (isMongoMode()) {
    const doc = await FarmerModel.create(payload);
    return db.serializeDoc<FarmerRecord>(doc);
  }
  const farmer: FarmerRecord = { ...payload, _id: makeId('frm'), createdAt: now, updatedAt: now };
  getLocalStore().farmers.push(farmer);
  persistLocalStore();
  return farmer;
}

export async function updateFarmerProfile(
  farmerId: string,
  updates: Partial<FarmerRecord>
): Promise<FarmerRecord | null> {
  if (isMongoMode()) {
    const doc = await FarmerModel.findByIdAndUpdate(farmerId, updates, { new: true });
    return doc ? db.serializeDoc<FarmerRecord>(doc) : null;
  }
  const farmer = getLocalStore().farmers.find((f) => f._id === farmerId);
  if (!farmer) return null;
  Object.assign(farmer, updates, { updatedAt: new Date().toISOString() });
  // Sync farm details to products belonging to this farmer
  if (updates.farmName || updates.farmLocation || updates.district || updates.state || updates.fullName) {
    for (const prod of getLocalStore().products) {
      if (prod.farmerId === farmerId) {
        prod.farmerName = farmer.fullName;
        prod.farmName = farmer.farmName;
        prod.farmLocation = farmer.farmLocation;
        prod.district = farmer.district;
        prod.state = farmer.state;
      }
    }
  }
  persistLocalStore();
  return farmer;
}

export async function verifyFarmer(
  farmerId: string,
  status: FarmerVerificationStatus,
  rejectionReason?: string
): Promise<FarmerRecord | null> {
  const updated = await updateFarmerProfile(farmerId, {
    verificationStatus: status,
    rejectionReason: status === 'rejected' ? rejectionReason : undefined,
  });
  if (updated) {
    await createNotification({
      userId: updated.userId,
      title:
        status === 'approved'
          ? 'Farm Verification Approved'
          : status === 'rejected'
          ? 'Farm Verification Needs Attention'
          : 'Verification Status Updated',
      message:
        status === 'approved'
          ? `${updated.farmName} is now verified on Krishi Market. Your products are live to customers.`
          : `Verification status: ${status}${rejectionReason ? ` — ${rejectionReason}` : ''}`,
      type: 'verification',
    });
  }
  return updated;
}

export async function findCustomerByUserId(userId: string): Promise<CustomerRecord | null> {
  if (isMongoMode()) {
    const doc = await CustomerModel.findOne({ userId });
    return doc ? db.serializeDoc<CustomerRecord>(doc) : null;
  }
  return getLocalStore().customers.find((c) => c.userId === userId) || null;
}

export async function createCustomer(
  data: Omit<CustomerRecord, '_id' | 'createdAt' | 'updatedAt' | 'wishlistProductIds'>
): Promise<CustomerRecord> {
  const now = new Date().toISOString();
  if (isMongoMode()) {
    const doc = await CustomerModel.create({ ...data, wishlistProductIds: [] });
    return db.serializeDoc<CustomerRecord>(doc);
  }
  const customer: CustomerRecord = {
    ...data,
    wishlistProductIds: [],
    _id: makeId('cust'),
    createdAt: now,
    updatedAt: now,
  };
  getLocalStore().customers.push(customer);
  persistLocalStore();
  return customer;
}

export async function updateCustomerProfile(
  userId: string,
  updates: Partial<CustomerRecord>
): Promise<CustomerRecord | null> {
  if (isMongoMode()) {
    const doc = await CustomerModel.findOneAndUpdate({ userId }, updates, { new: true });
    return doc ? db.serializeDoc<CustomerRecord>(doc) : null;
  }
  const customer = getLocalStore().customers.find((c) => c.userId === userId);
  if (!customer) return null;
  Object.assign(customer, updates, { updatedAt: new Date().toISOString() });
  persistLocalStore();
  return customer;
}

export async function listCustomersWithStatus(): Promise<Array<CustomerRecord & { isActive: boolean }>> {
  if (isMongoMode()) {
    const [customers, users] = await Promise.all([
      CustomerModel.find().sort({ createdAt: -1 }),
      UserModel.find({ role: 'customer' }),
    ]);
    const activeMap = new Map(users.map((u) => [String(u._id), Boolean(u.isActive)]));
    return customers.map((c) => {
      const serialized = db.serializeDoc<CustomerRecord>(c);
      return { ...serialized, isActive: activeMap.get(String(serialized.userId)) ?? true };
    });
  }
  const store = getLocalStore();
  return store.customers.map((c) => {
    const user = store.users.find((u) => u._id === c.userId);
    return { ...c, isActive: user?.isActive ?? true };
  });
}

export async function listCategories(onlyActive = true): Promise<CategoryRecord[]> {
  if (isMongoMode()) {
    const query = onlyActive ? { isActive: true } : {};
    const docs = await CategoryModel.find(query).sort({ name: 1 });
    return docs.map((d) => db.serializeDoc<CategoryRecord>(d));
  }
  const list = getLocalStore().categories;
  return onlyActive ? list.filter((c) => c.isActive) : [...list];
}

export async function createCategory(data: {
  name: string;
  description: string;
  imageUrl?: string;
}): Promise<CategoryRecord> {
  const now = new Date().toISOString();
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const payload = {
    name: data.name.trim(),
    slug,
    description: data.description.trim(),
    imageUrl: data.imageUrl || '/src/assets/images/cat_vegetables_1795104333947.jpg',
    isActive: true,
  };
  if (isMongoMode()) {
    const doc = await CategoryModel.create(payload);
    return db.serializeDoc<CategoryRecord>(doc);
  }
  const cat: CategoryRecord = { ...payload, _id: makeId('cat'), createdAt: now, updatedAt: now };
  getLocalStore().categories.push(cat);
  persistLocalStore();
  return cat;
}

export async function updateCategory(id: string, updates: Partial<CategoryRecord>): Promise<CategoryRecord | null> {
  if (isMongoMode()) {
    const doc = await CategoryModel.findByIdAndUpdate(id, updates, { new: true });
    return doc ? db.serializeDoc<CategoryRecord>(doc) : null;
  }
  const cat = getLocalStore().categories.find((c) => c._id === id);
  if (!cat) return null;
  Object.assign(cat, updates, { updatedAt: new Date().toISOString() });
  persistLocalStore();
  return cat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isMongoMode()) {
    const res = await CategoryModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getLocalStore();
  const idx = store.categories.findIndex((c) => c._id === id);
  if (idx === -1) return false;
  store.categories.splice(idx, 1);
  persistLocalStore();
  return true;
}

export async function listProducts(filters?: {
  category?: string;
  search?: string;
  district?: string;
  method?: string;
  minPrice?: number;
  maxPrice?: number;
  farmerId?: string;
  sort?: string;
  includeUnavailable?: boolean;
}): Promise<ProductRecord[]> {
  let items: ProductRecord[];
  if (isMongoMode()) {
    const docs = await ProductModel.find();
    items = docs.map((d) => db.serializeDoc<ProductRecord>(d));
  } else {
    items = [...getLocalStore().products];
  }

  if (!filters?.includeUnavailable) {
    items = items.filter((p) => p.isAvailable);
  }
  if (filters?.farmerId) {
    items = items.filter((p) => p.farmerId === filters.farmerId);
  }
  if (filters?.category && filters.category !== 'All') {
    const catLower = filters.category.toLowerCase();
    items = items.filter(
      (p) => p.categoryName.toLowerCase() === catLower || p.categoryId === filters.category
    );
  }
  if (filters?.district && filters.district !== 'All') {
    items = items.filter((p) => p.district.toLowerCase() === filters.district!.toLowerCase());
  }
  if (filters?.method && filters.method !== 'All') {
    items = items.filter((p) => p.farmingMethod.toLowerCase() === filters.method!.toLowerCase());
  }
  if (typeof filters?.minPrice === 'number' && !Number.isNaN(filters.minPrice)) {
    items = items.filter((p) => p.pricePerUnit >= filters.minPrice!);
  }
  if (typeof filters?.maxPrice === 'number' && !Number.isNaN(filters.maxPrice)) {
    items = items.filter((p) => p.pricePerUnit <= filters.maxPrice!);
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.farmerName.toLowerCase().includes(q) ||
        p.farmName.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q)
    );
  }

  switch (filters?.sort) {
    case 'price_asc':
      items.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      break;
    case 'price_desc':
      items.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
      break;
    case 'rating':
      items.sort((a, b) => b.rating - a.rating);
      break;
    case 'newest':
      items.sort((a, b) => b.harvestDate.localeCompare(a.harvestDate));
      break;
    default:
      items.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.soldCount - a.soldCount);
      break;
  }

  return items;
}

export async function findProductById(id: string): Promise<ProductRecord | null> {
  if (isMongoMode()) {
    const doc = await ProductModel.findById(id);
    return doc ? db.serializeDoc<ProductRecord>(doc) : null;
  }
  return getLocalStore().products.find((p) => p._id === id) || null;
}

export async function createProduct(
  data: Omit<ProductRecord, '_id' | 'rating' | 'reviewCount' | 'soldCount' | 'createdAt' | 'updatedAt'>
): Promise<ProductRecord> {
  const now = new Date().toISOString();
  const payload = {
    ...data,
    rating: 5.0,
    reviewCount: 0,
    soldCount: 0,
  };
  if (isMongoMode()) {
    const doc = await ProductModel.create(payload);
    return db.serializeDoc<ProductRecord>(doc);
  }
  const prod: ProductRecord = { ...payload, _id: makeId('prod'), createdAt: now, updatedAt: now };
  getLocalStore().products.unshift(prod);
  persistLocalStore();
  return prod;
}

export async function updateProduct(id: string, updates: Partial<ProductRecord>): Promise<ProductRecord | null> {
  if (isMongoMode()) {
    const doc = await ProductModel.findByIdAndUpdate(id, updates, { new: true });
    return doc ? db.serializeDoc<ProductRecord>(doc) : null;
  }
  const prod = getLocalStore().products.find((p) => p._id === id);
  if (!prod) return null;
  Object.assign(prod, updates, { updatedAt: new Date().toISOString() });
  persistLocalStore();
  return prod;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (isMongoMode()) {
    const res = await ProductModel.findByIdAndDelete(id);
    return Boolean(res);
  }
  const store = getLocalStore();
  const idx = store.products.findIndex((p) => p._id === id);
  if (idx === -1) return false;
  store.products.splice(idx, 1);
  persistLocalStore();
  return true;
}

export async function listAddressesByCustomer(customerId: string): Promise<AddressRecord[]> {
  if (isMongoMode()) {
    const docs = await AddressModel.find({ customerId }).sort({ isDefault: -1, createdAt: -1 });
    return docs.map((d) => db.serializeDoc<AddressRecord>(d));
  }
  return getLocalStore().addresses.filter((a) => a.customerId === customerId);
}

export async function createAddress(
  data: Omit<AddressRecord, '_id' | 'createdAt' | 'updatedAt'>
): Promise<AddressRecord> {
  const now = new Date().toISOString();
  if (isMongoMode()) {
    if (data.isDefault) {
      await AddressModel.updateMany({ customerId: data.customerId }, { isDefault: false });
    }
    const doc = await AddressModel.create(data);
    return db.serializeDoc<AddressRecord>(doc);
  }
  const store = getLocalStore();
  if (data.isDefault) {
    for (const addr of store.addresses) {
      if (addr.customerId === data.customerId) addr.isDefault = false;
    }
  }
  const address: AddressRecord = { ...data, _id: makeId('addr'), createdAt: now, updatedAt: now };
  store.addresses.unshift(address);
  persistLocalStore();
  return address;
}

export async function deleteAddress(id: string, customerId: string): Promise<boolean> {
  if (isMongoMode()) {
    const res = await AddressModel.findOneAndDelete({ _id: id, customerId });
    return Boolean(res);
  }
  const store = getLocalStore();
  const idx = store.addresses.findIndex((a) => a._id === id && a.customerId === customerId);
  if (idx === -1) return false;
  store.addresses.splice(idx, 1);
  persistLocalStore();
  return true;
}

export async function getPlatformSettings(): Promise<PlatformSettingsRecord> {
  if (isMongoMode()) {
    let doc = await PlatformSettingsModel.findOne();
    if (!doc) {
      doc = await PlatformSettingsModel.create({
        commissionPercent: 6,
        deliveryFee: 35,
        freeDeliveryThreshold: 499,
      });
    }
    return db.serializeDoc<PlatformSettingsRecord>(doc);
  }
  return getLocalStore().settings;
}

export async function updatePlatformSettings(
  updates: Partial<PlatformSettingsRecord>
): Promise<PlatformSettingsRecord> {
  const now = new Date().toISOString();
  if (isMongoMode()) {
    const doc = await PlatformSettingsModel.findOneAndUpdate({}, updates, { new: true, upsert: true });
    return db.serializeDoc<PlatformSettingsRecord>(doc);
  }
  Object.assign(getLocalStore().settings, updates, { updatedAt: now });
  persistLocalStore();
  return getLocalStore().settings;
}

export async function placeCustomerOrders(params: {
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ productId: string; quantity: number }>;
  deliveryAddress: OrderRecord['deliveryAddress'];
  deliverySlot: string;
  paymentMethod: 'Cash on Delivery' | 'UPI on Delivery';
}): Promise<OrderRecord[]> {
  if (!params.items.length) {
    throw new Error('Cart is empty. Add fresh produce before placing an order.');
  }

  const settings = await getPlatformSettings();
  const resolvedItems: Array<{ product: ProductRecord; quantity: number }> = [];

  for (const reqItem of params.items) {
    const product = await findProductById(reqItem.productId);
    if (!product) {
      throw new Error('One of the requested products is no longer listed.');
    }
    if (!product.isAvailable || product.availableQuantity <= 0) {
      throw new Error(`${product.name} is currently out of stock.`);
    }
    if (reqItem.quantity <= 0 || !Number.isFinite(reqItem.quantity)) {
      throw new Error(`Invalid quantity requested for ${product.name}.`);
    }
    if (reqItem.quantity > product.availableQuantity) {
      throw new Error(
        `Only ${product.availableQuantity} ${product.unit} of ${product.name} available in stock.`
      );
    }
    resolvedItems.push({ product, quantity: reqItem.quantity });
  }

  const totalOrderSubtotal = resolvedItems.reduce(
    (sum, entry) => sum + entry.product.pricePerUnit * entry.quantity,
    0
  );
  const overallDeliveryFee =
    totalOrderSubtotal >= settings.freeDeliveryThreshold ? 0 : settings.deliveryFee;

  // Group items by farmer so each farmer receives their dedicated order
  const byFarmer = new Map<string, Array<{ product: ProductRecord; quantity: number }>>();
  for (const entry of resolvedItems) {
    const list = byFarmer.get(entry.product.farmerId) || [];
    list.push(entry);
    byFarmer.set(entry.product.farmerId, list);
  }

  const createdOrders: OrderRecord[] = [];
  const now = new Date().toISOString();
  let isFirstGroup = true;

  for (const [farmerId, entries] of byFarmer.entries()) {
    const orderItems: OrderItemRecord[] = entries.map(({ product, quantity }) => ({
      productId: product._id,
      productName: product.name,
      productImage: product.images[0] || '/src/assets/images/cat_vegetables_1795104333947.jpg',
      farmerId: product.farmerId,
      farmName: product.farmName,
      quantity,
      unit: product.unit,
      pricePerUnit: product.pricePerUnit,
      subtotal: product.pricePerUnit * quantity,
    }));

    const subtotal = orderItems.reduce((s, i) => s + i.subtotal, 0);
    const deliveryFee = isFirstGroup ? overallDeliveryFee : 0;
    isFirstGroup = false;

    const platformCommission = Math.round((subtotal * settings.commissionPercent) / 100);
    const farmerPayout = subtotal - platformCommission;
    const totalAmount = subtotal + deliveryFee;
    const orderNumber = `KM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderPayload: Omit<OrderRecord, '_id'> = {
      orderNumber,
      customerId: params.customerId,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      farmerId,
      farmName: entries[0].product.farmName,
      items: orderItems,
      subtotal,
      deliveryFee,
      commissionRate: settings.commissionPercent,
      platformCommission,
      farmerPayout,
      totalAmount,
      deliveryAddress: params.deliveryAddress,
      deliverySlot: params.deliverySlot,
      paymentMethod: params.paymentMethod,
      status: 'New Order',
      customerConfirmedDelivery: false,
      timeline: [
        {
          status: 'New Order',
          timestamp: now,
          note: `Order placed for ${entries[0].product.farmName}.`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Deduct inventory atomically
    for (const { product, quantity } of entries) {
      const nextQty = Math.max(0, product.availableQuantity - quantity);
      await updateProduct(product._id, {
        availableQuantity: nextQty,
        isAvailable: nextQty > 0 ? product.isAvailable : false,
        soldCount: product.soldCount + quantity,
      });
    }

    let created: OrderRecord;
    if (isMongoMode()) {
      const doc = await OrderModel.create(orderPayload);
      created = db.serializeDoc<OrderRecord>(doc);
    } else {
      created = { ...orderPayload, _id: makeId('ord') };
      getLocalStore().orders.unshift(created);
      persistLocalStore();
    }
    createdOrders.push(created);

    const farmer = await findFarmerById(farmerId);
    if (farmer) {
      await createNotification({
        userId: farmer.userId,
        title: `New Order ${orderNumber}`,
        message: `${params.customerName} ordered ₹${subtotal} of fresh produce.`,
        type: 'order',
      });
    }
  }

  return createdOrders;
}

export async function listOrders(filters?: {
  customerId?: string;
  farmerId?: string;
}): Promise<OrderRecord[]> {
  let orders: OrderRecord[];
  if (isMongoMode()) {
    const query: Record<string, string> = {};
    if (filters?.customerId) query.customerId = filters.customerId;
    if (filters?.farmerId) query.farmerId = filters.farmerId;
    const docs = await OrderModel.find(query).sort({ createdAt: -1 });
    orders = docs.map((d) => db.serializeDoc<OrderRecord>(d));
  } else {
    orders = [...getLocalStore().orders];
    if (filters?.customerId) orders = orders.filter((o) => o.customerId === filters.customerId);
    if (filters?.farmerId) orders = orders.filter((o) => o.farmerId === filters.farmerId);
    orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return orders;
}

export async function findOrderById(id: string): Promise<OrderRecord | null> {
  if (isMongoMode()) {
    const doc = await OrderModel.findById(id);
    return doc ? db.serializeDoc<OrderRecord>(doc) : null;
  }
  return getLocalStore().orders.find((o) => o._id === id) || null;
}

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
  note: string,
  options?: { confirmDelivery?: boolean }
): Promise<OrderRecord | null> {
  const order = await findOrderById(orderId);
  if (!order) return null;

  const previousStatus = order.status;
  if (previousStatus === 'Cancelled' && nextStatus !== 'Cancelled') {
    throw new Error('Cannot reopen a cancelled order.');
  }

  const now = new Date().toISOString();
  const timeline = [
    ...order.timeline,
    { status: nextStatus, timestamp: now, note },
  ];

  // Restore inventory on cancellation
  if (nextStatus === 'Cancelled' && previousStatus !== 'Cancelled' && previousStatus !== 'Delivered') {
    for (const item of order.items) {
      const product = await findProductById(item.productId);
      if (product) {
        await updateProduct(product._id, {
          availableQuantity: product.availableQuantity + item.quantity,
          isAvailable: true,
          soldCount: Math.max(0, product.soldCount - item.quantity),
        });
      }
    }
  }

  // Credit farmer earnings when delivered for the first time
  if (nextStatus === 'Delivered' && previousStatus !== 'Delivered') {
    const farmer = await findFarmerById(order.farmerId);
    if (farmer) {
      await updateFarmerProfile(farmer._id, {
        totalEarnings: farmer.totalEarnings + order.farmerPayout,
      });
    }
  }

  const updates: Partial<OrderRecord> = {
    status: nextStatus,
    timeline,
    updatedAt: now,
  };
  if (options?.confirmDelivery) {
    updates.customerConfirmedDelivery = true;
  }

  let updated: OrderRecord | null = null;
  if (isMongoMode()) {
    const doc = await OrderModel.findByIdAndUpdate(orderId, updates, { new: true });
    updated = doc ? db.serializeDoc<OrderRecord>(doc) : null;
  } else {
    const target = getLocalStore().orders.find((o) => o._id === orderId);
    if (target) {
      Object.assign(target, updates);
      persistLocalStore();
      updated = target;
    }
  }

  if (updated) {
    // Notify customer
    const customerList = isMongoMode()
      ? await CustomerModel.findById(updated.customerId)
      : getLocalStore().customers.find((c) => c._id === updated!.customerId);
    const customerUserId = customerList ? String(customerList.userId) : '';
    if (customerUserId) {
      await createNotification({
        userId: customerUserId,
        title: `Order ${updated.orderNumber}: ${nextStatus}`,
        message: note,
        type: 'order',
      });
    }
  }

  return updated;
}

export async function listReviews(filters?: {
  productId?: string;
  farmerId?: string;
  customerId?: string;
}): Promise<ReviewRecord[]> {
  let reviews: ReviewRecord[];
  if (isMongoMode()) {
    const query: Record<string, string> = {};
    if (filters?.productId) query.productId = filters.productId;
    if (filters?.farmerId) query.farmerId = filters.farmerId;
    if (filters?.customerId) query.customerId = filters.customerId;
    const docs = await ReviewModel.find(query).sort({ createdAt: -1 });
    reviews = docs.map((d) => db.serializeDoc<ReviewRecord>(d));
  } else {
    reviews = [...getLocalStore().reviews];
    if (filters?.productId) reviews = reviews.filter((r) => r.productId === filters.productId);
    if (filters?.farmerId) reviews = reviews.filter((r) => r.farmerId === filters.farmerId);
    if (filters?.customerId) reviews = reviews.filter((r) => r.customerId === filters.customerId);
    reviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return reviews;
}

export async function createReview(
  data: Omit<ReviewRecord, '_id' | 'createdAt' | 'updatedAt'>
): Promise<ReviewRecord> {
  const now = new Date().toISOString();
  let created: ReviewRecord;
  if (isMongoMode()) {
    const doc = await ReviewModel.create(data);
    created = db.serializeDoc<ReviewRecord>(doc);
  } else {
    created = { ...data, _id: makeId('rev'), createdAt: now, updatedAt: now };
    getLocalStore().reviews.unshift(created);
    persistLocalStore();
  }

  // Recalculate product rating
  const prodReviews = await listReviews({ productId: data.productId });
  if (prodReviews.length > 0) {
    const avg = prodReviews.reduce((s, r) => s + r.rating, 0) / prodReviews.length;
    await updateProduct(data.productId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: prodReviews.length,
    });
  }

  // Recalculate farmer rating
  const farmerReviews = await listReviews({ farmerId: data.farmerId });
  if (farmerReviews.length > 0) {
    const avgFarmer = farmerReviews.reduce((s, r) => s + r.farmerRating, 0) / farmerReviews.length;
    await updateFarmerProfile(data.farmerId, {
      rating: Math.round(avgFarmer * 10) / 10,
      reviewCount: farmerReviews.length,
    });
  }

  const farmer = await findFarmerById(data.farmerId);
  if (farmer) {
    await createNotification({
      userId: farmer.userId,
      title: `New ${data.rating}★ Review on ${data.productName}`,
      message: `${data.customerName} reviewed your produce: "${data.comment.slice(0, 70)}"`,
      type: 'review',
    });
  }

  return created;
}

export async function listNotifications(userId: string): Promise<NotificationRecord[]> {
  if (isMongoMode()) {
    const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(20);
    return docs.map((d) => db.serializeDoc<NotificationRecord>(d));
  }
  return getLocalStore()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createNotification(
  data: Omit<NotificationRecord, '_id' | 'isRead' | 'createdAt'>
): Promise<NotificationRecord> {
  const now = new Date().toISOString();
  if (isMongoMode()) {
    const doc = await NotificationModel.create({ ...data, isRead: false });
    return db.serializeDoc<NotificationRecord>(doc);
  }
  const notif: NotificationRecord = {
    ...data,
    _id: makeId('notif'),
    isRead: false,
    createdAt: now,
  };
  getLocalStore().notifications.unshift(notif);
  persistLocalStore();
  return notif;
}

export async function markNotificationRead(id: string, userId: string): Promise<boolean> {
  if (isMongoMode()) {
    const res = await NotificationModel.findOneAndUpdate({ _id: id, userId }, { isRead: true });
    return Boolean(res);
  }
  const notif = getLocalStore().notifications.find((n) => n._id === id && n.userId === userId);
  if (!notif) return false;
  notif.isRead = true;
  persistLocalStore();
  return true;
}

export async function listComplaints(userId?: string): Promise<ComplaintRecord[]> {
  if (isMongoMode()) {
    const query = userId ? { raisedByUserId: userId } : {};
    const docs = await ComplaintModel.find(query).sort({ createdAt: -1 });
    return docs.map((d) => db.serializeDoc<ComplaintRecord>(d));
  }
  const list = getLocalStore().complaints;
  return userId
    ? list.filter((c) => c.raisedByUserId === userId)
    : [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createComplaint(data: {
  orderId?: string;
  orderNumber?: string;
  raisedByUserId: string;
  raisedByName: string;
  raisedByRole: UserRole;
  subject: string;
  description: string;
}): Promise<ComplaintRecord> {
  const now = new Date().toISOString();
  if (isMongoMode()) {
    const doc = await ComplaintModel.create({ ...data, status: 'Open' });
    return db.serializeDoc<ComplaintRecord>(doc);
  }
  const cmp: ComplaintRecord = {
    ...data,
    _id: makeId('cmp'),
    status: 'Open',
    createdAt: now,
    updatedAt: now,
  };
  getLocalStore().complaints.unshift(cmp);
  persistLocalStore();
  return cmp;
}

export async function updateComplaint(
  id: string,
  updates: { status?: ComplaintStatus; adminNotes?: string }
): Promise<ComplaintRecord | null> {
  if (isMongoMode()) {
    const doc = await ComplaintModel.findByIdAndUpdate(id, updates, { new: true });
    return doc ? db.serializeDoc<ComplaintRecord>(doc) : null;
  }
  const cmp = getLocalStore().complaints.find((c) => c._id === id);
  if (!cmp) return null;
  Object.assign(cmp, updates, { updatedAt: new Date().toISOString() });
  persistLocalStore();
  return cmp;
}
