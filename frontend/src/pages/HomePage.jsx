import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductComparePanel from '../components/ProductComparePanel';
import CustomSelect from '../components/CustomSelect';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const HomePage = () => {
  const getCategoryPreviewImage = (categoryName) => {
    const slug = toSlug(categoryName);

    const CATEGORY_HERO_PREVIEW = {
      electronics:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
      fashion:
        'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=80',
      accessories:
        'https://img.freepik.com/premium-vector/mobile-phone-charger-vector-set-realistic-smartphone-power-supply-3d-usb-cables-cords-electri_1123160-11978.jpg?semt=ais_hybrid&w=740&q=80',
      audio:
        'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
      mobiles:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80',
      'home-kitchen':
        'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=80',
      default:
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1000&q=80',
    };

    return CATEGORY_HERO_PREVIEW[slug] || CATEGORY_HERO_PREVIEW.default;
  };

  const toSlug = (value) =>
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const defaultHeroImage =
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80';
  const heroFallbackImage = '/hero-fallback.svg';
  const [products, setProducts] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [comparedIds, setComparedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroSrc, setHeroSrc] = useState(defaultHeroImage);
  const { user } = useAuth();
  const { addItem } = useCart();

  if (user?.role === 'Vendor') return <Navigate to="/vendor" replace />;
  if (user?.role === 'Admin') return <Navigate to="/admin" replace />;

  const handleAddToCart = async (product) => {
    try {
      const mode = await addItem(product);
      toast.success(
        mode === 'db'
          ? 'Item added to cart and saved in database ✅'
          : 'Item added to guest cart 🛒 (login required at checkout)'
      );
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Unable to add item to cart');
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryId('');
    setSortBy('latest');
    setShowFilters(false);
  };

  const comparedProducts = useMemo(
    () => products.filter((product) => comparedIds.includes(product.Product_ID)),
    [products, comparedIds]
  );

  const toggleCompare = (product, shouldCompare) => {
    setComparedIds((prev) => {
      if (shouldCompare) {
        if (prev.includes(product.Product_ID)) return prev;
        if (prev.length >= 4) {
          toast.error('You can compare up to 4 products at once');
          return prev;
        }
        return [...prev, product.Product_ID];
      }

      return prev.filter((id) => id !== product.Product_ID);
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get('/products', { params: categoryId ? { categoryId } : {} }),
          api.get('/products/categories'),
        ]);
        setProducts(productsRes.data.data || []);
        setCategories(categoriesRes.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId]);

  const title = useMemo(
    () => (categoryId ? `Filtered Products (${products.length})` : `All Products (${products.length})`),
    [categoryId, products.length]
  );

  const visibleProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.Name?.toLowerCase().includes(q) || p.Description?.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'priceLowToHigh') {
      result.sort((a, b) => Number(a.Price) - Number(b.Price));
    } else if (sortBy === 'priceHighToLow') {
      result.sort((a, b) => Number(b.Price) - Number(a.Price));
    } else if (sortBy === 'stockHigh') {
      result.sort((a, b) => Number(b.Stock) - Number(a.Stock));
    }

    return result;
  }, [products, search, sortBy]);

  const groupedProducts = useMemo(() => {
    return visibleProducts.reduce((acc, product) => {
      const key = product.Category_Name || 'Uncategorized';
      if (!acc[key]) acc[key] = [];
      acc[key].push(product);
      return acc;
    }, {});
  }, [visibleProducts]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 grid gap-6 rounded-2xl p-6 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.32em] muted-text">Multi-Vendor Marketplace</p>
          <h1 className="hero-title text-4xl font-extrabold leading-tight md:text-5xl">
            Premium Electronics.
            <br />
            Trusted Vendors.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] font-light muted-text">
            Shop verified products with transparent pricing, secure checkout, and reliable order tracking.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.16em] amber-text">
            <span>Fast Dispatch</span>
            <span>Verified Sellers</span>
            <span>Secure Payments</span>
          </div>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <div className="hero-glow" />
          <img
            src={heroSrc}
            alt="Premium headphones"
            className="relative h-56 w-full max-w-md rounded-2xl object-cover"
            onError={() => {
              if (heroSrc !== heroFallbackImage) setHeroSrc(heroFallbackImage);
            }}
          />
        </div>
      </div>

      <div className="relative mb-6">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 amber-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="search-glass w-full px-12 py-3 text-white outline-none placeholder:text-[#8B8B8B]"
          />
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-transparent p-2 text-[#d8d8d8] transition hover:border-white/15 hover:text-[#FFC107]"
            aria-label="Toggle filters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 5h18" />
              <path d="M7 12h10" />
              <path d="M10 19h4" />
            </svg>
          </button>
        </div>

        {showFilters && (
          <div className="absolute right-0 top-14 z-10 w-72 ui-panel p-3">
            <label className="mb-2 block text-xs muted-text">Sort</label>
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              className="mb-3"
              options={[
                { value: 'latest', label: 'Latest' },
                { value: 'priceLowToHigh', label: 'Price: Low to High' },
                { value: 'priceHighToLow', label: 'Price: High to Low' },
                { value: 'stockHigh', label: 'Stock: High to Low' },
              ]}
            />

            <label className="mb-2 block text-xs muted-text">Category</label>
            <CustomSelect
              value={categoryId}
              onChange={setCategoryId}
              options={[
                { value: '', label: 'All Categories' },
                ...categories.map((cat) => ({
                  value: String(cat.Category_ID),
                  label: cat.Category_Name,
                })),
              ]}
            />
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <h2 className="text-3xl font-bold cream-text">{title}</h2>
      </div>

      {!!categories.length && (
        <div id="categories" className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-2xl font-bold cream-text">Category Hubs</h3>
            <p className="text-xs uppercase tracking-[0.2em] muted-text">Dive by intent</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const slug = toSlug(category.Category_Name);
              const previewImage = getCategoryPreviewImage(category.Category_Name);

              return (
                <Link
                  key={category.Category_ID}
                  to={`/categories/${slug}`}
                  className="group relative overflow-hidden rounded-xl border border-white/10"
                >
                  <img
                    src={previewImage}
                    alt={category.Category_Name}
                    className="h-36 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-linear-to-r from-[#111216]/85 to-[#111216]/30" />
                  <div className="absolute inset-0 flex items-end p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{category.Category_Name}</p>
                      <p className="text-xs amber-text">Open hub →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="ui-panel overflow-hidden p-4">
              <div className="skeleton aspect-square rounded-xl" />
              <div className="mt-4 space-y-2">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-4 w-1/2 rounded" />
                <div className="skeleton h-4 w-full rounded" />
                <div className="skeleton h-10 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {visibleProducts.length ? (
            <div className="space-y-8">
              {Object.entries(groupedProducts).map(([groupName, groupItems]) => (
                <div key={groupName}>
                  <h3 className="mb-3 text-2xl font-bold text-white">
                    {groupName} <span className="text-base muted-text">({groupItems.length})</span>
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupItems.map((product) => (
                      <ProductCard
                        key={product.Product_ID}
                        product={product}
                        onAddToCart={handleAddToCart}
                        showCompare
                        isCompared={comparedIds.includes(product.Product_ID)}
                        compareDisabled={comparedIds.length >= 4}
                        onToggleCompare={toggleCompare}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ui-panel px-6 py-10 text-center">
              <p className="text-5xl">📦</p>
              <h3 className="mt-3 text-2xl font-bold text-white">No products found</h3>
              <p className="mt-2 text-sm muted-text">Try changing your search or filters.</p>
              <button onClick={resetFilters} className="ui-btn ui-btn-primary mt-5 rounded-xl px-5 py-2.5">
                Reset Filters
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <div className="ui-panel p-4">
          <p className="text-2xl">🚚</p>
          <h3 className="mt-2 font-semibold text-white">Fast Dispatch</h3>
          <p className="mt-1 text-sm muted-text">Most products are shipped within 24 hours by active vendors.</p>
        </div>
        <div className="ui-panel p-4">
          <p className="text-2xl">💳</p>
          <h3 className="mt-2 font-semibold text-white">Secure Payments</h3>
          <p className="mt-1 text-sm muted-text">Order and payment data are tracked with clear order status history.</p>
        </div>
        <div className="ui-panel p-4">
          <p className="text-2xl">⭐</p>
          <h3 className="mt-2 font-semibold text-white">Real Reviews</h3>
          <p className="mt-1 text-sm muted-text">Customers can submit ratings (1-5) and text reviews for products.</p>
        </div>
      </div>

      <ProductComparePanel
        products={comparedProducts}
        onRemove={(id) => setComparedIds((prev) => prev.filter((productId) => productId !== id))}
        onClear={() => setComparedIds([])}
      />
    </section>
  );
};

export default HomePage;
