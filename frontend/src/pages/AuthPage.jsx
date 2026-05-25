import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CustomerIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 7h12l-1.2 8a2 2 0 0 1-2 1.7H9.2a2 2 0 0 1-2-1.7L6 7z" />
    <path d="M9 7V5a3 3 0 0 1 6 0v2" />
  </svg>
);

const VendorIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10l9-6 9 6" />
    <path d="M5 10h14v10H5z" />
    <path d="M9 14h6" />
  </svg>
);

const AdminIcon = () => (
  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 4v5c0 5-3.4 7.7-7 9-3.6-1.3-7-4-7-9V7l7-4z" />
    <path d="M9.5 12.5l1.7 1.7 3.3-3.3" />
  </svg>
);

const roleCards = [
  { role: 'Customer', label: 'Customer', icon: CustomerIcon, delay: '0ms' },
  { role: 'Vendor', label: 'Vendor', icon: VendorIcon, delay: '120ms' },
  { role: 'Admin', label: 'Admin', icon: AdminIcon, delay: '240ms' },
];

const AuthPage = () => {
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState('Customer');
  const [form, setForm] = useState({ email: '', password: '', role: 'Customer', name: '', phoneNo: '' });
  const [error, setError] = useState('');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isPrivilegedLoginOnly = selectedRole === 'Vendor' || selectedRole === 'Admin';

  if (isAuthenticated) {
    if (user?.role === 'Vendor') return <Navigate to="/vendor" replace />;
    if (user?.role === 'Admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/home" replace />;
  }

  const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'register' && !isPrivilegedLoginOnly) {
        await api.post('/auth/register', { ...form, role: selectedRole });
        toast.success('Account created successfully. Please login.');
      }
      const res = await api.post('/auth/login', { email: form.email, password: form.password });

      const loggedInRole = res.data?.data?.user?.role;
      if (loggedInRole !== selectedRole) {
        const mismatchMessage = `This account is '${loggedInRole}'. Please choose '${loggedInRole}' role and try again.`;
        setError(mismatchMessage);
        toast.error(mismatchMessage);
        return;
      }

      login(res.data.data);
      toast.success('Logged in successfully');

      if (loggedInRole === 'Vendor') {
        navigate('/vendor');
      } else if (loggedInRole === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/home');
      }
    } catch (err) {
      if (!err.response) {
        const networkMessage = 'Cannot reach backend server. Please ensure backend is running on http://localhost:5000';
        setError(networkMessage);
        toast.error(networkMessage);
      } else {
        const apiError = err.response?.data;
        const validationMessages = Array.isArray(apiError?.errors)
          ? apiError.errors.map((e) => e.msg).filter(Boolean)
          : [];

        if (validationMessages.length) {
          const validationMessage = validationMessages.join(', ');
          setError(validationMessage);
          toast.error(validationMessage);
        } else {
          const authErrorMessage = apiError?.message || 'Authentication failed';
          setError(authErrorMessage);
          toast.error(authErrorMessage);
        }
      }
    }
  };

  if (step === 'role') {
    return (
      <section className="immersive-auth min-h-screen">
        <div className="immersive-auth-overlay" />
        <div className="immersive-auth-blur" />

        <div className="relative z-10 flex min-h-screen flex-col px-6 py-8 md:px-10">
          <div className="auth-brand-glow text-4xl font-black tracking-tight text-white">MultiVendor</div>

          <div className="mx-auto mt-10 flex w-full max-w-6xl flex-1 flex-col items-center justify-center text-center">
            <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.05] text-[#F5F5F3] md:text-7xl">
             Trusted Multi-Vendor Marketplace.
            </h1>
            <p className="mt-4 text-base text-[#A1A1A1] md:text-lg">Select your gateway to the marketplace.</p>

            <div className="mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              {roleCards.map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(card.role);
                      if (card.role === 'Vendor' || card.role === 'Admin') {
                        setMode('login');
                      }
                      setStep('credentials');
                      setError('');
                    }}
                    className="immersive-role-card role-card-entrance"
                    style={{ animationDelay: card.delay }}
                  >
                    <span className="immersive-role-icon">
                      <Icon />
                    </span>
                    <span className="mt-4 block text-2xl font-semibold text-[#F5F5F3]">{card.label}</span>
                    <span className="mt-1 block text-sm text-[#A1A1A1]">Enter as {card.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigate('/home')}
              className="mt-10 text-sm font-medium text-[#A1A1A1] underline underline-offset-4 transition hover:text-[#FFB800]"
            >
              Enter as Guest
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-lg px-4 pb-10">
      <div className="glass-card rounded-3xl p-7 md:p-8">
        <h1 className="mb-2 text-3xl font-black tracking-tight text-white">
          {isPrivilegedLoginOnly ? 'Login' : mode === 'login' ? 'Login' : 'Register'}
        </h1>
        <p className="mb-5 text-sm muted-text">
          {'Secure login with role-based access.'}
        </p>

        {error && <p className="mb-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-300">{error}</p>}

        {
          <>
            <p className="mb-3 text-sm muted-text">
              Signing in as: <span className="font-semibold amber-text">{selectedRole}</span>
            </p>

            <form onSubmit={onSubmit} className="space-y-3">
              {mode === 'register' && !isPrivilegedLoginOnly && (
                <>
                  <input
                    name="name"
                    placeholder="Full name"
                    onChange={onChange}
                    className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                  />
                  <input
                    name="phoneNo"
                    placeholder="Phone number"
                    onChange={onChange}
                    className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
                  />
                </>
              )}
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                onChange={onChange}
                className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
              />
              <input
                name="password"
                type="password"
                required
                minLength={mode === 'register' ? 8 : 1}
                placeholder="Password"
                onChange={onChange}
                className="search-glass w-full rounded-xl px-3 py-2 text-white outline-none placeholder:text-[#8b8b95]"
              />
              {mode === 'register' && !isPrivilegedLoginOnly && (
                <p className="text-xs muted-text">
                  Password must be at least 8 chars and include upper, lower, number, and special character.
                </p>
              )}
              <button className="ui-btn ui-btn-primary w-full py-3">
                {isPrivilegedLoginOnly ? 'Login' : mode === 'login' ? 'Login' : 'Create account'}
              </button>
            </form>

            <button
              onClick={() => {
                setStep('role');
                setError('');
              }}
              className="mt-3 text-sm muted-text hover:text-white"
            >
              ← Back to role selection
            </button>

            {!isPrivilegedLoginOnly && (
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="mt-3 block text-sm font-medium amber-text hover:brightness-110"
              >
                Enter without login (Guest)
              </button>
            )}

            {!isPrivilegedLoginOnly && (
              <button
                onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
                className="mt-4 block text-sm amber-text hover:brightness-110"
              >
                {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
              </button>
            )}
          </>
        }
      </div>
    </section>
  );
};

export default AuthPage;
