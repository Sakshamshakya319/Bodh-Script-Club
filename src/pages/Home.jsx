import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { Code2, Rocket, Users, Sparkles, Zap, Trophy } from 'lucide-react';
import TestimonialCarousel from '../components/TestimonialCarousel';
import Footer from '../components/Footer';
import LazyImage from '../components/LazyImage';
import { eventsAPI, testimonialsAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const Home = () => {
  const heroRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const { theme } = useTheme();

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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen flex items-center justify-center px-4 pt-20 relative overflow-hidden">
        <div className={`absolute inset-0 ${theme === 'dark'
          ? 'bg-gradient-radial from-neon-blue/5 via-transparent to-transparent'
          : 'bg-gradient-radial from-blue-100/30 via-transparent to-transparent'
          }`}></div>

        <div className="text-center max-w-6xl relative z-10">
          {/* Club Logo */}
          <div className="mb-8 flex justify-center">
            <div className="relative group">
              <div className={`absolute inset-0 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 ${theme === 'dark'
                ? 'bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink'
                : 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'
                }`}></div>
              <img
                src="/logo.png"
                alt="Bodh Script Club Logo"
                className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain animate-float drop-shadow-2xl"
              />
            </div>
          </div>

          <div className="mb-6 inline-block">
            <span className={`px-6 py-2 rounded-full font-mono text-sm animate-pulse-slow ${theme === 'dark'
              ? 'glass-effect text-neon-cyan'
              : 'bg-blue-100 text-blue-700 border border-blue-300'
              }`}>
              ✨ Welcome to the Future of Tech
            </span>
          </div>

          <h1 className={`text-6xl md:text-8xl lg:text-9xl font-heading font-bold mb-6 animate-float ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
            }`}>
            BODH SCRIPT CLUB
          </h1>

          <p className={`text-2xl md:text-3xl font-body mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
            Where Code Meets <span className={`font-semibold ${theme === 'dark' ? 'text-neon-purple' : 'text-purple-600'}`}>Creativity</span>
          </p>

          <p className={`text-lg md:text-xl font-body mb-12 max-w-3xl mx-auto leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
            Join a community of passionate developers, innovators, and tech enthusiasts.
            Learn, build, and grow together in the most exciting tech club on campus.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              to="/join"
              className={`group px-10 py-5 rounded-xl font-body font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg ${theme === 'dark'
                ? 'bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink hover:shadow-neon-blue/50'
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-blue-500/50'
                }`}
            >
              <span className="flex items-center justify-center gap-2">
                Join Now <Sparkles className="group-hover:rotate-12 transition-transform" size={20} />
              </span>
            </Link>
            <Link
              to="/events"
              className={`px-10 py-5 rounded-xl font-body font-semibold text-lg transition-all duration-300 ${theme === 'dark'
                ? 'neon-border hover:bg-neon-blue/10'
                : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                }`}
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
              <div key={idx} className={`p-6 rounded-xl card-hover border ${theme === 'dark'
                ? 'glass-effect border-gray-800'
                : 'bg-white border-gray-200 shadow-md'
                }`}>
                <div className={`mb-3 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'}`}>{stat.icon}</div>
                <div className={`text-3xl md:text-4xl font-heading font-bold mb-2 ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
                  }`}>{stat.value}</div>
                <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-32 px-4 relative">
        <div className={`absolute inset-0 ${theme === 'dark'
          ? 'bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent'
          : 'bg-gradient-to-b from-transparent via-purple-50 to-transparent'
          }`}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className={`text-5xl md:text-7xl font-heading font-bold mb-6 ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
              }`}>
              What We Offer
            </h2>
            <p className={`text-xl font-body max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Comprehensive programs designed to accelerate your tech journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Code2 size={48} />,
                title: 'Coding Workshops',
                desc: 'Master the latest technologies and frameworks through hands-on sessions',
                color: theme === 'dark' ? 'neon-blue' : 'blue-600'
              },
              {
                icon: <Rocket size={48} />,
                title: 'Hackathons',
                desc: 'Build innovative solutions in 24-hour coding marathons with prizes',
                color: theme === 'dark' ? 'neon-purple' : 'purple-600'
              },
              {
                icon: <Users size={48} />,
                title: 'Networking',
                desc: 'Connect with industry professionals and like-minded developers',
                color: theme === 'dark' ? 'neon-pink' : 'pink-600'
              },
              {
                icon: <Zap size={48} />,
                title: 'Tech Talks',
                desc: 'Learn from industry experts and thought leaders in tech',
                color: theme === 'dark' ? 'neon-cyan' : 'cyan-600'
              },
              {
                icon: <Trophy size={48} />,
                title: 'Competitions',
                desc: 'Participate in coding challenges and win exciting prizes',
                color: theme === 'dark' ? 'neon-green' : 'green-600'
              },
              {
                icon: <Sparkles size={48} />,
                title: 'Open Source',
                desc: 'Contribute to real-world projects and build your portfolio',
                color: theme === 'dark' ? 'neon-blue' : 'blue-600'
              },
            ].map((item, idx) => (
              <div key={idx} className={`group p-8 rounded-2xl card-hover border ${theme === 'dark'
                ? 'glass-effect border-gray-800'
                : 'bg-white border-gray-200 shadow-md hover:shadow-lg'
                }`}>
                <div className={`text-${item.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className={`text-2xl font-heading font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{item.title}</h3>
                <p className={`font-body leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className={`py-32 px-4 ${theme === 'dark'
        ? 'bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent'
        : 'bg-gradient-to-b from-transparent via-purple-50 to-transparent'
        }`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-5xl md:text-7xl font-heading font-bold mb-6 ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
              }`}>
              Gallery
            </h2>
            <p className={`text-xl font-body max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Moments that define our journey
            </p>
          </div>

          {/* Modern Gallery Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {galleryImages.slice(0, 8).map((img, idx) => (
              <div
                key={img.id}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                  } ${idx === 0 || idx === 7 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <div className={`${idx === 0 || idx === 7 ? 'aspect-square' : 'aspect-square'}`}>
                  <LazyImage
                    src={img.url}
                    alt="Gallery"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-6">
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Link
              to="/gallery"
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-body font-semibold transition-all duration-300 group ${theme === 'dark'
                ? 'neon-border hover:bg-neon-blue/10'
                : 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
                }`}
            >
              View Full Gallery
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Join Now Banner */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: QR Code Banner */}
            <div className="flex justify-center md:justify-start">
              <Link
                to="/join"
                className="block relative overflow-hidden rounded-3xl group cursor-pointer transition-all duration-300 hover:scale-[1.02] max-w-md"
              >
                <img
                  src="/JoinNow.png"
                  alt="Join Bodh Script Club Now"
                  className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>

            {/* Right: Promotional Text */}
            <div className="text-center md:text-left space-y-6">
              <h3 className={`text-4xl md:text-5xl font-heading font-bold ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
                }`}>
                Ready to Level Up?
              </h3>
              <p className={`text-lg md:text-xl font-body leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Join <span className={`font-bold ${theme === 'dark' ? 'text-neon-cyan' : 'text-blue-600'}`}>Bodh Script Club</span> and become part of an amazing community of developers, innovators, and tech enthusiasts.
              </p>
              <ul className={`space-y-3 font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                <li className="flex items-start gap-3">
                  <span className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'}>✓</span>
                  <span>Access to exclusive workshops and tech talks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'}>✓</span>
                  <span>Network with industry professionals</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'}>✓</span>
                  <span>Build real-world projects and portfolios</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'}>✓</span>
                  <span>Participate in hackathons and competitions</span>
                </li>
              </ul>
              <Link
                to="/join"
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-body font-semibold text-lg hover:scale-105 transition-all duration-300 shadow-lg ${theme === 'dark'
                    ? 'bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink hover:shadow-neon-blue/50 text-white'
                    : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-blue-500/50'
                  }`}
              >
                <span>Join Now</span>
                <Sparkles size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {events.length > 0 && (
        <section className="py-32 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className={`text-5xl md:text-7xl font-heading font-bold text-center mb-20 ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
              }`}>
              Upcoming Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {events.map(event => (
                <Link
                  key={event._id}
                  to="/events"
                  className={`rounded-2xl overflow-hidden card-hover border ${theme === 'dark'
                    ? 'glass-effect border-gray-800'
                    : 'bg-white border-gray-200 shadow-md hover:shadow-lg'
                    }`}
                >
                  <LazyImage
                    src={event.image || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400'}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className={`text-xl font-heading font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{event.title}</h3>
                    <p className={`font-body text-sm mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      {event.shortDescription || event.description?.replace(/<[^>]*>/g, '').substring(0, 100) || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs ${theme === 'dark' ? 'text-neon-cyan' : 'text-blue-600'
                        }`}>
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className={`hover:underline font-body text-sm ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'
                        }`}>Learn More →</span>
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
        <section className={`py-32 px-4 ${theme === 'dark'
          ? 'bg-gradient-to-b from-transparent via-neon-blue/5 to-transparent'
          : 'bg-gradient-to-b from-transparent via-blue-50 to-transparent'
          }`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className={`text-5xl md:text-7xl font-heading font-bold mb-6 ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
                }`}>
                What People Say
              </h2>
              <p className={`text-xl font-body max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
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
