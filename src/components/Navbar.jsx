import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Calendar, ChevronDown, Sun, Moon } from 'lucide-react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Delay animation to ensure DOM is ready
    const timer = setTimeout(() => {
      const navItems = document.querySelectorAll('.nav-item');
      if (navItems.length > 0) {
        gsap.fromTo('.nav-item',
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
        );
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Hide navbar on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/events', label: 'Events' },
    { path: '/members', label: 'Members' },
    { path: '/join', label: 'Join Us' },
  ];

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    setIsOpen(false);
    navigate('/', { replace: true });
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled
      ? theme === 'dark'
        ? 'glass-effect shadow-lg'
        : 'bg-white shadow-lg'
      : theme === 'dark'
        ? 'bg-transparent'
        : 'bg-white/80 backdrop-blur-sm'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-20 w-full">
          <Link to="/" className="nav-item flex items-center gap-2 md:gap-3 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Bodh Script Club Logo"
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
            />
            <h1 className={`text-xl sm:text-2xl md:text-3xl font-heading font-bold tracking-wider whitespace-nowrap ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
              }`}>
              BODH SCRIPT CLUB
            </h1>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-item font-body font-medium text-lg transition-all duration-300 relative group ${location.pathname === link.path
                  ? theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'
                  : theme === 'dark' ? 'text-gray-300 hover:text-neon-blue' : 'text-gray-700 hover:text-blue-600'
                  }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 transition-all duration-300 ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                  } ${theme === 'dark' ? 'bg-gradient-to-r from-neon-blue to-neon-purple' : 'bg-blue-600'
                  }`}></span>
              </Link>
            ))}

            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-300 ${theme === 'dark'
                ? 'hover:bg-neon-blue/10 text-yellow-400'
                : 'hover:bg-gray-100 text-gray-700'
                }`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {!user && !loading && (
              <Link
                to="/login"
                className={`nav-item px-6 py-2.5 rounded-lg font-body font-semibold transition-all duration-300 ${theme === 'dark'
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon text-white'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg text-white'
                  }`}
              >
                Login
              </Link>
            )}

            {user && (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${theme === 'dark'
                    ? 'neon-border hover:bg-neon-blue/10'
                    : 'border border-gray-300 hover:bg-gray-100'
                    }`}
                >
                  <User size={18} />
                  <span className="text-sm font-body">{user.name}</span>
                  <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl overflow-hidden animate-fadeIn ${theme === 'dark'
                    ? 'glass-effect border border-gray-800'
                    : 'bg-white border border-gray-200'
                    }`}>
                    <div className={`p-3 ${theme === 'dark' ? 'border-b border-gray-800' : 'border-b border-gray-200'}`}>
                      <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Signed in as</p>
                      <p className={`text-sm font-body font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.email}</p>
                    </div>

                    <Link
                      to="/my-registrations"
                      onClick={() => setShowDropdown(false)}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${theme === 'dark'
                        ? 'hover:bg-neon-blue/10'
                        : 'hover:bg-gray-100'
                        }`}
                    >
                      <Calendar size={18} className={theme === 'dark' ? 'text-neon-cyan' : 'text-blue-600'} />
                      <span className={`text-sm font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>My Registrations</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${theme === 'dark'
                        ? 'hover:bg-red-500/10 border-t border-gray-800'
                        : 'hover:bg-red-50 border-t border-gray-200'
                        }`}
                    >
                      <LogOut size={18} className="text-red-400" />
                      <span className="text-sm font-body text-red-400">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className={theme === 'dark' ? 'md:hidden text-white' : 'md:hidden text-gray-900'}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={`md:hidden ${theme === 'dark'
          ? 'glass-effect border-t border-gray-800'
          : 'bg-white border-t border-gray-200'
          }`}>
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-3 font-body text-lg transition-all duration-300 ${location.pathname === link.path
                  ? theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'
                  : theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Theme Switcher */}
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center gap-2 py-3 font-body text-lg ${theme === 'dark' ? 'text-yellow-400' : 'text-gray-700'
                }`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {!user && !loading && (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className={`w-full block py-3 px-4 text-center rounded-lg font-body font-semibold transition-all duration-300 mt-2 ${theme === 'dark'
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  }`}
              >
                Login
              </Link>
            )}

            {user && (
              <>
                <div className={`pt-2 pb-2 ${theme === 'dark' ? 'border-t border-gray-800' : 'border-t border-gray-200'}`}>
                  <p className={`text-xs font-body mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Signed in as</p>
                  <p className={`text-sm font-body font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                </div>
                <Link
                  to="/my-registrations"
                  className={`flex items-center gap-2 py-3 font-body ${theme === 'dark' ? 'text-neon-cyan' : 'text-blue-600'
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Calendar size={18} />
                  My Registrations
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-left py-3 text-red-400 font-body"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
