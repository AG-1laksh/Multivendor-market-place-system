import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const ProductCard = ({
  product,
  onAddToCart,
  showCompare = false,
  isCompared = false,
  compareDisabled = false,
  onToggleCompare,
}) => {
  const { user } = useAuth();
  const fallbackImage = '/product-fallback.svg';
  const image =
    product.Image_URL ||
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80';
  const [imgSrc, setImgSrc] = useState(image);
  const isOutOfStock = Number(product.Stock) <= 0;
  const isCustomerView = !user || user.role === 'Customer';
  const averageRating = Number(product.Avg_Rating || 0);
  const reviewCount = Number(product.Review_Count || 0);

  useEffect(() => {
    setImgSrc(image);
  }, [image]);

  return (
    <div className="product-hover overflow-hidden rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] backdrop-blur-xl">
      <div className="relative aspect-square overflow-hidden bg-[#1f1f22] p-4">
        {showCompare && (
          <label className="absolute left-3 top-3 z-10 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-[#111216]/80 px-2 py-1 text-xs text-white backdrop-blur">
            <input
              type="checkbox"
              checked={isCompared}
              disabled={compareDisabled && !isCompared}
              onChange={(e) => onToggleCompare?.(product, e.target.checked)}
            />
            <span>{isCompared ? 'Compared' : 'Compare'}</span>
          </label>
        )}
        <img
          src={imgSrc}
          alt={product.Name}
          className="h-full w-full object-contain"
          onError={() => {
            if (imgSrc !== fallbackImage) setImgSrc(fallbackImage);
          }}
        />
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 text-lg font-bold cream-text">{product.Name}</h3>
        <p className="text-xs muted-category">{product.Category_Name || 'Uncategorized'}</p>
        {product.Vendor_ID && (
          <Link
            to={`/vendors/${product.Vendor_ID}`}
            className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200"
          >
            <span className="rounded-full border border-emerald-300/40 bg-emerald-300/10 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em]">
              Verified Vendor
            </span>
            <span className="line-clamp-1">{product.Vendor_Name || 'Visit Shop'}</span>
          </Link>
        )}
        <p className="line-clamp-2 text-sm muted-text">
          {product.Description || 'Premium quality product from verified vendor.'}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-xl font-bold amber-text">₹{Number(product.Price).toFixed(2)}</p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs amber-text">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="amber-text">
              <path d="M12 3l2.82 5.72L21 9.64l-4.5 4.38 1.06 6.2L12 17.27 6.44 20.22l1.06-6.2L3 9.64l6.18-.92L12 3z" />
            </svg>
            <span>{reviewCount ? `${averageRating.toFixed(1)} (${reviewCount})` : 'No ratings'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {isCustomerView ? (
            <div className="inline-flex items-center gap-2 text-xs muted-text">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  isOutOfStock ? 'bg-[#666666]' : 'bg-[#20C997] shadow-[0_0_8px_rgba(32,201,151,0.7)]'
                }`}
              />
              {isOutOfStock ? 'Not Available' : 'In Stock'}
            </div>
          ) : (
            <p className="text-xs muted-text">Stock: {product.Stock}</p>
          )}

          <Link to={`/products/${product.Product_ID}`} className="text-sm amber-text hover:underline">
            View details
          </Link>
        </div>

        <button
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className="ui-btn ui-btn-primary mt-3 w-full px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
