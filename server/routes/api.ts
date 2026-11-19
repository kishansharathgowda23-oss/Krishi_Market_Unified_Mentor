import express from 'express';
import {
  comparePassword,
  hashPassword,
  optionalAuth,
  requireAuth,
  requireRole,
  signToken,
  type AuthenticatedRequest,
} from '../middleware/auth.ts';
import {
  createAddress,
  createCategory,
  createComplaint,
  createCustomer,
  createFarmer,
  createProduct,
  createReview,
  createUser,
  deleteAddress,
  deleteCategory,
  deleteProduct,
  findCustomerByUserId,
  findFarmerById,
  findFarmerByUserId,
  findOrderById,
  findProductById,
  findUserByEmail,
  findUserById,
  getPlatformSettings,
  listAddressesByCustomer,
  listCategories,
  listComplaints,
  listCustomersWithStatus,
  listFarmers,
  listNotifications,
  listOrders,
  listProducts,
  listReviews,
  markNotificationRead,
  placeCustomerOrders,
  updateCategory,
  updateComplaint,
  updateCustomerProfile,
  updateFarmerProfile,
  updateOrderStatus,
  updatePlatformSettings,
  updateProduct,
  updateUserActive,
  verifyFarmer,
} from '../db/repository.ts';
import type { FarmerVerificationStatus, OrderStatus } from '../types.ts';
import { uploadToCloudinary } from '../utils/cloudinary.ts';

export const apiRouter = express.Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'krishi-market-api' });
});

// ==================== AUTHENTICATION ====================

