import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, Menu, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-800">
      <div className="max-w-full px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Responsive */}
          <Link to="/admin" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Bodh Script Club Logo" 
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl font-heading font-bold gradient-text">
                ADMIN PANEL
              </h1>
              <p className="text-xs font-mono text-gray-500">Bodh Script Club</p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-lg font-heading font-bold gradient-text">
                ADMIN
              </h1>
            </div>
          </Link>

          {/* Desktop Actions - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            {/* Quick Link to Public Site */}
            <Link
              to="/"
              className="flex items-center gap-2 px-3 xl:px-4 py-2 glass-effect rounded-xl hover:bg-white/5 transition-all duration-300 group"
            >
              <Home size={18} className="text-gray-400 group-hover:text-neon-cyan transition-colors" />
              <span className="text-sm font-body text-gray-400 group-hover:text-white transition-colors">
                View Site
              </span>
            </Link>

            {/* Admin Info */}
            <div className="glass-effect rounded-xl px-3 xl:px-4 py-2 border border-gray-800">
              <p className="text-xs font-body text-gray-500">Logged in as</p>
              <p className="text-sm font-heading font-bold text-white truncate max-w-[150px]">{user?.name}</p>
              <p className="text-xs font-mono text-neon-cyan truncate max-w-[150px]">{user?.email}</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 xl:px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all duration-300 group"
            >
              <LogOut size={18} className="text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="text-sm font-body text-red-400 group-hover:text-red-300 transition-colors">
                Logout
              </span>
            </button>
          </div>

          {/* Mobile/Tablet Actions - Compact */}
          <div className="flex lg:hidden items-center gap-2">
            {/* User indicator */}
            <div className="hidden md:flex items-center gap-2 glass-effect rounded-lg px-3 py-2 border border-gray-800">
              <User size={16} className="text-neon-cyan" />
              <span className="text-sm font-body text-white truncate max-w-[100px]">{user?.name}</span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10 glass-effect rounded-lg hover:bg-white/5 transition-all duration-300"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X size={20} className="text-white" />
              ) : (
                <Menu size={20} className="text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-800 pt-4 space-y-3 animate-fade-in">
            {/* Mobile Admin Info */}
            <div className="glass-effect rounded-xl px-4 py-3 border border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30">
                  <User size={20} className="text-neon-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body text-gray-500">Logged in as</p>
                  <p className="text-sm font-heading font-bold text-white truncate">{user?.name}</p>
                  <p className="text-xs font-mono text-neon-cyan truncate">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Mobile Quick Link */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 px-4 py-3 glass-effect rounded-xl hover:bg-white/5 transition-all duration-300 group"
            >
              <Home size={20} className="text-gray-400 group-hover:text-neon-cyan transition-colors" />
              <span className="text-sm font-body text-gray-400 group-hover:text-white transition-colors">
                View Public Site
              </span>
            </Link>

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all duration-300 group"
            >
              <LogOut size={20} className="text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="text-sm font-body text-red-400 group-hover:text-red-300 transition-colors">
                Logout
              </span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
