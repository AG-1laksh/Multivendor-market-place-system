import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    pincode: '',
    country: 'India',
    paymentMode: 'COD',
    upiId: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    bankName: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!items.length) {
      setStatus('');
    }
  }, [items.length]);

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      if (!user || user.role !== 'Customer') return;

      try {
        setIsAddressLoading(true);
        const res = await api.get('/orders/addresses/me');
        setSavedAddresses(res.data?.data || []);
      } catch {
        setSavedAddresses([]);
      } finally {
        setIsAddressLoading(false);
      }
    };

    fetchSavedAddresses();
  }, [user]);

  const onFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const onSavedAddressChange = (e) => {
    const { value } = e.target;
    setSelectedAddressId(value);

    if (!value) return;

    const selected = savedAddresses.find((address) => String(address.Address_ID) === value);
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      street: selected.Street || '',
      city: selected.City || '',
      pincode: selected.Pincode || '',
      country: selected.Country || 'India',
    }));

    setErrors((prev) => ({
      ...prev,
      street: '',
      city: '',
      pincode: '',
      country: '',
    }));
    toast.success('Saved address applied');
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!form.phone.trim() || form.phone.trim().length < 10) nextErrors.phone = 'Valid phone is required';
    if (!form.street.trim()) nextErrors.street = 'Street address is required';
    if (!form.city.trim()) nextErrors.city = 'City is required';
    if (!form.pincode.trim()) nextErrors.pincode = 'Pincode is required';
    if (!form.country.trim()) nextErrors.country = 'Country is required';

    if (form.paymentMode === 'UPI' && !/^[\w.-]+@[\w.-]+$/.test(form.upiId.trim())) {
      nextErrors.upiId = 'Please enter a valid UPI ID';
    }

    if (form.paymentMode === 'CARD') {
      if (!form.cardName.trim()) nextErrors.cardName = 'Card holder name is required';
      if (!/^\d{12,19}$/.test(form.cardNumber.replace(/\s+/g, ''))) {
        nextErrors.cardNumber = 'Card number must be 12-19 digits';
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.cardExpiry.trim())) {
        nextErrors.cardExpiry = 'Expiry must be in MM/YY format';
      }
      if (!/^\d{3,4}$/.test(form.cardCvv.trim())) {
        nextErrors.cardCvv = 'CVV must be 3 or 4 digits';
      }
    }

    if (form.paymentMode === 'NET_BANKING' && !form.bankName.trim()) {
      nextErrors.bankName = 'Please select your bank';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const placeOrder = async () => {
    if (placingOrder) return;
    if (!user) {
      toast.error('Please login as customer to place your order.');
      return;
    }
    if (!items.length) {
      toast.error('Your cart is empty. Add products to continue.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fill all required checkout details.');
      return;
    }

    try {
      setPlacingOrder(true);
      const payload = {
        items: items.map((it) => ({ productId: it.Product_ID, quantity: it.quantity })),
        paymentMode: form.paymentMode,
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          street: form.street.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
          country: form.country.trim(),
        },
        paymentDetails:
          form.paymentMode === 'UPI'
            ? { upiId: form.upiId.trim() }
            : form.paymentMode === 'CARD'
            ? {
                cardName: form.cardName.trim(),
                cardNumberLast4: form.cardNumber.replace(/\s+/g, '').slice(-4),
                cardExpiry: form.cardExpiry.trim(),
              }
            : form.paymentMode === 'NET_BANKING'
            ? { bankName: form.bankName.trim() }
            : {},
      };
      await api.post('/orders', payload);
      await clearCart();
      setStatus('Order placed successfully!');
      toast.success('Order placed successfully 🎉');
      setErrors({});
    } catch (error) {
      setStatus(error.response?.data?.message || 'Failed to place order');
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-4xl font-black tracking-tight text-white">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          <div className="ui-panel p-5">
            <h2 className="text-xl font-bold text-white">Delivery Details</h2>
            <p className="mt-1 text-sm muted-text">Please provide shipping address and payment method.</p>

            <div className="mt-4">
              <label className="mb-1 block text-xs muted-text">Use Saved Address (optional)</label>
              <select
                value={selectedAddressId}
                onChange={onSavedAddressChange}
                disabled={isAddressLoading || !savedAddresses.length}
                className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" className="bg-[#1b1b1e]">
                  {isAddressLoading
                    ? 'Loading saved addresses...'
                    : savedAddresses.length
                    ? 'Select an address'
                    : 'No saved addresses found'}
                </option>
                {savedAddresses.map((address) => (
                  <option key={address.Address_ID} value={String(address.Address_ID)} className="bg-[#1b1b1e]">
                    {`${address.Street}, ${address.City}, ${address.Pincode}, ${address.Country}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={onFieldChange}
                  placeholder="Full Name"
                  className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                />
                {errors.fullName && <p className="mt-1 text-xs text-rose-300">{errors.fullName}</p>}
              </div>
              <div>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onFieldChange}
                  placeholder="Phone Number"
                  className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                />
                {errors.phone && <p className="mt-1 text-xs text-rose-300">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <input
                  name="street"
                  value={form.street}
                  onChange={onFieldChange}
                  placeholder="Street Address"
                  className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                />
                {errors.street && <p className="mt-1 text-xs text-rose-300">{errors.street}</p>}
              </div>
              <div>
                <input
                  name="city"
                  value={form.city}
                  onChange={onFieldChange}
                  placeholder="City"
                  className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                />
                {errors.city && <p className="mt-1 text-xs text-rose-300">{errors.city}</p>}
              </div>
              <div>
                <input
                  name="pincode"
                  value={form.pincode}
                  onChange={onFieldChange}
                  placeholder="Pincode"
                  className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                />
                {errors.pincode && <p className="mt-1 text-xs text-rose-300">{errors.pincode}</p>}
              </div>
              <div className="sm:col-span-2">
                <input
                  name="country"
                  value={form.country}
                  onChange={onFieldChange}
                  placeholder="Country"
                  className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                />
                {errors.country && <p className="mt-1 text-xs text-rose-300">{errors.country}</p>}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-white">Payment Method</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { value: 'COD', label: 'Cash on Delivery' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'CARD', label: 'Card' },
                  { value: 'NET_BANKING', label: 'Net Banking' },
                ].map((option) => (
                  <label key={option.value} className="search-glass flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2">
                    <input
                      type="radio"
                      name="paymentMode"
                      value={option.value}
                      checked={form.paymentMode === option.value}
                      onChange={onFieldChange}
                    />
                    <span className="text-sm text-white">{option.label}</span>
                  </label>
                ))}
              </div>

              {form.paymentMode === 'UPI' && (
                <div className="mt-3">
                  <input
                    name="upiId"
                    value={form.upiId}
                    onChange={onFieldChange}
                    placeholder="UPI ID (e.g. name@bank)"
                    className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                  />
                  {errors.upiId && <p className="mt-1 text-xs text-rose-300">{errors.upiId}</p>}
                </div>
              )}

              {form.paymentMode === 'CARD' && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <input
                      name="cardName"
                      value={form.cardName}
                      onChange={onFieldChange}
                      placeholder="Card Holder Name"
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                    />
                    {errors.cardName && <p className="mt-1 text-xs text-rose-300">{errors.cardName}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={onFieldChange}
                      placeholder="Card Number"
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                    />
                    {errors.cardNumber && <p className="mt-1 text-xs text-rose-300">{errors.cardNumber}</p>}
                  </div>
                  <div>
                    <input
                      name="cardExpiry"
                      value={form.cardExpiry}
                      onChange={onFieldChange}
                      placeholder="Expiry (MM/YY)"
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                    />
                    {errors.cardExpiry && <p className="mt-1 text-xs text-rose-300">{errors.cardExpiry}</p>}
                  </div>
                  <div>
                    <input
                      name="cardCvv"
                      value={form.cardCvv}
                      onChange={onFieldChange}
                      placeholder="CVV"
                      className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                    />
                    {errors.cardCvv && <p className="mt-1 text-xs text-rose-300">{errors.cardCvv}</p>}
                  </div>
                </div>
              )}

              {form.paymentMode === 'NET_BANKING' && (
                <div className="mt-3">
                  <select
                    name="bankName"
                    value={form.bankName}
                    onChange={onFieldChange}
                    className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="" className="bg-[#1b1b1e]">Select Bank</option>
                    <option value="SBI" className="bg-[#1b1b1e]">State Bank of India</option>
                    <option value="HDFC" className="bg-[#1b1b1e]">HDFC Bank</option>
                    <option value="ICICI" className="bg-[#1b1b1e]">ICICI Bank</option>
                    <option value="AXIS" className="bg-[#1b1b1e]">Axis Bank</option>
                    <option value="KOTAK" className="bg-[#1b1b1e]">Kotak Mahindra Bank</option>
                  </select>
                  {errors.bankName && <p className="mt-1 text-xs text-rose-300">{errors.bankName}</p>}
                </div>
              )}
            </div>
          </div>

          {items.length ? (
            items.map((item) => (
              <div key={item.Product_ID} className="ui-panel flex items-center justify-between p-4">
                <div>
                  <h3 className="font-semibold text-white">{item.Name || 'Product'}</h3>
                  <p className="text-sm muted-text">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-white">₹{(Number(item.Price) * Number(item.quantity)).toFixed(2)}</p>
              </div>
            ))
          ) : (
            <div className="ui-panel px-6 py-10 text-center">
              <p className="text-5xl">🧾</p>
              <h3 className="mt-3 text-2xl font-bold text-white">Nothing to checkout</h3>
              <p className="mt-2 text-sm muted-text">Add products to your cart and come back here.</p>
              <Link to="/home" className="ui-btn ui-btn-primary mt-5 inline-block rounded-xl px-5 py-2.5">
                Continue Shopping
              </Link>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="ui-panel p-5">
            <h2 className="text-xl font-bold text-white">Order Summary</h2>
            <p className="mt-3 text-sm muted-text">Items: {items.length}</p>
            <p className="mt-1 text-lg font-semibold text-white">Total: ₹{total.toFixed(2)}</p>
            <button
              onClick={placeOrder}
              disabled={!user || !items.length || placingOrder}
              className="ui-btn ui-btn-primary mt-4 w-full rounded-xl px-4 py-2 disabled:opacity-50"
            >
              {placingOrder ? 'Placing Order...' : 'Place Order'}
            </button>
            {!items.length && <p className="mt-3 text-sm muted-text">Checkout is disabled because cart is empty.</p>}
            {!user && <p className="mt-3 text-sm muted-text">Please login as customer to place the order.</p>}
            {status && <p className="mt-3 text-sm muted-text">{status}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};
export default CheckoutPage;
