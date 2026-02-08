import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-gray-800">
      <div className="max-w-full px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/admin" className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Bodh Script Club Logo" 
              className="h-10 w-10 object-contain"
            />
            <div>
              <h1 className="text-2xl font-heading font-bold gradient-text">
                ADMIN PANEL
              </h1>
              <p className="text-xs font-mono text-gray-500">Bodh Script Club</p>
            </div>
          </Link>

          {/* Admin Info & Actions */}
          <div className="flex items-center gap-4">
            {/* Quick Link to Public Site */}
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 glass-effect rounded-xl hover:bg-white/5 transition-all duration-300 group"
            >
              <Home size={18} className="text-gray-400 group-hover:text-neon-cyan transition-colors" />
              <span className="text-sm font-body text-gray-400 group-hover:text-white transition-colors">
                View Site
              </span>
            </Link>

            {/* Admin Info */}
            <div className="glass-effect rounded-xl px-4 py-2 border border-gray-800">
              <p className="text-xs font-body text-gray-500">Logged in as</p>
              <p className="text-sm font-heading font-bold text-white">{user?.name}</p>
              <p className="text-xs font-mono text-neon-cyan">{user?.email}</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all duration-300 group"
            >
              <LogOut size={18} className="text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="text-sm font-body text-red-400 group-hover:text-red-300 transition-colors">
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
