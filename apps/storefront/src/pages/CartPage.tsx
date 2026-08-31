import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight } from 'lucide-react';
import { useWishlist, useAddToWishlist, useRemoveFromWishlist, useApplyCoupon } from '@frontend/api-client';
import { useLanguage } from '../context/LanguageContext';
 
export const CartPage: React.FC = () => {
  const { t } = useLanguage();
  const { items, updateQuantity, removeFromCart, subtotal, addToCart } = useCart();
  const { data: wishlist } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const applyCouponMutation = useApplyCoupon();
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState<{ code: string; discountPercent: number } | null>(() => {
    const savedCode = localStorage.getItem('applied_coupon_code');
    const savedPct = localStorage.getItem('applied_coupon_discount');
    return savedCode && savedPct ? { code: savedCode, discountPercent: parseFloat(savedPct) } : null;
  });
  const [couponError, setCouponError] = React.useState('');

  const handleApplyCoupon = () => {
    setCouponError('');
    applyCouponMutation.mutate(couponCode, {
      onSuccess: (data) => {
        if (data.valid) {
          setAppliedCoupon({ code: data.code, discountPercent: data.discountPercent });
          localStorage.setItem('applied_coupon_code', data.code);
          localStorage.setItem('applied_coupon_discount', data.discountPercent.toString());
          setCouponCode('');
        }
      },
      onError: (err: any) => {
        setCouponError(err.response?.data?.message || 'Invalid coupon code.');
      }
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('applied_coupon_code');
    localStorage.removeItem('applied_coupon_discount');
    setCouponCode('');
    setCouponError('');
  };

  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercent) / 100 : 0;
  const finalTotal = subtotal - discountAmount;

  const handleSaveForLater = (product: any) => {
    addToWishlist.mutate(product.id, {
      onSuccess: () => {
        removeFromCart(product.id);
        alert('Item saved for later!');
      }
    });
  };

  const handleMoveToCart = (product: any) => {
    addToCart(product, 1);
    removeFromWishlist.mutate(product.id);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-amber-950">{t('Shopping Cart')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('Review your selections and proceed to checkout.')}</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-orange-100/20 shadow-sm flex flex-col items-center justify-center space-y-4">
          <span className="text-5xl">🛍️</span>
          <h2 className="font-display text-xl font-bold text-amber-950">{t('Your Bag is Empty')}</h2>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Looks like you haven't added anything to your cart yet. Let's find some inspiration.
          </p>
          <Link to="/products" className="inline-flex items-center gap-1.5 px-6 h-9 bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold rounded-full shadow-sm">
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-4 sm:gap-6 bg-white p-4 rounded-2xl border border-orange-100/20 shadow-sm relative group">
                
                {/* Product Aspect Indicator */}
                <div className="w-20 sm:w-24 aspect-[4/3] bg-gradient-to-tr from-amber-50 to-orange-50/70 rounded-xl flex items-center justify-center p-2 shrink-0">
                  <span className="text-3xl">
                    {item.product.category === 'Electronics' ? '🎧' : item.product.category === 'Clothing' ? '👕' : '📚'}
                  </span>
                </div>

                {/* Info details */}
                <div className="flex-grow flex flex-col justify-between py-1">
                  <div>
                    <h3 className="font-semibold text-amber-950 text-sm sm:text-base">{item.product.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{item.product.category}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    {/* Quantity adjust */}
                    <div className="flex items-center border border-amber-50 rounded-full h-8 overflow-hidden bg-gray-50">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2.5 h-full hover:bg-amber-50 font-bold text-xs"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-semibold select-none">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2.5 h-full hover:bg-amber-50 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Save for later link */}
                    <button
                      onClick={() => handleSaveForLater(item.product)}
                      className="text-xs text-amber-900/80 hover:text-amber-950 hover:underline font-semibold"
                    >
                      Save for later
                    </button>

                    <span className="text-sm font-bold text-amber-950">INR {(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>

                {/* Delete item button */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-rose-600 transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
 
          {/* Order Summary Panel */}
          <div className="bg-white p-6 rounded-3xl border border-orange-100/20 h-fit shadow-sm space-y-6">
            <h3 className="font-display text-xl font-bold text-amber-950 border-b border-gray-100 pb-3">
              {t('Order Summary')}
            </h3>
 
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{t('Subtotal')}</span>
                <span className="font-semibold text-amber-950">INR {subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-gray-500">
                  <span>{t('Discount')} ({appliedCoupon.code})</span>
                  <span className="font-semibold text-rose-600">-INR {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>{t('Shipping')}</span>
                <span className="font-semibold text-emerald-600">{t('Free')}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between text-base font-bold text-amber-950">
                <span>{t('Total')}</span>
                <span>INR {finalTotal.toFixed(2)}</span>
              </div>
            </div>
 
            {/* Promo Coupon Code */}
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Promo Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter AURA10 or AURA20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                  className="flex-grow border border-amber-100 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900 uppercase font-mono"
                />
                {appliedCoupon ? (
                  <button
                    onClick={handleRemoveCoupon}
                    className="px-3 h-8 border border-rose-200 text-rose-600 text-xs font-semibold rounded-full hover:bg-rose-50"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyCouponMutation.isPending || !couponCode}
                    className="px-4 h-8 bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 text-white text-xs font-semibold rounded-full"
                  >
                    Apply
                  </button>
                )}
              </div>
              {couponError && (
                <p className="text-[10px] text-rose-600 font-semibold">{couponError}</p>
              )}
              {appliedCoupon && (
                <p className="text-[10px] text-emerald-600 font-semibold">
                  Coupon {appliedCoupon.code} applied ({appliedCoupon.discountPercent}% off!)
                </p>
              )}
            </div>
            <Link
              to="/checkout"
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 text-white font-semibold h-11 px-6 rounded-full shadow-md transition-colors"
            >
              <span>{t('Proceed to Checkout')}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Saved for Later Section */}
      {wishlist && wishlist.length > 0 && (
        <div className="border-t border-orange-100/10 pt-8 mt-8 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-amber-950">Saved for Later</h2>
            <p className="text-xs text-gray-500">Items you've saved to buy at another time.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {wishlist.map((prod) => (
              <div key={prod.id} className="flex gap-4 bg-white p-4 rounded-2xl border border-orange-100/20 shadow-sm relative">
                {/* Image Aspect Indicator */}
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-50 to-orange-50/70 rounded-xl flex items-center justify-center p-2 shrink-0">
                  <span className="text-2xl">
                    {prod.category === 'Electronics' ? '🎧' : prod.category === 'Clothing' ? '👕' : '📚'}
                  </span>
                </div>
                {/* Details */}
                <div className="flex-grow flex flex-col justify-between py-0.5 min-w-0">
                  <div>
                    <h4 className="font-semibold text-amber-950 text-xs sm:text-sm truncate">{prod.name}</h4>
                    <p className="text-[10px] text-gray-400 font-mono">INR {prod.price.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-3 text-[10px] font-semibold pt-1">
                    <button
                      onClick={() => handleMoveToCart(prod)}
                      className="text-amber-900 hover:text-amber-700 underline"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => removeFromWishlist.mutate(prod.id)}
                      className="text-gray-400 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
