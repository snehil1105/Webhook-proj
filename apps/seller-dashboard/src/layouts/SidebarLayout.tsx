import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings, LogOut, Store, Tag, Users } from 'lucide-react';
import { useSellerProfile } from '@frontend/api-client';
 
export const SidebarLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('seller_token');
  const sellerEmail = localStorage.getItem('seller_email') || 'Seller Portal';
 
  const { data: profile } = useSellerProfile({ enabled: !!token });
  const shopName = profile?.name || 'MerchantHub';
 
  // Auth Guard
  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);
 
  const handleLogout = () => {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_email');
    localStorage.removeItem('seller_name');
    navigate('/login');
  };
 
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Orders', path: '/orders', icon: ShoppingCart },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Coupons', path: '/coupons', icon: Tag },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar Nav */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          {/* Logo / Header */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
            <Store className="w-6 h-6 text-[#ff3f6c]" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-800">{shopName}</span>
          </div>

          {/* Nav list */}
          <nav className="px-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-[#ff3f6c]/10 text-[#ff3f6c]' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#ff3f6c]'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#ff3f6c]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info / Logout */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="px-2 truncate">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Store</span>
            <span className="text-xs font-semibold text-[#ff3f6c] block truncate mb-1">{shopName}</span>
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Logged in as</span>
            <span className="text-xs font-semibold text-slate-600 block truncate">{sellerEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Portal</span>
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <div className="flex-grow flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Portal Control</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500">Live Connection</span>
          </div>
        </header>
        
        <main className="flex-grow p-8 bg-slate-50 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
