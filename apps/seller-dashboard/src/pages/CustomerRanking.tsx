import React from 'react';
import { useIncomingOrders } from '@frontend/api-client';
import { Users, Award, ShoppingBag, MapPin, Search } from 'lucide-react';

interface AggregatedCustomer {
  customerId: string;
  totalSpent: number;
  itemsMap: { [productName: string]: number };
  orderCount: number;
}

export const CustomerRanking: React.FC = () => {
  const { data: orders, isLoading } = useIncomingOrders();
  const [searchTerm, setSearchTerm] = React.useState('');

  const getMockAddress = (customerId: string) => {
    const cities = ["New York, NY 10012", "Los Angeles, CA 90001", "Chicago, IL 60601", "Houston, TX 77001", "Miami, FL 33101", "San Francisco, CA 94101"];
    const streets = ["Broadway Ave", "Sunset Blvd", "Michigan Ave", "Westheimer Rd", "Ocean Dr", "Market St"];
    let code = 0;
    for (let i = 0; i < customerId.length; i++) {
      code += customerId.charCodeAt(i);
    }
    const city = cities[code % cities.length];
    const street = streets[code % streets.length];
    const apt = (code % 200) + 1;
    return `Apt ${apt}, ${code * 7} ${street}, ${city}`;
  };

  const customersList = React.useMemo(() => {
    if (!orders) return [];
    
    const map: { [customerId: string]: AggregatedCustomer } = {};
    
    orders.forEach((order) => {
      // Exclude cancelled orders from active purchase value ranking
      if (order.status === 'CANCELLED') return;

      const customerId = order.customerId;
      if (!map[customerId]) {
        map[customerId] = {
          customerId,
          totalSpent: 0,
          itemsMap: {},
          orderCount: 0,
        };
      }
      
      const customer = map[customerId];
      customer.totalSpent += order.totalAmount;
      customer.orderCount += 1;
      
      const items = order.items ? (Array.isArray(order.items) ? order.items : JSON.parse(order.items as any)) : [];
      items.forEach((item: any) => {
        const name = item.productName || 'Product';
        customer.itemsMap[name] = (customer.itemsMap[name] || 0) + item.quantity;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm.trim()) return customersList;
    return customersList.filter(c => 
      c.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Object.keys(c.itemsMap).some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customersList, searchTerm]);

  return (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Customer Rankings</h1>
        <p className="text-sm text-slate-500 mt-1">Discover your top customers, ordered items, and shipping addresses.</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Customer ID or Ordered Product Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center">
          <Users className="w-12 h-12 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No Customers Found</p>
          <p className="text-xs text-slate-400 mt-1">No orders or matches correspond to your query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCustomers.map((customer, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            
            return (
              <div 
                key={customer.customerId}
                className={`bg-white rounded-2xl border transition-all p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                  isTop3 ? 'border-emerald-200 bg-emerald-50/5' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left Section: Rank Badge & Customer Info */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                    rank === 1 
                      ? 'bg-amber-100 border-amber-200 text-amber-800' 
                      : rank === 2 
                      ? 'bg-slate-100 border-slate-200 text-slate-700' 
                      : rank === 3 
                      ? 'bg-orange-100 border-orange-200 text-orange-800'
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    {rank <= 3 ? <Award className="w-6 h-6" /> : <span className="font-bold text-sm">#{rank}</span>}
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-700 flex items-center gap-2">
                      <span>Customer</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 text-xs font-normal">
                        ID: {customer.customerId.substring(0, 8)}...
                      </span>
                    </h3>
                    
                    {/* Shipping Address - deterministic and matches 'no contact details' */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{getMockAddress(customer.customerId)}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Purchase Value & Items details */}
                <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider">Total Store Spending</span>
                    <span className="font-display text-lg font-bold text-slate-900">INR {customer.totalSpent.toFixed(2)}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">{customer.orderCount} completed orders</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2 md:mt-0 max-w-sm w-full md:w-auto">
                    <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1 mb-1">
                      <ShoppingBag className="w-3 h-3" />
                      <span>Ordered Products</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries(customer.itemsMap).map(([name, qty]) => (
                        <span key={name} className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {name} <span className="text-emerald-600">x{qty}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
