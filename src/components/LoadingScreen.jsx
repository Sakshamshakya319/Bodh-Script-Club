import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const LoadingScreen = ({ isLoading, onComplete }) => {
  const loadingRef = useRef(null);
  const logoRef = useRef(null);
  const progressRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (!isLoading) {
      // Hide loading screen
      const tl = gsap.timeline({
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });

      tl.to(progressRef.current, {
        width: '100%',
        duration: 0.5,
        ease: 'power2.out'
      })
      .to(textRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.3
      }, '-=0.2')
      .to(logoRef.current, {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        ease: 'back.in(1.7)'
      }, '-=0.1')
      .to(loadingRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, '-=0.2');

      return;
    }

    // Show loading screen animation
    const tl = gsap.timeline();
    
    tl.fromTo(loadingRef.current, 
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    )
    .fromTo(logoRef.current,
      { 
        scale: 0.5,
        opacity: 0,
        rotationY: 180
      },
      {
        scale: 1,
        opacity: 1,
        rotationY: 0,
        duration: 1,
        ease: 'back.out(1.7)'
      }
    )
    .fromTo(textRef.current,
      {
        opacity: 0,
        y: 30
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out'
      },
      '-=0.5'
    );

    // Animate progress bar
    gsap.to(progressRef.current, {
      width: '80%',
      duration: 2,
      ease: 'power2.out'
    });

    // Pulsing logo animation
    gsap.to(logoRef.current, {
      scale: 1.1,
      duration: 1.5,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut'
    });

  }, [isLoading, onComplete]);

  if (!isLoading) return null;

  return (
    <div
      ref={loadingRef}
      className="loading-screen fixed inset-0 bg-black z-[10000] flex items-center justify-center"
    >
      <div className="text-center">
        {/* Logo */}
        <div
          ref={logoRef}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink flex items-center justify-center">
            <span className="text-3xl font-heading font-bold text-white">BS</span>
          </div>
          <h1 className="text-3xl font-heading font-bold gradient-text">
            Bodh Script Club
          </h1>
        </div>

        {/* Loading text */}
        <div ref={textRef} className="mb-8">
          <p className="text-xl font-body text-gray-400 mb-2">
            Loading...
          </p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
          <div
            ref={progressRef}
            className="h-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-full"
            style={{ width: '0%' }}
          ></div>
        </div>

        {/* Loading percentage */}
        <p className="text-sm font-mono text-gray-500 mt-4">
          Initializing Components...
        </p>
      </div>

      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-neon-cyan rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;