import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import CustomSelect from '../components/CustomSelect';

const initial = { name: '', description: '', imageUrl: '', price: '', stock: '', categoryId: '' };

const VendorDashboard = () => {
  const [form, setForm] = useState(initial);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        api.get('/products/vendor/me'),
        api.get('/products/categories'),
        api.get('/orders/vendor/me'),
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
      setOrders(ordersRes.data.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData().catch(console.error);
  }, []);

  const createProduct = async (e) => {
    e.preventDefault();
    if (!form.categoryId) return;
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
      };

      if (form.imageUrl.trim()) {
        payload.imageUrl = form.imageUrl.trim();
      }

      await api.post('/products', {
        ...payload,
      });
      setForm(initial);
      toast.success('Product added successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to add product');
    }
  };

  const orderMap = useMemo(() => {
    const map = new Map();
    orders.forEach((orderRow) => {
      if (!map.has(orderRow.Order_ID)) {
        map.set(orderRow.Order_ID, {
          orderId: orderRow.Order_ID,
          date: orderRow.Order_Date,
          status: orderRow.Status,
          totalAmount: Number(orderRow.Total_Amount || 0),
          customerId: orderRow.Customer_ID,
        });
      }
    });
    return map;
  }, [orders]);

  const analytics = useMemo(() => {
    const uniqueOrders = Array.from(orderMap.values());
    const totalProducts = products.length;
    const totalOrders = uniqueOrders.length;
    const totalRevenue = uniqueOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const unitsSold = orders.reduce((sum, order) => sum + Number(order.Quantity || 0), 0);
    const lowStockCount = products.filter((product) => Number(product.Stock) <= 5).length;
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    const topProductsMap = new Map();
    orders.forEach((row) => {
      const current = topProductsMap.get(row.Product_ID) || {
        productId: row.Product_ID,
        name: row.Product_Name,
        units: 0,
        revenue: 0,
      };

      current.units += Number(row.Quantity || 0);
      current.revenue += Number(row.Price_At_Purchase || 0) * Number(row.Quantity || 0);
      topProductsMap.set(row.Product_ID, current);
    });

    const topProducts = Array.from(topProductsMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    const recentOrders = uniqueOrders
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalProducts,
      totalOrders,
      totalRevenue,
      unitsSold,
      lowStockCount,
      avgOrderValue,
      topProducts,
      recentOrders,
    };
  }, [products, orders, orderMap]);

  const statCards = [
    { label: 'Total Revenue', value: `₹${analytics.totalRevenue.toFixed(2)}` },
    { label: 'Orders', value: analytics.totalOrders },
    { label: 'Products Listed', value: analytics.totalProducts },
    { label: 'Units Sold', value: analytics.unitsSold },
    { label: 'Avg Order Value', value: `₹${analytics.avgOrderValue.toFixed(2)}` },
    { label: 'Low Stock Alerts', value: analytics.lowStockCount },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-5 text-4xl font-black tracking-tight text-white">Vendor Dashboard</h1>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div key={card.label} className="ui-panel p-4">
            <p className="text-xs uppercase tracking-[0.14em] muted-text">{card.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="ui-panel p-4">
          <h2 className="text-xl font-bold text-white">Top Selling Products</h2>
          <div className="mt-3 space-y-2">
            {analytics.topProducts.length ? (
              analytics.topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      #{index + 1} {product.name}
                    </p>
                    <p className="text-xs muted-text">Revenue: ₹{product.revenue.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-semibold amber-text">{product.units} sold</p>
                </div>
              ))
            ) : (
              <p className="text-sm muted-text">No sales yet.</p>
            )}
          </div>
        </div>

        <div className="ui-panel p-4">
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <div className="mt-3 space-y-2">
            {analytics.recentOrders.length ? (
              analytics.recentOrders.map((order) => (
                <div key={order.orderId} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Order #{order.orderId}</p>
                    <p className="text-xs muted-text">{new Date(order.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs muted-text">Customer #{order.customerId}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm font-semibold amber-text">₹{Number(order.totalAmount || 0).toFixed(2)}</p>
                    <span className="rounded-full border border-[#FFC107]/45 bg-[#FFC107]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] amber-text">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm muted-text">No recent orders.</p>
            )}
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-2xl font-bold text-white">Add Product</h2>
      <form
        onSubmit={createProduct}
        className="ui-panel mb-6 grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <input
          className="search-glass rounded px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="search-glass rounded px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
        <input
          className="search-glass rounded px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
          placeholder="Price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <input
          className="search-glass rounded px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
          placeholder="Stock"
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          required
        />
        <CustomSelect
          value={form.categoryId}
          onChange={(value) => setForm({ ...form, categoryId: value })}
          placeholder="Select category"
          options={[
            { value: '', label: 'Select category' },
            ...categories.map((c) => ({ value: String(c.Category_ID), label: c.Category_Name })),
          ]}
        />
        <input type="hidden" required value={form.categoryId} readOnly />
        <textarea
          className="search-glass rounded px-3 py-2 text-white outline-none placeholder:text-[#8b8b95] md:col-span-2 lg:col-span-3"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button className="ui-btn ui-btn-primary rounded-xl px-3 py-2 md:col-span-2 lg:col-span-3">Add Product</button>
      </form>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Products</h2>
        {loading && <p className="text-sm muted-text">Refreshing dashboard...</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.Product_ID} className="product-hover overflow-hidden rounded-xl border border-white/10 bg-[rgba(255,255,255,0.04)] backdrop-blur-xl">
            <img
              src={p.Image_URL || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80'}
              alt={p.Name}
              className="h-40 w-full object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold cream-text">{p.Name}</h3>
              <p className="line-clamp-2 text-sm muted-text">{p.Description || 'No description'}</p>
              <p className="mt-2 text-sm font-semibold amber-text">₹{Number(p.Price).toFixed(2)}</p>
              <p className="text-xs muted-text">Stock: {p.Stock}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default VendorDashboard;
