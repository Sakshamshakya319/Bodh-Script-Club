import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { AuthProvider } from './context/AuthContext';
import { gsapAnimations } from './utils/gsap';

// Components
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Members from './pages/Members';
import Feedback from './pages/Feedback';
import JoinUs from './pages/JoinUs';
import Login from './pages/Login';
import MyRegistrations from './pages/MyRegistrations';
import Admin from './pages/Admin';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize app with loading sequence
    const initializeApp = async () => {
      try {
        // Simulate loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Initialize GSAP animations
        gsapAnimations.initAll();

        setIsLoading(false);

        // Page load animation after loading screen disappears
        setTimeout(() => {
          gsapAnimations.pageLoadAnimation();
          setIsInitialized(true);
        }, 500);

      } catch (error) {
        console.error('Error initializing app:', error);
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      gsapAnimations.cleanup();
    };
  }, []);



  // Refresh GSAP animations when route changes
  useEffect(() => {
    if (isInitialized) {
      setTimeout(() => {
        gsapAnimations.refresh();
      }, 100);
    }
  }, [isInitialized]);

  return (
    <AuthProvider>
      <Router>
        {/* Loading Screen */}
        <LoadingScreen
          isLoading={isLoading}
          onComplete={() => setIsInitialized(true)}
        />



        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Main App Content */}
        {isInitialized && (
          <div className="w-full overflow-x-hidden page-content">
            <div className="page-header">
              <Navbar />
            </div>
            <main className="hero-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/members" element={<Members />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/join" element={<JoinUs />} />
                <Route path="/login" element={<Login />} />

                <Route path="/my-registrations" element={<MyRegistrations />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/*" element={<Admin />} />
              </Routes>
            </main>
          </div>
        )}
      </Router>
    </AuthProvider>
  );
}

export default App;
