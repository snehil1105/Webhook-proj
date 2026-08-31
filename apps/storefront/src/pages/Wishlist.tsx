import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist, useRemoveFromWishlist, formatImageUrl } from '@frontend/api-client';
import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export const Wishlist: React.FC = () => {
  const { data: wishlist, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { addToCart } = useCart();

  const handleMoveToBag = (product: any) => {
    addToCart(product, 1);
    removeFromWishlist.mutate(product.id);
    alert('Item moved to your shopping bag!');
  };

  const handleRemove = (id: string) => {
    removeFromWishlist.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-white border border-gray-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-amber-950">My Wishlist</h1>
        <p className="text-sm text-gray-500 mt-1">Keep track of the handcrafted items you love.</p>
      </div>

      {!wishlist || wishlist.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-orange-100/20 shadow-sm flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto">
          <span className="text-6xl">💖</span>
          <div>
            <h2 className="font-display text-2xl font-bold text-amber-950">Your Wishlist is Empty</h2>
            <p className="text-xs text-gray-500 mt-1.5 font-sans leading-relaxed">
              Tap the heart icon on any product page or catalog card to save your favorite products here.
            </p>
          </div>
          <Link to="/products" className="inline-flex items-center gap-1.5 px-6 h-10 bg-amber-900 hover:bg-amber-800 text-white font-semibold rounded-full shadow-sm transition-colors">
            <span>Explore Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="bg-white rounded-2xl border border-orange-100/20 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group relative">
              {/* Product Card Image Wrapper */}
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
                
                {/* Trash delete absolute icon */}
                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/95 text-gray-400 hover:text-rose-600 shadow-sm border border-orange-100/30 transition-colors z-10"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Product Info Details */}
              <div className="p-4 flex-grow flex flex-col justify-between space-y-4">
                <div>
                  <Link to={`/products/${product.id}`} className="block font-semibold text-amber-950 hover:underline truncate">
                    {product.name}
                  </Link>
                  <p className="text-xs text-amber-900 font-bold mt-1">INR {product.price.toFixed(2)}</p>
                </div>

                {/* Move to bag CTA */}
                <button
                  onClick={() => handleMoveToBag(product)}
                  className="w-full inline-flex items-center justify-center gap-1.5 h-9 bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold rounded-full shadow-sm transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
