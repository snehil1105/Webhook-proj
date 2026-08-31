import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { usePublicProducts, useSearchProducts, useWishlist, useAddToWishlist, useRemoveFromWishlist, formatImageUrl } from '@frontend/api-client';
import { useCart } from '../context/CartContext';
import { Search, Filter, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
 
export const Catalog: React.FC = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  const { data: allProducts, isLoading: loadingAll } = usePublicProducts();
  const { data: searchedProducts, isLoading: loadingSearch } = useSearchProducts(searchQuery, {
    enabled: !!searchQuery
  });

  const { addToCart } = useCart();
  const { data: wishlist } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const isWishlisted = (id: string) => {
    return (wishlist || []).some((w) => w.id === id);
  };

  const handleWishlistToggle = (id: string) => {
    if (isWishlisted(id)) {
      removeFromWishlist.mutate(id);
    } else {
      addToWishlist.mutate(id);
    }
  };
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('default');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const itemsPerPage = 12;

  const products = searchQuery ? searchedProducts : allProducts;
  const isLoading = searchQuery ? loadingSearch : loadingAll;

  // Filter products locally on category, price range, and stock
  const filteredProducts = (products || []).filter((product) => {
    const matchesCategory = categoryFilter ? product.category.toLowerCase() === categoryFilter.toLowerCase() : true;
    const matchesPrice = product.price <= maxPrice;
    const matchesStock = inStockOnly ? product.stockQuantity > 0 : true;
    return matchesCategory && matchesPrice && matchesStock;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0; // default
  });

  // Paginated products
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleCategoryClick = (cat: string) => {
    const params = new URLSearchParams(searchParams);
    if (cat) {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
    setCurrentPage(1); // reset to page 1
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = (e.currentTarget.elements.namedItem('search') as HTMLInputElement).value;
    const params = new URLSearchParams(searchParams);
    if (query) {
      params.set('search', query);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
    setCurrentPage(1);
  };

  const categories = Array.from(new Set((allProducts || []).map((p) => p.category)));

  return (
    <div className="w-full py-2 space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-slate-800">{t('Shop Collection')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('Browse all premium offerings crafted with care.')}</p>
      </div>

      {/* Categories chips horizontal scroll bar at the top */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <button
          onClick={() => handleCategoryClick('')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all shrink-0 ${
            !categoryFilter
              ? 'bg-[#ff3f6c] text-white border-[#ff3f6c]'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
          }`}
        >
          {t('All Offerings')}
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-all shrink-0 ${
              categoryFilter.toLowerCase() === cat.toLowerCase()
                ? 'bg-[#ff3f6c] text-white border-[#ff3f6c]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
            }`}
          >
            {t(cat)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Filter Panel (Left) */}
        <aside className="space-y-6 pr-6 border-r border-slate-200 h-fit">
          <div className="flex items-center gap-2 font-semibold text-slate-800 border-b border-gray-100 pb-3">
            <Filter className="w-4 h-4" />
            <span>{t('Filter Catalog')}</span>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder={t('Search items...')}
              className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff3f6c]"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-gray-400 hover:text-[#ff3f6c]">
              <Search className="w-4.5 h-4.5" />
            </button>
          </form>
 
          {/* Categories Filter (Vertical fallback) */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t('Categories')}</h4>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => handleCategoryClick('')}
                className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  !categoryFilter ? 'bg-[#ff3f6c] text-white font-medium' : 'text-gray-600 hover:bg-slate-50'
                }`}
              >
                {t('All Categories')}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    categoryFilter.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#ff3f6c] text-white font-medium'
                      : 'text-gray-600 hover:bg-slate-50'
                  }`}
                >
                  {t(cat)}
                </button>
              ))}
            </div>
          </div>
 
          {/* Price Range Filter */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider font-semibold text-gray-400">
              <span>{t('Max Price')}</span>
              <span className="text-[#ff3f6c] font-bold">INR {maxPrice.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full accent-[#ff3f6c]"
            />
          </div>
 
          {/* In Stock toggle */}
          <div className="space-y-2 border-t border-slate-100 pt-4 flex items-center justify-between">
            <label htmlFor="inStock" className="text-xs uppercase tracking-wider font-semibold text-gray-400 cursor-pointer">
              {t('In Stock Only')}
            </label>
            <input
              id="inStock"
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded border-slate-200 text-[#ff3f6c] focus:ring-[#ff3f6c] accent-[#ff3f6c] cursor-pointer"
            />
          </div>
 
          {/* Sorting */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">{t('Sort By')}</h4>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff3f6c] text-slate-700 font-medium"
            >
              <option value="default">{t('Default')}</option>
              <option value="price-asc">{t('Price: Low to High')}</option>
              <option value="price-desc">{t('Price: High to Low')}</option>
              <option value="name-asc">Alphabetical: A-Z</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </aside>

        {/* Product Grid Panel (Right) */}
        <div className="lg:col-span-3 space-y-8 lg:pl-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse p-4 space-y-4" />
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <span className="text-6xl mb-4">🔍</span>
              <p className="font-accent text-3xl text-gray-400">no products match filters</p>
              <p className="text-xs text-gray-400 mt-2">Try relaxing your price range or search terms.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                    <div className="relative aspect-[4/3] bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={formatImageUrl(product.images[0])}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-xl"
                        />
                      ) : (
                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">
                          {product.category === 'Electronics' ? '🎧' : product.category === 'Clothing' ? '👕' : '📚'}
                        </span>
                      )}
                      <span className="absolute top-3 left-3 bg-white/95 px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#ff3f6c] border border-slate-100">
                        {product.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWishlistToggle(product.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 shadow-sm border border-slate-100 text-rose-500 hover:scale-110 transition-transform z-10"
                        title={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted(product.id) ? 'fill-rose-500' : 'text-gray-500'}`} />
                      </button>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <Link to={`/products/${product.id}`} className="block font-semibold text-slate-800 hover:underline truncate">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-500">
                          <span>★</span>
                          <span>{product.averageRating ? product.averageRating.toFixed(1) : '0.0'}</span>
                          <span className="text-gray-400 font-normal">({product.reviewCount || 0} reviews)</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[32px]">{product.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">INR {product.price.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            addToCart(product, 1);
                            alert('Product added to your bag!');
                          }}
                          disabled={product.stockQuantity <= 0}
                          className="px-4 py-1.5 bg-[#ff3f6c] hover:bg-[#e0355c] disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-full shadow-sm transition-colors"
                        >
                          {product.stockQuantity <= 0 ? t('Out of Stock') : t('Add to Bag')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 pt-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 text-xs font-semibold rounded-full border transition-colors ${
                        currentPage === page
                          ? 'bg-[#ff3f6c] text-white border-[#ff3f6c]'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
