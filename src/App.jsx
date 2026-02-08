import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { AuthProvider } from './context/AuthContext';
import { gsapAnimations } from './utils/gsap';

// Components
import Navbar from './components/Navbar';
import CursorFollower from './components/CursorFollower';
import LoadingScreen from './components/LoadingScreen';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import Members from './pages/Members';
import Gallery from './pages/Gallery';
import Feedback from './pages/Feedback';
import JoinUs from './pages/JoinUs';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyRegistrations from './pages/MyRegistrations';
import Admin from './pages/Admin';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const cursorRef = useRef(null);

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

  // Cursor glow position - state so the colored glow follows the mouse
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const glowPosRef = useRef({ x: 0, y: 0 });
  const glowRafRef = useRef(null);

  useEffect(() => {
    const updateGlowPosition = (e) => {
      glowPosRef.current = { x: e.clientX, y: e.clientY };
      if (glowRafRef.current == null) {
        glowRafRef.current = requestAnimationFrame(() => {
          setGlowPos({ x: glowPosRef.current.x, y: glowPosRef.current.y });
          glowRafRef.current = null;
        });
      }
    };

    window.addEventListener('mousemove', updateGlowPosition);
    return () => {
      window.removeEventListener('mousemove', updateGlowPosition);
      if (glowRafRef.current != null) cancelAnimationFrame(glowRafRef.current);
    };
  }, [isInitialized]);

  const glowStyle = {
    left: glowPos.x,
    top: glowPos.y,
    transform: 'translate(-50%, -50%)',
  };

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

        {/* Cursor Glow - position follows mouse so color moves with cursor */}
        <div 
          ref={cursorRef} 
          className="cursor-glow fixed w-[400px] h-[400px] pointer-events-none z-[99998] rounded-full mix-blend-screen filter blur-[50px] opacity-60 transition-opacity duration-300"
          style={{ 
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.5) 0%, rgba(0, 240, 255, 0.3) 30%, rgba(176, 0, 255, 0.2) 50%, rgba(255, 0, 255, 0.1) 70%, transparent 85%)',
            pointerEvents: 'none',
            ...glowStyle
          }}
        />

        {/* Precision Cursor Follower */}
        {isInitialized && <CursorFollower />}

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
                <Route path="/members" element={<Members />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/join" element={<JoinUs />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
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
