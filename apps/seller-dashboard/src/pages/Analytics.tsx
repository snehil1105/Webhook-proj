import React from 'react';
import { useSellerProducts, useIncomingOrders } from '@frontend/api-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Analytics: React.FC = () => {
  const { data: products } = useSellerProducts();
  const { data: orders } = useIncomingOrders();

  // Aggregate Category Stats
  const categoryCounts: { [key: string]: number } = {};
  const categoryRevenue: { [key: string]: number } = {};

  products?.forEach((p) => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + p.stockQuantity;
  });

  orders?.filter(o => o.status !== 'CANCELLED').forEach((o) => {
    const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items as any);
    items.forEach((item: any) => {
      // Find category of the product
      const product = products?.find(p => p.id === item.productId);
      const cat = product ? product.category : 'General';
      const itemRev = item.unitPrice ? item.unitPrice * item.quantity : 0;
      categoryRevenue[cat] = (categoryRevenue[cat] || 0) + itemRev;
    });
  });

  const categoryPieData = Object.keys(categoryCounts).map((cat) => ({
    name: cat,
    value: categoryCounts[cat],
  }));

  const revenueBarData = Object.keys(categoryRevenue).map((cat) => ({
    name: cat,
    revenue: categoryRevenue[cat],
  }));

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Deep-dive reports on sales revenue and inventory counts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Revenue Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">Revenue By Product Category</h3>
          <div className="h-64">
            {revenueBarData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-20">No revenue data available yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock Allocation Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">Stock Allocation By Category</h3>
          <div className="h-64 flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">No inventory items mapped.</p>
            ) : (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-xs">
                  {categoryPieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="font-semibold text-slate-700">{entry.name}</span>
                      <span className="text-slate-400">({entry.value} units)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
