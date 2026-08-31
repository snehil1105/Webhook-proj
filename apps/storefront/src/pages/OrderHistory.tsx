import React, { useState } from 'react';
import { useCustomerOrders } from '@frontend/api-client';
import { Calendar, Check, Clock, AlertTriangle, Search, Eye, CornerUpLeft, Truck, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
 
export const OrderHistory: React.FC = () => {
  const { t } = useLanguage();
  const { data: orders, isLoading } = useCustomerOrders();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'BUY_AGAIN' | 'NOT_SHIPPED'>('ORDERS');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Check className="w-4 h-4 text-emerald-600" />;
      case 'SHIPPED':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'PENDING':
      case 'CONFIRMED':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'RETURN_REQUESTED':
        return <CornerUpLeft className="w-4 h-4 text-orange-600" />;
      case 'RETURNED':
        return <CornerUpLeft className="w-4 h-4 text-rose-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'SHIPPED':
        return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'PENDING':
      case 'CONFIRMED':
        return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'RETURN_REQUESTED':
      case 'RETURNED':
        return 'bg-orange-50 text-orange-850 border-orange-100';
      default:
        return 'bg-rose-50 text-rose-800 border-rose-100';
    }
  };

  const matchesDate = (orderDateStr?: string, filter?: string) => {
    if (!orderDateStr) return true;
    if (filter === 'ALL') return true;

    const orderDate = new Date(orderDateStr);
    const now = new Date();

    if (filter === '30_DAYS') {
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    if (filter === '3_MONTHS') {
      const targetDate = new Date();
      targetDate.setMonth(now.getMonth() - 3);
      return orderDate >= targetDate;
    }
    if (filter === '6_MONTHS') {
      const targetDate = new Date();
      targetDate.setMonth(now.getMonth() - 6);
      return orderDate >= targetDate;
    }
    if (filter === 'CUSTOM') {
      if (customFrom && customTo) {
        const fromDate = new Date(customFrom);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(customTo);
        toDate.setHours(23, 59, 59, 999);
        return orderDate >= fromDate && orderDate <= toDate;
      }
      return true;
    }
    return true;
  };

  const filteredOrders = React.useMemo(() => {
    return (orders || []).filter((order) => {
      // 1. Search Query (order ID or product name)
      const matchesQuery = searchQuery.trim() === ''
        ? true
        : order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (order.items && (Array.isArray(order.items) ? order.items : JSON.parse(order.items as any)).some((item: any) =>
            item.productName?.toLowerCase().includes(searchQuery.toLowerCase())
          ));

      // 2. Date Filter
      const matchesDt = matchesDate(order.createdAt, dateFilter);

      return matchesQuery && matchesDt;
    });
  }, [orders, searchQuery, dateFilter, customFrom, customTo]);

  const finalOrders = React.useMemo(() => {
    let result = filteredOrders;
    if (activeTab === 'NOT_SHIPPED') {
      result = result.filter(order => order.status === 'PENDING' || order.status === 'CONFIRMED');
    }
    return result;
  }, [filteredOrders, activeTab]);

  const buyAgainItems = React.useMemo(() => {
    const itemsMap = new Map<string, { productId: string; productName: string; unitPrice: number }>();
    (orders || []).forEach(order => {
      if (order.status === 'CANCELLED') return;
      const items = order.items ? (Array.isArray(order.items) ? order.items : JSON.parse(order.items as any)) : [];
      items.forEach((item: any) => {
        if (item.productId && !itemsMap.has(item.productId)) {
          itemsMap.set(item.productId, {
            productId: item.productId,
            productName: item.productName || 'Aura Item',
            unitPrice: item.unitPrice || 0
          });
        }
      });
    });
    return Array.from(itemsMap.values());
  }, [orders]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="font-display text-4xl font-bold text-slate-800">{t('Order History')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('Track status and review your previous purchases.')}</p>
      </div>

      {/* Search & Filters Action Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search box */}
          <div className="relative md:col-span-2">
            <input
              type="text"
              placeholder={t('Search items...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
            />
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-gray-400" />
          </div>

          {/* Date range selection */}
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff3f6c] h-[38px] font-medium text-slate-700"
            >
              <option value="ALL">{t('All Orders')}</option>
              <option value="30_DAYS">{t('Last 30 Days')}</option>
              <option value="3_MONTHS">{t('Last 3 Months')}</option>
              <option value="6_MONTHS">{t('Last 6 Months')}</option>
              <option value="CUSTOM">{t('Custom Date Range')}</option>
            </select>
          </div>
        </div>

        {/* Custom date range fields */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex flex-wrap gap-4 items-center animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{t('From')}</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">{t('To')}</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
              />
            </div>
          </div>
        )}

        {/* Amazon-style Tabs */}
        <div className="flex border-b border-slate-200 gap-4">
          {[
            { id: 'ORDERS', label: 'Orders' },
            { id: 'BUY_AGAIN', label: 'Buy Again' },
            { id: 'NOT_SHIPPED', label: 'Not Yet Shipped' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-[1px] ${
                activeTab === tab.id
                  ? 'border-[#ff3f6c] text-[#ff3f6c]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Container */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white border border-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : activeTab === 'BUY_AGAIN' ? (
        buyAgainItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
            <span className="text-6xl mb-4">🛒</span>
            <p className="font-accent text-3xl text-gray-400">no products ordered yet</p>
            <p className="text-xs text-gray-400 mt-2">Products you purchase will appear here for quick re-ordering.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {buyAgainItems.map((item) => (
              <div key={item.productId} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm line-clamp-2">{item.productName}</h4>
                  <span className="font-bold text-slate-700 text-sm mt-1 block">INR {item.unitPrice.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => {
                    const mockProduct: any = {
                      id: item.productId,
                      name: item.productName,
                      price: item.unitPrice,
                      category: 'Handcrafted',
                      images: [],
                      stockQuantity: 100,
                      active: true
                    };
                    addToCart(mockProduct, 1);
                    alert('Product added to your bag!');
                  }}
                  className="w-full py-2 bg-[#ff3f6c] hover:bg-[#e0355c] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t('Buy Again')}</span>
                </button>
              </div>
            ))}
          </div>
        )
      ) : finalOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center">
          <span className="text-6xl mb-4">📦</span>
          <p className="font-accent text-3xl text-gray-400">no orders match filters</p>
          <p className="text-xs text-gray-400 mt-2">Try relaxing your search terms or filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {finalOrders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => navigate(`/orders/${order.id}`)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100 hover:border-slate-350 transition-all cursor-pointer group hover:shadow-md text-left"
            >
              {/* Card Header details */}
              <div className="p-5 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold tracking-wider">{t('Placed on')}</span>
                    <span className="text-sm text-slate-800 font-medium flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Today'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold tracking-wider">{t('Total')}</span>
                    <span className="text-sm font-bold text-slate-800 block mt-0.5">INR {order.totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase block font-semibold tracking-wider">{t('Order ID')}</span>
                    <span className="text-xs font-mono text-slate-500 block mt-0.5 truncate max-w-[120px]">{order.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusClass(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{t(order.status)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 h-8 bg-slate-50 group-hover:bg-[#ff3f6c]/10 text-slate-600 group-hover:text-[#ff3f6c] text-xs font-semibold rounded-full border border-slate-200 group-hover:border-[#ff3f6c]/20 transition-all">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('Order Detail')}</span>
                  </span>
                </div>
              </div>

              {/* Items in order */}
              <div className="p-5 space-y-4">
                {order.items && (Array.isArray(order.items) ? order.items : JSON.parse(order.items as any)).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-slate-800 group-hover:text-[#ff3f6c] transition-colors">{item.productName || 'Aura Item'}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Quantity: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-slate-700">INR {(item.unitPrice ? item.unitPrice * item.quantity : 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
