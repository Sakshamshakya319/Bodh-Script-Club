import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import imageCompression from 'browser-image-compression';
import { 
  Users, Calendar, Image, MessageSquare, FileText, Download, 
  CheckCircle, XCircle, Clock, Trash2, Eye, X, RefreshCw, MapPin, Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AdminNavbar from '../components/AdminNavbar';
import { submissionsAPI, eventsAPI, testimonialsAPI, membersAPI } from '../utils/api';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('submissions');
  const [loading, setLoading] = useState(false);

  // Data states
  const [submissions, setSubmissions] = useState([]);
  const [events, setEvents] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [members, setMembers] = useState([]);

  // Handle tab change with proper event handling
  const handleTabChange = (tabId, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setActiveTab(tabId);
  };

  // Add refresh functionality
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(''); // 'event', 'member', 'testimonial', etc.

  const handleRefresh = async () => {
    setRefreshing(true);
    console.log('Refreshing data for tab:', activeTab);
    
    try {
      await fetchAllData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // CRUD Operations
  const handleCreate = (type) => {
    setModalType(type);
    setSelectedItem(null);
    setShowCreateModal(true);
  };

  const handleEdit = (item, type) => {
    setModalType(type);
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDelete = async (id, type, name) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      switch (type) {
        case 'event':
          await eventsAPI.delete(id);
          break;
        case 'member':
          await membersAPI.delete(id);
          break;
        case 'testimonial':
          await testimonialsAPI.delete(id);
          break;
        default:
          throw new Error('Invalid type');
      }
      
      alert('Item deleted successfully!');
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateSubmissionStatus = async (id, status) => {
    try {
      await submissionsAPI.updateStatus(id, status);
      await fetchAllData();
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleUpdateTestimonialStatus = async (id, status) => {
    try {
      await testimonialsAPI.update(id, { status });
      await fetchAllData();
      alert(`Testimonial ${status} successfully!`);
    } catch (error) {
      console.error('Error updating testimonial:', error);
      alert('Failed to update testimonial status');
    }
  };

  const handleDeleteTestimonial = async (id, name) => {
    if (!confirm(`Are you sure you want to delete the testimonial by "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await testimonialsAPI.delete(id);
      await fetchAllData();
      alert('Testimonial deleted successfully!');
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Failed to delete testimonial');
    }
  };

  const handleExportSubmissions = async () => {
    try {
      console.log('Exporting submissions...');
      const response = await submissionsAPI.export();
      console.log('Export response:', response);
      
      // Create blob with proper CSV type
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Save as .csv file (not .xlsx)
      const filename = `join-requests-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
      
      console.log('Export successful:', filename);
      alert('Export successful! File downloaded as ' + filename);
    } catch (error) {
      console.error('Error exporting submissions:', error);
      alert('Failed to export submissions: ' + (error.response?.data?.message || error.message));
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    console.log('Fetching admin dashboard data...');
    
    try {
      const [subsData, eventsData, testsData, membersData] = await Promise.all([
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
        })
      ]);

      console.log('Data fetched successfully');
      // Normalize all responses to arrays
      const normalizeToArray = (response) => {
        if (!response) return [];
        if (Array.isArray(response)) return response;
        if (Array.isArray(response?.data)) return response.data;
        return [];
      };
      
      setSubmissions(normalizeToArray(subsData));
      setEvents(normalizeToArray(eventsData));
      setTestimonials(normalizeToArray(testsData));
      setMembers(normalizeToArray(membersData));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Admin page - User:', user);
    console.log('Admin page - Auth Loading:', authLoading);
    
    if (!authLoading && (!user || (user.role !== 'admin' && !user.isAdmin))) {
      console.log('Not admin, redirecting to login...');
      navigate('/login');
      return;
    }
    
    if (user?.isAdmin || user?.role === 'admin') {
      fetchAllData();
    }
  }, [user, authLoading, navigate]);

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-body text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading screen if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <p className="text-xl font-body text-white">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const safeMembers = Array.isArray(members) ? members : [];

  const tabs = [
    { id: 'submissions', label: 'Join Requests', icon: FileText, count: safeSubmissions.length },
    { id: 'events', label: 'Events', icon: Calendar, count: safeEvents.length },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, count: safeTestimonials.length },
    { id: 'members', label: 'Members', icon: Users, count: safeMembers.length },
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
                <span className="text-3xl font-heading font-bold text-white">{safeSubmissions.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Join Requests</p>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-purple transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="text-neon-purple" size={32} />
                <span className="text-3xl font-heading font-bold text-white">{safeEvents.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Total Events</p>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-pink transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="text-neon-pink" size={32} />
                <span className="text-3xl font-heading font-bold text-white">{safeTestimonials.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Testimonials</p>
            </div>

            <div className="glass-effect rounded-2xl p-6 border border-gray-800 hover:border-neon-cyan transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-neon-cyan" size={32} />
                <span className="text-3xl font-heading font-bold text-white">{safeMembers.length}</span>
              </div>
              <p className="text-sm font-body text-gray-400">Team Members</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-4 mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTabChange(tab.id, e);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-body font-medium transition-all duration-300 cursor-pointer select-none border-0 outline-none ${
                    isActive
                      ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                      : 'glass-effect text-gray-300 hover:text-white hover:bg-white/5'
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
          <div className="glass-effect rounded-2xl p-6 min-h-[200px]">
            {/* Tab Header with Refresh Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-heading font-bold text-white">
                {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 font-body rounded-xl hover:bg-neon-cyan/20 transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-xl font-body text-gray-400">Loading...</div>
              </div>
            ) : (
              <>
                {activeTab === 'submissions' && (
                  <SubmissionsContent 
                    submissions={safeSubmissions} 
                    onUpdateStatus={handleUpdateSubmissionStatus}
                    onExport={handleExportSubmissions}
                  />
                )}
                {activeTab === 'events' && (
                  <EventsContent 
                    events={safeEvents} 
                    onCreate={() => handleCreate('event')}
                    onEdit={(item) => handleEdit(item, 'event')}
                    onDelete={(id, name) => handleDelete(id, 'event', name)}
                  />
                )}
                {activeTab === 'testimonials' && (
                  <TestimonialsContent 
                    testimonials={safeTestimonials} 
                    onUpdateStatus={handleUpdateTestimonialStatus}
                    onDelete={handleDeleteTestimonial}
                  />
                )}
                {activeTab === 'members' && (
                  <MembersContent 
                    members={safeMembers} 
                    onCreate={() => handleCreate('member')}
                    onEdit={(item) => handleEdit(item, 'member')}
                    onDelete={(id, name) => handleDelete(id, 'member', name)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modals */}
      {showCreateModal && (
        <CreateModal
          type={modalType}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchAllData();
          }}
        />
      )}

      {showEditModal && selectedItem && (
        <EditModal
          type={modalType}
          item={selectedItem}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchAllData();
          }}
        />
      )}
    </div>
  );
};

// Content Components for each tab
const SubmissionsContent = ({ submissions, onUpdateStatus, onExport }) => {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  // Filter submissions by status
  const filteredSubmissions = submissions.filter(submission => {
    const matchesFilter = filter === 'all' || submission.status === filter;
    const matchesSearch = !searchQuery || 
      submission.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.phone?.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div>
      {/* Header with Export Button */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400 font-body">
          Total Join Requests: <span className="text-neon-cyan font-semibold">{submissions.length}</span>
        </p>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
        >
          <Download size={18} />
          Export to Excel
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            type="button"
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

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, registration number, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all"
        />
      </div>
      
      {filteredSubmissions.length > 0 ? (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Name</th>
                  <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Email</th>
                  <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Reg. Number</th>
                  <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Course</th>
                  <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <>
                    <tr 
                      key={submission._id} 
                      className="border-b border-gray-800 hover:bg-white/5 cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === submission._id ? null : submission._id)}
                    >
                      <td className="py-3 px-4 font-body text-white">{submission.name}</td>
                      <td className="py-3 px-4 font-body text-gray-300">{submission.email}</td>
                      <td className="py-3 px-4 font-body text-gray-300">{submission.registrationNumber}</td>
                      <td className="py-3 px-4 font-body text-gray-300">{submission.course}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-body ${
                          submission.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          submission.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {submission.status}
                        </span>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {submission.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(submission._id, 'approved')}
                              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} className="text-green-400" />
                            </button>
                          )}
                          {submission.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(submission._id, 'rejected')}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} className="text-red-400" />
                            </button>
                          )}
                          {submission.status !== 'pending' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(submission._id, 'pending')}
                              className="p-2 hover:bg-yellow-500/20 rounded-lg transition-colors"
                              title="Mark as Pending"
                            >
                              <Clock size={18} className="text-yellow-400" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedRow(expandedRow === submission._id ? null : submission._id)}
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} className="text-blue-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Row Details */}
                    {expandedRow === submission._id && (
                      <tr className="bg-gray-900/50 border-b border-gray-800">
                        <td colSpan="6" className="py-4 px-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 font-body mb-1">Phone Number</p>
                              <p className="text-sm text-white font-body">{submission.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-body mb-1">WhatsApp Number</p>
                              <p className="text-sm text-white font-body">{submission.whatsapp || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-body mb-1">Section</p>
                              <p className="text-sm text-white font-body">{submission.section || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-body mb-1">Year</p>
                              <p className="text-sm text-white font-body">{submission.year || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-body mb-1">Batch</p>
                              <p className="text-sm text-white font-body">{submission.batch || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-body mb-1">GitHub Profile</p>
                              {submission.github ? (
                                <a 
                                  href={submission.github} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-neon-cyan font-body hover:underline break-all"
                                >
                                  {submission.github}
                                </a>
                              ) : (
                                <p className="text-sm text-white font-body">N/A</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Hidden on desktop */}
          <div className="lg:hidden space-y-4">
            {filteredSubmissions.map((submission) => (
              <div 
                key={submission._id} 
                className="glass-effect rounded-xl p-4 border border-gray-800 hover:border-neon-cyan/30 transition-all"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-heading font-bold text-white truncate mb-1">
                      {submission.name}
                    </h3>
                    <p className="text-sm font-body text-gray-400 truncate">{submission.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-body flex-shrink-0 ml-2 ${
                    submission.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    submission.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {submission.status}
                  </span>
                </div>

                {/* Card Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-body">Reg. Number:</span>
                    <span className="text-white font-body">{submission.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-body">Course:</span>
                    <span className="text-white font-body">{submission.course}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-body">Phone:</span>
                    <span className="text-white font-body">{submission.phone || 'N/A'}</span>
                  </div>
                  {submission.section && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-body">Section:</span>
                      <span className="text-white font-body">{submission.section}</span>
                    </div>
                  )}
                </div>

                {/* Expandable Details */}
                {expandedRow === submission._id && (
                  <div className="border-t border-gray-700 pt-3 mb-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-body">WhatsApp:</span>
                      <span className="text-white font-body">{submission.whatsapp || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-body">Year:</span>
                      <span className="text-white font-body">{submission.year || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-body">Batch:</span>
                      <span className="text-white font-body">{submission.batch || 'N/A'}</span>
                    </div>
                    {submission.github && (
                      <div className="text-sm">
                        <span className="text-gray-500 font-body block mb-1">GitHub:</span>
                        <a 
                          href={submission.github} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-neon-cyan font-body hover:underline break-all"
                        >
                          {submission.github}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {submission.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(submission._id, 'approved')}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-sm font-body hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                  )}
                  {submission.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(submission._id, 'rejected')}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-body hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  )}
                  {submission.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(submission._id, 'pending')}
                      className="flex-1 min-w-[100px] px-3 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-body hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Clock size={16} />
                      Pending
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpandedRow(expandedRow === submission._id ? null : submission._id)}
                    className="px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-body hover:bg-blue-500/20 transition-all flex items-center gap-2"
                  >
                    <Eye size={16} />
                    {expandedRow === submission._id ? 'Less' : 'More'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 font-body">
            {searchQuery ? 'No submissions match your search' : 'No join requests found'}
          </p>
        </div>
      )}
    </div>
  );
};

const EventsContent = ({ events, onCreate, onEdit, onDelete }) => {
  const [filter, setFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const handleViewRegistrations = async (event) => {
    setSelectedEvent(event);
    setShowRegistrationsModal(true);
    setLoadingRegistrations(true);
    
    try {
      const { data } = await eventsAPI.getRegistrations(event._id);
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      alert('Failed to fetch registrations');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleExportRegistrations = async (eventId) => {
    try {
      const response = await eventsAPI.exportRegistrations(eventId);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `${selectedEvent?.title.replace(/[^a-z0-9]/gi, '-')}-registrations-${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      alert('Export successful!');
    } catch (error) {
      console.error('Error exporting registrations:', error);
      alert('Failed to export registrations');
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event?.status === filter;
  });

  const statusCounts = {
    all: events.length,
    upcoming: events.filter(e => e?.status === 'upcoming').length,
    completed: events.filter(e => e?.status === 'completed').length,
    cancelled: events.filter(e => e?.status === 'cancelled').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400 font-body">
          Total Events: <span className="text-neon-purple font-semibold">{events.length}</span>
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
        >
          <Calendar size={18} />
          Create New Event
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['all', 'upcoming', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
              filter === status
                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple'
                : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>
      
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event._id} className="glass-effect rounded-xl overflow-hidden border border-gray-800 hover:border-neon-purple/30 transition-all">
              {/* Event Image */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-contain bg-gray-900"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-full h-full flex items-center justify-center" style={{ display: event.image ? 'none' : 'flex' }}>
                  <Calendar size={48} className="text-gray-600" />
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${
                    event.status === 'upcoming' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    event.status === 'completed'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    event.status === 'cancelled'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-gray-500/20 text-gray-400 border border-gray-500/30'
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
                  {event.shortDescription || event.description?.replace(/<[^>]*>/g, '').substring(0, 150) || 'No description'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm font-body text-gray-300">
                    <Calendar size={16} className="text-neon-cyan" />
                    {event.date ? new Date(event.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'No date set'}
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-2 text-sm font-body text-gray-300">
                      <Clock size={16} className="text-neon-cyan" />
                      {event.time}
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm font-body text-gray-300">
                      <MapPin size={16} className="text-neon-cyan" />
                      {event.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm font-body text-gray-300">
                    <Users size={16} className="text-neon-purple" />
                    {event.registrationCount || 0} Registrations
                  </div>
                  {event.slug && (
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mt-2 pt-2 border-t border-gray-800">
                      <span className="text-gray-600">URL:</span>
                      <span className="text-neon-cyan">/events/{event.slug}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewRegistrations(event)}
                    className="px-3 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-lg text-sm font-body hover:bg-neon-cyan/20 transition-all flex items-center justify-center gap-1"
                    title="View Registrations"
                  >
                    <Users size={14} />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(event)}
                    className="px-3 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-lg text-sm font-body hover:bg-neon-blue/20 transition-all flex items-center justify-center gap-1"
                  >
                    <Eye size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(event._id, event.title)}
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
      ) : (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 font-body mb-4">
            {filter === 'all' ? 'No events found' : `No ${filter} events found`}
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
          >
            <Calendar size={18} />
            Create First Event
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {filteredEvents.length > 0 && (
        <div className="mt-8 p-6 bg-dark-lighter rounded-xl">
          <h3 className="text-lg font-heading font-bold text-white mb-4">Event Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-neon-purple">{statusCounts.all}</div>
              <div className="text-sm font-body text-gray-400">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-green-400">{statusCounts.upcoming}</div>
              <div className="text-sm font-body text-gray-400">Upcoming</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-blue-400">{statusCounts.completed}</div>
              <div className="text-sm font-body text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-red-400">{statusCounts.cancelled}</div>
              <div className="text-sm font-body text-gray-400">Cancelled</div>
            </div>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrationsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="glass-effect rounded-3xl border border-gray-800 max-w-6xl w-full my-8">
            {/* Header */}
            <div className="sticky top-0 bg-black/50 backdrop-blur-md border-b border-gray-800 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-heading font-bold gradient-text">
                  Event Registrations
                </h2>
                <p className="text-gray-400 font-body mt-1">{selectedEvent.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExportRegistrations(selectedEvent._id)}
                  className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 font-body rounded-xl hover:bg-neon-cyan/20 transition-all"
                >
                  <Download size={18} />
                  Export CSV
                </button>
                <button
                  onClick={() => setShowRegistrationsModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingRegistrations ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-xl font-body text-gray-400">Loading registrations...</div>
                </div>
              ) : registrations.length > 0 ? (
                <>
                  <div className="mb-4 p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 font-body">Total Registrations</p>
                        <p className="text-2xl font-heading font-bold text-neon-cyan">{registrations.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 font-body">Latest Registration</p>
                        <p className="text-lg font-heading font-bold text-blue-400">
                          {registrations[0]?.registeredAt ? new Date(registrations[0].registeredAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Name</th>
                          <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Reg. No</th>
                          <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Phone</th>
                          <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Course</th>
                          <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Section</th>
                          <th className="text-left py-3 px-4 font-body text-gray-400 text-sm">Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((reg) => (
                          <tr key={reg._id} className="border-b border-gray-800 hover:bg-white/5">
                            <td className="py-3 px-4 font-body text-white">{reg.name}</td>
                            <td className="py-3 px-4 font-body text-gray-300">{reg.registrationNo}</td>
                            <td className="py-3 px-4 font-body text-gray-300">{reg.phoneNumber}</td>
                            <td className="py-3 px-4 font-body text-gray-300">{reg.course || 'N/A'}</td>
                            <td className="py-3 px-4 font-body text-gray-300">{reg.section}</td>
                            <td className="py-3 px-4 font-body text-gray-300 text-sm">
                              {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="lg:hidden space-y-4">
                    {registrations.map((reg) => (
                      <div 
                        key={reg._id} 
                        className="glass-effect rounded-xl p-4 border border-gray-800 hover:border-neon-purple/30 transition-all"
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-heading font-bold text-white truncate mb-1">
                              {reg.name}
                            </h3>
                            <p className="text-sm font-body text-gray-400">{reg.registrationNo}</p>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-body">Phone:</span>
                            <span className="text-white font-body">{reg.phoneNumber}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-body">Course:</span>
                            <span className="text-white font-body">{reg.course || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-body">Section:</span>
                            <span className="text-white font-body">{reg.section}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-body">Registered:</span>
                            <span className="text-white font-body">
                              {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
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
    </div>
  );
};

const TestimonialsContent = ({ testimonials, onUpdateStatus, onDelete }) => {
  const [filter, setFilter] = useState('all');

  const filteredTestimonials = testimonials.filter(testimonial => {
    if (filter === 'all') return true;
    return testimonial?.status === filter;
  });

  const statusCounts = {
    all: testimonials.length,
    pending: testimonials.filter(t => t?.status === 'pending').length,
    approved: testimonials.filter(t => t?.status === 'approved').length,
    rejected: testimonials.filter(t => t?.status === 'rejected').length,
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
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400 font-body">
          Total Testimonials: <span className="text-neon-pink font-semibold">{testimonials.length}</span>
        </p>
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

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all ${
              filter === status
                ? 'bg-neon-pink/20 text-neon-pink border border-neon-pink'
                : 'bg-dark-lighter text-gray-400 hover:text-white'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>
      
      {filteredTestimonials.length > 0 ? (
        <div className="space-y-6">
          {filteredTestimonials.map((testimonial) => (
            <div key={testimonial._id} className="glass-effect rounded-xl p-6 border border-gray-800 hover:border-neon-pink/30 transition-all">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple flex items-center justify-center text-white text-xl font-heading font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
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
                        {testimonial.role} • {testimonial.email}
                      </p>
                      <div className="flex items-center gap-3">
                        {renderStars(testimonial.rating)}
                        <span className="text-xs font-mono text-gray-500">
                          {new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
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
                  <div className="mb-4 p-4 bg-gray-800/50 rounded-lg">
                    <p className="font-body text-gray-300 leading-relaxed">
                      "{testimonial.message}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {testimonial.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(testimonial._id, 'approved')}
                        className="px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/30 rounded-lg text-sm font-body hover:bg-green-500/20 transition-all flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                    )}
                    {testimonial.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(testimonial._id, 'rejected')}
                        className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-body hover:bg-red-500/20 transition-all flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    )}
                    {testimonial.status !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(testimonial._id, 'pending')}
                        className="px-4 py-2 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-body hover:bg-yellow-500/20 transition-all flex items-center gap-2"
                      >
                        <Clock size={16} />
                        Mark Pending
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(testimonial._id, testimonial.name)}
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
      ) : (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 font-body mb-4">
            {filter === 'all' ? 'No testimonials found' : `No ${filter} testimonials found`}
          </p>
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
        <div className="mt-8 p-6 bg-dark-lighter rounded-xl">
          <h3 className="text-lg font-heading font-bold text-white mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-neon-pink">{statusCounts.all}</div>
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

const MembersContent = ({ members, onCreate, onEdit, onDelete }) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <p className="text-gray-400 font-body">
        Total Members: <span className="text-neon-cyan font-semibold">{members.length}</span>
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
      >
        <Users size={18} />
        Add New Member
      </button>
    </div>
    
    {members.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <div key={member._id} className="glass-effect rounded-xl p-4 border border-gray-800 hover:border-neon-cyan/30 transition-all">
            <div className="text-center mb-4">
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-20 h-20 rounded-full mx-auto mb-3 object-cover border-2 border-neon-cyan/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto mb-3 bg-gradient-to-br from-neon-cyan to-neon-blue flex items-center justify-center text-white text-2xl font-heading font-bold">
                  {member.name.charAt(0)}
                </div>
              )}
              <h3 className="text-lg font-heading font-bold text-white mb-1">{member.name}</h3>
              <p className="text-neon-cyan text-sm font-body">{member.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="flex-1 px-3 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-lg text-sm font-body hover:bg-neon-cyan/20 transition-all flex items-center justify-center gap-1"
              >
                <Eye size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(member._id, member.name)}
                className="flex-1 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-body hover:bg-red-500/20 transition-all flex items-center justify-center gap-1"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12">
        <Users size={48} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 font-body mb-4">No members found</p>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body rounded-xl hover:shadow-neon transition-all"
        >
          <Users size={18} />
          Add First Member
        </button>
      </div>
    )}
  </div>
);

export default Admin;

// Modal Components
const CreateModal = ({ type, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Process tags if it's an event
      const dataToSubmit = { ...formData };
      if (type === 'event' && typeof dataToSubmit.tags === 'string') {
        dataToSubmit.tags = dataToSubmit.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      }

      switch (type) {
        case 'event':
          await eventsAPI.create(dataToSubmit);
          break;
        case 'member':
          await membersAPI.create(dataToSubmit);
          break;
          await galleryAPI.create(dataToSubmit);
          break;
        default:
          throw new Error('Invalid type');
      }
      
      alert('Item created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update preview if it's the image URL field
    if (name === 'image') {
      setImagePreview(value);
    }
  };

  const handleQuillChange = (value) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);

    try {
      // Compression options
      const options = {
        maxSizeMB: 0.8, // Target size under 1MB (0.8MB to be safe)
        maxWidthOrHeight: 1920, // Max dimension
        useWebWorker: true,
        fileType: 'image/jpeg', // Convert to JPEG for better compression
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);
      
      console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

      // Convert to base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, image: base64String }));
        setImagePreview(base64String);
        alert(`Image compressed successfully! Size: ${(compressedFile.size / 1024).toFixed(0)}KB`);
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to compress image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-2xl font-heading font-bold text-white">
            Create New {type.charAt(0).toUpperCase() + type.slice(1)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {type === 'event' && (
              <>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Short Description * (for event cards)
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription || ''}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Brief description (max 150 characters)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.shortDescription || '').length}/150 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Full Description * (with rich formatting)
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={formData.description || ''}
                    onChange={handleQuillChange}
                    className="bg-gray-900/50 rounded-lg quill-editor"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    placeholder="Enter detailed event description with rich formatting..."
                  />
                  <style>{`
                    .quill-editor .ql-container {
                      min-height: 200px;
                      background: rgba(17, 24, 39, 0.5);
                      border: 1px solid rgb(55, 65, 81);
                      border-top: none;
                      border-radius: 0 0 0.5rem 0.5rem;
                      color: white;
                    }
                    .quill-editor .ql-toolbar {
                      background: rgba(17, 24, 39, 0.5);
                      border: 1px solid rgb(55, 65, 81);
                      border-radius: 0.5rem 0.5rem 0 0;
                    }
                    .quill-editor .ql-editor {
                      color: white;
                      font-family: inherit;
                    }
                    .quill-editor .ql-editor.ql-blank::before {
                      color: rgb(107, 114, 128);
                    }
                    .quill-editor .ql-stroke {
                      stroke: rgb(156, 163, 175);
                    }
                    .quill-editor .ql-fill {
                      fill: rgb(156, 163, 175);
                    }
                    .quill-editor .ql-picker-label {
                      color: rgb(156, 163, 175);
                    }
                  `}</style>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date || ''}
                      onChange={handleChange}
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
                      value={formData.time || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter event location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Event Image *
                  </label>
                  
                  {/* Image Upload Button */}
                  <div className="mb-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-neon-blue/10 border-2 border-dashed border-neon-blue/30 rounded-lg cursor-pointer hover:bg-neon-blue/20 transition-all">
                      <Upload size={20} className="text-neon-blue" />
                      <span className="text-neon-blue font-body font-semibold">
                        {uploadingImage ? 'Compressing...' : 'Upload Image (Auto-compress to <1MB)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-gray-700"></div>
                    <span className="text-xs text-gray-500 font-body">OR</span>
                    <div className="flex-1 h-px bg-gray-700"></div>
                  </div>

                  {/* Image URL Input */}
                  <input
                    type="text"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Or paste image URL here"
                  />
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-contain bg-gray-900 rounded-lg border border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image: '' }));
                          setImagePreview('');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Upload an image (will be compressed to under 1MB) or paste a URL. Image will be displayed with full aspect ratio.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status || 'upcoming'}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Event Type *
                    </label>
                    <select
                      name="eventType"
                      value={formData.eventType || 'other'}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="bootcamp">Bootcamp</option>
                      <option value="webinar">Webinar</option>
                      <option value="tech-training">Tech Training Session</option>
                      <option value="coding-class">Coding Class / Tutorial</option>
                      <option value="meeting">Meeting</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                {/* Team Settings for Hackathons */}
                {formData.eventType === 'hackathon' && (
                  <div className="border border-neon-purple/30 rounded-lg p-4 bg-neon-purple/5">
                    <h4 className="text-lg font-heading font-bold text-neon-purple mb-3">
                      Team Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                          Min Team Size *
                        </label>
                        <input
                          type="number"
                          name="teamSettings.minTeamSize"
                          value={formData.teamSettings?.minTeamSize || 1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setFormData(prev => ({
                              ...prev,
                              teamSettings: {
                                ...prev.teamSettings,
                                enabled: true,
                                minTeamSize: value
                              }
                            }));
                          }}
                          min="1"
                          max="10"
                          required
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                          Max Team Size *
                        </label>
                        <input
                          type="number"
                          name="teamSettings.maxTeamSize"
                          value={formData.teamSettings?.maxTeamSize || 4}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 4;
                            setFormData(prev => ({
                              ...prev,
                              teamSettings: {
                                ...prev.teamSettings,
                                enabled: true,
                                maxTeamSize: value
                              }
                            }));
                          }}
                          min="1"
                          max="10"
                          required
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Teams must have between {formData.teamSettings?.minTeamSize || 1} and {formData.teamSettings?.maxTeamSize || 4} members
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees || ''}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="e.g., Workshop, Technical, Coding, Web Development"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tags help categorize and filter events</p>
                </div>
              </>
            )}

            {type === 'member' && (
              <>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter member name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role || 'developer'}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                  >
                    <option value="president">President</option>
                    <option value="vice-president">Vice President</option>
                    <option value="event-coordinator">Event Coordinator</option>
                    <option value="technical-lead">Technical Lead</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="content-writer">Content Writer</option>
                    <option value="social-media-manager">Social Media Manager</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body font-semibold rounded-xl hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 text-white font-body font-semibold rounded-xl hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditModal = ({ type, item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(item || {});
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(item?.image || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      switch (type) {
        case 'event':
          await eventsAPI.update(item._id, formData);
          break;
        case 'member':
          await membersAPI.update(item._id, formData);
          break;
        case 'testimonial':
          await testimonialsAPI.update(item._id, formData);
          break;
        default:
          throw new Error('Invalid type');
      }
      
      alert('Item updated successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update preview if it's the image field
    if (name === 'image') {
      setImagePreview(value);
    }
  };

  const handleQuillChange = (value) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);

    try {
      const options = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };

      const compressedFile = await imageCompression(file, options);
      
      console.log('Original:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('Compressed:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, image: base64String }));
        setImagePreview(base64String);
        alert(`Image compressed! Size: ${(compressedFile.size / 1024).toFixed(0)}KB`);
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Failed to compress image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-effect rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-2xl font-heading font-bold text-white">
            Edit {type.charAt(0).toUpperCase() + type.slice(1)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {type === 'event' && (
              <>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Short Description * (for event cards)
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription || ''}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Brief description (max 150 characters)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.shortDescription || '').length}/150 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Full Description * (with rich formatting)
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={formData.description || ''}
                    onChange={handleQuillChange}
                    className="bg-gray-900/50 rounded-lg quill-editor"
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    placeholder="Enter detailed event description with rich formatting..."
                  />
                  <style>{`
                    .quill-editor .ql-container {
                      min-height: 200px;
                      background: rgba(17, 24, 39, 0.5);
                      border: 1px solid rgb(55, 65, 81);
                      border-top: none;
                      border-radius: 0 0 0.5rem 0.5rem;
                      color: white;
                    }
                    .quill-editor .ql-toolbar {
                      background: rgba(17, 24, 39, 0.5);
                      border: 1px solid rgb(55, 65, 81);
                      border-radius: 0.5rem 0.5rem 0 0;
                    }
                    .quill-editor .ql-editor {
                      color: white;
                      font-family: inherit;
                    }
                    .quill-editor .ql-editor.ql-blank::before {
                      color: rgb(107, 114, 128);
                    }
                    .quill-editor .ql-stroke {
                      stroke: rgb(156, 163, 175);
                    }
                    .quill-editor .ql-fill {
                      fill: rgb(156, 163, 175);
                    }
                    .quill-editor .ql-picker-label {
                      color: rgb(156, 163, 175);
                    }
                  `}</style>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date ? formData.date.split('T')[0] : ''}
                      onChange={handleChange}
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
                      value={formData.time || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter event location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Event Image *
                  </label>
                  
                  {/* Image Upload Button */}
                  <div className="mb-3">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 bg-neon-blue/10 border-2 border-dashed border-neon-blue/30 rounded-lg cursor-pointer hover:bg-neon-blue/20 transition-all">
                      <Upload size={20} className="text-neon-blue" />
                      <span className="text-neon-blue font-body font-semibold">
                        {uploadingImage ? 'Compressing...' : 'Upload Image (Auto-compress to <1MB)'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-gray-700"></div>
                    <span className="text-xs text-gray-500 font-body">OR</span>
                    <div className="flex-1 h-px bg-gray-700"></div>
                  </div>

                  {/* Image URL Input */}
                  <input
                    type="text"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Or paste image URL here"
                  />
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-contain bg-gray-900 rounded-lg border border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, image: '' }));
                          setImagePreview('');
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Upload an image (will be compressed to under 1MB) or paste a URL. Image will be displayed with full aspect ratio.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status || 'upcoming'}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                      Event Type *
                    </label>
                    <select
                      name="eventType"
                      value={formData.eventType || 'other'}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                    >
                      <option value="workshop">Workshop</option>
                      <option value="bootcamp">Bootcamp</option>
                      <option value="webinar">Webinar</option>
                      <option value="tech-training">Tech Training Session</option>
                      <option value="coding-class">Coding Class / Tutorial</option>
                      <option value="meeting">Meeting</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                
                {/* Team Settings for Hackathons */}
                {formData.eventType === 'hackathon' && (
                  <div className="border border-neon-purple/30 rounded-lg p-4 bg-neon-purple/5">
                    <h4 className="text-lg font-heading font-bold text-neon-purple mb-3">
                      Team Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                          Min Team Size *
                        </label>
                        <input
                          type="number"
                          name="teamSettings.minTeamSize"
                          value={formData.teamSettings?.minTeamSize || 1}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            setFormData(prev => ({
                              ...prev,
                              teamSettings: {
                                ...prev.teamSettings,
                                enabled: true,
                                minTeamSize: value
                              }
                            }));
                          }}
                          min="1"
                          max="10"
                          required
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                          Max Team Size *
                        </label>
                        <input
                          type="number"
                          name="teamSettings.maxTeamSize"
                          value={formData.teamSettings?.maxTeamSize || 4}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 4;
                            setFormData(prev => ({
                              ...prev,
                              teamSettings: {
                                ...prev.teamSettings,
                                enabled: true,
                                maxTeamSize: value
                              }
                            }));
                          }}
                          min="1"
                          max="10"
                          required
                          className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Teams must have between {formData.teamSettings?.minTeamSize || 1} and {formData.teamSettings?.maxTeamSize || 4} members
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees || ''}
                    onChange={handleChange}
                    min="1"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags || '')}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="e.g., Workshop, Technical, Coding, Web Development"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tags help categorize and filter events</p>
                </div>

                {/* Gallery Management Section */}
                <div className="border-t border-gray-700 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-heading font-semibold text-neon-blue mb-1">
                        Event Gallery (Up to 20 images)
                      </label>
                      <p className="text-xs text-gray-500">
                        Add images to showcase this event. Images will be displayed in a lightbox gallery.
                      </p>
                    </div>
                    <span className="text-sm font-body text-gray-400">
                      {(formData.gallery || []).length}/20
                    </span>
                  </div>

                  {/* Add Image Form */}
                  <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="space-y-3">
                      {/* Image Upload */}
                      <div>
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-neon-purple/10 border-2 border-dashed border-neon-purple/30 rounded-lg cursor-pointer hover:bg-neon-purple/20 transition-all">
                          <Upload size={18} className="text-neon-purple" />
                          <span className="text-neon-purple font-body font-semibold text-sm">
                            {uploadingImage ? 'Compressing...' : 'Upload Gallery Image'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              
                              if ((formData.gallery || []).length >= 20) {
                                alert('Maximum 20 images allowed');
                                return;
                              }

                              setUploadingImage(true);
                              try {
                                const options = {
                                  maxSizeMB: 0.8,
                                  maxWidthOrHeight: 1920,
                                  useWebWorker: true,
                                  fileType: 'image/jpeg',
                                };
                                const compressedFile = await imageCompression(file, options);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64String = reader.result;
                                  setFormData(prev => ({
                                    ...prev,
                                    gallery: [...(prev.gallery || []), { url: base64String, caption: '', uploadedAt: new Date() }]
                                  }));
                                  alert(`Image added! Size: ${(compressedFile.size / 1024).toFixed(0)}KB`);
                                };
                                reader.readAsDataURL(compressedFile);
                              } catch (error) {
                                alert('Failed to compress image: ' + error.message);
                              } finally {
                                setUploadingImage(false);
                              }
                            }}
                            disabled={uploadingImage || (formData.gallery || []).length >= 20}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* OR Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-700"></div>
                        <span className="text-xs text-gray-500 font-body">OR</span>
                        <div className="flex-1 h-px bg-gray-700"></div>
                      </div>

                      {/* URL Input */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          id="galleryImageUrl"
                          placeholder="Paste image URL"
                          className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-purple focus:outline-none transition font-body text-white placeholder:text-gray-500 text-sm"
                        />
                        <input
                          type="text"
                          id="galleryImageCaption"
                          placeholder="Caption (optional)"
                          className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-purple focus:outline-none transition font-body text-white placeholder:text-gray-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const urlInput = document.getElementById('galleryImageUrl');
                            const captionInput = document.getElementById('galleryImageCaption');
                            const url = urlInput.value.trim();
                            const caption = captionInput.value.trim();
                            
                            if (!url) {
                              alert('Please enter an image URL');
                              return;
                            }

                            if ((formData.gallery || []).length >= 20) {
                              alert('Maximum 20 images allowed');
                              return;
                            }

                            setFormData(prev => ({
                              ...prev,
                              gallery: [...(prev.gallery || []), { url, caption, uploadedAt: new Date() }]
                            }));
                            
                            urlInput.value = '';
                            captionInput.value = '';
                          }}
                          className="px-4 py-2 bg-neon-purple/20 text-neon-purple border border-neon-purple/30 rounded-lg font-body text-sm hover:bg-neon-purple/30 transition-all whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Images Grid */}
                  {formData.gallery && formData.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.gallery.map((img, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img 
                            src={img.url} 
                            alt={img.caption || `Gallery ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border border-gray-700"
                          />
                          {/* Caption Badge */}
                          {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-xs text-white truncate rounded-b-lg">
                              {img.caption}
                            </div>
                          )}
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                gallery: prev.gallery.filter((_, i) => i !== index)
                              }));
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            title="Remove image"
                          >
                            <X size={14} />
                          </button>
                          {/* Image Number */}
                          <div className="absolute top-1 left-1 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
                      <Image size={40} className="mx-auto text-gray-600 mb-2" />
                      <p className="text-sm text-gray-500 font-body">No gallery images yet</p>
                      <p className="text-xs text-gray-600 font-body mt-1">Upload or add image URLs above</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {type === 'member' && (
              <>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="Enter member name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role || 'developer'}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                  >
                    <option value="faculty-incharge">Faculty Incharge</option>
                    <option value="president">President</option>
                    <option value="vice-president">Vice President</option>
                    <option value="event-coordinator">Event Coordinator</option>
                    <option value="technical-lead">Technical Lead</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="content-writer">Content Writer</option>
                    <option value="social-media-manager">Social Media Manager</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white placeholder:text-gray-500"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </>
            )}

            {type === 'testimonial' && (
              <div>
                <label className="block text-sm font-heading font-semibold mb-2 text-neon-blue">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status || 'pending'}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg focus:border-neon-blue focus:outline-none transition font-body text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            )}
            
            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-body font-semibold rounded-xl hover:shadow-neon transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : `Update ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 text-white font-body font-semibold rounded-xl hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};


