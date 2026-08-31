import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSearchProducts, useWishlist, useAddToWishlist, useRemoveFromWishlist, formatImageUrl } from '@frontend/api-client';
import { useCart } from '../context/CartContext';
import { Filter, ArrowLeft, Heart } from 'lucide-react';

export const SearchResults: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const categoryFilter = searchParams.get('category') || '';

  const { data: products, isLoading } = useSearchProducts(searchQuery, {
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

  // Filter locally
  const filteredProducts = (products || []).filter((product) => {
    const matchesCategory = categoryFilter ? product.category.toLowerCase() === categoryFilter.toLowerCase() : true;
    const matchesPrice = product.price <= maxPrice;
    const matchesStock = inStockOnly ? product.stockQuantity > 0 : true;
    return matchesCategory && matchesPrice && matchesStock;
  });

  // Sort locally
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    if (sortBy === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }
    return 0;
  });

  // Paginate
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const categories = Array.from(new Set((products || []).map((p) => p.category)));

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Back Button */}
      <div className="space-y-4">
        <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 hover:text-amber-700 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
        <div>
          <h1 className="font-display text-4xl font-bold text-amber-950">Search Results</h1>
          <p className="text-sm text-gray-500 mt-1">Showing results for: <span className="font-semibold text-amber-900 font-mono">"{searchQuery}"</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <aside className="space-y-6 bg-white p-6 rounded-2xl border border-orange-100/30 h-fit shadow-sm">
          <div className="flex items-center gap-2 font-semibold text-amber-950 border-b border-gray-100 pb-3">
            <Filter className="w-4 h-4" />
            <span>Filter Results</span>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">Categories</h4>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleCategoryClick('')}
                  className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    !categoryFilter ? 'bg-amber-900 text-white font-medium' : 'text-gray-600 hover:bg-amber-50/50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      categoryFilter.toLowerCase() === cat.toLowerCase()
                        ? 'bg-amber-900 text-white font-medium'
                        : 'text-gray-600 hover:bg-amber-50/50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider font-semibold text-gray-400">
              <span>Max Price</span>
              <span className="text-amber-900 font-bold">INR {maxPrice.toFixed(0)}</span>
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
              className="w-full accent-amber-900"
            />
          </div>

          {/* In Stock toggle */}
          <div className="space-y-2 border-t border-orange-100/10 pt-4 flex items-center justify-between">
            <label htmlFor="inStock" className="text-xs uppercase tracking-wider font-semibold text-gray-400 cursor-pointer">
              In Stock Only
            </label>
            <input
              id="inStock"
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 rounded border-amber-200 text-amber-900 focus:ring-amber-900 accent-amber-900 cursor-pointer"
            />
          </div>

          {/* Sorting */}
          <div className="space-y-2 border-t border-orange-100/10 pt-4">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-gray-400">Sort By</h4>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-gray-50 border border-amber-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-900 text-amber-950 font-medium"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Alphabetical: A-Z</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </aside>

        {/* Results grid */}
        <div className="lg:col-span-3 space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-white rounded-2xl border border-gray-100 animate-pulse p-4 space-y-4" />
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-orange-100/20 shadow-sm flex flex-col items-center justify-center">
              <span className="text-6xl mb-4">🔍</span>
              <p className="font-accent text-3xl text-gray-400">no products match search</p>
              <p className="text-xs text-gray-400 mt-2">Try check for spelling mistakes, or broadening filters.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl border border-orange-100/20 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                    <div className="relative aspect-[4/3] bg-gradient-to-tr from-amber-50 to-orange-50/70 flex items-center justify-center p-4 overflow-hidden">
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
                      <span className="absolute top-3 left-3 bg-white/95 px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-900 border border-amber-50">
                        {product.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWishlistToggle(product.id);
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 shadow-sm border border-orange-100/30 text-rose-500 hover:scale-110 transition-transform z-10"
                        title={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted(product.id) ? 'fill-rose-500' : 'text-gray-500'}`} />
                      </button>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <Link to={`/products/${product.id}`} className="block font-semibold text-amber-950 hover:underline truncate">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-800">
                          <span>★</span>
                          <span>{product.averageRating ? product.averageRating.toFixed(1) : '0.0'}</span>
                          <span className="text-gray-400 font-normal">({product.reviewCount || 0} reviews)</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[32px]">{product.description}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-amber-950">INR {product.price.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            addToCart(product, 1);
                            alert('Product added to your bag!');
                          }}
                          disabled={product.stockQuantity <= 0}
                          className="px-4 py-1.5 bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold rounded-full shadow-sm transition-colors"
                        >
                          {product.stockQuantity <= 0 ? 'Out of stock' : 'Add to Bag'}
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
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 disabled:opacity-50 hover:bg-amber-50"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 text-xs font-semibold rounded-full border transition-colors ${
                        currentPage === page
                          ? 'bg-amber-900 text-white border-amber-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-amber-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 disabled:opacity-50 hover:bg-amber-50"
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
