import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-cyan mb-4">
              <LogIn size={32} className="text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold gradient-text mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400 font-body">
              Login to access your account
            </p>
          </div>

          {/* Login Form */}
          <div className="glass-effect rounded-2xl p-8 border border-gray-800">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm font-body">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-body text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-body focus:border-neon-blue focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-body text-gray-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-black/50 border border-gray-700 rounded-xl text-white font-body focus:border-neon-blue focus:outline-none transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-neon-cyan transition-colors focus:outline-none"
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
                className="w-full py-4 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-xl font-body font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-neon-blue/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-black text-gray-500 font-body">or</span>
              </div>
            </div>

            {/* Signup Link */}
            <div className="text-center">
              <p className="text-gray-400 font-body text-sm">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  state={{ from, eventId }}
                  className="text-neon-cyan hover:text-neon-blue transition-colors font-semibold"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-400 font-body text-sm transition-colors"
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
