import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const linkClass = 'nav-link relative inline-flex items-center whitespace-nowrap py-1 text-sm';

const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="20" r="1" />
    <circle cx="18" cy="20" r="1" />
    <path d="M3 4h2l2.3 10.5a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 7H7" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c2.2-3.8 13.8-3.8 16 0" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const cartCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const profilePath = user ? '/profile' : '/auth';

  const textLink = (to, label) => (
    <NavLink to={to} className={linkClass}>
      {() => (
        <span className="icon-text-link relative">
          <span>{label}</span>
        </span>
      )}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#161618]/78 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-y-3 px-4 py-4">
        <Link to="/auth" className="text-2xl font-black tracking-tight cream-text sm:text-3xl">
          MultiVendor
        </Link>

        <div className="nav-item-gap mobile-nav-scroll flex w-full items-center justify-end text-[#E9E9E9] sm:w-auto">
          {(!user || user.role === 'Customer') && textLink('/home', 'Home')}
          {user?.role === 'Vendor' && textLink('/vendor', 'Vendor')}
          {user?.role === 'Admin' && textLink('/admin', 'Admin')}

          {(!user || user.role === 'Customer') && (
            <NavLink to="/cart" className={linkClass}>
              {() => (
                <span className="icon-text-link relative">
                  <span className="cart-icon-wrap">
                    <CartIcon />
                    {cartCount > 0 && (
                      <span className="cart-badge">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </span>
                  <span>Cart</span>
                </span>
              )}
            </NavLink>
          )}

          <NavLink to={profilePath} className={linkClass}>
            {() => (
              <span className="icon-text-link relative">
                <UserIcon />
                <span>Profile</span>
              </span>
            )}
          </NavLink>

          {user ? (
            <button onClick={logout} className="nav-link icon-text-link text-sm text-[#E9E9E9]">
              <LogoutIcon />
              <span>Logout</span>
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
