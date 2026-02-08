import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      setInitialized(true);
      return;
    }

    try {
      console.log('Checking authentication...');
      const { data } = await authAPI.getMe();
      console.log('User authenticated:', data.user);
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Only remove token if it's actually invalid (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Token invalid, removing...');
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await authAPI.login(credentials);
      // Store the access token (the API returns accessToken, not token)
      localStorage.setItem('token', data.accessToken);
      setUser(data.user);
      console.log('Login successful:', data.user);
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const { data } = await authAPI.signup(userData);
      // Store the access token (the API returns accessToken, not token)
      localStorage.setItem('token', data.accessToken);
      setUser(data.user);
      console.log('Signup successful:', data.user);
      return data;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    setUser(null);
    // Fire-and-forget; don't block. No /auth/logout on Vercel - ignore errors.
    authAPI.logout().catch(() => {});
  };

  const value = {
    user,
    loading,
    initialized,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    checkAuth // Expose checkAuth for manual refresh
  };

  // Don't render children until auth is checked
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-body text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
