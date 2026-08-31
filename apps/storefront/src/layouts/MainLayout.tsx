import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, MapPin, Globe, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSearchProducts } from '@frontend/api-client';
import { useAddresses } from '../context/AddressContext';
import { useLanguage, languageOptions } from '../context/LanguageContext';
 
export const MainLayout: React.FC = () => {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const token = localStorage.getItem('storefront_token');
  const userEmail = localStorage.getItem('storefront_email') || 'Account';
  
  const { language, setLanguage, t } = useLanguage();
  
  const { addresses, selectedAddress, addAddress, setDefaultAddress, setSelectedAddress } = useAddresses();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addrForm, setAddrForm] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });
 
  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.name.trim() || !addrForm.street.trim() || !addrForm.city.trim() || !addrForm.state.trim() || !addrForm.zipCode.trim()) {
      alert("Please fill all fields.");
      return;
    }
    addAddress(addrForm);
    setAddrForm({ name: '', street: '', city: '', state: '', zipCode: '' });
    setShowAddForm(false);
  };
 
  // Global Search state
  const [searchVal, setSearchVal] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const { data: suggestions } = useSearchProducts(debouncedQuery, {
    enabled: debouncedQuery.length >= 2
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      setShowDropdown(false);
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('storefront_token');
    localStorage.removeItem('storefront_email');
    localStorage.removeItem('storefront_name');
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#EAEDED] text-[#0F1111] font-sans antialiased">
      {/* Light Myntra-Style Header */}
      <header className="sticky top-0 z-40 bg-white text-slate-800 border-b border-slate-200 shadow-sm print:hidden select-none">
        {/* Main top header row */}
        <div className="w-full px-8 h-16 flex items-center justify-between gap-6 text-sm">
          
          {/* Logo */}
          <Link to="/" className="flex items-center h-12 px-2 transition-colors text-[22px] font-extrabold tracking-tight shrink-0 text-[#ff3f6c] hover:opacity-95">
            AuraRetail
          </Link>
 
          {/* Location */}
          <div 
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-center gap-1.5 px-2 h-12 transition-colors cursor-pointer shrink-0 text-slate-700 hover:text-[#ff3f6c]"
          >
            <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('Deliver to')}</span>
              <span className="text-[12px] font-bold truncate max-w-[100px]">
                {selectedAddress ? selectedAddress.city : 'Haldwani'}
              </span>
            </div>
          </div>
 
          {/* Main Search Bar */}
          <div ref={dropdownRef} className="flex-1 relative max-w-xl flex items-center">
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center h-10 bg-[#f5f5f6] rounded-[4px] border border-transparent focus-within:border-slate-350 focus-within:bg-white transition-all px-3">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={t('Search for products, brands and more')}
                className="flex-grow h-full text-[13px] text-slate-800 bg-transparent focus:outline-none placeholder-slate-400 font-normal"
              />
            </form>
 
            {/* Suggestions Dropdown */}
            {showDropdown && searchVal.length >= 2 && suggestions && (
              <div className="absolute left-0 right-0 top-11 bg-white rounded-md shadow-lg border border-[#D5D9D9] max-h-60 overflow-y-auto z-50 divide-y divide-gray-100 py-1">
                {suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-gray-400 italic">No matches found</div>
                ) : (
                  suggestions.slice(0, 5).map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setShowDropdown(false);
                        setSearchVal('');
                        navigate(`/products/${prod.id}`);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 transition-colors text-black"
                    >
                      <span className="text-lg shrink-0">
                        {prod.category === 'Electronics' ? '🎧' : prod.category === 'Clothing' ? '👕' : '📚'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 truncate">{prod.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">INR {prod.price.toFixed(2)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
 
          {/* Language Selector */}
          <div className="relative group h-12 flex items-center shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 transition-colors cursor-pointer text-slate-700 hover:text-[#ff3f6c]">
              <Globe className="w-4 h-4 text-slate-400" />
              <span className="text-[12px] font-bold uppercase">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
 
            {/* Language Dropdown popover */}
            <div className="absolute right-0 top-12 bg-white text-black border border-[#D5D9D9] rounded-2xl shadow-lg py-3 px-4 z-50 w-52 hidden group-hover:block space-y-2 font-sans text-left">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Change Language</span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {languageOptions.map((opt) => {
                  const isSelected = language === opt.code;
                  return (
                    <label 
                      key={opt.code}
                      onClick={() => setLanguage(opt.code)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-[#ff3f6c] bg-[#ff3f6c]/5 text-[#ff3f6c]' 
                          : 'border-slate-100 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{opt.nativeName} - {opt.code}</span>
                      <input
                        type="radio"
                        name="lang_selection"
                        checked={isSelected}
                        onChange={() => setLanguage(opt.code)}
                        className="w-3.5 h-3.5 text-[#ff3f6c] accent-[#ff3f6c]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
 
          {/* Account & Lists Dropdown (Hover using group/group-hover) */}
          <div className="relative group h-12 flex items-center shrink-0">
            <div className="flex flex-col text-left leading-tight px-2 py-1 transition-colors cursor-pointer w-full text-slate-700 hover:text-[#ff3f6c]">
              <span className="text-[10px] text-slate-455 text-slate-400 uppercase font-bold tracking-wider">
                {token ? `Hello, ${userEmail.split('@')[0]}` : 'Profile'}
              </span>
              <span className="text-[12px] font-bold flex items-center gap-1 mt-0.5">
                <span>Account & Lists</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-455" />
              </span>
            </div>
 
            {/* Dropdown Box */}
            <div className="absolute right-0 top-12 bg-white text-black border border-[#D5D9D9] rounded shadow-lg py-4 px-5 z-50 w-64 hidden group-hover:block space-y-3 font-sans">
              <div className="border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-900 text-sm">
                  {token ? `Hello, ${userEmail.split('@')[0]}` : 'Hello Customer'}
                </span>
              </div>
              <div className="flex flex-col space-y-2 text-xs font-semibold">
                <Link to="/orders" className="text-[#007185] hover:text-[#C7511F] hover:underline">Your Orders</Link>
                <Link to="/profile" className="text-[#007185] hover:text-[#C7511F] hover:underline">Your Addresses</Link>
                <Link to="/profile" className="text-[#007185] hover:text-[#C7511F] hover:underline">Login & Security</Link>
                <Link to="/profile" className="text-[#007185] hover:text-[#C7511F] hover:underline">Payment Options</Link>
                <a href="#" onClick={(e) => { e.preventDefault(); alert("Contact us at support@auraretail.com"); }} className="text-[#007185] hover:text-[#C7511F] hover:underline">Contact Us</a>
              </div>
              <div className="border-t border-gray-100 pt-2 flex flex-col space-y-2 text-xs font-semibold">
                <span className="font-bold text-gray-900 text-xs">Sell on AuraRetail</span>
                <a href="http://localhost:3001/login" className="text-[#007185] hover:text-[#C7511F] hover:underline">Seller Login</a>
                <a href="http://localhost:3001/register" className="text-[#007185] hover:text-[#C7511F] hover:underline">Register as Seller</a>
              </div>
              {token ? (
                <button 
                  onClick={handleLogout} 
                  className="w-full text-center py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-[8px] font-semibold text-xs transition-colors mt-2"
                >
                  Sign Out
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="block w-full text-center py-1.5 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] rounded-[8px] font-semibold text-xs transition-colors mt-2 text-black"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
 
          {/* Returns & Orders */}
          <Link to="/orders" className="flex flex-col text-left leading-tight px-2 py-1 transition-colors shrink-0 text-slate-700 hover:text-[#ff3f6c]">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('Returns & Orders')}</span>
          </Link>
 
          {/* Cart Icon with badge count */}
          <Link to="/cart" className="flex items-end gap-1 px-2 py-1 transition-colors shrink-0 relative text-slate-700 hover:text-[#ff3f6c] h-12">
            <div className="relative mb-0.5">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#ff3f6c] text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="text-[12px] font-bold">{t('Cart')}</span>
          </Link>
 
        </div>
 
        {/* Secondary Sub-navigation bar */}
        <div className="bg-white text-slate-700 text-[12px] h-10 flex items-center px-4 overflow-x-auto whitespace-nowrap scrollbar-none font-semibold border-t border-slate-100 tracking-wider uppercase">
          <div className="w-full px-4 flex items-center gap-6">
            <Link to="/" className="flex items-center py-1 transition-colors hover:text-[#ff3f6c]">
              {t('All')}
            </Link>
            <Link to="/products" className="flex items-center py-1 transition-colors hover:text-[#ff3f6c]">
              {t("TODAY'S DEALS")}
            </Link>
            <Link to="/products?category=Electronics" className="flex items-center py-1 transition-colors hover:text-[#ff3f6c]">
              {t('Electronics')}
            </Link>
            <Link to="/products?category=Clothing" className="flex items-center py-1 transition-colors hover:text-[#ff3f6c]">
              {t('CLOTHES')}
            </Link>
            <Link to="/products" className="flex items-center py-1 transition-colors hover:text-[#ff3f6c]">
              {t('BEST SELLERS')}
            </Link>
            <a href="mailto:snehilvarnit@gmail.com?subject=AuraRetail%20Customer%20Support" className="flex items-center py-1 transition-colors hover:text-[#ff3f6c] normal-case">
              {t('Customer Service')}
            </a>
          </div>
        </div>
      </header>

      {/* Main content viewport */}
      <main className="flex-grow w-full px-8 py-6">
        <Outlet />
      </main>

      {/* Dark Footer */}
      <footer className="bg-[#232F3E] text-[#EAEDED] py-10 mt-12 border-t border-[#131921] print:hidden">
        <div className="w-full px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-bold mb-3 font-sans">AuraRetail</h3>
            <p className="text-sm text-gray-300 max-w-xs font-normal">
              High-quality goods, reliable customer support, and fast delivery processing brought straight to you.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3 font-sans">Shop Navigation</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link to="/products" className="hover:text-white transition-colors hover:underline">All Products</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors hover:underline">My Cart</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors hover:underline">Track Order</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-white mb-3 font-sans">Brand Information</h4>
            <p className="text-sm text-gray-300">
              Reliable e-commerce platform processing secure transaction workflows.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              © {new Date().getFullYear()} AuraRetail. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Address Selection Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-[#0F1111]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-5 shadow-xl animate-in zoom-in-95 duration-200 text-left">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-display text-lg font-bold text-slate-800">Select Delivery Location</h3>
              <button 
                onClick={() => { setIsAddressModalOpen(false); setShowAddForm(false); }}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* List of addresses */}
            {!showAddForm ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Choose a default address for ordering or select a temporary one.</p>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddress?.id === addr.id;
                    return (
                      <div 
                        key={addr.id}
                        onClick={() => setSelectedAddress(addr.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-4 ${
                          isSelected 
                            ? 'border-[#ff3f6c] bg-[#ff3f6c]/5' 
                            : 'border-slate-200 hover:border-slate-350'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">{addr.name}</span>
                            {addr.isDefault && (
                              <span className="bg-slate-100 text-slate-550 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase">Default</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {addr.street}<br />
                            {addr.city}, {addr.state} {addr.zipCode}
                          </p>
                        </div>

                        {/* Set default button if not default */}
                        {!addr.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDefaultAddress(addr.id);
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-[#ff3f6c] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-1 transition-all shrink-0"
                          >
                            Set Default
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  + Add New Address
                </button>
              </div>
            ) : (
              /* Add address form */
              <form onSubmit={handleAddAddressSubmit} className="space-y-4">
                <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">New Shipping Address</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Address Label (e.g. Home, Office)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Home"
                      value={addrForm.name}
                      onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      placeholder="123 Design Studio Ave, Apt 4B"
                      value={addrForm.street}
                      onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">City</label>
                      <input
                        type="text"
                        required
                        placeholder="New York"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">State</label>
                      <input
                        type="text"
                        required
                        placeholder="NY"
                        value={addrForm.state}
                        onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Zip Code</label>
                      <input
                        type="text"
                        required
                        placeholder="10012"
                        value={addrForm.zipCode}
                        onChange={(e) => setAddrForm({ ...addrForm, zipCode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 h-9 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 bg-[#ff3f6c] hover:bg-[#e0355c] text-white text-xs font-semibold rounded-full shadow-sm"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
