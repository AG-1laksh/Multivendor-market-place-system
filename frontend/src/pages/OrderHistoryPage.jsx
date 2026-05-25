import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [activeReviewFor, setActiveReviewFor] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, text: '' });

  const fetchOrders = async () => {
    if (!user?.userId) return;
    const res = await api.get(`/orders/${user.userId}`);
    setOrders(res.data.data || []);
  };

  useEffect(() => {
    fetchOrders().catch(console.error);
  }, [user?.userId]);

  const submitReview = async (order) => {
    try {
      await api.post('/reviews', {
        productId: order.Product_ID,
        rating: Number(reviewForm.rating),
        text: reviewForm.text?.trim() || undefined,
      });

      toast.success('Review submitted successfully');
      setActiveReviewFor(null);
      setReviewForm({ rating: 5, text: '' });
      await fetchOrders();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to submit review';
      toast.error(message);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-4xl font-black tracking-tight text-white">Order History</h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.Order_Item_ID || order.Order_ID}
            className="ui-panel p-4"
          >
            <p className="font-semibold text-white">Order #{order.Order_ID}</p>
            <p className="text-sm muted-text">Product: {order.Product_Name}</p>
            <p className="text-sm muted-text">Qty: {order.Quantity}</p>
            <p className="text-sm amber-text">Status: {order.Status}</p>

            {order.Existing_Review_ID ? (
              <p className="mt-2 inline-flex rounded-full border border-emerald-300/50 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-300">
                Reviewed ({Number(order.Existing_Rating || 0).toFixed(1)}★)
              </p>
            ) : (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReviewFor(order.Order_Item_ID || order.Order_ID);
                    setReviewForm({ rating: 5, text: '' });
                  }}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-[#d7d7dd] transition hover:border-[#FFC107]/55 hover:text-[#FFC107]"
                >
                  Write Review
                </button>

                {activeReviewFor === (order.Order_Item_ID || order.Order_ID) && (
                  <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div>
                      <label className="mb-1 block text-xs muted-text">Rating</label>
                      <select
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
                        className="search-glass rounded-lg px-3 py-2 text-white outline-none"
                      >
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value} className="bg-[#1b1b1e]">
                            {value} ★
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs muted-text">Review (optional)</label>
                      <textarea
                        rows={3}
                        value={reviewForm.text}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, text: e.target.value }))}
                        className="search-glass w-full rounded-lg px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                        placeholder="Share your experience with this product"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => submitReview(order)}
                        className="ui-btn ui-btn-primary rounded-lg px-3 py-1.5"
                      >
                        Submit Review
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveReviewFor(null)}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-[#d7d7dd] transition hover:border-white/35"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {!orders.length && <p className="muted-text">No orders yet.</p>}
      </div>
    </section>
  );
};

export default OrderHistoryPage;
