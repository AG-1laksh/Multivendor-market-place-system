import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductComparePanel from '../components/ProductComparePanel';
import Breadcrumbs from '../components/Breadcrumbs';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const toSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CATEGORY_HERO = {
  electronics: {
    title: 'Engineering Excellence',
    subtitle: 'Performance-driven devices built for your everyday power needs.',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1500&q=80',
  },
  fashion: {
    title: 'Style Meets Identity',
    subtitle: 'Curated outfits and accessories to elevate every look.',
    image:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1500&q=80',
  },
  accessories: {
    title: 'Essential Accessories for Every Style',
    subtitle: 'Discover premium accessories that elevate your everyday look and setup.',
    image:
      'https://img.freepik.com/premium-vector/mobile-phone-charger-vector-set-realistic-smartphone-power-supply-3d-usb-cables-cords-electri_1123160-11978.jpg?semt=ais_hybrid&w=740&q=80',
  },
  audio: {
    title: 'Sound Without Compromise',
    subtitle: 'Discover speakers and headphones built for immersive listening.',
    image:
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1500&q=80',
  },
  mobiles: {
    title: 'Smart Mobility, Reimagined',
    subtitle: 'Latest smartphones with powerful performance and sleek design.',
    image:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1500&q=80',
  },
  'home-kitchen': {
    title: 'Comfort Starts at Home',
    subtitle: 'Essential home and kitchen picks for better everyday living.',
    image:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1500&q=80',
  },
  default: {
    title: 'Top Picks in This Category',
    subtitle: 'Explore handpicked products from trusted marketplace vendors.',
    image:
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1500&q=80',
  },
};

