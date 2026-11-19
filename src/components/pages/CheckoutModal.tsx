import { AlertCircle, CheckCircle2, MapPin, Plus, Truck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import type { Address, Order } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  onClose: () => void;
  onAuthRedirect: () => void;
  onOrderSuccess: (orders: Order[]) => void;
}

const DELIVERY_SLOTS = [
  'Morning (6:00 AM – 9:00 AM)',
  'Midday (11:00 AM – 2:00 PM)',
  'Evening (5:00 PM – 8:00 PM)',
];

export function CheckoutModal({
  isOpen,
  deliveryFee,
  freeDeliveryThreshold,
  onClose,
  onAuthRedirect,
  onOrderSuccess,
}: CheckoutModalProps) {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddress, setShowNewAddress] = useState(false);

  // New address fields
  const [label, setLabel] = useState('Home');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [district, setDistrict] = useState('Bengaluru');
  const [stateName, setStateName] = useState('Karnataka');
  const [pincode, setPincode] = useState('');

  const [deliverySlot, setDeliverySlot] = useState(DELIVERY_SLOTS[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'UPI on Delivery'>(
    'UPI on Delivery'
  );

  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedOrders, setConfirmedOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!isOpen || !user || user.role !== 'customer') return;
    setConfirmedOrders(null);
    setError('');
    setLoadingAddresses(true);
    api
      .getAddresses()
      .then((list) => {
        setAddresses(list);
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(def._id);
          setShowNewAddress(false);
        } else {
          setShowNewAddress(true);
          setFullName(user.name);
          setPhone(user.phone);
        }
      })
      .catch(() => {
        setShowNewAddress(true);
      })
      .finally(() => setLoadingAddresses(false));
  }, [isOpen, user]);

  if (!isOpen) return null;

  const appliedDelivery = subtotal >= freeDeliveryThreshold || subtotal === 0 ? 0 : deliveryFee;
  const totalPayable = subtotal + appliedDelivery;

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const created = await api.createAddress({
        label,
        fullName,
        phone,
        street,
        landmark,
        district,
        state: stateName,
        pincode,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created._id);
      setShowNewAddress(false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handlePlaceOrder = async () => {
    setError('');
    const chosen = addresses.find((a) => a._id === selectedAddressId);
    const deliveryAddress = chosen
      ? {
          fullName: chosen.fullName,
          phone: chosen.phone,
          street: chosen.street,
          landmark: chosen.landmark,
          district: chosen.district,
          state: chosen.state,
          pincode: chosen.pincode,
        }
      : {
          fullName,
          phone,
          street,
          landmark,
          district,
          state: stateName,
          pincode,
        };

    if (!deliveryAddress.street || !deliveryAddress.pincode) {
      setError('Please select or save a complete delivery address with PIN code.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.placeOrder({
        items: items.map((i) => ({ productId: i.product._id, quantity: i.quantity })),
        deliveryAddress,
        deliverySlot,
        paymentMethod,
      });
      // Only show confirmed orders after backend successfully commits stock deduction & order records
      clearCart();
      setConfirmedOrders(res.orders);
      onOrderSuccess(res.orders);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-[#1F2B23]/55 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-[#FBFAF5] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#1F2B23]/15 shadow-2xl p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-[#1F2B23] flex items-center justify-center border border-[#1F2B23]/10 cursor-pointer"
          aria-label="Close checkout"
        >
          <X className="w-4 h-4" />
        </button>

        {!user || user.role !== 'customer' ? (
          <div className="py-10 text-center space-y-4">
            <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
              Customer Sign-In Required
            </h2>
            <p className="text-sm text-[#1F2B23]/75 max-w-md mx-auto">
              {user
                ? `You are currently signed in as a ${user.role}. Please sign in with a Customer account to place farm orders.`
                : 'Sign in or create a Customer account to save your delivery address and track orders.'}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAuthRedirect();
              }}
              className="px-6 py-3 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] cursor-pointer"
            >
              Go to Login / Registration
            </button>
          </div>
        ) : confirmedOrders ? (
          <div className="py-6 space-y-5">
            <div className="flex items-center gap-3 text-[#1F6B45]">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <div>
                <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                  Order Confirmed with Farm{confirmedOrders.length > 1 ? 's' : ''}
                </h2>
                <p className="text-sm text-[#1F2B23]/70">
                  Inventory reserved and harvest notification sent directly to the grower.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {confirmedOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="bg-white rounded-xl border border-[#1F2B23]/10 p-4 space-y-2 text-sm"
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="font-mono text-[#1F6B45]">{ord.orderNumber}</span>
                    <span className="font-mono tabular-nums">₹{ord.totalAmount}</span>
                  </div>
                  <div className="text-xs text-[#1F2B23]/70">
                    Farm: {ord.farmName} · Slot: {ord.deliverySlot} · {ord.paymentMethod}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-[#1F6B45] text-white text-sm font-semibold hover:bg-[#185536] cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#1F2B23]">
                Checkout & Delivery Slot
              </h2>
              <p className="text-xs text-[#1F2B23]/65 mt-1">
                Stock is verified live against farm availability when placing your order.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Delivery Address */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1F2B23] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1F6B45]" />
                  <span>1. Delivery Address</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewAddress((s) => !s)}
                  className="text-xs font-semibold text-[#1F6B45] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showNewAddress ? 'Use Saved Address' : 'Add New Address'}</span>
                </button>
              </div>

              {loadingAddresses ? (
                <p className="text-xs text-[#1F2B23]/60">Loading saved addresses...</p>
              ) : showNewAddress ? (
                <form
                  onSubmit={handleSaveNewAddress}
                  className="bg-white rounded-xl border border-[#1F2B23]/12 p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="Label (e.g. Home, Office)"
                      className="h-10 px-3 rounded-lg border border-[#1F2B23]/15 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Recipient Name"
                      className="h-10 px-3 rounded-lg border border-[#1F2B23]/15 text-sm"
                    />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 Phone"
                      className="h-10 px-3 rounded-lg border border-[#1F2B23]/15 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="PIN Code (e.g. 560008)"
                      className="h-10 px-3 rounded-lg border border-[#1F2B23]/15 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="House / Flat, Street, Layout"
                    className="w-full h-10 px-3 rounded-lg border border-[#1F2B23]/15 text-sm"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Landmark (optional)"
                      className="h-10 px-3 rounded-lg border border-[#1F2B23]/15 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="District"
                      className="h-10 px-3 rounded-lg border border-[#1F2B23]/15 text-sm"
                    />
                    <input
                      type="text"
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="State"
                      className="h-10 px-3 rounded-lg border border-[#1F2B23]/15 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#1F6B45] text-white text-xs font-semibold cursor-pointer"
                  >
                    Save Address
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                        selectedAddressId === addr._id
                          ? 'bg-white border-[#1F6B45]'
                          : 'bg-white/60 border-[#1F2B23]/12'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === addr._id}
                        onChange={() => setSelectedAddressId(addr._id)}
                        className="mt-1 accent-[#1F6B45]"
                      />
                      <div className="text-xs space-y-0.5">
                        <div className="font-semibold text-[#1F2B23]">
                          {addr.label} · {addr.fullName} ({addr.phone})
                        </div>
                        <div className="text-[#1F2B23]/75">
                          {addr.street}, {addr.district}, {addr.state} – {addr.pincode}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Delivery Slot & Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1F2B23] mb-1.5 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#1F6B45]" />
                  <span>2. Preferred Delivery Slot</span>
                </label>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
                >
                  {DELIVERY_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F2B23] mb-1.5">
                  3. Payment Terms (On Delivery)
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as 'Cash on Delivery' | 'UPI on Delivery')
                  }
                  className="w-full h-11 px-3 rounded-xl border border-[#1F2B23]/15 bg-white text-sm"
                >
                  <option value="UPI on Delivery">UPI on Delivery</option>
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                </select>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl border border-[#1F2B23]/10 p-4 space-y-2 text-sm">
              <div className="flex justify-between text-[#1F2B23]/75">
                <span>Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <span className="font-mono tabular-nums">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-[#1F2B23]/75">
                <span>Delivery Fee (Free above ₹{freeDeliveryThreshold})</span>
                <span className="font-mono tabular-nums">
                  {appliedDelivery === 0 ? 'Free' : `₹${appliedDelivery}`}
                </span>
              </div>
              <div className="flex justify-between font-bold text-base text-[#1F2B23] pt-2 border-t border-[#1F2B23]/10">
                <span>Total Payable on Delivery</span>
                <span className="font-mono tabular-nums">₹{totalPayable}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting || items.length === 0}
              onClick={handlePlaceOrder}
              className="w-full h-12 rounded-xl bg-[#1F6B45] text-white font-semibold text-sm hover:bg-[#185536] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {submitting ? 'Verifying Stock & Confirming...' : `Confirm Order · ₹${totalPayable}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
