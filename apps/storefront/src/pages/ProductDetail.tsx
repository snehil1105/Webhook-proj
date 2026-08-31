import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductDetail, useWishlist, useAddToWishlist, useRemoveFromWishlist, useProductReviews, useSubmitProductReview, usePublicProducts, formatImageUrl } from '@frontend/api-client';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ShoppingBag, ShieldCheck, CornerDownLeft, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
 
export const ProductDetail: React.FC = () => {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProductDetail(id || '');
  const { addToCart } = useCart();
  const { data: wishlist } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { data: reviews } = useProductReviews(id || '');
  const submitReview = useSubmitProductReview(id || '');

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isWishlisted = (productId: string) => {
    return (wishlist || []).some((w) => w.id === productId);
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    if (isWishlisted(product.id)) {
      removeFromWishlist.mutate(product.id);
    } else {
      addToWishlist.mutate(product.id);
    }
  };
  const [qty, setQty] = useState(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  const { data: allProducts } = usePublicProducts();

  useEffect(() => {
    if (product) {
      try {
        const list = JSON.parse(localStorage.getItem('storefront_recently_viewed') || '[]');
        const updated = [product.id, ...list.filter((id: string) => id !== product.id)].slice(0, 6);
        localStorage.setItem('storefront_recently_viewed', JSON.stringify(updated));
      } catch (e) {
        console.error('Error updating recently viewed list', e);
      }
    }
  }, [product]);

  const recommendations = React.useMemo(() => {
    if (!product || !allProducts) return [];
    return allProducts
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product, allProducts]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-gray-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-[4/3] bg-gray-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="font-accent text-4xl text-rose-500">item not found</p>
        <p className="text-sm text-gray-500">The product you are trying to view does not exist.</p>
        <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-900 underline">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [];
 
  const getReturnLabel = () => {
    const policyStr = (product as any).returnPolicy === 'REPLACE' ? 'Replace' : 'Return';
    if ((product as any).returnType === 'NO_RETURN') {
      return t('No Return');
    }
    if ((product as any).returnType === 'SEVEN_DAYS_RETURN') {
      return policyStr === 'Replace' ? `7 Days ${t('replacement')}` : t('7 Days Return');
    }
    return `Custom ${policyStr} Policy`;
  };
 
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <div>
        <Link to="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-amber-950 hover:text-amber-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to shop</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white p-8 sm:p-12 rounded-3xl border border-orange-100/20 shadow-sm">
        
        {/* Left Gallery View */}
        <div className="space-y-4">
          <div className="aspect-[4/3] bg-gradient-to-tr from-amber-50 to-orange-50/70 rounded-2xl flex items-center justify-center relative p-8">
            {images.length > 0 ? (
              <img
                src={formatImageUrl(images[activeImgIdx])}
                alt={product.name}
                className="w-full h-full object-contain rounded-xl"
              />
            ) : (
              <span className="text-8xl select-none">
                {product.category === 'Electronics' ? '🎧' : product.category === 'Clothing' ? '👕' : '📚'}
              </span>
            )}
            <span className="absolute top-4 left-4 bg-white/95 px-3 py-1 rounded-full text-xs font-semibold text-amber-900 border border-amber-50">
              {product.category}
            </span>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 bg-white ${
                    activeImgIdx === idx ? 'border-amber-800' : 'border-gray-200'
                  }`}
                >
                  <img src={formatImageUrl(img)} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Info View */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              {product.brand && (
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800/80 block">
                  Brand: {product.brand}
                </span>
              )}
              <div className="flex justify-between items-start gap-4">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-amber-950 leading-tight flex-1">
                  {product.name}
                </h1>
                <button
                  onClick={handleWishlistToggle}
                  className="p-2 rounded-full bg-white shadow-sm border border-orange-100/30 text-rose-500 hover:scale-105 transition-transform shrink-0"
                  title={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted(product.id) ? 'fill-rose-500' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 mt-1">
                <div className="flex items-center text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= Math.round(product.averageRating || 0) ? 'text-amber-500' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span>{product.averageRating ? product.averageRating.toFixed(1) : '0.0'}</span>
                <span className="text-gray-400 font-normal">({product.reviewCount || 0} reviews)</span>
              </div>
            </div>
            
            <p className="text-2xl font-bold text-amber-900">INR {product.price.toFixed(2)}</p>
            
            <hr className="border-gray-100" />

            {/* Bullet Highlights */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Features</span>
                <ul className="list-disc pl-5 space-y-1 text-xs text-gray-700">
                  {product.highlights.map((hl, i) => (
                    <li key={i}>{hl}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {product.highlights && product.highlights.length > 0 && <hr className="border-gray-100" />}
            
            <div className="space-y-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Product Description</span>
              <p className="text-xs text-gray-600 leading-relaxed font-sans whitespace-pre-line">
                {product.description}
              </p>
            </div>
          </div>
 
          <div className="space-y-6 pt-4">
            {/* Stock status banner */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${product.stockQuantity > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-xs font-medium text-gray-500">
                {product.stockQuantity > 0 
                  ? `${t('In Stock')} (${product.stockQuantity} units available)` 
                  : t('Out of Stock')}
              </span>
            </div>
 
            {/* Quantity Selector & Add to Cart */}
            {product.stockQuantity > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center border border-amber-100 rounded-full h-10 overflow-hidden bg-gray-50">
                  <button
                    onClick={() => setQty((q) => Math.max(q - 1, 1))}
                    className="px-3 h-full hover:bg-amber-50 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-semibold select-none">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(q + 1, product.stockQuantity))}
                    className="px-3 h-full hover:bg-amber-50 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
                
                <button
                  onClick={() => addToCart(product, qty)}
                  className="flex-grow inline-flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 text-white font-semibold h-10 px-6 rounded-full transition-all shadow-md text-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t('Add to Bag')}</span>
                </button>
              </div>
            )}

            {/* Quality Seals */}
            <div className="border-t border-gray-100 pt-4 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>3-year warranty</span>
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-4 h-4 text-[#ff3f6c]" />
                <span className="font-semibold text-slate-700">{getReturnLabel()}</span>
              </span>
            </div>
          </div>

        </div>
      </div>
         {/* Specifications Table Section */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="bg-white p-8 rounded-3xl border border-orange-100/20 shadow-sm space-y-4">
          <h3 className="font-display text-lg font-bold text-amber-950 border-b border-gray-100 pb-2">{t('Product Specifications')}</h3>
          <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100 text-xs">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="grid grid-cols-3 p-4 hover:bg-gray-50/50">
                <span className="font-semibold text-gray-500 col-span-1">{key}</span>
                <span className="text-gray-800 col-span-2 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
 
      {/* Ratings & Reviews Section */}
      <div className="bg-white p-8 rounded-3xl border border-orange-100/20 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-display text-xl font-bold text-amber-950">{t('Ratings & Reviews')}</h3>
            <p className="text-xs text-gray-500">Read what other buyers say about this item.</p>
          </div>
          <button
            onClick={() => {
              if (!localStorage.getItem('storefront_token')) {
                alert('Please log in to write a review.');
                return;
              }
              setShowReviewModal(true);
            }}
            className="px-5 h-9 bg-amber-900 hover:bg-amber-800 text-white text-xs font-semibold rounded-full shadow-sm"
          >
            Write a Review
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Breakdown column */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-amber-950">
                {product.averageRating ? product.averageRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-sm font-semibold text-gray-400">out of 5</span>
            </div>
            
            {/* Stars row distribution */}
            <div className="space-y-2 text-xs font-semibold text-gray-500">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = (reviews || []).filter((r) => r.rating === stars).length;
                const total = reviews?.length || 1;
                const percentage = Math.round((count / total) * 100);
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="w-12">{stars} star</span>
                    <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-600" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="w-8 text-right font-mono text-gray-400">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feed column */}
          <div className="md:col-span-2 space-y-6">
            {!reviews || reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No reviews yet. Be the first to share your thoughts!
              </div>
            ) : (
              <div className="divide-y divide-gray-100 space-y-6">
                {reviews.map((rev, idx) => (
                  <div key={rev.id || idx} className={`${idx > 0 ? 'pt-6' : ''} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex text-amber-500 text-[10px]">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= rev.rating ? 'text-amber-500' : 'text-gray-200'}>★</span>
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-950">{rev.customerName}</span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-sans">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-orange-100/20 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl font-bold text-amber-950">Write a Review</h3>
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Rating</label>
              <div className="flex gap-1.5 text-2xl text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewRating(s)}
                    className="hover:scale-110 transition-transform"
                  >
                    {s <= newRating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Your Comment</label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What did you like or dislike about this product?"
                className="w-full border border-amber-100 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-amber-900 min-h-[100px] font-sans"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setErrorMsg('');
                  setNewComment('');
                }}
                className="flex-1 h-10 border border-amber-900/10 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-full"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  submitReview.mutate(
                    {
                      rating: newRating,
                      comment: newComment,
                      customerName: localStorage.getItem('storefront_name') || 'Aura Customer'
                    },
                    {
                      onSuccess: () => {
                        setShowReviewModal(false);
                        setNewComment('');
                        alert('Thank you! Your review has been published.');
                      },
                      onError: (err: any) => {
                        setErrorMsg(err.response?.data || 'Failed to submit review. Only verified purchasers can write reviews.');
                      }
                    }
                  );
                }}
                disabled={submitReview.isPending}
                className="flex-1 h-10 bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 text-white text-xs font-semibold rounded-full shadow-md"
              >
                {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frequently Bought With */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-6 pt-4">
          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-amber-950">Frequently Bought With</h3>
            <p className="text-xs text-gray-500 font-sans">Other items in the {product.category} collection you might adore.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-orange-100/30 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                <div className="relative aspect-[4/3] bg-gradient-to-tr from-amber-50 to-orange-50/70 flex items-center justify-center p-4">
                  <span className="text-4xl select-none group-hover:scale-110 transition-transform duration-300">
                    {item.category === 'Electronics' ? '🎧' : item.category === 'Clothing' ? '👕' : '📚'}
                  </span>
                  <span className="absolute top-3 left-3 bg-white/95 px-2 py-0.5 rounded-full text-[10px] font-semibold text-amber-900 border border-amber-50">
                    {item.category}
                  </span>
                </div>
                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div>
                    <Link to={`/products/${item.id}`} className="block font-semibold text-amber-950 hover:underline truncate">
                      {item.name}
                    </Link>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[32px]">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-950">INR {item.price.toFixed(2)}</span>
                    <button
                      onClick={() => {
                        addToCart(item);
                        alert('Product added to bag!');
                      }}
                      disabled={item.stockQuantity <= 0}
                      className="px-3 h-8 bg-amber-900 hover:bg-amber-800 disabled:bg-gray-200 text-xs font-semibold text-white rounded-full transition-colors"
                    >
                      {item.stockQuantity > 0 ? 'Add to Bag' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
