import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/';
  const eventId = location.state?.eventId;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData);
      console.log('Login response:', response);

      const user = response?.user;
      if (user && (user.role === 'admin' || user.isAdmin)) {
        console.log('Admin user detected, redirecting to dashboard...');
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { state: { eventId }, replace: true });
      }
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message || 'Login failed. Please check your credentials.';
      const code = data?.error;
      // Show actionable hint for server config errors (Vercel env vars)
      if (code === 'JWT_SECRET_MISSING' || code === 'MONGODB_URI_MISSING' || code === 'DB_CONNECTION_FAILED') {
        setError(`${msg} If you just deployed, add MONGODB_URI and JWT_SECRET in Vercel → Project Settings → Environment Variables, then redeploy.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`min-h-screen flex items-center justify-center px-4 py-20 ${theme === 'dark' ? 'bg-black' : 'bg-white'
        }`}>
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
              <LogIn size={32} className="text-white" />
            </div>
            <h1 className={`text-4xl md:text-5xl font-heading font-bold mb-2 ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
              }`}>
              Welcome Back
            </h1>
            <p className={`font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Login to access your account
            </p>
          </div>

          {/* Login Form */}
          <div className={`rounded-2xl p-8 border ${theme === 'dark'
              ? 'glass-effect border-gray-800'
              : 'bg-white border-gray-200 shadow-lg'
            }`}>
            {error && (
              <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${theme === 'dark'
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-red-50 border-red-300'
                }`}>
                <AlertCircle size={20} className={`flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-red-500' : 'text-red-600'
                  }`} />
                <p className={`text-sm font-body ${theme === 'dark' ? 'text-red-400' : 'text-red-700'
                  }`}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className={`block text-sm font-body mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={20} className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl font-body transition-colors ${theme === 'dark'
                        ? 'bg-black/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      } focus:outline-none`}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-body mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={20} className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`w-full pl-12 pr-12 py-3 border rounded-xl font-body transition-colors ${theme === 'dark'
                        ? 'bg-black/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      } focus:outline-none`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-colors focus:outline-none ${theme === 'dark'
                        ? 'text-gray-500 hover:text-neon-cyan'
                        : 'text-gray-400 hover:text-blue-600'
                      }`}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl font-body font-semibold hover:scale-105 transition-all duration-300 shadow-lg text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>


          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className={`font-body text-sm transition-colors ${theme === 'dark'
                  ? 'text-gray-500 hover:text-gray-400'
                  : 'text-gray-500 hover:text-gray-600'
                }`}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;
