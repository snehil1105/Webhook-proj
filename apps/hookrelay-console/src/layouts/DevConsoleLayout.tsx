import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Terminal, Radio, TableProperties, Key, LogOut } from 'lucide-react';

export const DevConsoleLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('hookrelay_token');
  const developerEmail = localStorage.getItem('hookrelay_email') || 'Developer Portal';

  // Auth Guard
  React.useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('hookrelay_token');
    localStorage.removeItem('hookrelay_email');
    localStorage.removeItem('hookrelay_name');
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/', icon: Terminal },
    { label: 'Endpoints', path: '/endpoints', icon: Radio },
    { label: 'Request Logs', path: '/logs', icon: TableProperties },
    { label: 'API Keys', path: '/keys', icon: Key },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Panel */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          
          {/* Logo with Acthirey Display Serif */}
          <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="font-display text-lg font-bold tracking-tight text-white">HookRelay</span>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive 
                      ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-500/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Developer credentials */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="px-2 truncate">
            <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-mono">Dev ID</span>
            <span className="text-xs font-mono text-indigo-300 block truncate">{developerEmail}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-450 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <div className="flex-grow flex flex-col min-h-screen">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8">
          <div>
            <span className="text-xs font-mono text-slate-500">HOOKRELAY_CONSOLE_V1.0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-[10px] font-mono text-slate-400">Stream listening...</span>
          </div>
        </header>

        <main className="flex-grow p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
