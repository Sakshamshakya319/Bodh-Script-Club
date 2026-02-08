import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Calendar, ChevronDown } from 'lucide-react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    gsap.fromTo('.nav-item', 
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
    );
  }, []);

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
    { path: '/gallery', label: 'Gallery' },
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
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'glass-effect shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-20 w-full">
          <Link to="/" className="nav-item flex items-center gap-2 md:gap-3 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Bodh Script Club Logo" 
              className="h-10 w-10 md:h-12 md:w-12 object-contain"
            />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold gradient-text tracking-wider whitespace-nowrap">
              BODH SCRIPT CLUB
            </h1>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-item font-body font-medium text-lg transition-all duration-300 hover:text-neon-blue relative group ${
                  location.pathname === link.path ? 'text-neon-blue' : 'text-gray-300'
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-neon-blue to-neon-purple transition-all duration-300 group-hover:w-full ${
                  location.pathname === link.path ? 'w-full' : ''
                }`}></span>
              </Link>
            ))}
            
            {user && (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2 neon-border rounded-lg hover:bg-neon-blue/10 transition"
                >
                  <User size={18} />
                  <span className="text-sm font-body">{user.name}</span>
                  <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 glass-effect rounded-xl border border-gray-800 shadow-xl overflow-hidden animate-fadeIn">
                    <div className="p-3 border-b border-gray-800">
                      <p className="text-sm font-body text-gray-400">Signed in as</p>
                      <p className="text-sm font-body text-white font-semibold truncate">{user.email}</p>
                    </div>
                    
                    <Link
                      to="/my-registrations"
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-neon-blue/10 transition-colors"
                    >
                      <Calendar size={18} className="text-neon-cyan" />
                      <span className="text-sm font-body text-gray-300">My Registrations</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors border-t border-gray-800"
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
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden glass-effect border-t border-gray-800">
          <div className="px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-3 font-body text-lg transition-all duration-300 ${
                  location.pathname === link.path ? 'text-neon-blue' : 'text-gray-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="pt-2 pb-2 border-t border-gray-800">
                  <p className="text-xs text-gray-500 font-body mb-1">Signed in as</p>
                  <p className="text-sm text-white font-body font-semibold">{user.name}</p>
                </div>
                <Link
                  to="/my-registrations"
                  className="flex items-center gap-2 py-3 text-neon-cyan font-body"
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
