import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// GSAP Animation Utilities for Production-Ready Animations
export class GSAPAnimations {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  init() {
    if (this.isInitialized) return;
    
    // Set default GSAP settings for better performance
    gsap.config({
      force3D: true,
      nullTargetWarn: false
    });

    // Refresh ScrollTrigger on window resize
    window.addEventListener('resize', () => {
      ScrollTrigger.refresh();
    });

    this.isInitialized = true;
  }

  // Cursor Follow Animation
  initCursorFollow() {
    const cursor = document.querySelector('.cursor-follower');
    if (!cursor) return;

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    // Update mouse position
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor follow animation
    const animateCursor = () => {
      const speed = 0.15;
      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;

      gsap.set(cursor, {
        x: cursorX,
        y: cursorY,
        force3D: true
      });

      requestAnimationFrame(animateCursor);
    };

    animateCursor();

    // Cursor hover effects
    const hoverElements = document.querySelectorAll('a, button, [data-cursor-hover]');
    hoverElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        gsap.to(cursor, {
          scale: 1.5,
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
      });
    });
  }

  // Page Load Animations
  pageLoadAnimation() {
    const tl = gsap.timeline();
    
    // Animate page elements on load
    tl.from('.page-header', {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    })
    .from('.hero-content', {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    }, '-=0.5')
    .from('.nav-item', {
      y: -30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out'
    }, '-=0.8');

    return tl;
  }

  // Scroll-triggered animations
  initScrollAnimations() {
    // Fade in elements on scroll
    gsap.utils.toArray('.fade-in').forEach(element => {
      gsap.fromTo(element, 
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // Slide in from left
    gsap.utils.toArray('.slide-in-left').forEach(element => {
      gsap.fromTo(element,
        {
          x: -100,
          opacity: 0
        },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // Slide in from right
    gsap.utils.toArray('.slide-in-right').forEach(element => {
      gsap.fromTo(element,
        {
          x: 100,
          opacity: 0
        },
        {
          x: 0,
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // Scale in animation
    gsap.utils.toArray('.scale-in').forEach(element => {
      gsap.fromTo(element,
        {
          scale: 0.8,
          opacity: 0
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    // Stagger animation for lists
    gsap.utils.toArray('.stagger-container').forEach(container => {
      const items = container.querySelectorAll('.stagger-item');
      gsap.fromTo(items,
        {
          y: 30,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }

  // Hover animations for cards
  initCardHoverAnimations() {
    const cards = document.querySelectorAll('.hover-card');
    
    cards.forEach(card => {
      const image = card.querySelector('.hover-image');
      const content = card.querySelector('.hover-content');
      
      card.addEventListener('mouseenter', () => {
        gsap.to(card, {
          y: -10,
          scale: 1.02,
          duration: 0.3,
          ease: 'power2.out'
        });
        
        if (image) {
          gsap.to(image, {
            scale: 1.1,
            duration: 0.5,
            ease: 'power2.out'
          });
        }
        
        if (content) {
          gsap.to(content, {
            y: -5,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      });
      
      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
        
        if (image) {
          gsap.to(image, {
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
          });
        }
        
        if (content) {
          gsap.to(content, {
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      });
    });
  }

  // Button hover animations
  initButtonAnimations() {
    const buttons = document.querySelectorAll('.animated-button');
    
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.2,
          ease: 'power2.out'
        });
      });
      
      button.addEventListener('mouseleave', () => {
        gsap.to(button, {
          scale: 1,
          duration: 0.2,
          ease: 'power2.out'
        });
      });
      
      button.addEventListener('mousedown', () => {
        gsap.to(button, {
          scale: 0.95,
          duration: 0.1,
          ease: 'power2.out'
        });
      });
      
      button.addEventListener('mouseup', () => {
        gsap.to(button, {
          scale: 1.05,
          duration: 0.1,
          ease: 'power2.out'
        });
      });
    });
  }

  // Text reveal animation
  initTextRevealAnimations() {
    gsap.utils.toArray('.text-reveal').forEach(element => {
      const text = element.textContent;
      element.innerHTML = text.split('').map(char => 
        `<span class="char">${char === ' ' ? '&nbsp;' : char}</span>`
      ).join('');
      
      const chars = element.querySelectorAll('.char');
      
      gsap.fromTo(chars,
        {
          opacity: 0,
          y: 50,
          rotationX: -90
        },
        {
          opacity: 1,
          y: 0,
          rotationX: 0,
          duration: 0.8,
          stagger: 0.02,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }

  // Parallax scrolling effect
  initParallaxAnimations() {
    gsap.utils.toArray('.parallax-element').forEach(element => {
      const speed = element.dataset.speed || 0.5;
      
      gsap.to(element, {
        yPercent: -50 * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: element,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  // Loading animation
  showLoadingAnimation() {
    const tl = gsap.timeline();
    
    tl.to('.loading-screen', {
      opacity: 1,
      duration: 0.3
    })
    .to('.loading-spinner', {
      rotation: 360,
      duration: 1,
      repeat: -1,
      ease: 'none'
    }, 0);
    
    return tl;
  }

  hideLoadingAnimation() {
    return gsap.to('.loading-screen', {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      onComplete: () => {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
          loadingScreen.style.display = 'none';
        }
      }
    });
  }

  // Initialize all animations
  initAll() {
    this.initScrollAnimations();
    this.initCardHoverAnimations();
    this.initButtonAnimations();
    this.initTextRevealAnimations();
    this.initParallaxAnimations();
    this.initCursorFollow();
  }

  // Cleanup function
  cleanup() {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    gsap.killTweensOf('*');
  }

  // Refresh ScrollTrigger (useful for dynamic content)
  refresh() {
    ScrollTrigger.refresh();
  }
}

// Create global instance
export const gsapAnimations = new GSAPAnimations();

// Export individual animation functions for specific use cases
export const animatePageTransition = (from, to) => {
  const tl = gsap.timeline();
  
  tl.to(from, {
    opacity: 0,
    x: -100,
    duration: 0.3,
    ease: 'power2.in'
  })
  .fromTo(to, 
    {
      opacity: 0,
      x: 100
    },
    {
      opacity: 1,
      x: 0,
      duration: 0.3,
      ease: 'power2.out'
    }
  );
  
  return tl;
};

export const animateModal = (modal, show = true) => {
  if (show) {
    return gsap.fromTo(modal,
      {
        opacity: 0,
        scale: 0.8,
        y: 50
      },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: 'back.out(1.7)'
      }
    );
  } else {
    return gsap.to(modal, {
      opacity: 0,
      scale: 0.8,
      y: 50,
      duration: 0.2,
      ease: 'power2.in'
    });
  }
};

export const animateNotification = (notification) => {
  const tl = gsap.timeline();
  
  tl.fromTo(notification,
    {
      opacity: 0,
      x: 100,
      scale: 0.8
    },
    {
      opacity: 1,
      x: 0,
      scale: 1,
      duration: 0.4,
      ease: 'back.out(1.7)'
    }
  )
  .to(notification, {
    opacity: 0,
    x: 100,
    scale: 0.8,
    duration: 0.3,
    ease: 'power2.in',
    delay: 3
  });
  
  return tl;
};