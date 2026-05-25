import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProductPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/reviews/${id}`),
        ]);
        setProduct(productRes.data.data);
        setReviews(reviewsRes.data.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const primary =
      product.Image_URL ||
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80';
    setImgSrc(primary);
  }, [product]);

  if (!product) return <p className="max-w-5xl mx-auto px-4 py-8">Loading product...</p>;

  const fallbackImage = '/product-fallback.svg';
  const isCustomerView = !user || user.role === 'Customer';
  const isAvailable = Number(product.Stock) > 0;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="ui-panel mb-6 grid gap-6 p-6 md:grid-cols-2">
        <img
          src={imgSrc}
          alt={product.Name}
          className="h-72 w-full rounded-2xl bg-[#1f1f22] object-contain p-4"
          onError={() => {
            if (imgSrc !== fallbackImage) setImgSrc(fallbackImage);
          }}
        />
        <div>
          <h1 className="mb-2 text-3xl font-extrabold cream-text">{product.Name}</h1>
          <p className="mb-3 text-lg font-semibold amber-text">₹{Number(product.Price).toFixed(2)}</p>
          <p className="mb-4 text-sm muted-text">Category: {product.Category_Name}</p>
          {product.Vendor_ID && (
            <p className="mb-4 text-sm muted-text">
              Sold by:{' '}
              <Link to={`/vendors/${product.Vendor_ID}`} className="text-emerald-300 hover:text-emerald-200 hover:underline">
                {product.Vendor_Name || 'Verified Vendor'}
              </Link>
            </p>
          )}
          <p className="mb-4 muted-text">{product.Description || 'No description available for this product yet.'}</p>
          <p className={`text-sm ${isAvailable ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isCustomerView
              ? `Status: ${isAvailable ? 'Available' : 'Not Available'}`
              : `Stock: ${product.Stock}`}
          </p>
        </div>
      </div>

      <div className="ui-panel p-6">
        <h2 className="mb-3 text-xl font-semibold text-white">Reviews</h2>
        <div className="space-y-3">
          {reviews.length ? (
            reviews.map((review) => (
              <div key={review.Review_ID} className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-3">
                <p className="font-medium text-white">{review.Customer_Name}</p>
                <p className="text-sm amber-text">Rating: {review.Rating}/5</p>
                <p className="text-sm muted-text">{review.Text}</p>
              </div>
            ))
          ) : (
            <p className="muted-text">No reviews yet.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductPage;
