import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  usePlaceOrder,
  useInitiatePayment,
  useVerifyPayment
} from '@frontend/api-client';
import { CreditCard, AlertCircle, MapPin } from 'lucide-react';
import { useAddresses as useLocalAddresses } from '../context/AddressContext';
import { useLanguage } from '../context/LanguageContext';
 
export const CheckoutPage: React.FC = () => {
  const { t } = useLanguage();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
 
  // Load saved local addresses
  const { addresses, defaultAddress, selectedAddress, setSelectedAddress, addAddress } = useLocalAddresses();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
 
  const activeCheckoutAddress = selectedAddress || defaultAddress;
 
  const handleAddNewAddressSubmit = (e: any) => {
    if (e) e.preventDefault();
    if (!newAddr.name.trim() || !newAddr.street.trim() || !newAddr.city.trim() || !newAddr.state.trim() || !newAddr.zipCode.trim()) {
      alert("Please fill all fields.");
      return;
    }
    addAddress(newAddr);
    setNewAddr({ name: '', street: '', city: '', state: '', zipCode: '' });
    setShowAddForm(false);
  };
 
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('card');
 
  // Coupon state loaded from localStorage
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [appliedDiscountPercent, setAppliedDiscountPercent] = useState<number>(0);
 
  useEffect(() => {
    const savedCode = localStorage.getItem('applied_coupon_code');
    const savedPct = localStorage.getItem('applied_coupon_discount');
    if (savedCode && savedPct) {
      setAppliedCouponCode(savedCode);
      setAppliedDiscountPercent(parseFloat(savedPct));
    }
  }, []);

  // Load Razorpay script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      try {
        document.body.removeChild(script);
      } catch (err) {}
    };
  }, []);

  const [errorMsg, setErrorMsg] = useState('');

  const placeOrderMutation = usePlaceOrder();
  const initiatePaymentMutation = useInitiatePayment();
  const verifyPaymentMutation = useVerifyPayment();

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  // Calculate pricing totals
  const discountAmount = (subtotal * appliedDiscountPercent) / 100;
  const finalTotal = subtotal - discountAmount;

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (!activeCheckoutAddress) {
        throw new Error('Please select or add a shipping address before completing your purchase.');
      }
 
      // 2. Create order in order-service (pass applied coupon if present)
      const orderPayload = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        coupon: appliedCouponCode || undefined
      };

      const order = await placeOrderMutation.mutateAsync(orderPayload);

      // Clean applied coupon code from localStorage
      localStorage.removeItem('applied_coupon_code');
      localStorage.removeItem('applied_coupon_discount');

      // 3. Handle Payment Method Selection
      if (paymentMethod === 'cod') {
        // COD routes directly to order-confirmation
        clearCart();
        navigate(`/order-confirmation?orderId=${order.id}&method=COD`);
      } else {
        // Online Card / UPI route initiates Razorpay
        const paymentInitiatePayload = {
          orderId: order.id,
          amount: order.totalAmount, // uses discounted order total from backend
        };
        const payment = await initiatePaymentMutation.mutateAsync(paymentInitiatePayload);

        const key = payment.key;
        if (!key) {
          throw new Error('Razorpay key configuration is missing on the platform backend.');
        }

        // Open real Razorpay Checkout.js
        const options = {
          key: key,
          amount: Math.round(payment.amount * 100), // paise
          currency: payment.currency || 'INR',
          name: 'AuraRetail',
          description: 'Order Payment',
          order_id: payment.razorpayOrderId,
          handler: async function (response: any) {
            try {
              await verifyPaymentMutation.mutateAsync({
                razorpayOrderId: payment.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });
              clearCart();
              navigate(`/order-confirmation?orderId=${order.id}&method=${paymentMethod.toUpperCase()}`);
            } catch (err: any) {
              setErrorMsg(err.response?.data?.message || 'Payment verification failed.');
            }
          },
          prefill: {
            name: localStorage.getItem('storefront_name') || '',
            email: localStorage.getItem('storefront_email') || '',
          },
          theme: { color: '#c17f3a' }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error occurred while creating order. Please try again.');
    }
  };



  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-amber-950">Secure Checkout</h1>
        <p className="text-sm text-gray-500 mt-1">Complete your purchase details below.</p>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

        <form onSubmit={handlePlaceOrderSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            {/* Address Selection Container */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100/20 shadow-sm space-y-6">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 border-b border-gray-100 pb-3 text-sm">
                <MapPin className="w-5 h-5 text-[#ff3f6c]" />
                <span>{t('Select Shipping Address')}</span>
              </h3>
 
              {/* List of addresses with selection */}
              <div className="grid grid-cols-1 gap-3 text-left">
                {addresses.map((addr) => {
                  const isSelected = activeCheckoutAddress?.id === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddress(addr.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-4 ${
                        isSelected
                          ? 'border-[#ff3f6c] bg-[#ff3f6c]/5'
                          : 'border-slate-200 hover:border-slate-355'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="checkout_address"
                            checked={isSelected}
                            onChange={() => setSelectedAddress(addr.id)}
                            className="w-3.5 h-3.5 text-[#ff3f6c] focus:ring-[#ff3f6c] accent-[#ff3f6c]"
                          />
                          <span className="font-bold text-slate-800 text-xs">{addr.name}</span>
                          {addr.isDefault && (
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">Default</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-555 text-slate-500 leading-relaxed pl-5">
                          {addr.street}<br />
                          {addr.city}, {addr.state} {addr.zipCode}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
 
              {!showAddForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  + Add New Shipping Address
                </button>
              ) : (
                /* Inline Add Address Form */
                <div className="border border-slate-200 rounded-2xl p-4 space-y-4">
                  <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider text-left">New Shipping Address</h4>
                  
                  <div className="space-y-3 text-left">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Address Label (e.g. Home, Office)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Home"
                        value={newAddr.name}
                        onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Street Address</label>
                      <input
                        type="text"
                        required
                        placeholder="123 Design Studio Ave, Apt 4B"
                        value={newAddr.street}
                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">City</label>
                        <input
                          type="text"
                          required
                          placeholder="New York"
                          value={newAddr.city}
                          onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">State</label>
                        <input
                          type="text"
                          required
                          placeholder="NY"
                          value={newAddr.state}
                          onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Zip Code</label>
                        <input
                          type="text"
                          required
                          placeholder="10012"
                          value={newAddr.zipCode}
                          onChange={(e) => setNewAddr({ ...newAddr, zipCode: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                        />
                      </div>
                    </div>
                  </div>
 
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewAddressSubmit}
                      className="px-3 py-1.5 bg-[#ff3f6c] hover:bg-[#e0355c] text-white rounded-lg text-xs font-semibold"
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mock Payment Options Selection */}
            <div className="bg-white p-6 rounded-3xl border border-orange-100/20 shadow-sm space-y-4">
              <h3 className="font-semibold text-amber-950 flex items-center gap-2 border-b border-gray-100 pb-3 text-sm">
                <CreditCard className="w-4 h-4" />
                <span>{t('Payment Method')}</span>
              </h3>
              <div className="grid grid-cols-1 gap-2 text-xs font-semibold">
                <label className="flex items-center justify-between p-3 rounded-xl border border-amber-50 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                      className="w-4 h-4 accent-amber-900 cursor-pointer"
                    />
                    <span className="text-amber-950">Credit / Debit Card</span>
                  </div>
                  <span className="text-gray-400 font-normal">Online Simulation</span>
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-amber-50 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'upi'}
                      onChange={() => setPaymentMethod('upi')}
                      className="w-4 h-4 accent-amber-900 cursor-pointer"
                    />
                    <span className="text-amber-950">UPI (GPay / PhonePe)</span>
                  </div>
                  <span className="text-gray-400 font-normal">Online Simulation</span>
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border border-amber-50 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="w-4 h-4 accent-amber-900 cursor-pointer"
                    />
                    <span className="text-amber-950">{t('Cash on Delivery')}</span>
                  </div>
                  <span className="text-gray-400 font-normal">Pay upon receipt</span>
                </label>
              </div>
            </div>
          </div>

          {/* Cart review + place order */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-orange-100/20 shadow-sm h-fit space-y-6">
            <h3 className="font-semibold text-amber-950 border-b border-gray-100 pb-3">
              {t('Order Summary')}
            </h3>

            <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center gap-4 text-sm">
                  <div className="truncate">
                    <span className="font-semibold text-amber-950">{item.product.name}</span>
                    <span className="text-xs text-gray-400 block">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-amber-950 shrink-0 font-mono">
                    INR {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-gray-500">
                <span>{t('Subtotal')}</span>
                <span className="font-semibold text-amber-950 font-mono">INR {subtotal.toFixed(2)}</span>
              </div>
              {appliedCouponCode && (
                <div className="flex justify-between text-gray-500">
                  <span>{t('Discount')} ({appliedCouponCode})</span>
                  <span className="font-semibold text-rose-600 font-mono">-INR {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>{t('Shipping')}</span>
                <span className="font-semibold text-emerald-600">{t('Free')}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-base font-bold text-amber-950">
                <span>{t('Total')}</span>
                <span className="font-mono">INR {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={placeOrderMutation.isPending}
              className="w-full inline-flex items-center justify-center bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 text-white font-semibold h-11 px-6 rounded-full shadow-md transition-colors"
            >
              {placeOrderMutation.isPending ? 'Processing Order...' : t('Place Order')}
            </button>
          </div>
        </form>
    </div>
  );
};
