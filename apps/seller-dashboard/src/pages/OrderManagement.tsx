import React from 'react';
import { useIncomingOrders, useShipOrder } from '@frontend/api-client';
import { ShoppingCart, Check, Truck } from 'lucide-react';

export const OrderManagement: React.FC = () => {
  const { data: orders, isLoading } = useIncomingOrders();
  const shipOrderMutation = useShipOrder();

  const handleShipClick = async (orderId: string) => {
    try {
      await shipOrderMutation.mutateAsync(orderId);
    } catch (err) {
      alert('Error updating order state.');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'SHIPPED':
        return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'PENDING':
      case 'CONFIRMED':
        return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-800 border-rose-100';
      case 'RETURN_REQUESTED':
      case 'RETURNED':
        return 'bg-orange-50 text-orange-850 border-orange-100';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Order Management</h1>
        <p className="text-sm text-slate-500 mt-1">Track incoming client orders and trigger shipping states.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center">
          <ShoppingCart className="w-12 h-12 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No incoming orders</p>
          <p className="text-xs text-slate-400 mt-1">Pending consumer activity will show up here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <th className="px-6 py-3.5">Order ID</th>
                <th className="px-6 py-3.5">Details</th>
                <th className="px-6 py-3.5">Total Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-600 select-all">{order.id}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Customer ID: {order.customerId.substring(0, 8)}...</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {order.items && (Array.isArray(order.items) ? order.items : JSON.parse(order.items as any)).map((item: any, i: number) => (
                        <div key={i} className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-900">{item.productName || 'Acoustics'}</span>
                          <span> x {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(order.status)}`}>
                      <span className="capitalize">{order.status.toLowerCase()}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {['PENDING', 'CONFIRMED'].includes(order.status) && (
                      <button
                        onClick={() => handleShipClick(order.id)}
                        disabled={shipOrderMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 h-8 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Ship Order</span>
                      </button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <span className="text-xs text-slate-400 font-semibold flex items-center justify-end gap-1">
                        <Check className="w-4 h-4 text-slate-400" />
                        <span>In Transit</span>
                      </span>
                    )}
                    {order.status === 'DELIVERED' && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Completed</span>
                      </span>
                    )}
                    {order.status === 'CANCELLED' && (
                      <span className="text-xs text-rose-600 font-semibold flex items-center justify-end gap-1">
                        <span>Cancelled by Customer</span>
                      </span>
                    )}
                    {['RETURN_REQUESTED', 'RETURNED'].includes(order.status) && (
                      <span className="text-xs text-orange-600 font-semibold flex items-center justify-end gap-1">
                        <span>Returned / Refunded</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
