import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
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
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Use quickTo for better performance
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.5, ease: "power3.out" });

    // Initial centering
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });

    const moveCursor = (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    window.addEventListener('mousemove', moveCursor);
    
    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div 
          ref={cursorRef} 
          className="cursor-glow fixed top-0 left-0 w-[300px] h-[300px] pointer-events-none z-[99999] rounded-full mix-blend-screen filter blur-[40px]"
          style={{ 
            background: 'radial-gradient(circle, rgba(0, 240, 255, 0.4) 0%, rgba(0, 240, 255, 0.2) 40%, rgba(176, 0, 255, 0.1) 60%, transparent 75%)',
            pointerEvents: 'none'
          }}
        ></div>
        <div className="w-full overflow-x-hidden">
          <Navbar />
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
        </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