const CategoryPage = () => {
  const getBrand = (product) => {
    const explicitBrand = product.Brand || product.brand;
    if (explicitBrand) return explicitBrand;

    const name = String(product.Name || '').trim();
    return name ? name.split(' ')[0] : 'Unknown';
  };

  const getCondition = (product) => {
    const explicitCondition = product.Condition || product.condition;
    if (explicitCondition) return explicitCondition;

    const description = String(product.Description || '').toLowerCase();
    if (description.includes('refurbished') || description.includes('used')) return 'Refurbished';
    return 'New';
  };

  const getRating = (product) => Number(product.Rating || product.Average_Rating || 4.5);

  const { slug } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [comparedIds, setComparedIds] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [loading, setLoading] = useState(true);

  if (user?.role === 'Vendor') return <Navigate to="/vendor" replace />;
  if (user?.role === 'Admin') return <Navigate to="/admin" replace />;

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        const categoriesRes = await api.get('/products/categories');
        const fetchedCategories = categoriesRes.data?.data || [];
        setCategories(fetchedCategories);

        const matchedCategory = fetchedCategories.find(
          (category) => toSlug(category.Category_Name) === slug
        );

        if (!matchedCategory) {
          setProducts([]);
          return;
        }

        const productsRes = await api.get('/products', {
          params: { categoryId: matchedCategory.Category_ID },
        });
        setProducts(productsRes.data?.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug]);

  const selectedCategory = useMemo(
    () => categories.find((category) => toSlug(category.Category_Name) === slug),
    [categories, slug]
  );

  const heroConfig = CATEGORY_HERO[slug] || CATEGORY_HERO.default;

  const brandOptions = useMemo(
    () => [...new Set(products.map((product) => getBrand(product)).filter(Boolean))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const price = Number(product.Price || 0);
      const rating = getRating(product);
      const brand = getBrand(product);
      const condition = getCondition(product);

      if (minPrice !== '' && price < Number(minPrice)) return false;
      if (maxPrice !== '' && price > Number(maxPrice)) return false;
      if (selectedBrand !== 'all' && brand !== selectedBrand) return false;
      if (selectedRating !== 'all' && rating < Number(selectedRating)) return false;
      if (selectedCondition !== 'all' && condition !== selectedCondition) return false;

      return true;
    });
  }, [products, minPrice, maxPrice, selectedBrand, selectedRating, selectedCondition]);

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

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/home' },
          { label: 'Categories', to: '/home#categories' },
          { label: selectedCategory?.Category_Name || 'Category' },
        ]}
      />

      {!loading && !selectedCategory ? (
        <div className="ui-panel px-6 py-10 text-center">
          <p className="text-5xl">🧭</p>
          <h2 className="mt-3 text-2xl font-bold text-white">Category not found</h2>
          <p className="mt-2 text-sm muted-text">This category does not exist or may have been renamed.</p>
          <Link to="/home" className="ui-btn ui-btn-primary mt-5 inline-block rounded-xl px-5 py-2.5">
            Back to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10">
            <img src={heroConfig.image} alt={selectedCategory?.Category_Name || 'Category'} className="h-64 w-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-[#111216]/90 via-[#111216]/75 to-transparent" />
            <div className="absolute inset-0 p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.28em] muted-text">Category Hub</p>
              <h1 className="mt-2 text-4xl font-extrabold leading-tight text-white md:text-5xl">
                {heroConfig.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm muted-text md:text-base">{heroConfig.subtitle}</p>
              {selectedCategory?.Category_Name && (
                <span className="mt-4 inline-flex rounded-full border border-[#FFC107]/45 bg-[#FFC107]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] amber-text">
                  {selectedCategory.Category_Name}
                </span>
              )}
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl font-bold cream-text">
              {selectedCategory?.Category_Name || 'Category'} Products ({filteredProducts.length})
            </h2>
          </div>

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
          ) : filteredProducts.length ? (
            <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
              <aside className="ui-panel h-fit p-4 lg:sticky lg:top-24">
                <h3 className="mb-3 text-lg font-bold text-white">Filters</h3>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs muted-text">Min Price</label>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs muted-text">Max Price</label>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none"
                      placeholder="100000"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs muted-text">Brand</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none"
                    >
                      <option value="all" className="bg-[#1b1b1e]">All Brands</option>
                      {brandOptions.map((brand) => (
                        <option key={brand} value={brand} className="bg-[#1b1b1e]">{brand}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs muted-text">Rating</label>
                    <select
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(e.target.value)}
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none"
                    >
                      <option value="all" className="bg-[#1b1b1e]">All Ratings</option>
                      <option value="4" className="bg-[#1b1b1e]">4★ & above</option>
                      <option value="3" className="bg-[#1b1b1e]">3★ & above</option>
                      <option value="2" className="bg-[#1b1b1e]">2★ & above</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs muted-text">Condition</label>
                    <select
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none"
                    >
                      <option value="all" className="bg-[#1b1b1e]">All Conditions</option>
                      <option value="New" className="bg-[#1b1b1e]">New</option>
                      <option value="Refurbished" className="bg-[#1b1b1e]">Refurbished</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      setSelectedBrand('all');
                      setSelectedRating('all');
                      setSelectedCondition('all');
                    }}
                    className="w-full rounded-xl border border-white/15 px-3 py-2 text-sm text-[#d3d3d8] transition hover:border-[#FFC107]/55 hover:text-[#FFC107]"
                  >
                    Reset Filters
                  </button>
                </div>
              </aside>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
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
          ) : (
            <div className="ui-panel px-6 py-10 text-center">
              <p className="text-5xl">📦</p>
              <h3 className="mt-3 text-2xl font-bold text-white">No products match your filters</h3>
              <p className="mt-2 text-sm muted-text">Try relaxing brand, rating, condition, or price filters.</p>
              <Link to="/home" className="ui-btn ui-btn-primary mt-5 inline-block rounded-xl px-5 py-2.5">
                Explore Other Categories
              </Link>
            </div>
          )}

          <ProductComparePanel
            products={comparedProducts}
            onRemove={(id) => setComparedIds((prev) => prev.filter((productId) => productId !== id))}
            onClear={() => setComparedIds([])}
          />
        </>
      )}
    </section>
  );
};

export default CategoryPage;
