import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrderDetail, useCancelOrder, useReturnOrder, usePublicProducts } from '@frontend/api-client';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Calendar, FileText, Truck, RefreshCw, XCircle, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
 
export const OrderDetail: React.FC = () => {
  const { t } = useLanguage();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading } = useOrderDetail(orderId || '');
  const cancelMutation = useCancelOrder();
  const returnMutation = useReturnOrder();
  const { addToCart } = useCart();
  const { data: products } = usePublicProducts();
 
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of mind');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('Product damaged');
  const [returnComment, setReturnComment] = useState('');
 
  const orderItems = order?.items ? (Array.isArray(order.items) ? order.items : JSON.parse(order.items as any)) : [];
 
  const isCancelableAfterShipping = React.useMemo(() => {
    if (!products || !orderItems || orderItems.length === 0) return false;
    return orderItems.some((item: any) => {
      const prod = products.find(p => p.id === item.productId);
      return prod && prod.returnType !== 'NO_RETURN';
    });
  }, [products, orderItems]);
 
  const getItemReturnLabel = (productId: string) => {
    if (!products) return '';
    const prod = products.find(p => p.id === productId);
    if (!prod) return '';
    const policyStr = prod.returnPolicy === 'REPLACE' ? 'Replace' : 'Return';
    if (prod.returnType === 'NO_RETURN') return t('No Return');
    if (prod.returnType === 'SEVEN_DAYS_RETURN') {
      return policyStr === 'Replace' ? `7 Days ${t('replacement')}` : t('7 Days Return');
    }
    return `Custom ${policyStr} Policy`;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded-lg"></div>
        <div className="h-40 bg-white border border-gray-100 rounded-3xl"></div>
        <div className="h-64 bg-white border border-gray-100 rounded-3xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <span className="text-6xl">🔍</span>
        <h2 className="font-display text-2xl font-bold text-amber-950">Order Not Found</h2>
        <p className="text-sm text-gray-500">We couldn't retrieve the details for order ID: {orderId}</p>
        <Link to="/orders" className="inline-flex items-center gap-1.5 px-6 h-10 bg-amber-900 text-white font-semibold rounded-full shadow-sm">
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }
 
  // Determine active steps in stepper
  const steps = [
    { label: 'Placed', active: true },
    { label: 'Confirmed', active: ['CONFIRMED', 'SHIPPED', 'DELIVERED'].includes(order.status) },
    { label: 'Shipped', active: ['SHIPPED', 'DELIVERED'].includes(order.status) },
    { label: 'Out for Delivery', active: order.status === 'DELIVERED' },
    { label: 'Delivered', active: order.status === 'DELIVERED' },
  ];

  // Mock tracking events logs
  const getTrackingEvents = () => {
    const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
    
    if (order.status === 'CANCELLED') {
      return [
        { time: '11:00 AM', date: formattedDate, desc: 'Order cancelled. Refund initiated to original payment source.' },
        { time: '10:00 AM', date: formattedDate, desc: 'Order placed successfully.' },
      ];
    }
    if (order.status === 'RETURN_REQUESTED') {
      return [
        { time: '04:15 PM', date: formattedDate, desc: 'Return request received. Pending warehouse receipt validation.' },
        { time: '02:45 PM', date: formattedDate, desc: 'Delivered - Package signed by customer at reception.' },
        { time: '10:00 AM', date: formattedDate, desc: 'Order placed successfully.' },
      ];
    }
    if (order.status === 'RETURNED') {
      return [
        { time: '09:30 AM', date: formattedDate, desc: 'Refund processed and completed.' },
        { time: '02:00 PM', date: formattedDate, desc: 'Return items received and verified at sorting center.' },
        { time: '02:45 PM', date: formattedDate, desc: 'Delivered - Left at front desk.' },
        { time: '10:00 AM', date: formattedDate, desc: 'Order placed successfully.' },
      ];
    }
    if (order.status === 'DELIVERED') {
      return [
        { time: '02:45 PM', date: formattedDate, desc: 'Delivered - Package left at front door. Handed to resident.' },
        { time: '09:00 AM', date: formattedDate, desc: 'Out for delivery with carrier local post courier.' },
        { time: '04:30 PM', date: formattedDate, desc: 'Package in transit with carrier.' },
        { time: '02:00 PM', date: formattedDate, desc: 'Packed and departed merchant fulfillment center.' },
        { time: '10:00 AM', date: formattedDate, desc: 'Order placed successfully.' },
      ];
    }
    if (order.status === 'SHIPPED') {
      return [
        { time: '04:30 PM', date: formattedDate, desc: 'Package in transit with carrier.' },
        { time: '02:00 PM', date: formattedDate, desc: 'Packed and departed merchant fulfillment center.' },
        { time: '11:30 AM', date: formattedDate, desc: 'Payment verification confirmed. Preparation for shipment.' },
        { time: '10:00 AM', date: formattedDate, desc: 'Order placed successfully.' },
      ];
    }
    return [
      { time: '11:30 AM', date: formattedDate, desc: 'Payment authorization confirmed. Awaiting shipping provider dispatch.' },
      { time: '10:00 AM', date: formattedDate, desc: 'Order placed successfully. Awaiting merchant confirmation.' },
    ];
  };

  const handleBuyItAgain = () => {
    orderItems.forEach((item: any) => {
      const mockProduct: any = {
        id: item.productId,
        name: item.productName || 'Aura Item',
        price: item.unitPrice || 0,
        category: 'Handcrafted',
        images: [],
        stockQuantity: 100,
        active: true
      };
      addToCart(mockProduct, item.quantity);
    });
    alert('All items from this order have been added to your bag!');
    navigate('/cart');
  };

  const handleCancelOrderSubmit = () => {
    cancelMutation.mutate(
      { id: order.id, reason: cancelReason },
      {
        onSuccess: () => {
          setIsCancelModalOpen(false);
          alert('Order cancelled successfully.');
        },
        onError: (err) => {
          alert('Failed to cancel order: ' + err.message);
        }
      }
    );
  };

  const handleReturnSubmit = () => {
    returnMutation.mutate(
      { id: order.id, reason: `${returnReason} - ${returnComment}` },
      {
        onSuccess: () => {
          setIsReturnModalOpen(false);
          alert('Return request submitted successfully.');
        },
        onError: (err) => {
          alert('Failed to return order: ' + err.message);
        }
      }
    );
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="print:hidden">
        <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 hover:text-amber-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('Your Orders')}</span>
        </Link>
      </div>
 
      {/* Invoice Card Container */}
      <div className="bg-white rounded-3xl border border-orange-100/20 shadow-sm overflow-hidden p-6 sm:p-8 space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Invoice Header details */}
        <div className="flex flex-wrap justify-between items-start gap-6 border-b border-orange-100/10 pb-6">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold text-amber-950">{t('Order Detail')}</h1>
            <p className="text-xs text-gray-400 font-mono">{t('Order ID')}: {order.id}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 pt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{t('Placed on')} {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}</span>
            </p>
          </div>
          
          <div className="print:hidden flex flex-wrap gap-2">
            <button
              onClick={printInvoice}
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-white border border-amber-100 hover:bg-amber-50 text-amber-900 text-xs font-semibold rounded-full shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Download Invoice</span>
            </button>
            <button
              onClick={handleBuyItAgain}
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold rounded-full shadow-sm transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('Buy Again')}</span>
            </button>
          </div>
        </div>

        {/* Stepper timeline */}
        {order.status !== 'CANCELLED' && (
          <div className="print:hidden py-4 border-b border-orange-100/10">
            <div className="flex justify-between items-center relative">
              {/* Stepper bar line */}
              <div className="absolute left-0 right-0 h-1 bg-gray-100 -z-10 top-1/2 transform -translate-y-1/2 rounded-full">
                <div
                  className="h-full bg-amber-900 transition-all duration-300 rounded-full"
                  style={{
                    width: `${
                      order.status === 'DELIVERED'
                        ? 100
                        : order.status === 'SHIPPED'
                        ? 50
                        : order.status === 'CONFIRMED'
                        ? 25
                        : 0
                    }%`
                  }}
                ></div>
              </div>

              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white transition-all ${
                      step.active
                        ? 'border-amber-900 text-amber-900 shadow-sm font-bold bg-amber-50/55'
                        : 'border-gray-200 text-gray-400 font-medium'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-[10px] sm:text-xs font-semibold text-amber-950 text-center">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancel/Return Status Banners */}
        {order.status === 'CANCELLED' && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-800">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Order Cancelled</h4>
              <p className="text-xs text-rose-700 mt-0.5">This transaction has been cancelled. If any charges were made, a refund will reflect within 5-7 business days.</p>
            </div>
          </div>
        )}

        {(order.status === 'RETURN_REQUESTED' || order.status === 'RETURNED') && (
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-3 text-orange-850">
            <RefreshCw className="w-6 h-6 text-orange-600 shrink-0 animate-spin-slow" />
            <div>
              <h4 className="font-semibold text-sm">
                {order.status === 'RETURN_REQUESTED' ? 'Return Requested' : 'Return Completed'}
              </h4>
              <p className="text-xs text-orange-800 mt-0.5">
                {order.status === 'RETURN_REQUESTED'
                  ? 'Your return request has been submitted and is currently being processed by the vendor.'
                  : 'The returned items have been received at our warehouse. A refund has been issued.'}
              </p>
            </div>
          </div>
        )}

        {/* Details Grid: Address & Summary info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-orange-100/10 pb-8">
          {/* Shipping details */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t('Shipping Address')}</h3>
            <div className="bg-gray-50 p-5 rounded-2xl border border-amber-50">
              <h4 className="font-semibold text-amber-950 text-sm">Aura Customer</h4>
              <p className="text-xs text-gray-500 mt-1 font-sans leading-relaxed">
                123 Design Studio Avenue, Apt 4B<br />
                SOHO Arts District<br />
                New York, NY 10012
              </p>
              <p className="text-[10px] text-gray-400 mt-3 font-mono">Estimated delivery: {order.status === 'DELIVERED' ? t('Delivered') : '5 days from shipping'}</p>
            </div>
          </div>
 
          {/* Payment breakdown summary */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t('Order Summary')}</h3>
            <div className="bg-gray-50 p-5 rounded-2xl border border-amber-50 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{t('Subtotal')}</span>
                <span>INR {(order.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-emerald-700 font-semibold">FREE</span>
              </div>
              <div className="h-[1px] bg-amber-100/60 my-2"></div>
              <div className="flex justify-between font-bold text-amber-950">
                <span>Total Amount Paid</span>
                <span>INR {(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized List */}
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-400">Items Purchased</h3>
          <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border border-orange-100/10">
            {orderItems.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center gap-6 p-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                    📦
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-950">{item.productName || 'Aura Goods'}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      {getItemReturnLabel(item.productId) && (
                        <>
                          <span className="text-gray-300 text-xs">•</span>
                          <span className="text-[10px] font-semibold text-[#ff3f6c] bg-pink-50 px-2 py-0.5 rounded border border-pink-100/50">
                            {getItemReturnLabel(item.productId)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-950 block">INR {(item.unitPrice ? item.unitPrice * item.quantity : 0).toFixed(2)}</span>
                  <span className="text-xs text-gray-400 block font-mono">INR {(item.unitPrice || 0).toFixed(2)} each</span>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* Package tracking updates */}
        <div className="print:hidden space-y-4 border-t border-orange-100/10 pt-8">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-900" />
            <h3 className="font-display text-lg font-bold text-amber-950">Track Package</h3>
          </div>
          <div className="relative border-l border-amber-900/10 pl-6 ml-3 space-y-6">
            {getTrackingEvents().map((evt, idx) => (
              <div key={idx} className="relative">
                {/* Stepper tracker dot */}
                <div className={`absolute -left-[29.5px] w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-amber-900 ring-4 ring-amber-100' : 'bg-gray-300'}`}></div>
                <div className="text-xs">
                  <span className="font-semibold text-amber-950 font-mono">{evt.date} at {evt.time}</span>
                  <p className="text-gray-500 mt-0.5">{evt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
 
        {/* Order modification options: Cancel / Return */}
        <div className="print:hidden border-t border-orange-100/10 pt-6 flex flex-wrap gap-3 justify-end">
          {/* Cancel button: Pending/Confirmed orders or Shipped orders under merchant options */}
          {(['PENDING', 'CONFIRMED'].includes(order.status) || (order.status === 'SHIPPED' && isCancelableAfterShipping)) && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-6 h-10 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold rounded-full shadow-sm transition-colors"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Order</span>
            </button>
          )}
 
          {/* Return item button: Delivered order */}
          {order.status === 'DELIVERED' && (
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-6 h-10 border border-orange-200 hover:bg-orange-50 text-orange-850 text-xs font-semibold rounded-full shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Return / Replace Item</span>
            </button>
          )}
        </div>

      </div>

      {/* Cancel Reason Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FCFAF7] rounded-3xl border border-orange-100/30 p-6 max-w-sm w-full space-y-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-display text-xl font-bold text-amber-950">Cancel Order</h3>
              <p className="text-xs text-gray-500 mt-1">Please select a reason for cancellation below.</p>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase">Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-white border border-amber-100 rounded-xl px-3 py-2 text-sm text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-900"
              >
                <option value="Change of mind">Change of mind</option>
                <option value="Incorrect shipping address">Incorrect shipping address</option>
                <option value="Accidental order">Accidental order</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Item delivery taking too long">Item delivery taking too long</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 h-9 bg-white border border-amber-100 text-amber-950 text-xs font-semibold rounded-full"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrderSubmit}
                disabled={cancelMutation.isPending}
                className="px-4 h-9 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-400 text-white text-xs font-semibold rounded-full shadow-sm transition-colors"
              >
                {cancelMutation.isPending ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Reason Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 bg-amber-950/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FCFAF7] rounded-3xl border border-orange-100/30 p-6 max-w-sm w-full space-y-5 shadow-xl animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-display text-xl font-bold text-amber-950">Return / Replace Request</h3>
              <p className="text-xs text-gray-500 mt-1">Please provide details regarding the return request.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase">Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-white border border-amber-100 rounded-xl px-3 py-2 text-sm text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-900"
                >
                  <option value="Product damaged">Product damaged or broken</option>
                  <option value="Item not as described">Item not as described</option>
                  <option value="Wrong item received">Wrong item received</option>
                  <option value="Quality below expectations">Quality below expectations</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-gray-400 uppercase">Comments (Optional)</label>
                <textarea
                  value={returnComment}
                  onChange={(e) => setReturnComment(e.target.value)}
                  placeholder="Tell us what went wrong..."
                  className="w-full bg-white border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-900 h-20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 h-9 bg-white border border-amber-100 text-amber-950 text-xs font-semibold rounded-full"
              >
                Go Back
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={returnMutation.isPending}
                className="px-4 h-9 bg-amber-900 hover:bg-amber-800 disabled:bg-amber-400 text-white text-xs font-semibold rounded-full shadow-sm transition-colors"
              >
                {returnMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
