import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Menu, X, ChevronDown,
  LayoutDashboard, Package, LogOut, User, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchOpen, setSearchOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/products' },
    { label: 'About', to: '/about' },
  ];

  // Safe helpers — work even when user profile hasn't been fetched yet
  const getDashboardLink = () => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'seller') return '/seller/dashboard';
    return '/account';
  };

  const getInitials = () => {
    if (!user) return <User size={16} />;
    return (user.username || user.email).charAt(0).toUpperCase();
  };

  const getDashboardLabel = () => {
    if (user?.role === 'admin') return 'Admin Panel';
    if (user?.role === 'seller') return 'Seller Dashboard';
    return 'My Account';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black">

      {/* ── Search overlay ────────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="absolute inset-0 z-10 bg-black flex items-center px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSearch} className="flex items-center w-full max-w-3xl mx-auto gap-4">
            <Search size={20} className="text-[#C9A84C] shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rugs, kilims, cushions..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg outline-none border-b border-[#C9A84C] pb-1 focus:border-[#D4B96A]"
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X size={22} />
            </button>
          </form>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="shrink-0 group" onClick={() => setMobileOpen(false)}>
            <span className="text-[#C9A84C] font-semibold tracking-[0.3em] text-base uppercase group-hover:text-[#D4B96A] transition-colors duration-200">
              Golden Knot
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-sm font-medium tracking-wider uppercase transition-colors duration-200 relative group ${
                    isActive ? 'text-[#C9A84C]' : 'text-gray-300 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {label}
                    <span className={`absolute -bottom-1 left-0 h-px bg-[#C9A84C] transition-all duration-200 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-300 hover:text-[#C9A84C] transition-colors duration-200 rounded-full hover:bg-white/5"
              aria-label="Search"
            >
              <Search size={19} />
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-300 hover:text-[#C9A84C] transition-colors duration-200 rounded-full hover:bg-white/5"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={19} />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-[#C9A84C] text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth — desktop */}
            <div className="hidden md:flex items-center gap-2 ml-2">
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    <span className="w-8 h-8 rounded-full bg-[#C9A84C] text-black font-semibold text-sm flex items-center justify-center shrink-0">
                      {getInitials()}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                      {/* Profile info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        {user ? (
                          <>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Signed in as</p>
                            <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{user.email}</p>
                            <span className="inline-block mt-1.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#A8872F]">
                              {user.role}
                            </span>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500">You are signed in</p>
                        )}
                      </div>

                      {/* Dashboard */}
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#C9A84C] transition-colors"
                      >
                        {user?.role === 'admin' ? <ShieldCheck size={16} /> : <LayoutDashboard size={16} />}
                        {getDashboardLabel()}
                      </Link>

                      {/* Orders */}
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#C9A84C] transition-colors"
                      >
                        <Package size={16} />
                        My Orders
                      </Link>

                      {/* Sign out */}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 transition-colors duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-medium bg-[#C9A84C] hover:bg-[#D4B96A] text-black px-4 py-1.5 rounded transition-colors duration-200"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile — avatar or user icon */}
            {isAuthenticated ? (
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="md:hidden w-8 h-8 rounded-full bg-[#C9A84C] text-black font-semibold text-sm flex items-center justify-center shrink-0"
              >
                {getInitials()}
              </button>
            ) : (
              <Link to="/login" className="md:hidden p-2 text-gray-300 hover:text-[#C9A84C] transition-colors">
                <User size={19} />
              </Link>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/5"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-3 text-sm font-medium tracking-wider uppercase rounded-lg transition-colors ${
                    isActive ? 'text-[#C9A84C] bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-1">
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <LayoutDashboard size={16} />
                {getDashboardLabel()}
              </Link>
              <Link
                to="/orders"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <Package size={16} />
                My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="px-4 pb-4 flex gap-2 border-t border-white/10 pt-4">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-medium text-gray-300 border border-white/20 rounded hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-2.5 text-sm font-medium bg-[#C9A84C] hover:bg-[#D4B96A] text-black rounded transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
