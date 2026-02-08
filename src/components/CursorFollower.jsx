import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const CursorFollower = () => {
  const cursorRef = useRef(null);
  const cursorDotRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    
    if (!cursor || !cursorDot) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let dotX = 0;
    let dotY = 0;

    // Update mouse position
    const updateMousePosition = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Animate cursor
    const animateCursor = () => {
      const speed = 0.15;
      const dotSpeed = 0.8;
      
      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;
      
      dotX += (mouseX - dotX) * dotSpeed;
      dotY += (mouseY - dotY) * dotSpeed;

      gsap.set(cursor, {
        x: cursorX - 20,
        y: cursorY - 20,
        force3D: true
      });

      gsap.set(cursorDot, {
        x: dotX - 4,
        y: dotY - 4,
        force3D: true
      });

      requestAnimationFrame(animateCursor);
    };

    // Start animation
    document.addEventListener('mousemove', updateMousePosition);
    animateCursor();

    // Hover effects
    const addHoverEffects = () => {
      const hoverElements = document.querySelectorAll('a, button, [data-cursor-hover], .hover-card, .animated-button');
      
      hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
          gsap.to(cursor, {
            scale: 1.5,
            duration: 0.3,
            ease: 'power2.out'
          });
          gsap.to(cursorDot, {
            scale: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        });

        el.addEventListener('mouseleave', () => {
          gsap.to(cursor, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
          gsap.to(cursorDot, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out'
          });
        });
      });

      // Special effects for different elements
      const textElements = document.querySelectorAll('h1, h2, h3, .gradient-text');
      textElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
          gsap.to(cursor, {
            scale: 2,
            backgroundColor: 'rgba(0, 240, 255, 0.1)',
            border: '2px solid #00f0ff',
            duration: 0.3,
            ease: 'power2.out'
          });
        });

        el.addEventListener('mouseleave', () => {
          gsap.to(cursor, {
            scale: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            duration: 0.3,
            ease: 'power2.out'
          });
        });
      });
    };

    // Add hover effects with a delay to ensure DOM is ready
    setTimeout(addHoverEffects, 100);

    // Hide cursor when leaving window
    const handleMouseLeave = () => {
      gsap.to([cursor, cursorDot], {
        opacity: 0,
        duration: 0.2
      });
    };

    const handleMouseEnter = () => {
      gsap.to([cursor, cursorDot], {
        opacity: 1,
        duration: 0.2
      });
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  // Don't render on mobile devices
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const cursor = cursorRef.current;
      const cursorDot = cursorDotRef.current;
      if (cursor) cursor.style.display = 'none';
      if (cursorDot) cursorDot.style.display = 'none';
    }
  }, []);

  return (
    <>
      {/* Main cursor */}
      <div
        ref={cursorRef}
        className="cursor-follower fixed top-0 left-0 w-10 h-10 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%',
          backdropFilter: 'blur(10px)',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* Cursor dot */}
      <div
        ref={cursorDotRef}
        className="cursor-dot fixed top-0 left-0 w-2 h-2 pointer-events-none z-[9999]"
        style={{
          background: '#00f0ff',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 10px #00f0ff'
        }}
      />
    </>
  );
};

export default CursorFollower;