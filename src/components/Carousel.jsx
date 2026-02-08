import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const Carousel = ({ items, direction = 'left' }) => {
  const carouselRef = useRef(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    const totalWidth = carousel.scrollWidth / 2;
    
    gsap.to(carousel, {
      x: direction === 'left' ? -totalWidth : totalWidth,
      duration: 40,
      ease: 'none',
      repeat: -1,
    });
  }, [direction]);

  return (
    <div className="overflow-hidden relative">
      <div ref={carouselRef} className="flex gap-8">
        {[...items, ...items].map((item, index) => (
          <div key={index} className="flex-shrink-0">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