apiRouter.post('/auth/register/customer', async (req, res) => {
  try {
    const { fullName, email, phone, password, preferredDistrict } = req.body;
    if (!fullName || !email || !phone || !password) {
      res.status(400).json({ error: 'All required fields must be filled.' });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const user = await createUser({
      name: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      passwordHash: hashPassword(String(password)),
      role: 'customer',
      isActive: true,
    });

    const customer = await createCustomer({
      userId: user._id,
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      preferredDistrict: preferredDistrict || 'Bengaluru',
    });

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: 'customer',
      name: user.name,
    });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      profile: customer,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.post('/auth/register/farmer', async (req, res) => {
  try {
    const {
      fullName,
      phone,
      email,
      password,
      farmName,
      farmLocation,
      district,
      state,
      cropTypes,
      farmingMethod,
      farmDescription,
      profileImage,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !email ||
      !password ||
      !farmName ||
      !farmLocation ||
      !district ||
      !state
    ) {
      res.status(400).json({ error: 'Please complete all required farmer and farm details.' });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const parsedCrops = Array.isArray(cropTypes)
      ? cropTypes
      : String(cropTypes || '')
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);

    const user = await createUser({
      name: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      passwordHash: hashPassword(String(password)),
      role: 'farmer',
      avatarUrl: profileImage || '/src/assets/images/farmer_portrait_ramesh_1795104333655.jpg',
      isActive: true,
    });

    const farmer = await createFarmer({
      userId: user._id,
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      farmName: String(farmName).trim(),
      farmLocation: String(farmLocation).trim(),
      district: String(district).trim(),
      state: String(state).trim(),
      cropTypes: parsedCrops.length ? parsedCrops : ['Seasonal Vegetables'],
      farmingMethod: farmingMethod === 'Conventional' ? 'Conventional' : 'Organic',
      farmDescription:
        String(farmDescription || '').trim() ||
        'Local direct-to-consumer farm committed to fresh harvest quality.',
      profileImage: profileImage || '/src/assets/images/farmer_portrait_ramesh_1795104333655.jpg',
      verificationStatus: 'pending',
    });

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: 'farmer',
      name: user.name,
    });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      profile: farmer,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await findUserByEmail(String(email));
    if (!user || !comparePassword(String(password), user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ error: 'This account has been deactivated by an administrator.' });
      return;
    }

    let profile: unknown = null;
    if (user.role === 'farmer') {
      profile = await findFarmerByUserId(user._id);
    } else if (user.role === 'customer') {
      profile = await findCustomerByUserId(user._id);
    }

    const token = signToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      profile,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await findUserById(req.auth!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    let profile: unknown = null;
    if (user.role === 'farmer') {
      profile = await findFarmerByUserId(user._id);
    } else if (user.role === 'customer') {
      profile = await findCustomerByUserId(user._id);
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
      profile,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== PUBLIC MARKETPLACE ====================

apiRouter.get('/categories', async (_req, res) => {
  const categories = await listCategories(true);
  res.json(categories);
});

apiRouter.get('/products', optionalAuth, async (req, res) => {
  try {
    const { category, search, district, method, minPrice, maxPrice, farmerId, sort } = req.query;
    const products = await listProducts({
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      district: district ? String(district) : undefined,
      method: method ? String(method) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      farmerId: farmerId ? String(farmerId) : undefined,
      sort: sort ? String(sort) : undefined,
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.get('/products/:id', async (req, res) => {
  const product = await findProductById(req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  const [farmer, reviews] = await Promise.all([
    findFarmerById(product.farmerId),
    listReviews({ productId: product._id }),
  ]);
  res.json({ product, farmer, reviews });
});

apiRouter.get('/farmers', async (_req, res) => {
  const farmers = await listFarmers(false);
  res.json(farmers);
});

apiRouter.get('/farmers/:id', async (req, res) => {
  const farmer = await findFarmerById(req.params.id);
  if (!farmer) {
    res.status(404).json({ error: 'Farmer not found.' });
    return;
  }
  const [products, reviews] = await Promise.all([
    listProducts({ farmerId: farmer._id }),
    listReviews({ farmerId: farmer._id }),
  ]);
  res.json({ farmer, products, reviews });
});

apiRouter.get('/reviews', async (req, res) => {
  const { productId, farmerId } = req.query;
  const reviews = await listReviews({
    productId: productId ? String(productId) : undefined,
    farmerId: farmerId ? String(farmerId) : undefined,
  });
  res.json(reviews);
});

apiRouter.get('/settings/public', async (_req, res) => {
  const settings = await getPlatformSettings();
  res.json(settings);
});

// ==================== IMAGE UPLOAD ====================

apiRouter.post('/upload', requireAuth, async (req, res) => {
  try {
    const { imageData, folder } = req.body;
    if (!imageData || typeof imageData !== 'string') {
      res.status(400).json({ error: 'Image payload is required.' });
      return;
    }
    const result = await uploadToCloudinary(imageData, folder || 'krishi_market');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// ==================== FARMER MODULE ====================

apiRouter.get('/farmer/dashboard', requireAuth, requireRole('farmer'), async (req: AuthenticatedRequest, res) => {
  const farmer = await findFarmerByUserId(req.auth!.userId);
  if (!farmer) {
    res.status(404).json({ error: 'Farmer profile not found.' });
    return;
  }

  const [products, orders, reviews] = await Promise.all([
    listProducts({ farmerId: farmer._id, includeUnavailable: true }),
    listOrders({ farmerId: farmer._id }),
    listReviews({ farmerId: farmer._id }),
  ]);

  const nonCancelled = orders.filter((o) => o.status !== 'Cancelled');
  const totalSales = nonCancelled.reduce((s, o) => s + o.farmerPayout, 0);
  const availableProducts = products.filter((p) => p.isAvailable && p.availableQuantity > 0).length;

  const monthlyMap = new Map<string, number>();
  const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  for (const m of months) monthlyMap.set(m, 0);
  for (const o of nonCancelled) {
    const d = new Date(o.createdAt);
    const label = d.toLocaleString('en-US', { month: 'short' });
    monthlyMap.set(label, (monthlyMap.get(label) || 0) + o.farmerPayout);
  }

  res.json({
    farmer,
    stats: {
      totalSales,
      totalOrders: orders.length,
      availableProducts,
      monthlyEarnings: monthlyMap.get('Nov') || totalSales,
    },
    monthlyChart: Array.from(monthlyMap.entries()).map(([month, earnings]) => ({ month, earnings })),
    products,
    orders,
    reviews,
  });
});

apiRouter.post('/farmer/products', requireAuth, requireRole('farmer'), async (req: AuthenticatedRequest, res) => {
  try {
    const farmer = await findFarmerByUserId(req.auth!.userId);
    if (!farmer) {
      res.status(404).json({ error: 'Farmer profile not found.' });
      return;
    }

    const {
      name,
      categoryId,
      description,
      images,
      pricePerUnit,
      availableQuantity,
      unit,
      farmingMethod,
      harvestDate,
      isAvailable,
    } = req.body;

    if (!name || !categoryId || !pricePerUnit || availableQuantity === undefined || !unit || !harvestDate) {
      res.status(400).json({ error: 'All product listing fields are required.' });
      return;
    }

    const categories = await listCategories(false);
    const cat = categories.find((c) => c._id === categoryId || c.name === categoryId);
    if (!cat) {
      res.status(400).json({ error: 'Invalid product category selected.' });
      return;
    }

    const prod = await createProduct({
      farmerId: farmer._id,
      farmerName: farmer.fullName,
      farmName: farmer.farmName,
      farmLocation: farmer.farmLocation,
      district: farmer.district,
      state: farmer.state,
      categoryId: cat._id,
      categoryName: cat.name,
      name: String(name).trim(),
      description: String(description || 'Fresh harvest directly from farm.').trim(),
      images: Array.isArray(images) && images.length ? images : [cat.imageUrl],
      pricePerUnit: Number(pricePerUnit),
      availableQuantity: Number(availableQuantity),
      unit,
      farmingMethod: farmingMethod === 'Conventional' ? 'Conventional' : 'Organic',
      harvestDate: String(harvestDate),
      isAvailable: isAvailable !== false,
      isFeatured: false,
    });

    res.status(201).json(prod);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.patch('/farmer/products/:id', requireAuth, requireRole('farmer'), async (req: AuthenticatedRequest, res) => {
  try {
    const farmer = await findFarmerByUserId(req.auth!.userId);
    const existing = await findProductById(req.params.id);
    if (!farmer || !existing || existing.farmerId !== farmer._id) {
      res.status(404).json({ error: 'Product not found in your farm catalog.' });
      return;
    }

    const updates = { ...req.body };
    if (updates.categoryId) {
      const categories = await listCategories(false);
      const cat = categories.find((c) => c._id === updates.categoryId || c.name === updates.categoryId);
      if (cat) {
        updates.categoryId = cat._id;
        updates.categoryName = cat.name;
      }
    }

    const updated = await updateProduct(existing._id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.delete('/farmer/products/:id', requireAuth, requireRole('farmer'), async (req: AuthenticatedRequest, res) => {
  const farmer = await findFarmerByUserId(req.auth!.userId);
  const existing = await findProductById(req.params.id);
  if (!farmer || !existing || existing.farmerId !== farmer._id) {
    res.status(404).json({ error: 'Product not found in your farm catalog.' });
    return;
  }
  await deleteProduct(existing._id);
  res.json({ deleted: true });
});

apiRouter.patch('/farmer/orders/:id/status', requireAuth, requireRole('farmer'), async (req: AuthenticatedRequest, res) => {
  try {
    const farmer = await findFarmerByUserId(req.auth!.userId);
    const order = await findOrderById(req.params.id);
    if (!farmer || !order || order.farmerId !== farmer._id) {
      res.status(404).json({ error: 'Order not found for your farm.' });
      return;
    }

    const { status, note } = req.body as { status: OrderStatus; note?: string };
    const allowed: OrderStatus[] = [
      'Accepted',
      'Processing',
      'Ready for Pickup',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'Invalid order status transition.' });
      return;
    }

    const updated = await updateOrderStatus(
      order._id,
      status,
      note || `Order updated to ${status} by ${farmer.farmName}.`
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

apiRouter.patch('/farmer/profile', requireAuth, requireRole('farmer'), async (req: AuthenticatedRequest, res) => {
  const farmer = await findFarmerByUserId(req.auth!.userId);
  if (!farmer) {
    res.status(404).json({ error: 'Farmer profile not found.' });
    return;
  }

  const allowedUpdates = {
    fullName: req.body.fullName ?? farmer.fullName,
    phone: req.body.phone ?? farmer.phone,
    farmName: req.body.farmName ?? farmer.farmName,
    farmLocation: req.body.farmLocation ?? farmer.farmLocation,
    district: req.body.district ?? farmer.district,
    state: req.body.state ?? farmer.state,
    cropTypes: Array.isArray(req.body.cropTypes) ? req.body.cropTypes : farmer.cropTypes,
    farmingMethod: req.body.farmingMethod ?? farmer.farmingMethod,
    farmDescription: req.body.farmDescription ?? farmer.farmDescription,
    profileImage: req.body.profileImage ?? farmer.profileImage,
  };

  const updated = await updateFarmerProfile(farmer._id, allowedUpdates);
  res.json(updated);
});

// ==================== CUSTOMER MODULE ====================

apiRouter.get('/customer/dashboard', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  const customer = await findCustomerByUserId(req.auth!.userId);
  if (!customer) {
    res.status(404).json({ error: 'Customer profile not found.' });
    return;
  }

  const [orders, addresses, allProducts, reviews] = await Promise.all([
    listOrders({ customerId: customer._id }),
    listAddressesByCustomer(customer._id),
    listProducts(),
    listReviews({ customerId: customer._id }),
  ]);

  const wishlist = allProducts.filter((p) => customer.wishlistProductIds.includes(p._id));

  res.json({
    customer,
    orders,
    addresses,
    wishlist,
    reviews,
  });
});

apiRouter.patch('/customer/profile', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  const updated = await updateCustomerProfile(req.auth!.userId, {
    fullName: req.body.fullName,
    phone: req.body.phone,
    preferredDistrict: req.body.preferredDistrict,
  });
  if (!updated) {
    res.status(404).json({ error: 'Customer profile not found.' });
    return;
  }
  res.json(updated);
});

apiRouter.post('/customer/wishlist/:productId', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  const customer = await findCustomerByUserId(req.auth!.userId);
  if (!customer) {
    res.status(404).json({ error: 'Customer profile not found.' });
    return;
  }
  const pid = req.params.productId;
  const exists = customer.wishlistProductIds.includes(pid);
  const nextIds = exists
    ? customer.wishlistProductIds.filter((id) => id !== pid)
    : [...customer.wishlistProductIds, pid];

  const updated = await updateCustomerProfile(req.auth!.userId, { wishlistProductIds: nextIds });
  res.json({ wishlistProductIds: updated?.wishlistProductIds || nextIds, added: !exists });
});

apiRouter.get('/addresses', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  const customer = await findCustomerByUserId(req.auth!.userId);
  if (!customer) {
    res.status(404).json({ error: 'Customer profile not found.' });
    return;
  }
  const addresses = await listAddressesByCustomer(customer._id);
  res.json(addresses);
});

apiRouter.post('/addresses', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  const customer = await findCustomerByUserId(req.auth!.userId);
  if (!customer) {
    res.status(404).json({ error: 'Customer profile not found.' });
    return;
  }
  const { label, fullName, phone, street, landmark, district, state, pincode, isDefault } = req.body;
  if (!label || !fullName || !phone || !street || !district || !state || !pincode) {
    res.status(400).json({ error: 'Please complete all required delivery address fields.' });
    return;
  }
  const created = await createAddress({
    customerId: customer._id,
    label,
    fullName,
    phone,
    street,
    landmark,
    district,
    state,
    pincode,
    isDefault: Boolean(isDefault),
  });
  res.status(201).json(created);
});

apiRouter.delete('/addresses/:id', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  const customer = await findCustomerByUserId(req.auth!.userId);
  if (!customer) {
    res.status(404).json({ error: 'Customer profile not found.' });
    return;
  }
  const deleted = await deleteAddress(req.params.id, customer._id);
  res.json({ deleted });
});

apiRouter.post('/orders', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  try {
    const customer = await findCustomerByUserId(req.auth!.userId);
    if (!customer) {
      res.status(404).json({ error: 'Customer profile not found.' });
      return;
    }

    const { items, deliveryAddress, deliverySlot, paymentMethod } = req.body;
    if (!deliveryAddress?.street || !deliveryAddress?.district || !deliveryAddress?.pincode) {
      res.status(400).json({ error: 'A valid Indian delivery address with PIN code is required.' });
      return;
    }
    if (!deliverySlot) {
      res.status(400).json({ error: 'Please select a delivery time slot.' });
      return;
    }

    const orders = await placeCustomerOrders({
      customerId: customer._id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      items,
      deliveryAddress,
      deliverySlot,
      paymentMethod: paymentMethod === 'UPI on Delivery' ? 'UPI on Delivery' : 'Cash on Delivery',
    });

    res.status(201).json({ orders });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

apiRouter.patch('/orders/:id/confirm-delivery', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  try {
    const customer = await findCustomerByUserId(req.auth!.userId);
    const order = await findOrderById(req.params.id);
    if (!customer || !order || order.customerId !== customer._id) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const updated = await updateOrderStatus(
      order._id,
      'Delivered',
      'Delivery confirmed by customer.',
      { confirmDelivery: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

apiRouter.patch('/orders/:id/cancel', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  try {
    const customer = await findCustomerByUserId(req.auth!.userId);
    const order = await findOrderById(req.params.id);
    if (!customer || !order || order.customerId !== customer._id) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (order.status !== 'New Order' && order.status !== 'Accepted') {
      res.status(400).json({ error: 'Orders already in processing or shipped cannot be cancelled.' });
      return;
    }
    const updated = await updateOrderStatus(order._id, 'Cancelled', 'Cancelled by customer.');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

apiRouter.post('/reviews', requireAuth, requireRole('customer'), async (req: AuthenticatedRequest, res) => {
  try {
    const customer = await findCustomerByUserId(req.auth!.userId);
    if (!customer) {
      res.status(404).json({ error: 'Customer profile not found.' });
      return;
    }
    const { orderId, productId, rating, farmerRating, comment } = req.body;
    const order = await findOrderById(orderId);
    if (!order || order.customerId !== customer._id) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (order.status !== 'Delivered') {
      res.status(400).json({ error: 'You can submit a review after your order is delivered.' });
      return;
    }
    const item = order.items.find((i) => i.productId === productId) || order.items[0];
    if (!item) {
      res.status(400).json({ error: 'Product not found in order.' });
      return;
    }

    const review = await createReview({
      orderId: order._id,
      productId: item.productId,
      productName: item.productName,
      farmerId: order.farmerId,
      customerId: customer._id,
      customerName: customer.fullName,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      farmerRating: Math.min(5, Math.max(1, Number(farmerRating) || Number(rating) || 5)),
      comment: String(comment || '').trim() || 'Fresh quality produce.',
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.post('/complaints', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, orderNumber, subject, description } = req.body;
    if (!subject || !description) {
      res.status(400).json({ error: 'Subject and description are required.' });
      return;
    }
    const cmp = await createComplaint({
      orderId,
      orderNumber,
      raisedByUserId: req.auth!.userId,
      raisedByName: req.auth!.name,
      raisedByRole: req.auth!.role,
      subject,
      description,
    });
    res.status(201).json(cmp);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.get('/complaints/my', requireAuth, async (req: AuthenticatedRequest, res) => {
  const list = await listComplaints(req.auth!.userId);
  res.json(list);
});

// ==================== NOTIFICATIONS ====================

apiRouter.get('/notifications', requireAuth, async (req: AuthenticatedRequest, res) => {
  const list = await listNotifications(req.auth!.userId);
  res.json(list);
});

apiRouter.patch('/notifications/:id/read', requireAuth, async (req: AuthenticatedRequest, res) => {
  const ok = await markNotificationRead(req.params.id, req.auth!.userId);
  res.json({ ok });
});

// ==================== ADMIN MODULE ====================

apiRouter.get('/admin/analytics', requireAuth, requireRole('admin'), async (_req, res) => {
  const [farmers, customers, products, orders, categories, complaints, settings] = await Promise.all([
    listFarmers(true),
    listCustomersWithStatus(),
    listProducts({ includeUnavailable: true }),
    listOrders(),
    listCategories(false),
    listComplaints(),
    getPlatformSettings(),
  ]);

  const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
  const totalRevenue = activeOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCommission = activeOrders.reduce((s, o) => s + o.platformCommission, 0);

  const monthNames = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const monthlySales = monthNames.map((month) => ({ month, revenue: 0, orders: 0 }));
  for (const ord of activeOrders) {
    const label = new Date(ord.createdAt).toLocaleString('en-US', { month: 'short' });
    const entry = monthlySales.find((m) => m.month === label);
    if (entry) {
      entry.revenue += ord.totalAmount;
      entry.orders += 1;
    }
  }

  const statusBuckets = [
    'New Order',
    'Accepted',
    'Processing',
    'Ready for Pickup',
    'Shipped',
    'Delivered',
    'Cancelled',
  ];
  const orderStatusChart = statusBuckets.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  res.json({
    stats: {
      totalFarmers: farmers.length,
      verifiedFarmers: farmers.filter((f) => f.verificationStatus === 'approved').length,
      pendingFarmers: farmers.filter((f) => f.verificationStatus === 'pending').length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue,
      totalCommission,
    },
    monthlySales,
    orderStatusChart,
    farmers,
    customers,
    products,
    orders,
    categories,
    complaints,
    settings,
  });
});

apiRouter.patch('/admin/farmers/:id/verify', requireAuth, requireRole('admin'), async (req, res) => {
  const { status, rejectionReason } = req.body as {
    status: FarmerVerificationStatus;
    rejectionReason?: string;
  };
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    res.status(400).json({ error: 'Invalid verification status.' });
    return;
  }
  const updated = await verifyFarmer(req.params.id, status, rejectionReason);
  if (!updated) {
    res.status(404).json({ error: 'Farmer not found.' });
    return;
  }
  res.json(updated);
});

apiRouter.patch('/admin/customers/:userId/status', requireAuth, requireRole('admin'), async (req, res) => {
  const updated = await updateUserActive(req.params.userId, Boolean(req.body.isActive));
  if (!updated) {
    res.status(404).json({ error: 'Customer user not found.' });
    return;
  }
  res.json({ userId: updated._id, isActive: updated.isActive });
});

apiRouter.post('/admin/categories', requireAuth, requireRole('admin'), async (req, res) => {
  const { name, description, imageUrl } = req.body;
  if (!name || !description) {
    res.status(400).json({ error: 'Category name and description are required.' });
    return;
  }
  const created = await createCategory({ name, description, imageUrl });
  res.status(201).json(created);
});

apiRouter.patch('/admin/categories/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const updated = await updateCategory(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  res.json(updated);
});

apiRouter.delete('/admin/categories/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const deleted = await deleteCategory(req.params.id);
  res.json({ deleted });
});

apiRouter.patch('/admin/products/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const updated = await updateProduct(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json(updated);
});

apiRouter.delete('/admin/products/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const deleted = await deleteProduct(req.params.id);
  res.json({ deleted });
});

apiRouter.patch('/admin/complaints/:id', requireAuth, requireRole('admin'), async (req, res) => {
  const updated = await updateComplaint(req.params.id, {
    status: req.body.status,
    adminNotes: req.body.adminNotes,
  });
  if (!updated) {
    res.status(404).json({ error: 'Complaint not found.' });
    return;
  }
  res.json(updated);
});

apiRouter.patch('/admin/settings', requireAuth, requireRole('admin'), async (req, res) => {
  const updated = await updatePlatformSettings({
    commissionPercent: Number(req.body.commissionPercent),
    deliveryFee: Number(req.body.deliveryFee),
    freeDeliveryThreshold: Number(req.body.freeDeliveryThreshold),
  });
  res.json(updated);
});
