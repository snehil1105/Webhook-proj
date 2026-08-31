import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { usePublicProducts, formatImageUrl } from '@frontend/api-client';
import { useLanguage } from '../context/LanguageContext';
 
export const Home: React.FC = () => {
  const { t } = useLanguage();
  const { data: products, isLoading } = usePublicProducts();

  const carouselRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  // Helper to compute a stable, deterministic discount percentage (10% to 55%) based on product ID
  const getProductDiscount = (prod: any) => {
    let hash = 0;
    for (let i = 0; i < prod.id.length; i++) {
      hash += prod.id.charCodeAt(i);
    }
    return (hash % 46) + 10; // 10 to 55
  };

  // Helper to get category-specific placeholder image URLs when product image fails to load
  const getCategoryFallbackImage = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('elect')) {
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'; // Headphones
    }
    if (cat.includes('cloth') || cat.includes('wear')) {
      return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300'; // Clothes
    }
    if (cat.includes('book')) {
      return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'; // Book
    }
    return 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300'; // Generic Plant
  };

  // Build carousel cards dynamically ensuring uniqueness and strict category mapping
  const carouselCards = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    const cards = [];
    const usedIds = new Set<string>();

    // 1. Max Discount Card (Deal of the day)
    const maxDiscount = [...products].sort((a, b) => getProductDiscount(b) - getProductDiscount(a))[0];
    if (maxDiscount) {
      cards.push({
        id: 'card-discount',
        type: 'discount',
        title: `Min ${getProductDiscount(maxDiscount)}% Off`,
        product: maxDiscount,
        badgeBg: 'bg-[#CC0C39]',
        badgeText: 'Limited Deal'
      });
      usedIds.add(maxDiscount.id);
    }

    // 2. Electronics Card (Unique electronics product)
    const electronics = products.find(p => p.category === 'Electronics' && !usedIds.has(p.id));
    if (electronics) {
      cards.push({
        id: 'card-electronics',
        type: 'electronics',
        title: 'Featured Electronics',
        product: electronics,
        badgeBg: 'bg-[#232F3E]',
        badgeText: 'Electronics'
      });
      usedIds.add(electronics.id);
    }

    // 3. Clothing Card (Unique clothing product)
    const clothing = products.find(p => p.category === 'Clothing' && !usedIds.has(p.id));
    if (clothing) {
      cards.push({
        id: 'card-clothing',
        type: 'clothing',
        title: `Min ${getProductDiscount(clothing)}% Off Clothes`,
        product: clothing,
        badgeBg: 'bg-[#CC0C39]',
        badgeText: 'Clothes Deal'
      });
      usedIds.add(clothing.id);
    }

    // 4. Low Price Card (price <= 999, unique)
    const lowPrice = products.find(p => p.price <= 999 && !usedIds.has(p.id));
    if (lowPrice) {
      cards.push({
        id: 'card-lowprice',
        type: 'lowprice',
        title: 'Starting ₹999',
        product: lowPrice,
        badgeBg: 'bg-emerald-700',
        badgeText: 'Value Buy'
      });
      usedIds.add(lowPrice.id);
    }

    return cards;
  }, [products]);

  // Today's Deals Rail: Unique products with high discount (>= 30%)
  const highDiscountProducts = React.useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => getProductDiscount(p) >= 30)
      .sort((a, b) => getProductDiscount(b) - getProductDiscount(a));
  }, [products]);

  // Categories split for bottom sections
  const electronicsProducts = React.useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.category === 'Electronics').slice(0, 4);
  }, [products]);

  const clothesProducts = React.useMemo(() => {
    if (!products) return [];
    return products.filter((p) => p.category === 'Clothing').slice(0, 4);
  }, [products]);

  const forYouProducts = React.useMemo(() => {
    if (!products) return [];
    return products.slice(0, 4);
  }, [products]);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-white rounded border border-[#D5D9D9] p-4 flex gap-4 overflow-x-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-56 h-full bg-gray-100 rounded shrink-0" />
          ))}
        </div>
        <div className="h-72 bg-white rounded border border-[#D5D9D9] p-4" />
      </div>
    );
  }

  // Count active grid categories to determine column layout dynamically
  const activeGridCount = [
    electronicsProducts.length > 0,
    clothesProducts.length > 0,
    forYouProducts.length > 0
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 pb-12 font-sans text-[#0F1111] leading-relaxed">
      
      {/* 1. TOP CAROUSEL SECTION */}
      {carouselCards.length > 0 && (
        <div className="relative group/carousel">
          <div 
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto scrollbar-none pb-2"
          >
            {carouselCards.map((card) => {
              const discount = getProductDiscount(card.product);
              const hasDiscount = card.type === 'discount' || card.type === 'clothing';
              const displayPrice = hasDiscount 
                ? Math.floor(card.product.price * (1 - discount / 100))
                : card.product.price;

              return (
                <div 
                  key={card.id} 
                  className="w-[240px] shrink-0 bg-white border border-[#D5D9D9] rounded-[6px] p-4 flex flex-col justify-between h-[320px]"
                >
                  <div>
                    <span className={`inline-block ${card.badgeBg} text-white text-[12px] font-bold px-2 py-0.5 rounded-[3px] mb-2`}>
                      {card.title}
                    </span>
                    <div className="w-full h-36 flex items-center justify-center bg-gray-50 rounded mb-2">
                      <img 
                        src={formatImageUrl(card.product.images?.[0]) || '/placeholder.png'} 
                        alt={card.product.name}
                        className="max-h-full max-w-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCategoryFallbackImage(card.product.category);
                        }}
                      />
                    </div>
                    <Link 
                      to={`/products/${card.product.id}`} 
                      className="text-[#007185] hover:text-[#C7511F] hover:underline text-[13px] font-medium line-clamp-2 leading-tight"
                    >
                      {card.product.name}
                    </Link>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-[20px] font-bold text-[#0F1111]">
                      ₹{displayPrice}
                    </span>
                    {hasDiscount && (
                      <span className="text-[12px] text-gray-500 line-through">
                        ₹{card.product.price}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {carouselCards.length > 4 && (
            <button 
              onClick={() => scroll(carouselRef, 'right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 border border-[#D5D9D9] shadow-md w-11 h-20 rounded-[4px] flex items-center justify-center z-10 transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>
      )}

      {/* 2. ALL DISCOUNT ITEMS (Horizontal scroll rail) */}
      {highDiscountProducts.length > 0 && (
        <section className="bg-white border border-[#D5D9D9] rounded-[6px] p-4 space-y-3 relative group/rail">
          <div className="flex justify-between items-center">
            <h2 className="text-[21px] font-bold text-[#0F1111]">Today's Deals — All Max Discount Items</h2>
            <Link to="/products" className="text-[#007185] hover:text-[#C7511F] text-xs font-semibold hover:underline">
              See all deals
            </Link>
          </div>
          
          <div 
            ref={railRef}
            className="flex gap-4 overflow-x-auto scrollbar-none pb-2"
          >
            {highDiscountProducts.map((product) => {
              const discount = getProductDiscount(product);
              const salePrice = Math.floor(product.price * (1 - discount / 100));
              return (
                <div 
                  key={product.id} 
                  className="w-[180px] shrink-0 border border-[#D5D9D9]/50 rounded-[4px] p-3 flex flex-col justify-between hover:border-amber-700/50 transition-colors"
                >
                  <div>
                    <div className="w-full h-28 flex items-center justify-center bg-gray-50 rounded mb-2">
                      <img 
                        src={formatImageUrl(product.images?.[0]) || '/placeholder.png'} 
                        alt={product.name}
                        className="max-h-full max-w-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCategoryFallbackImage(product.category);
                        }}
                      />
                    </div>
                    <div className="flex gap-1.5 items-center mb-1">
                      <span className="bg-[#CC0C39] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[2px]">
                        {discount}% Off
                      </span>
                      <span className="text-[10px] text-[#CC0C39] font-bold">Limited Deal</span>
                    </div>
                    <Link to={`/products/${product.id}`} className="text-[#007185] hover:text-[#C7511F] hover:underline text-[12px] font-medium line-clamp-2 leading-tight">
                      {product.name}
                    </Link>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-[16px] font-bold">₹{salePrice}</span>
                    <span className="text-[11px] text-gray-500 line-through">₹{product.price}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {highDiscountProducts.length > 5 && (
            <>
              <button 
                onClick={() => scroll(railRef, 'left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 border border-[#D5D9D9] shadow-md w-10 h-16 rounded-[4px] flex items-center justify-center z-10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={() => scroll(railRef, 'right')}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 border border-[#D5D9D9] shadow-md w-10 h-16 rounded-[4px] flex items-center justify-center z-10 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}
        </section>
      )}

      {/* 3. CATEGORY SECTION GRID */}
      {activeGridCount > 0 && (
        <section 
          className={`grid gap-4 ${
            activeGridCount === 1 
              ? 'grid-cols-1' 
              : activeGridCount === 2 
                ? 'grid-cols-1 md:grid-cols-2' 
                : 'grid-cols-1 md:grid-cols-3'
          }`}
        >
          {/* Electronics Grid */}
          {electronicsProducts.length > 0 && (
            <div className="bg-white border border-[#D5D9D9] rounded-[6px] p-4 flex flex-col justify-between min-h-[360px]">
              <div>
                <h3 className="text-[21px] font-extrabold text-[#0F1111] mb-3">{t('Electronics')}</h3>
                <div className={`grid gap-3 ${electronicsProducts.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {electronicsProducts.map((product) => (
                    <div key={product.id} className="flex flex-col space-y-1">
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center rounded overflow-hidden p-1 border border-gray-100">
                        <img 
                          src={formatImageUrl(product.images?.[0]) || '/placeholder.png'} 
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200';
                          }}
                        />
                      </div>
                      <Link to={`/products/${product.id}`} className="text-[12px] text-gray-800 line-clamp-1 hover:text-[#C7511F] hover:underline">
                        {product.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/products?category=Electronics" className="text-[#007185] hover:text-[#C7511F] text-xs font-semibold hover:underline mt-4 block">
                Shop more Electronics
              </Link>
            </div>
          )}

          {/* For You Curated Grid */}
          {forYouProducts.length > 0 && (
            <div className="bg-white border border-[#D5D9D9] rounded-[6px] p-4 flex flex-col justify-between min-h-[360px]">
              <div>
                <h3 className="text-[21px] font-extrabold text-[#0F1111] mb-3">{t('For You')}</h3>
                <div className={`grid gap-3 ${forYouProducts.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {forYouProducts.map((product) => (
                    <div key={product.id} className="flex flex-col space-y-1">
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center rounded overflow-hidden p-1 border border-gray-100">
                        <img 
                          src={formatImageUrl(product.images?.[0]) || '/placeholder.png'} 
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200';
                          }}
                        />
                      </div>
                      <Link to={`/products/${product.id}`} className="text-[12px] text-gray-800 line-clamp-1 hover:text-[#C7511F] hover:underline">
                        {product.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/products" className="text-[#007185] hover:text-[#C7511F] text-xs font-semibold hover:underline mt-4 block">
                See all catalog
              </Link>
            </div>
          )}

          {/* Clothing / Clothes Grid */}
          {clothesProducts.length > 0 && (
            <div className="bg-white border border-[#D5D9D9] rounded-[6px] p-4 flex flex-col justify-between min-h-[360px]">
              <div>
                <h3 className="text-[21px] font-extrabold text-[#0F1111] mb-3">{t('CLOTHES')}</h3>
                <div className={`grid gap-3 ${clothesProducts.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {clothesProducts.map((product) => (
                    <div key={product.id} className="flex flex-col space-y-1">
                      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center rounded overflow-hidden p-1 border border-gray-100">
                        <img 
                          src={formatImageUrl(product.images?.[0]) || '/placeholder.png'} 
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200';
                          }}
                        />
                      </div>
                      <Link to={`/products/${product.id}`} className="text-[12px] text-gray-800 line-clamp-1 hover:text-[#C7511F] hover:underline">
                        {product.name}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <Link to="/products?category=Clothing" className="text-[#007185] hover:text-[#C7511F] text-xs font-semibold hover:underline mt-4 block">
                Shop more Clothing
              </Link>
            </div>
          )}
        </section>
      )}

    </div>
  );
};
