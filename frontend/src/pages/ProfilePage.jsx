import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const pick = (user, keys, fallback = '—') => {
  for (const key of keys) {
    const value = user?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return fallback;
};

const ProfilePage = () => {
  const { user } = useAuth();

  const email = pick(user, ['email', 'Email']);
  const emailFallbackName = String(email).includes('@') ? String(email).split('@')[0] : 'User';
  const name = pick(user, ['name', 'Name'], emailFallbackName);
  const phone = pick(user, ['phoneNo', 'Phone_No', 'phone']);
  const role = pick(user, ['role', 'Role']);
  const userId = pick(user, ['userId', 'User_ID']);
  const roleValue = String(role).toLowerCase();

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-5 text-4xl font-black tracking-tight text-white">Your Profile</h1>

      <div className="ui-panel p-6">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] text-xl font-bold amber-text">
            {String(name).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold text-white">{name}</p>
            <p className="text-sm muted-text">{email}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-3">
            <p className="text-xs uppercase tracking-wider muted-text">Role</p>
            <p className="mt-1 text-white">{role}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-3">
            <p className="text-xs uppercase tracking-wider muted-text">User ID</p>
            <p className="mt-1 text-white">{userId}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-3 sm:col-span-2">
            <p className="text-xs uppercase tracking-wider muted-text">Phone</p>
            <p className="mt-1 text-white">{phone}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {roleValue === 'customer' && (
            <Link to="/orders" className="ui-btn ui-btn-primary rounded-xl px-4 py-2">
              View Orders
            </Link>
          )}
          {roleValue === 'vendor' && (
            <Link to="/vendor" className="ui-btn ui-btn-primary rounded-xl px-4 py-2">
              Vendor Dashboard
            </Link>
          )}
          {roleValue === 'admin' && (
            <Link to="/admin" className="ui-btn ui-btn-primary rounded-xl px-4 py-2">
              Admin Dashboard
            </Link>
          )}
          {roleValue === 'customer' && (
            <Link to="/cart" className="ui-btn ui-btn-ghost rounded-xl px-4 py-2">
              Go to Cart
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
