import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, Image, MessageSquare, FileText, Download, 
  CheckCircle, XCircle, Clock, Trash2, Eye, X, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LazyImage from '../components/LazyImage';
import AdminNavbar from '../components/AdminNavbar';
import { submissionsAPI, eventsAPI, testimonialsAPI, membersAPI, galleryAPI } from '../utils/api';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submissions');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [submissions, setSubmissions] = useState([]);
  const [events, setEvents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [members, setMembers] = useState([]);
  const [gallery, setGallery] = useState([]);

  useEffect(() => {
    console.log('Admin page - Auth loading:', authLoading);
    console.log('Admin page - User:', user);
    console.log('Admin page - Is Admin:', user?.isAdmin || user?.role === 'admin');
    
    if (!authLoading && (!user || (user.role !== 'admin' && !user.isAdmin))) {
      console.log('Not admin, redirecting to login...');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.isAdmin || user?.role === 'admin') {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    console.log('Fetching admin dashboard data...');
    
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Data fetch timed out, forcing loading false');
        setLoading(false);
      }
    }, 10000);

    try {
      const [subsData, eventsData, testsData, membersData, galleryData] = await Promise.all([
        submissionsAPI.getAll().catch(err => {
          console.error('Failed to fetch submissions:', err);
          return { data: [] };
        }),
        eventsAPI.getAll().catch(err => {
          console.error('Failed to fetch events:', err);
          return { data: [] };
        }),
        testimonialsAPI.getAll().catch(err => {
          console.error('Failed to fetch testimonials:', err);
          return { data: [] };
        }),
        membersAPI.getAll().catch(err => {
          console.error('Failed to fetch members:', err);
          return { data: [] };
        }),
        galleryAPI.getAll().catch(err => {
          console.error('Failed to fetch gallery:', err);
          return { data: [] };
        })
      ]);

      console.log('Data fetched successfully');
      setSubmissions(subsData?.data || []);
      setEvents(eventsData?.data || []);
      setTestimonials(testsData?.data || []);
      setMembers(membersData?.data || []);
      setGallery(galleryData?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data } = await submissionsAPI.getAll();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await eventsAPI.getAll();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const { data } = await testimonialsAPI.getAll();
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data } = await membersAPI.getAll();
      setMembers(data);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchGallery = async () => {
    try {
      const { data } = await galleryAPI.getAll();
      setGallery(data);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    }
  };

  const handleExportSubmissions = async () => {
    try {
      const response = await submissionsAPI.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `submissions-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting submissions:', error);
      alert('Failed to export submissions');
    }
  };

  const handleUpdateSubmissionStatus = async (id, status) => {
    try {
      await submissionsAPI.updateStatus(id, status);
      // Refresh submissions data
      await fetchSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleUpdateTestimonialStatus = async (id, status) => {
    try {
      await testimonialsAPI.update(id, { status });
      // Refresh testimonials data
      await fetchTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
      alert('Failed to update testimonial');
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;
    try {
      await testimonialsAPI.delete(id);
      // Refresh testimonials data
      await fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Failed to delete testimonial');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-body text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading && submissions.length === 0 && events.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-body text-white">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'submissions', label: 'Join Requests', icon: FileText, count: submissions.length },
    { id: 'events', label: 'Events', icon: Calendar, count: events.length },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, count: testimonials.length },
    { id: 'members', label: 'Members', icon: Users, count: members.length },
    { id: 'gallery', label: 'Gallery', icon: Image, count: gallery.length },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <AdminNavbar />
      
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-full mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-heading font-bold gradient-text mb-2">
              Dashboard
            </h1>
            <p className="text-xl font-body text-gray-400">
              Manage all club content and submissions
            </p>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-blue transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <FileText className="text-neon-blue" size={32} />
                <span className="text-3xl font-heading font-bold text-white">{submissions.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Join Requests</p>
              <p className="text-xs font-mono text-neon-cyan mt-1">
                {submissions.filter(s => s.status === 'pending').length} pending
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-purple transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="text-neon-purple" size={32} />
                <span className="text-3xl font-heading font-bold text-white">{events.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Total Events</p>
              <p className="text-xs font-mono text-neon-cyan mt-1">
                {events.filter(e => e.status === 'upcoming').length} upcoming
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-pink transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="text-neon-pink" size={32} />
                <span className="text-3xl font-heading font-bold text-white">{testimonials.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Testimonials</p>
              <p className="text-xs font-mono text-neon-cyan mt-1">
                {testimonials.filter(t => t.status === 'pending').length} pending
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-cyan transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-neon-cyan" size={32} />
                <span className="text-3xl font-heading font-bold text-white">{members.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Team Members</p>
              <p className="text-xs font-mono text-neon-cyan mt-1">Active members</p>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-green transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <Image className="text-neon-green" size={32} />
                <span className="text-3xl font-heading font-bold text-white">{gallery.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Gallery Items</p>
              <p className="text-xs font-mono text-neon-cyan mt-1">Photo collections</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-body font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                      : 'glass-effect text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="glass-effect rounded-2xl p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-xl font-body text-gray-400">Loading...</div>
              </div>
            ) : (
              <>
                {activeTab === 'submissions' && (
                  <SubmissionsTab
                    submissions={submissions}
                    onExport={handleExportSubmissions}
                    onUpdateStatus={handleUpdateSubmissionStatus}
                    onRefresh={fetchSubmissions}
                  />
                )}
                {activeTab === 'events' && (
                  <EventsTab events={events} onRefresh={fetchEvents} />
                )}
                {activeTab === 'testimonials' && (
                  <TestimonialsTab
                    testimonials={testimonials}
                    onUpdateStatus={handleUpdateTestimonialStatus}
                    onDelete={handleDeleteTestimonial}
                    onRefresh={fetchTestimonials}
                  />
                )}
                {activeTab === 'members' && (
                  <MembersTab members={members} onRefresh={fetchMembers} />
                )}
                {activeTab === 'gallery' && (
                  <GalleryTab gallery={gallery} onRefresh={fetchGallery} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Submissions Tab Component
const SubmissionsTab = ({ submissions, onExport, onUpdateStatus, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-heading font-bold text-white">
          Join Requests ({filteredSubmissions.length})
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-lighter text-neon-cyan border border-neon-cyan/30 font-body rounded-xl hover:bg-neon-cyan/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
          >
            <Download size={18} />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
              filter === status
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Submissions Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Photo</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Name</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Reg No.</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Email</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Phone</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Course</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Year</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Batch</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Status</th>
              <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((submission) => (
              <tr key={submission._id} className="border-b border-gray-800 hover:bg-white/5">
                <td className="py-3 px-4">
                  {submission.photo ? (
                    <LazyImage
                      src={`http://localhost:5000${submission.photo}`}
                      alt={submission.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center text-white font-heading">
                      {submission.name.charAt(0)}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 font-body text-white">{submission.name}</td>
                <td className="py-3 px-4 font-mono text-sm text-gray-300">{submission.registrationNumber}</td>
                <td className="py-3 px-4 font-body text-sm text-gray-300">{submission.email}</td>
                <td className="py-3 px-4 font-body text-sm text-gray-300">{submission.phone}</td>
                <td className="py-3 px-4 font-body text-sm text-gray-300">{submission.course}</td>
                <td className="py-3 px-4 font-body text-sm text-gray-300">{submission.year}</td>
                <td className="py-3 px-4 font-body text-sm text-gray-300">{submission.batch}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-body ${
                    submission.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    submission.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {submission.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {submission.status !== 'approved' && (
                      <button
                        onClick={() => onUpdateStatus(submission._id, 'approved')}
                        className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={18} className="text-green-400" />
                      </button>
                    )}
                    {submission.status !== 'rejected' && (
                      <button
                        onClick={() => onUpdateStatus(submission._id, 'rejected')}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <XCircle size={18} className="text-red-400" />
                      </button>
                    )}
                    {submission.status !== 'pending' && (
                      <button
                        onClick={() => onUpdateStatus(submission._id, 'pending')}
                        className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors"
                        title="Mark as Pending"
                      >
                        <Clock size={18} className="text-yellow-400" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 font-body">No submissions found</p>
          </div>
        )}
      </div>

      {/* Additional Details Section */}
      {filteredSubmissions.length > 0 && (
        <div className="mt-6 p-4 bg-dark-lighter rounded-xl">
          <h3 className="text-lg font-heading font-bold text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-neon-cyan">{submissions.length}</div>
              <div className="text-sm font-body text-gray-400">Total Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-yellow-400">{statusCounts.pending}</div>
              <div className="text-sm font-body text-gray-400">Pending Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-green-400">{statusCounts.approved}</div>
              <div className="text-sm font-body text-gray-400">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-red-400">{statusCounts.rejected}</div>
              <div className="text-sm font-body text-gray-400">Rejected</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Events Tab Component
const EventsTab = ({ events: initialEvents, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [events, setEvents] = useState(initialEvents);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    image: '',
    tags: '',
    maxAttendees: '',
    status: 'upcoming'
  });

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const eventData = {
        ...newEvent,
        tags: newEvent.tags ? newEvent.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        maxAttendees: newEvent.maxAttendees ? parseInt(newEvent.maxAttendees) : undefined
      };

      await eventsAPI.create(eventData);
      alert('Event created successfully!');
      setShowCreateModal(false);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        image: '',
        tags: '',
        maxAttendees: '',
        status: 'upcoming'
      });
      await onRefresh();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({ ...prev, [name]: value }));
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const statusCounts = {
    all: events.length,
    upcoming: events.filter(e => e.status === 'upcoming').length,
    completed: events.filter(e => e.status === 'completed').length,
  };

  const refreshEvents = async () => {
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing events:', error);
    }
  };

  const handleViewRegistrations = async (event) => {
    setSelectedEvent(event);
    setShowRegistrationsModal(true);
    setLoadingRegistrations(true);
    setRegistrations([]);
    
    try {
      console.log('Fetching registrations for event:', event._id);
      const { data } = await eventsAPI.getRegistrations(event._id);
      console.log('Registrations received:', data);
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert('Failed to load registrations: ' + (error.response?.data?.message || error.message));
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleExportRegistrations = async (eventId, eventTitle) => {
    try {
      console.log('Exporting registrations for event:', eventId);
      const response = await eventsAPI.exportRegistrations(eventId);
      
      // Create blob from response
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${eventTitle.replace(/[^a-z0-9]/gi, '_')}_registrations.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('Export successful');
    } catch (error) {
      console.error('Error exporting registrations:', error);
      alert('Failed to export registrations: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This will also delete all registrations for this event. This action cannot be undone.`)) {
      return;
    }
    
    try {
      console.log('Deleting event:', eventId);
      await eventsAPI.delete(eventId);
      console.log('Event deleted successfully');
      
      // Refresh events list
      await refreshEvents();
      alert('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-heading font-bold text-white">
          Events Management ({filteredEvents.length})
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-lighter text-neon-cyan border border-neon-cyan/30 font-body rounded-xl hover:bg-neon-cyan/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
          >
            <Calendar size={18} />
            Create New Event
          </button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['all', 'upcoming', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
              filter === status
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div key={event._id} className="glass-effect rounded-2xl overflow-hidden border border-gray-800 hover:border-neon-cyan transition-all duration-300">
            {/* Event Image */}
            <div className="relative h-48 overflow-hidden">
              <LazyImage
                src={event.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-xs font-body ${
                  event.status === 'upcoming' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                }`}>
                  {event.status}
                </span>
              </div>
            </div>

            {/* Event Info */}
            <div className="p-6">
              <h3 className="text-xl font-heading font-bold text-white mb-2 line-clamp-2">
                {event.title}
              </h3>
              <p className="text-sm font-body text-gray-400 mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm font-body text-gray-300">
                  <Calendar size={16} className="text-neon-cyan" />
                  {new Date(event.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex items-center gap-2 text-sm font-body text-gray-300">
                  <Users size={16} className="text-neon-purple" />
                  {event.registrationCount || 0} Registrations
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleViewRegistrations(event)}
                  className="px-3 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-lg text-sm font-body hover:bg-neon-blue/20 transition-all flex items-center justify-center gap-1"
                >
                  <Eye size={14} />
                  View
                </button>
                <button
                  onClick={() => handleExportRegistrations(event._id, event.title)}
                  className="px-3 py-2 bg-neon-purple/10 text-neon-purple border border-neon-purple/30 rounded-lg text-sm font-body hover:bg-neon-purple/20 transition-all flex items-center justify-center gap-1"
                >
                  <Download size={14} />
                  Export
                </button>
                <button
                  onClick={() => handleDeleteEvent(event._id, event.title)}
                  className="col-span-2 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-body hover:bg-red-500/20 transition-all flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 font-body">No events found</p>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrationsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowRegistrationsModal(false)}>
          <div className="glass-effect rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-heading font-bold text-white">
                  Event Registrations
                </h3>
                <p className="text-sm font-body text-gray-400 mt-1">
                  {selectedEvent.title}
                </p>
              </div>
              <button
                onClick={() => setShowRegistrationsModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {loadingRegistrations ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400 font-body">Loading registrations...</p>
                </div>
              ) : registrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">S.No</th>
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Name</th>
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Reg No.</th>
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Phone</th>
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">WhatsApp</th>
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Department</th>
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Year</th>
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Section</th>
                        <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((reg, index) => (
                        <tr key={reg._id} className="border-b border-gray-800 hover:bg-white/5">
                          <td className="py-3 px-4 font-body text-white">{index + 1}</td>
                          <td className="py-3 px-4 font-body text-white">{reg.name}</td>
                          <td className="py-3 px-4 font-mono text-sm text-gray-300">{reg.registrationNo}</td>
                          <td className="py-3 px-4 font-body text-sm text-gray-300">{reg.phoneNumber}</td>
                          <td className="py-3 px-4 font-body text-sm text-gray-300">{reg.whatsappNumber}</td>
                          <td className="py-3 px-4 font-body text-sm text-gray-300">{reg.department}</td>
                          <td className="py-3 px-4 font-body text-sm text-gray-300">{reg.year}</td>
                          <td className="py-3 px-4 font-body text-sm text-gray-300">{reg.section}</td>
                          <td className="py-3 px-4 font-body text-sm text-gray-300">
                            {new Date(reg.registeredAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 font-body">No registrations yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="glass-effect rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-2xl font-heading font-bold text-white">
                Create New Event
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newEvent.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter event title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500 resize-none"
                    placeholder="Enter event description"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={newEvent.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={newEvent.time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={newEvent.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter event location"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={newEvent.image}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={newEvent.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="e.g., Workshop, Technical, Coding"
                  />
                </div>

                {/* Max Attendees and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Max Attendees
                    </label>
                    <input
                      type="number"
                      name="maxAttendees"
                      value={newEvent.maxAttendees}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={newEvent.status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="previous">Previous</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body font-semibold rounded-xl hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-gray-700 text-white font-body font-semibold rounded-xl hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Testimonials Tab Component
const TestimonialsTab = ({ testimonials, onUpdateStatus, onDelete, onRefresh }) => {
  const [filter, setFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredTestimonials = testimonials.filter(test => {
    if (filter === 'all') return true;
    return test.status === filter;
  });

  const statusCounts = {
    all: testimonials.length,
    pending: testimonials.filter(t => t.status === 'pending').length,
    approved: testimonials.filter(t => t.status === 'approved').length,
    rejected: testimonials.filter(t => t.status === 'rejected').length,
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-heading font-bold text-white">
          Testimonials Management ({filteredTestimonials.length})
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-lighter text-neon-cyan border border-neon-cyan/30 font-body rounded-xl hover:bg-neon-cyan/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <a
            href="/feedback"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
          >
            <MessageSquare size={18} />
            View Feedback Page
          </a>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
              filter === status
                ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Testimonials Grid */}
      <div className="grid gap-6">
        {filteredTestimonials.map((testimonial) => (
          <div key={testimonial._id} className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-cyan/30 transition-all duration-300">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <LazyImage
                  src={testimonial.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=random&size=128`}
                  alt={testimonial.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-neon-cyan/30"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xl font-heading font-bold text-white mb-1">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm font-body text-gray-400 mb-2">
                      {testimonial.role}
                    </p>
                    <div className="flex items-center gap-3">
                      {renderStars(testimonial.rating)}
                      <span className="text-xs font-mono text-gray-500">
                        {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-body font-semibold ${
                    testimonial.status === 'approved' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    testimonial.status === 'rejected' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {testimonial.status.charAt(0).toUpperCase() + testimonial.status.slice(1)}
                  </span>
                </div>

                {/* Message */}
                <p className="font-body text-gray-300 mb-4 leading-relaxed">
                  "{testimonial.message}"
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {testimonial.status !== 'approved' && (
                    <button
                      onClick={() => onUpdateStatus(testimonial._id, 'approved')}
                      className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-sm font-body hover:bg-green-500/20 transition-all flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                  )}
                  {testimonial.status !== 'rejected' && (
                    <button
                      onClick={() => onUpdateStatus(testimonial._id, 'rejected')}
                      className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-body hover:bg-red-500/20 transition-all flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  )}
                  {testimonial.status !== 'pending' && (
                    <button
                      onClick={() => onUpdateStatus(testimonial._id, 'pending')}
                      className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-body hover:bg-yellow-500/20 transition-all flex items-center gap-2"
                    >
                      <Clock size={16} />
                      Mark Pending
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(testimonial._id)}
                    className="px-4 py-2 bg-gray-500/10 text-gray-400 border border-gray-500/30 rounded-lg text-sm font-body hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTestimonials.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 font-body mb-4">No testimonials found</p>
          <a
            href="/feedback"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
          >
            <MessageSquare size={18} />
            Go to Feedback Page
          </a>
        </div>
      )}

      {/* Quick Stats */}
      {filteredTestimonials.length > 0 && (
        <div className="mt-6 p-6 bg-dark-lighter rounded-xl">
          <h3 className="text-lg font-heading font-bold text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-neon-cyan">{testimonials.length}</div>
              <div className="text-sm font-body text-gray-400">Total Testimonials</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-yellow-400">{statusCounts.pending}</div>
              <div className="text-sm font-body text-gray-400">Pending Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-green-400">{statusCounts.approved}</div>
              <div className="text-sm font-body text-gray-400">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-red-400">{statusCounts.rejected}</div>
              <div className="text-sm font-body text-gray-400">Rejected</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Members Tab Component
const MembersTab = ({ members: initialMembers, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [members, setMembers] = useState(initialMembers);
  const [newMember, setNewMember] = useState({
    name: '',
    role: 'developer',
    image: '',
    github: '',
    linkedin: '',
    twitter: '',
    order: 0
  });

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditModal) {
      setSelectedMember(prev => ({ ...prev, [name]: value }));
    } else {
      setNewMember(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await membersAPI.create(newMember);
      alert('Member added successfully!');
      setShowCreateModal(false);
      setNewMember({
        name: '',
        role: 'developer',
        image: '',
        github: '',
        linkedin: '',
        twitter: '',
        order: 0
      });
      await onRefresh();
    } catch (error) {
      console.error('Error creating member:', error);
      alert('Failed to add member: ' + (error.response?.data?.message || error.message));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      await membersAPI.update(selectedMember._id, selectedMember);
      alert('Member updated successfully!');
      setShowEditModal(false);
      setSelectedMember(null);
      await onRefresh();
    } catch (error) {
      console.error('Error updating member:', error);
      alert('Failed to update member: ' + (error.response?.data?.message || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMember = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await membersAPI.delete(id);
      alert('Member deleted successfully!');
      await onRefresh();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditClick = (member) => {
    setSelectedMember({ ...member });
    setShowEditModal(true);
  };

  const roleLabels = {
    'president': 'President',
    'vice-president': 'Vice President',
    'event-coordinator': 'Event Coordinator',
    'technical-lead': 'Technical Lead',
    'developer': 'Developer',
    'designer': 'Designer',
    'content-writer': 'Content Writer',
    'social-media-manager': 'Social Media Manager',
    'other': 'Other'
  };

  const roleColors = {
    'president': 'from-yellow-500 to-orange-500',
    'vice-president': 'from-purple-500 to-pink-500',
    'event-coordinator': 'from-blue-500 to-cyan-500',
    'technical-lead': 'from-green-500 to-emerald-500',
    'developer': 'from-cyan-500 to-blue-500',
    'designer': 'from-pink-500 to-rose-500',
    'content-writer': 'from-indigo-500 to-purple-500',
    'social-media-manager': 'from-orange-500 to-red-500',
    'other': 'from-gray-500 to-slate-500'
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-heading font-bold text-white">
          Members Management ({members.length})
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-lighter text-neon-cyan border border-neon-cyan/30 font-body rounded-xl hover:bg-neon-cyan/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
          >
            <Users size={18} />
            Add New Member
          </button>
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {members.map((member) => (
          <div key={member._id} className="glass-effect rounded-2xl overflow-hidden border border-gray-800 hover:border-neon-cyan/30 transition-all duration-300 group">
            {/* Member Image */}
            <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
              {member.image ? (
                <LazyImage
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${roleColors[member.role]} flex items-center justify-center text-white text-5xl font-heading font-bold`}>
                    {member.name.charAt(0)}
                  </div>
                </div>
              )}
              <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-body font-semibold bg-gradient-to-r ${roleColors[member.role]} text-white`}>
                {roleLabels[member.role]}
              </div>
            </div>

            {/* Member Info */}
            <div className="p-6">
              <h3 className="text-xl font-heading font-bold text-white mb-2">
                {member.name}
              </h3>
              <p className="text-sm font-body text-gray-400 mb-4">
                Order: {member.order}
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-2 mb-4">
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 hover:bg-neon-cyan/20 rounded-lg transition-colors"
                    title="GitHub"
                  >
                    <svg className="w-5 h-5 text-gray-300 hover:text-neon-cyan" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="LinkedIn"
                  >
                    <svg className="w-5 h-5 text-gray-300 hover:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                )}
                {member.twitter && (
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-gray-800 hover:bg-sky-500/20 rounded-lg transition-colors"
                    title="Twitter"
                  >
                    <svg className="w-5 h-5 text-gray-300 hover:text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEditClick(member)}
                  className="px-3 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-lg text-sm font-body hover:bg-neon-blue/20 transition-all flex items-center justify-center gap-1"
                >
                  <Eye size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMember(member._id, member.name)}
                  className="px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-body hover:bg-red-500/20 transition-all flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 font-body mb-4">No members found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
          >
            <Users size={18} />
            Add First Member
          </button>
        </div>
      )}

      {/* Create Member Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-2xl font-heading font-bold text-white">
                Add New Member
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newMember.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter member name"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={newMember.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={newMember.image}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://example.com/photo.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use auto-generated avatar</p>
                </div>

                {/* GitHub */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={newMember.github}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://github.com/username"
                  />
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={newMember.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Twitter Profile URL
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={newMember.twitter}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://twitter.com/username"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={newMember.order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body font-semibold rounded-xl hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Adding...' : 'Add Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-gray-700 text-white font-body font-semibold rounded-xl hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedMember && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-2xl font-heading font-bold text-white">
                Edit Member
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={selectedMember.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter member name"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={selectedMember.role}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={selectedMember.image || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://example.com/photo.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to use auto-generated avatar</p>
                </div>

                {/* GitHub */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={selectedMember.github || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://github.com/username"
                  />
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={selectedMember.linkedin || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                {/* Twitter */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Twitter Profile URL
                  </label>
                  <input
                    type="url"
                    name="twitter"
                    value={selectedMember.twitter || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://twitter.com/username"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={selectedMember.order}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body font-semibold rounded-xl hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : 'Update Member'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-3 bg-gray-700 text-white font-body font-semibold rounded-xl hover:bg-gray-600 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Gallery Tab Component - PLACEHOLDER FOR FULL IMPLEMENTATION
const GalleryTab = ({ gallery, onRefresh }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-heading font-bold text-white">
          Gallery Management ({gallery.length})
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-dark-lighter text-neon-cyan border border-neon-cyan/30 font-body rounded-xl hover:bg-neon-cyan/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
          >
            <Image size={18} />
            Add Gallery Item
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gallery.map((item) => (
          <div key={item._id} className="glass-effect rounded-2xl overflow-hidden border border-gray-800 hover:border-neon-cyan/30 transition-all duration-300">
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
              {item.coverImage ? (
                <LazyImage
                  src={item.coverImage}
                  alt={item.eventName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image size={48} className="text-gray-600" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 rounded-full text-xs font-body font-semibold bg-neon-purple/80 text-white">
                  {item.category}
                </span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-heading font-bold text-white mb-2">
                {item.eventName}
              </h3>
              <p className="text-sm font-body text-gray-400 mb-2">
                {new Date(item.eventDate).toLocaleDateString()}
              </p>
              <p className="text-xs font-mono text-gray-500">
                {item.images?.length || 0} images
              </p>
            </div>
          </div>
        ))}
      </div>

      {gallery.length === 0 && (
        <div className="text-center py-12">
          <Image size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 font-body">No gallery items found</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
