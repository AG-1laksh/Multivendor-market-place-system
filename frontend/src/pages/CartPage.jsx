import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const defaultCartImage =
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=500&q=80';
  const fallbackCartImage = '/product-fallback.svg';
  const { user } = useAuth();
  const { items, updateQty, removeItem, total, isCartLoading } = useCart();

  if (user?.role === 'Vendor') return <Navigate to="/vendor" replace />;
  if (user?.role === 'Admin') return <Navigate to="/admin" replace />;

  const handleDecreaseQty = async (item) => {
    if (Number(item.quantity) <= 1) return;
    try {
      await updateQty(item.Product_ID, Number(item.quantity) - 1);
      toast.success('Quantity updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update quantity');
    }
  };

  const handleIncreaseQty = async (item) => {
    try {
      await updateQty(item.Product_ID, Number(item.quantity) + 1);
      toast.success('Quantity updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update quantity');
    }
  };

  const handleRemove = async (item) => {
    try {
      await removeItem(item.Product_ID);
      toast.success(`${item.Name || 'Item'} removed from cart`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove item');
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-5 text-4xl font-black tracking-tight text-white">Your Cart</h1>
      <div className="space-y-3">
        {isCartLoading && (
          <>
            {[1, 2].map((skeleton) => (
              <div key={skeleton} className="ui-panel flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-16 w-16 rounded-lg" />
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-36 rounded" />
                    <div className="skeleton h-4 w-24 rounded" />
                  </div>
                </div>
                <div className="skeleton h-10 w-28 rounded-xl" />
                <div className="skeleton h-9 w-20 rounded-lg" />
              </div>
            ))}
          </>
        )}

        {!isCartLoading &&
          items.map((item) => (
            <div key={item.Product_ID} className="ui-panel flex flex-wrap items-center justify-between gap-3 p-4 md:flex-nowrap">
              <Link to={`/products/${item.Product_ID}`} className="flex min-w-0 items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-[#1f1f22] p-1">
                  <img
                    src={item.Image_URL || defaultCartImage}
                    alt={item.Name || item.product_name || 'Product'}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackCartImage;
                    }}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-white transition hover:text-[#FFC107]">
                    {item.Name || item.product_name || 'Product'}
                  </h3>
                  <p className="text-sm muted-text">₹{Number(item.Price).toFixed(2)}</p>
                </div>
              </Link>

              <div className="inline-flex items-center overflow-hidden rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => handleDecreaseQty(item)}
                  disabled={Number(item.quantity) <= 1}
                  className="h-10 w-10 text-lg text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Decrease quantity for ${item.Name}`}
                >
                  −
                </button>
                <span className="inline-flex h-10 min-w-10 items-center justify-center px-3 text-sm font-semibold text-white">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleIncreaseQty(item)}
                  className="h-10 w-10 text-lg text-white transition hover:bg-white/10"
                  aria-label={`Increase quantity for ${item.Name}`}
                >
                  +
                </button>
              </div>

              <button
                onClick={() => handleRemove(item)}
                className="rounded-lg border border-[#4a3030] px-3 py-1 text-sm text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
              >
                Remove
              </button>
            </div>
          ))}

        {!isCartLoading && !items.length && (
          <div className="ui-panel px-6 py-10 text-center">
            <p className="text-5xl">🛒</p>
            <h3 className="mt-3 text-2xl font-bold text-white">Your cart is empty</h3>
            <p className="mt-2 text-sm muted-text">Looks like you have not added anything yet.</p>
            <Link to="/home" className="ui-btn ui-btn-primary mt-5 inline-block rounded-xl px-5 py-2.5">
              Continue Shopping
            </Link>
          </div>
        )}
      </div>

      <div className="ui-panel mt-6 flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <p className="text-lg font-semibold text-white">Total: ₹{total.toFixed(2)}</p>
        {items.length ? (
          <Link to="/checkout" className="ui-btn ui-btn-primary rounded-xl px-4 py-2">
            Proceed to Checkout
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="ui-btn rounded-xl border border-white/15 px-4 py-2 text-sm text-[#9B9BA4]"
          >
            Add items to checkout
          </button>
        )}
      </div>

      {!items.length && !isCartLoading && (
        <p className="mt-3 text-sm muted-text">Checkout is disabled until your cart has at least one item.</p>
      )}
    </section>
  );
};

export default CartPage;
