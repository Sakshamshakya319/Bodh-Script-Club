import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Star, Quote } from 'lucide-react';
import LazyImage from './LazyImage';

const TestimonialCarousel = ({ testimonials }) => {
  const carouselRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || testimonials.length === 0) return;

    const totalWidth = carousel.scrollWidth / 2;
    
    // Create animation
    animationRef.current = gsap.to(carousel, {
      x: -totalWidth,
      duration: testimonials.length * 8, // 8 seconds per testimonial
      ease: 'none',
      repeat: -1,
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [testimonials]);

  const handleMouseEnter = () => {
    if (animationRef.current) {
      animationRef.current.pause();
    }
  };

  const handleMouseLeave = () => {
    if (animationRef.current) {
      animationRef.current.play();
    }
  };

  // Generate avatar with initials
  const getAvatar = (name) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = [
      'from-neon-blue to-neon-cyan',
      'from-neon-purple to-neon-pink',
      'from-neon-pink to-neon-purple',
      'from-neon-cyan to-neon-blue',
    ];
    const colorIndex = name.length % colors.length;
    
    return (
      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-2xl font-heading font-bold text-white border-4 border-neon-blue/30`}>
        {initials}
      </div>
    );
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}
      />
    ));
  };

  return (
    <div className="overflow-hidden relative">
      <div
        ref={carouselRef}
        className="flex gap-8"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {[...testimonials, ...testimonials].map((testimonial, index) => (
          <div
            key={`${testimonial._id || testimonial.name}-${index}`}
            className="flex-shrink-0 w-[450px]"
          >
            <div className="glass-effect rounded-2xl p-8 h-full border border-gray-800 hover:border-neon-blue/50 transition-all duration-300 relative">
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 text-neon-blue/20" size={48} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Avatar and Info */}
                <div className="flex items-center gap-4 mb-6">
                  {testimonial.avatar ? (
                    <LazyImage
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-neon-blue/30"
                    />
                  ) : (
                    getAvatar(testimonial.name)
                  )}
                  <div>
                    <h3 className="text-xl font-heading font-bold text-white mb-1">
                      {testimonial.name}
                    </h3>
                    <p className="text-neon-cyan font-body text-sm mb-2">
                      {testimonial.role}
                    </p>
                    <div className="flex gap-1">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>

                {/* Message */}
                <p className="text-gray-300 font-body leading-relaxed italic">
                  "{testimonial.message}"
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;
