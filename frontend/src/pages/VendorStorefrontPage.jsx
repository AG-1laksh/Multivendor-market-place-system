import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductComparePanel from '../components/ProductComparePanel';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const followedVendorsKey = 'followed_vendor_ids';

const readFollowedVendors = () => {
  try {
    const raw = localStorage.getItem(followedVendorsKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeFollowedVendors = (ids) => {
  localStorage.setItem(followedVendorsKey, JSON.stringify(ids));
};

const VendorStorefrontPage = () => {
  const { vendorId } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comparedIds, setComparedIds] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  if (user?.role === 'Vendor' && Number(user.userId) === Number(vendorId)) {
    return <Navigate to="/vendor" replace />;
  }

  useEffect(() => {
    const followedIds = readFollowedVendors();
    setIsFollowing(followedIds.includes(Number(vendorId)));

    const fetchStorefront = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/products/vendors/${vendorId}/storefront`);
        setProfile(res.data?.data?.profile || null);
        setProducts(res.data?.data?.products || []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Unable to load vendor storefront');
        setProfile(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStorefront();
  }, [vendorId]);

  const comparedProducts = useMemo(
    () => products.filter((product) => comparedIds.includes(product.Product_ID)),
    [products, comparedIds]
  );

  const memberSince = profile?.Created_At
    ? new Date(profile.Created_At).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
      })
    : 'N/A';

  const toggleFollow = () => {
    const followedIds = readFollowedVendors();

    if (isFollowing) {
      const next = followedIds.filter((id) => id !== Number(vendorId));
      writeFollowedVendors(next);
      setIsFollowing(false);
      toast.success('Vendor unfollowed');
      return;
    }

    const next = [...new Set([...followedIds, Number(vendorId)])];
    writeFollowedVendors(next);
    setIsFollowing(true);
    toast.success('Vendor followed');
  };

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
          { label: 'Vendors' },
          { label: profile?.Vendor_Name || 'Storefront' },
        ]}
      />

      {loading ? (
        <div className="ui-panel p-6">
          <div className="skeleton h-8 w-64 rounded" />
          <div className="mt-3 skeleton h-5 w-48 rounded" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        </div>
      ) : !profile ? (
        <div className="ui-panel px-6 py-10 text-center">
          <p className="text-5xl">🏪</p>
          <h2 className="mt-3 text-2xl font-bold text-white">Vendor not found</h2>
          <p className="mt-2 text-sm muted-text">The requested storefront could not be loaded.</p>
          <Link to="/home" className="ui-btn ui-btn-primary mt-5 inline-block rounded-xl px-5 py-2.5">
            Back to Home
          </Link>
        </div>
      ) : (
        <>
          <div className="ui-panel mb-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-2xl">
                  🏬
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-white">{profile.Vendor_Name}</h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-emerald-300/50 bg-emerald-300/10 px-2 py-1 text-emerald-300">
                      Verified Vendor
                    </span>
                    <span className="rounded-full border border-white/15 px-2 py-1 muted-text">Member Since {memberSince}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleFollow}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isFollowing
                    ? 'border border-white/20 bg-white/5 text-white hover:border-rose-300/40 hover:text-rose-300'
                    : 'ui-btn ui-btn-primary'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs muted-text">Overall Rating</p>
                <p className="mt-1 text-lg font-bold text-white">⭐ {Number(profile.Avg_Rating || 0).toFixed(1)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs muted-text">Reviews</p>
                <p className="mt-1 text-lg font-bold text-white">{profile.Review_Count || 0}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs muted-text">Products Listed</p>
                <p className="mt-1 text-lg font-bold text-white">{profile.Product_Count || products.length}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs muted-text">Contact</p>
                <p className="mt-1 text-sm text-white">{profile.Phone_No || 'Not shared'}</p>
              </div>
            </div>
          </div>

          {products.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
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
          ) : (
            <div className="ui-panel px-6 py-10 text-center">
              <p className="text-5xl">📭</p>
              <h3 className="mt-3 text-2xl font-bold text-white">No products listed yet</h3>
              <p className="mt-2 text-sm muted-text">This vendor has not published products yet.</p>
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

export default VendorStorefrontPage;
