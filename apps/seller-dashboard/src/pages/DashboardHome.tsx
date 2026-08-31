import React from 'react';
import { useSellerProducts, useIncomingOrders } from '@frontend/api-client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, DollarSign, Package, ShoppingBag, AlertTriangle } from 'lucide-react';

export const DashboardHome: React.FC = () => {
  const { data: products } = useSellerProducts();
  const { data: orders } = useIncomingOrders();

  // Aggregate metrics
  const sellerProductIds = new Set(products?.map((p) => p.id) || []);

  const totalSales = orders
    ?.filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => {
      const sellerItems = o.items ? (Array.isArray(o.items) ? o.items : JSON.parse(o.items as any)) : [];
      const orderSellerSum = sellerItems
        .filter((item: any) => sellerProductIds.has(item.productId))
        .reduce((itemSum: number, item: any) => itemSum + (item.unitPrice || item.price || 0) * item.quantity, 0);
      return sum + orderSellerSum;
    }, 0) || 0;

  const totalOrders = orders?.filter((o) => {
    const sellerItems = o.items ? (Array.isArray(o.items) ? o.items : JSON.parse(o.items as any)) : [];
    return sellerItems.some((item: any) => sellerProductIds.has(item.productId));
  }).length || 0;

  const lowStockProducts = products?.filter((p) => p.stockQuantity <= (p.lowStockThreshold !== undefined ? p.lowStockThreshold : 5)) || [];
  const lowStockCount = lowStockProducts.length;

  // Generate chart data based on actual orders grouped by current week's days (Mon-Sun)
  const getWeeklyRevenue = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const revenueMap: { [key: string]: number } = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };

    if (!orders || !products) {
      return days.map(d => ({ name: d, revenue: 0 }));
    }

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const daysTimestamps = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toDateString();
    });

    orders.forEach((o) => {
      if (o.status === 'CANCELLED') return;

      const sellerItems = o.items ? (Array.isArray(o.items) ? o.items : JSON.parse(o.items as any)) : [];
      const orderSellerSum = sellerItems
        .filter((item: any) => sellerProductIds.has(item.productId))
        .reduce((itemSum: number, item: any) => itemSum + (item.unitPrice || item.price || 0) * item.quantity, 0);

      if (!o.createdAt) return;
      const orderDate = new Date(o.createdAt);
      const orderDateString = orderDate.toDateString();

      const dayIndex = daysTimestamps.indexOf(orderDateString);
      if (dayIndex !== -1) {
        const dayName = days[dayIndex];
        revenueMap[dayName] += orderSellerSum;
      }
    });

    return days.map(d => ({
      name: d,
      revenue: revenueMap[d]
    }));
  };

  const chartData = getWeeklyRevenue();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your store performance and catalog inventory.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric Card 1 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Revenue</span>
            <p className="text-2xl font-bold text-slate-900">{totalSales.toFixed(2)}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase">Incoming Orders</span>
            <p className="text-2xl font-bold text-slate-900">{totalOrders}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase">Catalog Size</span>
            <p className="text-2xl font-bold text-slate-900">{products?.length || 0}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-semibold uppercase">Low Stock Alerts</span>
            <p className="text-2xl font-bold text-rose-600">{lowStockCount}</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Panel grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-semibold text-slate-900">Weekly Revenue Trends</h3>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <span>+12.4%</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Checklist */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">
              Low Inventory Alerts
            </h3>
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                All inventory quantities are healthy!
              </p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{p.category}</span>
                    </div>
                    <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold border border-rose-100">
                      {p.stockQuantity} Left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="text-[10px] text-slate-400 border-t border-slate-50 pt-2 block mt-auto">
            Updates in real-time as checkout occurs.
          </span>
        </div>
      </div>
    </div>
  );
};
