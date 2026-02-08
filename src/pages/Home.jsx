import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { Code2, Rocket, Users, Sparkles, Zap, Trophy } from 'lucide-react';
import TestimonialCarousel from '../components/TestimonialCarousel';
import Footer from '../components/Footer';
import LazyImage from '../components/LazyImage';
import { eventsAPI, testimonialsAPI } from '../utils/api';

const Home = () => {
  const heroRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    gsap.fromTo(heroRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
    );

    fetchEvents();
    fetchTestimonials();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await eventsAPI.getAll();
      console.log('Home page - Events fetched:', data);
      
      // Ensure data is an array
      const eventsArray = Array.isArray(data) ? data : [];
      
      // Filter upcoming events and limit to 4
      const upcomingEvents = eventsArray.filter(e => e.status === 'upcoming').slice(0, 4);
      console.log('Home page - Upcoming events:', upcomingEvents);
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const { data } = await testimonialsAPI.getApproved();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('Testimonials data is not an array:', data);
        setTestimonials(demoTestimonials);
        return;
      }
      
      // Remove duplicates - keep only the first testimonial from each unique user
      const uniqueTestimonials = data.reduce((acc, current) => {
        const isDuplicate = acc.find(item => item.name.toLowerCase() === current.name.toLowerCase());
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setTestimonials(uniqueTestimonials.length > 0 ? uniqueTestimonials : demoTestimonials);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      // Fallback to demo data
      setTestimonials(demoTestimonials);
    }
  };

  const demoTestimonials = [
    {
      _id: 1,
      name: 'Dr. Rishi Chopra',
      role: 'Controller of School',
      message: 'AI and Machine Learning are shaping the future of innovation.',
      rating: 5
    },
    {
      _id: 2,
      name: 'Priya Sharma',
      role: 'Alumni, Software Engineer at Google',
      message: 'Bodh Script Club gave me the foundation I needed to succeed in the tech industry. The hands-on projects and mentorship were invaluable.',
      rating: 5
    },
    {
      _id: 3,
      name: 'Rahul Kumar',
      role: 'Final Year Student',
      message: 'Being part of this club has been the best decision of my college life. I learned more here than in any classroom.',
      rating: 5
    },
    {
      _id: 4,
      name: 'Ananya Gupta',
      role: 'Tech Lead, Microsoft',
      message: 'The collaborative environment and real-world projects prepared me for my career. Highly recommend joining!',
      rating: 5
    },
  ];

  const galleryImages = [
    { id: 1, url: 'https://i.ibb.co/fzWTpvhY/img2.jpg' },
    { id: 2, url: 'https://i.ibb.co/pcgbbqW/img6.jpg' },
    { id: 3, url: 'https://i.ibb.co/fV4kB7bK/img3.jpg' },
    { id: 4, url: 'https://i.ibb.co/GfSHfcsy/img4.jpg' },
    { id: 5, url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center px-4 pt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-blue/5 via-transparent to-transparent"></div>
        
        <div className="text-center max-w-6xl relative z-10">
          <div className="mb-6 inline-block">
            <span className="px-6 py-2 glass-effect rounded-full text-neon-cyan font-mono text-sm animate-pulse-slow">
              ✨ Welcome to the Future of Tech
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-heading font-bold mb-6 gradient-text animate-float">
            BODH SCRIPT CLUB
          </h1>
          
          <p className="text-2xl md:text-3xl font-body text-gray-300 mb-4 text-glow">
            Where Code Meets <span className="text-neon-purple font-semibold">Creativity</span>
          </p>
          
          <p className="text-lg md:text-xl font-body text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join a community of passionate developers, innovators, and tech enthusiasts. 
            Learn, build, and grow together in the most exciting tech club on campus.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link 
              to="/join" 
              className="group px-10 py-5 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-xl font-body font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-neon-blue/50"
            >
              <span className="flex items-center justify-center gap-2">
                Join Now <Sparkles className="group-hover:rotate-12 transition-transform" size={20} />
              </span>
            </Link>
            <Link 
              to="/events" 
              className="px-10 py-5 neon-border rounded-xl font-body font-semibold text-lg hover:bg-neon-blue/10 transition-all duration-300"
            >
              Explore Events
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl mx-auto">
            {[
              { label: 'Members', value: '150+', icon: <Users size={32} /> },
              { label: 'Events', value: '50+', icon: <Rocket size={32} /> },
              { label: 'Projects', value: '100+', icon: <Code2 size={32} /> },
            ].map((stat, idx) => (
              <div key={idx} className="glass-effect p-6 rounded-xl card-hover">
                <div className="text-neon-blue mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-heading font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-sm font-body text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-32 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-heading font-bold gradient-text mb-6">
              What We Offer
            </h2>
            <p className="text-xl font-body text-gray-400 max-w-2xl mx-auto">
              Comprehensive programs designed to accelerate your tech journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: <Code2 size={48} />, 
                title: 'Coding Workshops', 
                desc: 'Master the latest technologies and frameworks through hands-on sessions',
                color: 'neon-blue'
              },
              { 
                icon: <Rocket size={48} />, 
                title: 'Hackathons', 
                desc: 'Build innovative solutions in 24-hour coding marathons with prizes',
                color: 'neon-purple'
              },
              { 
                icon: <Users size={48} />, 
                title: 'Networking', 
                desc: 'Connect with industry professionals and like-minded developers',
                color: 'neon-pink'
              },
              { 
                icon: <Zap size={48} />, 
                title: 'Tech Talks', 
                desc: 'Learn from industry experts and thought leaders in tech',
                color: 'neon-cyan'
              },
              { 
                icon: <Trophy size={48} />, 
                title: 'Competitions', 
                desc: 'Participate in coding challenges and win exciting prizes',
                color: 'neon-green'
              },
              { 
                icon: <Sparkles size={48} />, 
                title: 'Open Source', 
                desc: 'Contribute to real-world projects and build your portfolio',
                color: 'neon-blue'
              },
            ].map((item, idx) => (
              <div key={idx} className="group p-8 glass-effect rounded-2xl card-hover border border-gray-800">
                <div className={`text-${item.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-heading font-bold mb-4 text-white">{item.title}</h3>
                <p className="font-body text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-32 px-4 bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-7xl font-heading font-bold gradient-text mb-6">
              Gallery
            </h2>
            <p className="text-xl font-body text-gray-400 max-w-2xl mx-auto">
              Moments that define our journey
            </p>
          </div>

          {/* Modern Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {galleryImages.slice(0, 8).map((img, idx) => (
              <div
                key={img.id}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer ${
                  idx === 0 || idx === 7 ? 'md:col-span-2 md:row-span-2' : ''
                }`}
              >
                <div className={`${idx === 0 || idx === 7 ? 'aspect-square' : 'aspect-square'}`}>
                  <LazyImage
                    src={img.url}
                    alt="Gallery"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                    <span className="font-body text-white text-lg">View</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 px-8 py-4 neon-border rounded-xl font-body font-semibold hover:bg-neon-blue/10 transition-all duration-300 group"
            >
              View Full Gallery
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-heading font-bold text-center mb-20 gradient-text">
              Upcoming Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {events.map(event => (
                <Link 
                  key={event._id} 
                  to="/events"
                  className="glass-effect rounded-2xl overflow-hidden card-hover border border-gray-800"
                >
                  <LazyImage 
                    src={event.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400'} 
                    alt={event.title} 
                    className="w-full h-48 object-cover" 
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-heading font-bold mb-2 text-white">{event.title}</h3>
                    <p className="font-body text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-neon-cyan">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="text-neon-blue hover:underline font-body text-sm">Learn More →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-32 px-4 bg-gradient-to-b from-transparent via-neon-blue/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-7xl font-heading font-bold gradient-text mb-6">
                What People Say
              </h2>
              <p className="text-xl font-body text-gray-400 max-w-2xl mx-auto">
                Hear from our members, alumni, and faculty about their experience
              </p>
            </div>
            
            <TestimonialCarousel testimonials={testimonials} />

            {/* Share Feedback Link */}
            <div className="text-center mt-12">
             
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Home;
