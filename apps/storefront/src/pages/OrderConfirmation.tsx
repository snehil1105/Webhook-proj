import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';

export const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const method = searchParams.get('method') || '';

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-8">
      
      {/* Circle Icon */}
      <div className="flex justify-center">
        <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 animate-pulse">
          <CheckCircle className="w-16 h-16" />
        </div>
      </div>

      <div className="space-y-3">
        {/* Accent Starfish script */}
        <p className="font-accent text-4xl text-amber-700 select-none">
          thank you for your purchase!
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-amber-950">
          Order Confirmed
        </h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto font-sans leading-relaxed">
          {method === 'COD'
            ? "Your order has been placed successfully. Please have cash ready to pay upon delivery."
            : "Your order has been placed successfully and is being prepared for shipping. We've sent a receipt to your email."
          }
        </p>
      </div>

      {orderId && (
        <div className="bg-amber-50/50 border border-amber-100/40 p-4 rounded-2xl max-w-xs mx-auto text-sm space-y-1">
          <span className="text-gray-400 block uppercase tracking-wider text-[10px] font-semibold">Order Reference ID</span>
          <span className="font-mono text-amber-900 font-bold block select-all">{orderId}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link to="/products" className="inline-flex items-center gap-1.5 px-6 h-10 bg-amber-900 hover:bg-amber-800 text-white font-semibold rounded-full shadow-sm transition-colors">
          <span>Continue Shopping</span>
          <ShoppingBag className="w-4 h-4" />
        </Link>
        <Link to="/orders" className="inline-flex items-center gap-1.5 px-6 h-10 bg-white border border-amber-200 hover:bg-amber-50/50 text-amber-950 font-semibold rounded-full transition-colors">
          <span>Track Order</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </Link>
      </div>

    </div>
  );
};
