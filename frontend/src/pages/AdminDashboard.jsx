import { useEffect, useState } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');

  const fetchData = async () => {
    const [usersRes, ordersRes, categoriesRes] = await Promise.all([
      api.get('/admin/users'),
      api.get('/admin/orders'),
      api.get('/admin/categories'),
    ]);
    setUsers(usersRes.data.data || []);
    setOrders(ordersRes.data.data || []);
    setCategories(categoriesRes.data.data || []);
  };

  useEffect(() => {
    fetchData().catch(console.error);
  }, []);

  const addCategory = async () => {
    if (!categoryName.trim()) return;
    await api.post('/admin/categories', { categoryName });
    setCategoryName('');
    fetchData();
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-4xl font-black tracking-tight text-white">Admin Dashboard</h1>

      <div className="ui-panel p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Manage Categories</h2>
        <div className="mb-3 flex gap-2">
          <input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="search-glass flex-1 rounded px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
            placeholder="New category"
          />
          <button onClick={addCategory} className="ui-btn ui-btn-primary rounded-xl px-4">
            Add
          </button>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.Category_ID} className="rounded-lg border border-white/10 bg-[rgba(255,255,255,0.03)] p-2 text-sm text-[#e8e8ea]">
              {c.Category_Name}
            </li>
          ))}
        </ul>
      </div>

      <div className="ui-panel p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Users</h2>
        <p className="mb-2 text-sm muted-text">Total users: {users.length}</p>
      </div>

      <div className="ui-panel p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Orders</h2>
        <p className="mb-2 text-sm muted-text">Total orders: {orders.length}</p>
      </div>
    </section>
  );
};

export default AdminDashboard;
