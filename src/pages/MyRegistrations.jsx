import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import Footer from '../components/Footer';
import { eventsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/my-registrations' } });
      return;
    }
    fetchMyRegistrations();
  }, [isAuthenticated, navigate]);

  const fetchMyRegistrations = async () => {
    try {
      console.log('Fetching my registrations...');
      const { data } = await eventsAPI.getMyRegistrations();
      console.log('Registrations received:', data);
      // API may return array directly or { registrations: [] } or { data: [] } - always normalize to array
      const list = Array.isArray(data)
        ? data
        : (Array.isArray(data?.registrations) ? data.registrations : Array.isArray(data?.data) ? data.data : []);
      setRegistrations(list);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load registrations';
      setError(errorMsg);
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (eventDate) => {
    const now = new Date();
    const date = new Date(eventDate);
    return date > now ? 'upcoming' : 'completed';
  };

  const safeRegistrations = Array.isArray(registrations) ? registrations : [];
  const upcomingRegistrations = safeRegistrations.filter(reg => 
    reg && reg.event && getEventStatus(reg.event.date) === 'upcoming'
  );
  const completedRegistrations = safeRegistrations.filter(reg => 
    reg && reg.event && getEventStatus(reg.event.date) === 'completed'
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} className="text-neon-blue animate-spin mx-auto mb-4" />
          <p className="text-xl font-body text-gray-400">Loading your registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-purple/10 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-6xl md:text-8xl font-heading font-bold mb-6 gradient-text animate-float">
            My Registrations
          </h1>
          <p className="text-xl md:text-2xl font-body text-gray-400 max-w-3xl mx-auto">
            Track all your registered events in one place
          </p>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm font-body">{error}</p>
          </div>
        </div>
      )}

      {/* No Registrations */}
      {!loading && !error && safeRegistrations.length === 0 && (
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center mx-auto mb-6">
              <Calendar size={48} className="text-neon-blue" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white mb-4">
              No Registrations Yet
            </h2>
            <p className="text-gray-400 font-body mb-8">
              You haven't registered for any events. Browse our upcoming events and join us!
            </p>
            <button
              onClick={() => navigate('/events')}
              className="px-8 py-4 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink rounded-xl font-body font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-neon-blue/50"
            >
              Browse Events
            </button>
          </div>
        </section>
      )}

      {/* Upcoming Registrations */}
      {upcomingRegistrations.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center">
                <Calendar size={24} className="text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold gradient-text">
                Upcoming Events
              </h2>
              <span className="px-4 py-1 rounded-full bg-neon-blue/20 border border-neon-blue/40 text-neon-cyan text-sm font-mono">
                {upcomingRegistrations.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingRegistrations.map((registration) => (
                <RegistrationCard key={registration._id} registration={registration} status="upcoming" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Completed Registrations */}
      {completedRegistrations.length > 0 && (
        <section className="py-20 px-4 bg-gradient-to-b from-transparent via-neon-purple/5 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green to-neon-cyan flex items-center justify-center">
                <CheckCircle size={24} className="text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold gradient-text">
                Completed Events
              </h2>
              <span className="px-4 py-1 rounded-full bg-neon-green/20 border border-neon-green/40 text-neon-green text-sm font-mono">
                {completedRegistrations.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {completedRegistrations.map((registration) => (
                <RegistrationCard key={registration._id} registration={registration} status="completed" />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

const RegistrationCard = ({ registration, status }) => {
  const { event } = registration;

  if (!event) {
    return null;
  }

  return (
    <div className="glass-effect rounded-2xl overflow-hidden border border-gray-800 card-hover group">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          {status === 'upcoming' ? (
            <span className="px-3 py-1 rounded-full bg-neon-blue/90 backdrop-blur-sm text-white text-xs font-mono font-bold">
              UPCOMING
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-neon-green/90 backdrop-blur-sm text-white text-xs font-mono font-bold flex items-center gap-1">
              <CheckCircle size={14} />
              COMPLETED
            </span>
          )}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-heading font-bold text-white mb-1">{event.title}</h3>
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-400">
            <Calendar size={16} className="text-neon-cyan flex-shrink-0" />
            <span className="font-body text-sm">
              {new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          
          {event.time && (
            <div className="flex items-center gap-3 text-gray-400">
              <Clock size={16} className="text-neon-purple flex-shrink-0" />
              <span className="font-body text-sm">{event.time}</span>
            </div>
          )}
          
          {event.location && (
            <div className="flex items-center gap-3 text-gray-400">
              <MapPin size={16} className="text-neon-pink flex-shrink-0" />
              <span className="font-body text-sm">{event.location}</span>
            </div>
          )}
        </div>

        {/* Registration Details */}
        <div className="p-4 rounded-xl bg-neon-blue/5 border border-neon-blue/20">
          <p className="text-xs text-gray-500 font-body mb-2">Your Registration Details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 font-body text-xs">Name</p>
              <p className="text-white font-body font-semibold">{registration.name}</p>
            </div>
            <div>
              <p className="text-gray-500 font-body text-xs">Reg. No.</p>
              <p className="text-white font-body font-semibold">{registration.registrationNo}</p>
            </div>
            <div>
              <p className="text-gray-500 font-body text-xs">Department</p>
              <p className="text-white font-body font-semibold">{registration.department}</p>
            </div>
            <div>
              <p className="text-gray-500 font-body text-xs">Year</p>
              <p className="text-white font-body font-semibold">{registration.year}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-800">
            <p className="text-xs text-gray-500 font-body">
              Registered on {new Date(registration.registeredAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Tags */}
        {Array.isArray(event.tags) && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {event.tags.slice(0, 3).map((tag, idx) => (
              <span 
                key={idx} 
                className="px-2 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-mono"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRegistrations;
