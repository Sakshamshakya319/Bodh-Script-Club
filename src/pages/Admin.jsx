import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import imageCompression from 'browser-image-compression';
import {
  Users, Calendar, Image, MessageSquare, FileText, Download,
  CheckCircle, XCircle, Clock, Trash2, Eye, X, RefreshCw, MapPin, Upload, UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import AdminNavbar from '../components/AdminNavbar';
import { submissionsAPI, eventsAPI, testimonialsAPI, membersAPI } from '../utils/api';
import Swal from 'sweetalert2';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
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
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteSubmission, setPromoteSubmission] = useState(null);

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
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete "${name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme === 'dark' ? '#06b6d4' : '#0891b2',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      background: theme === 'dark' ? '#111827' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#000000'
    });

    if (!result.isConfirmed) {
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
        case 'submission':
          await submissionsAPI.delete(id);
          break;
        default:
          throw new Error('Invalid type');
      }

      await Swal.fire({
        title: 'Deleted!',
        text: 'Item has been deleted successfully.',
        icon: 'success',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
      await fetchAllData();
    } catch (error) {
      console.error('Error deleting item:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete item: ' + (error.response?.data?.message || error.message),
        icon: 'error',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
    }
  };

  const handleUpdateSubmissionStatus = async (id, status) => {
    try {
      await submissionsAPI.updateStatus(id, status);
      await fetchAllData();
      Swal.fire({
        title: 'Updated!',
        text: 'Status updated successfully!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update status',
        icon: 'error',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
    }
  };

  const handlePromoteClick = (submission) => {
    setPromoteSubmission(submission);
    setShowPromoteModal(true);
  };

  const handlePromoteConfirm = async (role, bio) => {
    try {
      if (!promoteSubmission) return;

      // 1. Create Member
      const memberData = {
        name: promoteSubmission.name,
        role: role,
        image: promoteSubmission.photo, // Use submitted photo
        github: promoteSubmission.github,
        bio: bio || `Member of Bodh Script Club - ${role}`,
        linkedin: '',
        twitter: '',
        order: 99 // Default order, can be changed later
      };

      console.log('Promoting user:', memberData);
      await membersAPI.create(memberData);

      // 2. Update Submission Status
      await submissionsAPI.updateStatus(promoteSubmission._id, 'approved');

      Swal.fire({
        title: 'Promoted!',
        text: `${promoteSubmission.name} has been promoted to ${role} successfully!`,
        icon: 'success',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
      setShowPromoteModal(false);
      setPromoteSubmission(null);
      await fetchAllData();

    } catch (error) {
      console.error('Error promoting user:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to promote user: ' + (error.response?.data?.message || error.message),
        icon: 'error',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
    }
  };

  const handleUpdateTestimonialStatus = async (id, status) => {
    try {
      await testimonialsAPI.update(id, { status });
      await fetchAllData();
      Swal.fire({
        title: 'Updated!',
        text: `Testimonial ${status} successfully!`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
    } catch (error) {
      console.error('Error updating testimonial:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update testimonial status',
        icon: 'error',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
    }
  };

  const handleDeleteTestimonial = async (id, name) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to delete the testimonial by "${name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: theme === 'dark' ? '#06b6d4' : '#0891b2',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      background: theme === 'dark' ? '#111827' : '#ffffff',
      color: theme === 'dark' ? '#ffffff' : '#000000'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await testimonialsAPI.delete(id);
      await fetchAllData();
      Swal.fire({
        title: 'Deleted!',
        text: 'Testimonial has been deleted successfully.',
        icon: 'success',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to delete testimonial',
        icon: 'error',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
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
      Swal.fire({
        title: 'Export Successful!',
        text: 'File downloaded as ' + filename,
        icon: 'success',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
    } catch (error) {
      console.error('Error exporting submissions:', error);
      Swal.fire({
        title: 'Export Failed!',
        text: 'Failed to export submissions: ' + (error.response?.data?.message || error.message),
        icon: 'error',
        background: theme === 'dark' ? '#111827' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#000000'
      });
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

    if (!authLoading) {
      if (!user) {
        console.log('No user, redirecting to login...');
        navigate('/login');
        return;
      }

      if (user.isAdmin || user.role === 'admin') {
        fetchAllData();
      }
    }
  }, [user, authLoading, navigate]);

  // Show loading screen while auth is loading
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'
        }`}>
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${theme === 'dark' ? 'border-neon-blue' : 'border-blue-600'
            }`}></div>
          <p className={`text-xl font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Loading...</p>
        </div>
      </div>
    );
  }

  // Show Access Denied if user is logged in but not admin
  if (user && !user.isAdmin && user.role !== 'admin') {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'
        }`}>
        <div className="text-center p-8 rounded-2xl border max-w-md mx-auto">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle size={32} className="text-red-600" />
          </div>
          <h2 className={`text-2xl font-heading font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Access Denied
          </h2>
          <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            You are logged in as <strong>{user.name}</strong> ({user.email}), but you do not have administrator privileges.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className={`px-6 py-2 rounded-xl font-medium transition-colors ${theme === 'dark'
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
            >
              Go Home
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen if no user
  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-black' : 'bg-white'
        }`}>
        <div className="text-center">
          <p className={`text-xl font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const safeSubmissions = Array.isArray(submissions) ? submissions : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const safeMembers = Array.isArray(members) ? members : [];
  const approvedStudents = safeSubmissions.filter(sub => sub.status === 'approved');

  const tabs = [
    { id: 'submissions', label: 'Join Requests', icon: FileText, count: safeSubmissions.length },
    { id: 'events', label: 'Events', icon: Calendar, count: safeEvents.length },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, count: safeTestimonials.length },
    { id: 'members', label: 'Members', icon: Users, count: safeMembers.length },
    { id: 'students', label: 'Students', icon: Users, count: approvedStudents.length },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark' : 'bg-gray-50'}`}>
      <AdminNavbar />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-full mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-5xl md:text-7xl font-heading font-bold mb-2 ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
              }`}>
              Dashboard
            </h1>
            <p className={`text-xl font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
              Manage all club content and submissions
            </p>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className={`rounded-2xl p-6 border transition-all duration-300 ${theme === 'dark'
              ? 'glass-effect border-gray-800 hover:border-neon-blue'
              : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-blue-300'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <FileText className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'} size={32} />
                <span className={`text-3xl font-heading font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{safeSubmissions.length}</span>
              </div>
              <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Join Requests</p>
            </div>

            <div className={`rounded-2xl p-6 border transition-all duration-300 ${theme === 'dark'
              ? 'glass-effect border-gray-800 hover:border-neon-purple'
              : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-purple-300'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <Calendar className={theme === 'dark' ? 'text-neon-purple' : 'text-purple-600'} size={32} />
                <span className={`text-3xl font-heading font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{safeEvents.length}</span>
              </div>
              <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Events</p>
            </div>

            <div className={`rounded-2xl p-6 border transition-all duration-300 ${theme === 'dark'
              ? 'glass-effect border-gray-800 hover:border-neon-pink'
              : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-pink-300'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className={theme === 'dark' ? 'text-neon-pink' : 'text-pink-600'} size={32} />
                <span className={`text-3xl font-heading font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{safeTestimonials.length}</span>
              </div>
              <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Testimonials</p>
            </div>

            <div className={`rounded-2xl p-6 border transition-all duration-300 ${theme === 'dark'
              ? 'glass-effect border-gray-800 hover:border-neon-cyan'
              : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-cyan-300'
              }`}>
              <div className="flex items-center justify-between mb-2">
                <Users className={theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'} size={32} />
                <span className={`text-3xl font-heading font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>{safeMembers.length}</span>
              </div>
              <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Team Members</p>
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
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-body font-medium transition-all duration-300 cursor-pointer select-none border-0 outline-none ${isActive
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                    : theme === 'dark'
                      ? 'glass-effect text-gray-300 hover:text-white hover:bg-white/5'
                      : 'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 shadow-sm'
                    }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className={`rounded-2xl p-6 min-h-[200px] border ${theme === 'dark'
            ? 'glass-effect border-gray-800'
            : 'bg-white border-gray-200 shadow-md'
            }`}>
            {/* Tab Header with Refresh Button */}
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 border font-body rounded-xl transition-all disabled:opacity-50 ${theme === 'dark'
                  ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/20'
                  : 'bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-100'
                  }`}
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${theme === 'dark' ? 'border-neon-blue' : 'border-blue-600'
                  }`}></div>
                <div className={`text-xl font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>Loading...</div>
              </div>
            ) : (
              <>
                {activeTab === 'submissions' && (
                  <SubmissionsContent
                    submissions={safeSubmissions}
                    onCreate={() => handleCreate('submission')}
                    onUpdateStatus={handleUpdateSubmissionStatus}
                    onPromote={handlePromoteClick}
                    onExport={handleExportSubmissions}
                    onDelete={(id, name) => handleDelete(id, 'submission', name)}
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
                {activeTab === 'students' && (
                  <StudentsContent
                    students={approvedStudents}
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
}

// Content Components for each tab
const SubmissionsContent = ({ submissions, onCreate, onUpdateStatus, onPromote, onExport, onDelete }) => {
  const { theme } = useTheme();
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
        <p className={`font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
          Total Join Requests: <span className={`font-semibold ${theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-700'
            }`}>{submissions.length}</span>
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCreate}
            className={`flex items-center gap-2 px-4 py-2 text-white font-body rounded-xl transition-all ${theme === 'dark'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-neon'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:shadow-lg'
              }`}
          >
            <UserPlus size={18} />
            Add New Request
          </button>
          <button
            type="button"
            onClick={onExport}
            className={`flex items-center gap-2 px-4 py-2 text-white font-body rounded-xl transition-all ${theme === 'dark'
              ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
              }`}
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
            type="button"
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all border ${filter === status
              ? theme === 'dark'
                ? 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan'
                : 'bg-cyan-100 text-cyan-800 border-cyan-400'
              : theme === 'dark'
                ? 'bg-dark-lighter text-gray-400 hover:text-white border-transparent'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
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
          className={`w-full px-4 py-3 border rounded-xl font-body transition-all focus:outline-none ${theme === 'dark'
            ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan focus:bg-gray-900/70'
            : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200'
            }`}
        />
      </div>

      {filteredSubmissions.length > 0 ? (
        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                  }`}>
                  <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>Name</th>
                  <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>Email</th>
                  <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>Reg. Number</th>
                  <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>Course</th>
                  <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>Status</th>
                  <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                    }`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <>
                    <tr
                      key={submission._id}
                      className={`border-b cursor-pointer transition-colors ${theme === 'dark'
                        ? 'border-gray-800 hover:bg-white/5'
                        : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      onClick={() => setExpandedRow(expandedRow === submission._id ? null : submission._id)}
                    >
                      <td className={`py-3 px-4 font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{submission.name}</td>
                      <td className={`py-3 px-4 font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>{submission.email}</td>
                      <td className={`py-3 px-4 font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>{submission.registrationNumber}</td>
                      <td className={`py-3 px-4 font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>{submission.course}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${submission.status === 'approved'
                          ? theme === 'dark'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-green-100 text-green-700 border border-green-300'
                          : submission.status === 'rejected'
                            ? theme === 'dark'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-red-100 text-red-700 border border-red-300'
                            : theme === 'dark'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
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
                              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'hover:bg-green-500/20'
                                : 'hover:bg-green-100'
                                }`}
                              title="Approve"
                            >
                              <CheckCircle size={18} className={
                                theme === 'dark' ? 'text-green-400' : 'text-green-600'
                              } />
                            </button>
                          )}
                          {submission.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => onPromote(submission)}
                              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'hover:bg-purple-500/20'
                                : 'hover:bg-purple-100'
                                }`}
                              title="Promote to Member"
                            >
                              <UserPlus size={18} className={
                                theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                              } />
                            </button>
                          )}
                          {submission.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(submission._id, 'rejected')}
                              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'hover:bg-red-500/20'
                                : 'hover:bg-red-100'
                                }`}
                              title="Reject"
                            >
                              <XCircle size={18} className={
                                theme === 'dark' ? 'text-red-400' : 'text-red-600'
                              } />
                            </button>
                          )}
                          {submission.status !== 'pending' && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(submission._id, 'pending')}
                              className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                                ? 'hover:bg-yellow-500/20'
                                : 'hover:bg-yellow-100'
                                }`}
                              title="Mark as Pending"
                            >
                              <Clock size={18} className={
                                theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                              } />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDelete(submission._id, submission.name)}
                            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                              ? 'hover:bg-gray-700'
                              : 'hover:bg-gray-200'
                              }`}
                            title="Delete Submission"
                          >
                            <Trash2 size={18} className={
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            } />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedRow(expandedRow === submission._id ? null : submission._id)}
                            className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                              ? 'hover:bg-blue-500/20'
                              : 'hover:bg-blue-100'
                              }`}
                            title="View Details"
                          >
                            <Eye size={18} className={
                              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                            } />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Details */}
                    {expandedRow === submission._id && (
                      <tr className={`border-b ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-800'
                        : 'bg-gray-50 border-gray-200'
                        }`}>
                        <td colSpan="6" className="py-4 px-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                              <p className={`text-xs font-body mb-1 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                                }`}>Phone Number</p>
                              <p className={`text-sm font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{submission.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-body mb-1 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                                }`}>WhatsApp Number</p>
                              <p className={`text-sm font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{submission.whatsapp || 'N/A'}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-body mb-1 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                                }`}>Section</p>
                              <p className={`text-sm font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{submission.section || 'N/A'}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-body mb-1 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                                }`}>Year</p>
                              <p className={`text-sm font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{submission.year || 'N/A'}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-body mb-1 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                                }`}>Batch</p>
                              <p className={`text-sm font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                }`}>{submission.batch || 'N/A'}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-body mb-1 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                                }`}>GitHub Profile</p>
                              {submission.github ? (
                                <a
                                  href={submission.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-sm font-body hover:underline break-all ${theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'
                                    }`}
                                >
                                  {submission.github}
                                </a>
                              ) : (
                                <p className={`text-sm font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  }`}>N/A</p>
                              )}
                            </div>

                            {/* Photo */}
                            <div>
                              <p className={`text-xs font-body mb-1 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                Student Photo
                              </p>
                              {submission.photo ? (
                                <img
                                  src={submission.photo}
                                  alt="Student"
                                  className="h-32 w-32 object-cover rounded-xl border-2 border-white shadow-sm"
                                />
                              ) : (
                                <p className={`text-sm font-body ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  No photo uploaded
                                </p>
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
                className={`rounded-xl p-4 border transition-all ${theme === 'dark'
                  ? 'glass-effect border-gray-800 hover:border-neon-cyan/30'
                  : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-cyan-300'
                  }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-heading font-bold truncate mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                      {submission.name}
                    </h3>
                    <p className={`text-sm font-body truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>{submission.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold flex-shrink-0 ml-2 ${submission.status === 'approved'
                    ? theme === 'dark'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-green-100 text-green-700 border border-green-300'
                    : submission.status === 'rejected'
                      ? theme === 'dark'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-red-100 text-red-700 border border-red-300'
                      : theme === 'dark'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    }`}>
                    {submission.status}
                  </span>
                </div>

                {/* Card Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>Reg. Number:</span>
                    <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{submission.registrationNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>Course:</span>
                    <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{submission.course}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>Phone:</span>
                    <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{submission.phone || 'N/A'}</span>
                  </div>
                  {submission.section && (
                    <div className="flex justify-between text-sm">
                      <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>Section:</span>
                      <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{submission.section}</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedRow === submission._id && (
                  <div className={`border-t pt-3 mb-3 space-y-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="flex justify-between text-sm">
                      <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>WhatsApp:</span>
                      <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{submission.whatsapp || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>Year:</span>
                      <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{submission.year || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>Batch:</span>
                      <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>{submission.batch || 'N/A'}</span>
                    </div>
                    {submission.github && (
                      <div className="text-sm">
                        <span className={`font-body block mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          }`}>GitHub:</span>
                        <a
                          href={submission.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-body hover:underline break-all ${theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'
                            }`}
                        >
                          {submission.github}
                        </a>
                      </div>
                    )}

                    {/* Photo Display */}
                    <div className="text-center pt-2">
                      <p className={`text-xs font-body mb-2 font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                        Student Photo
                      </p>
                      {submission.photo ? (
                        <img
                          src={submission.photo}
                          alt="Student"
                          className="h-32 w-32 object-cover rounded-xl border-2 border-white shadow-sm mx-auto"
                        />
                      ) : (
                        <div className={`p-4 rounded-xl border border-dashed text-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}`}>
                          <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            No photo uploaded
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {submission.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(submission._id, 'approved')}
                      className={`flex-1 min-w-[100px] px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-2 ${theme === 'dark'
                        ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                        : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                        }`}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                  )}
                  {submission.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onPromote(submission)}
                      className={`flex-1 min-w-[100px] px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-2 ${theme === 'dark'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
                        : 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                        }`}
                    >
                      <UserPlus size={16} />
                      Promote
                    </button>
                  )}
                  {submission.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(submission._id, 'rejected')}
                      className={`flex-1 min-w-[100px] px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-2 ${theme === 'dark'
                        ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                        : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                        }`}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  )}
                  {submission.status !== 'pending' && (
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(submission._id, 'pending')}
                      className={`flex-1 min-w-[100px] px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-2 ${theme === 'dark'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20'
                        : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                        }`}
                    >
                      <Clock size={16} />
                      Pending
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(submission._id, submission.name)}
                    className={`px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center gap-2 ${theme === 'dark'
                      ? 'bg-gray-700/10 text-gray-400 border-gray-700/30 hover:bg-gray-700/20'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedRow(expandedRow === submission._id ? null : submission._id)}
                    className={`px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center gap-2 ${theme === 'dark'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                      : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                      }`}
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
          <FileText size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
          <p className={`font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {searchQuery ? 'No submissions match your search' : 'No join requests found'}
          </p>
        </div>
      )
      }
    </div >
  );
};

const EventsContent = ({ events, onCreate, onEdit, onDelete }) => {
  const { theme } = useTheme();
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
        <p className={`font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
          Total Events: <span className={`font-semibold ${theme === 'dark' ? 'text-neon-purple' : 'text-purple-700'
            }`}>{events.length}</span>
        </p>
        <button
          type="button"
          onClick={onCreate}
          className={`flex items-center gap-2 px-4 py-2 text-white font-body rounded-xl transition-all ${theme === 'dark'
            ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
            }`}
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
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all border ${filter === status
              ? theme === 'dark'
                ? 'bg-neon-purple/20 text-neon-purple border-neon-purple'
                : 'bg-purple-100 text-purple-800 border-purple-400'
              : theme === 'dark'
                ? 'bg-dark-lighter text-gray-400 hover:text-white border-transparent'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div key={event._id} className={`rounded-xl overflow-hidden border transition-all ${theme === 'dark'
              ? 'glass-effect border-gray-800 hover:border-neon-purple/30'
              : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-purple-300'
              }`}>
              {/* Event Image */}
              <div className={`relative h-48 overflow-hidden ${theme === 'dark'
                ? 'bg-gradient-to-br from-gray-800 to-gray-900'
                : 'bg-gradient-to-br from-gray-100 to-gray-200'
                }`}>
                {event.image ? (
                  <img
                    src={event.image}
                    alt={event.title}
                    className={`w-full h-full object-contain ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'
                      }`}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className="w-full h-full flex items-center justify-center" style={{ display: event.image ? 'none' : 'flex' }}>
                  <Calendar size={48} className={
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  } />
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-body font-semibold ${event.status === 'upcoming'
                    ? theme === 'dark'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-green-100 text-green-700 border border-green-300'
                    : event.status === 'completed'
                      ? theme === 'dark'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-blue-100 text-blue-700 border border-blue-300'
                      : event.status === 'cancelled'
                        ? theme === 'dark'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-red-100 text-red-700 border border-red-300'
                        : theme === 'dark'
                          ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}>
                    {event.status}
                  </span>
                </div>
              </div>

              {/* Event Info */}
              <div className="p-6">
                <h3 className={`text-xl font-heading font-bold mb-2 line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                  {event.title}
                </h3>
                <p className={`text-sm font-body mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                  {event.shortDescription || event.description?.replace(/<[^>]*>/g, '').substring(0, 150) || 'No description'}
                </p>

                <div className="space-y-2 mb-4">
                  <div className={`flex items-center gap-2 text-sm font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <Calendar size={16} className={
                      theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'
                    } />
                    {event.date ? new Date(event.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No date set'}
                  </div>
                  {event.time && (
                    <div className={`flex items-center gap-2 text-sm font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      <Clock size={16} className={
                        theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'
                      } />
                      {event.time}
                    </div>
                  )}
                  {event.location && (
                    <div className={`flex items-center gap-2 text-sm font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      <MapPin size={16} className={
                        theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'
                      } />
                      {event.location}
                    </div>
                  )}
                  <div className={`flex items-center gap-2 text-sm font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                    <Users size={16} className={
                      theme === 'dark' ? 'text-neon-purple' : 'text-purple-600'
                    } />
                    {event.registrationCount || 0} Registrations
                  </div>
                  {event.slug && (
                    <div className={`flex items-center gap-2 text-xs font-mono mt-2 pt-2 border-t ${theme === 'dark'
                      ? 'text-gray-500 border-gray-800'
                      : 'text-gray-500 border-gray-200'
                      }`}>
                      <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-500'}>URL:</span>
                      <span className={theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'}>/events/{event.slug}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewRegistrations(event)}
                    className={`px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-1 ${theme === 'dark'
                      ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/20'
                      : 'bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-100'
                      }`}
                    title="View Registrations"
                  >
                    <Users size={14} />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(event)}
                    className={`px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-1 ${theme === 'dark'
                      ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30 hover:bg-neon-blue/20'
                      : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                      }`}
                  >
                    <Eye size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(event._id, event.title)}
                    className={`px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-1 ${theme === 'dark'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                      : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                      }`}
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
          <Calendar size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
          <p className={`font-body mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {filter === 'all' ? 'No events found' : `No ${filter} events found`}
          </p>
          <button
            type="button"
            onClick={onCreate}
            className={`inline-flex items-center gap-2 px-6 py-3 text-white font-body rounded-xl transition-all ${theme === 'dark'
              ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
              }`}
          >
            <Calendar size={18} />
            Create First Event
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {filteredEvents.length > 0 && (
        <div className={`mt-8 p-6 rounded-xl ${theme === 'dark' ? 'bg-dark-lighter' : 'bg-gray-100'
          }`}>
          <h3 className={`text-lg font-heading font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Event Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-neon-purple' : 'text-purple-600'
                }`}>{statusCounts.all}</div>
              <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Events</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`}>{statusCounts.upcoming}</div>
              <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Upcoming</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>{statusCounts.completed}</div>
              <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Completed</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`}>{statusCounts.cancelled}</div>
              <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Cancelled</div>
            </div>
          </div>
        </div>
      )}

      {/* Registrations Modal */}
      {showRegistrationsModal && selectedEvent && (
        <div className={`fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn ${theme === 'dark' ? 'bg-black/80' : 'bg-gray-900/50'
          }`}>
          <div className={`rounded-3xl border max-w-6xl w-full my-8 ${theme === 'dark'
            ? 'glass-effect border-gray-800'
            : 'bg-white border-gray-200 shadow-2xl'
            }`}>
            {/* Header */}
            <div className={`sticky top-0 backdrop-blur-md border-b p-6 flex items-center justify-between ${theme === 'dark'
              ? 'bg-black/50 border-gray-800'
              : 'bg-white/90 border-gray-200'
              }`}>
              <div>
                <h2 className={`text-3xl font-heading font-bold ${theme === 'dark' ? 'gradient-text' : 'text-gray-900'
                  }`}>
                  Event Registrations
                </h2>
                <p className={`font-body mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>{selectedEvent.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExportRegistrations(selectedEvent._id)}
                  className={`flex items-center gap-2 px-4 py-2 border font-body rounded-xl transition-all ${theme === 'dark'
                    ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/20'
                    : 'bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-100'
                    }`}
                >
                  <Download size={18} />
                  Export CSV
                </button>
                <button
                  onClick={() => setShowRegistrationsModal(false)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                >
                  <X size={24} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingRegistrations ? (
                <div className="text-center py-12">
                  <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${theme === 'dark' ? 'border-neon-blue' : 'border-blue-600'
                    }`}></div>
                  <div className={`text-xl font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>Loading registrations...</div>
                </div>
              ) : registrations.length > 0 ? (
                <>
                  <div className={`mb-4 p-4 border rounded-xl ${theme === 'dark'
                    ? 'bg-neon-blue/10 border-neon-blue/30'
                    : 'bg-blue-50 border-blue-200'
                    }`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Total Registrations</p>
                        <p className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-700'
                          }`}>{registrations.length}</p>
                      </div>
                      <div>
                        <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>Latest Registration</p>
                        <p className={`text-lg font-heading font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                          }`}>
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
                        <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                          }`}>
                          <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                            }`}>Name</th>
                          <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                            }`}>Reg. No</th>
                          <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                            }`}>Phone</th>
                          <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                            }`}>Course</th>
                          <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                            }`}>Section</th>
                          <th className={`text-left py-3 px-4 font-body text-sm font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'
                            }`}>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations.map((reg) => (
                          <tr key={reg._id} className={`border-b transition-colors ${theme === 'dark'
                            ? 'border-gray-800 hover:bg-white/5'
                            : 'border-gray-200 hover:bg-gray-50'
                            }`}>
                            <td className={`py-3 px-4 font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{reg.name}</td>
                            <td className={`py-3 px-4 font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>{reg.registrationNo}</td>
                            <td className={`py-3 px-4 font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>{reg.phoneNumber}</td>
                            <td className={`py-3 px-4 font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>{reg.course || 'N/A'}</td>
                            <td className={`py-3 px-4 font-body ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>{reg.section}</td>
                            <td className={`py-3 px-4 font-body text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                              }`}>
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
                        className={`rounded-xl p-4 border transition-all ${theme === 'dark'
                          ? 'glass-effect border-gray-800 hover:border-neon-purple/30'
                          : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-purple-300'
                          }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-lg font-heading font-bold truncate mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                              {reg.name}
                            </h3>
                            <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                              }`}>{reg.registrationNo}</p>
                          </div>
                        </div>

                        {/* Card Details */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                              }`}>Phone:</span>
                            <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{reg.phoneNumber}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                              }`}>Course:</span>
                            <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{reg.course || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                              }`}>Section:</span>
                            <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{reg.section}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={`font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                              }`}>Registered:</span>
                            <span className={`font-body font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
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
                  <Users size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                  <p className={`font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>No registrations yet</p>
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
  const { theme } = useTheme();
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
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`}
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
        <p className={`font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
          Total Testimonials: <span className={`font-semibold ${theme === 'dark' ? 'text-neon-pink' : 'text-pink-700'
            }`}>{testimonials.length}</span>
        </p>
        <a
          href="/feedback"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-4 py-2 text-white font-body rounded-xl transition-all ${theme === 'dark'
            ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
            }`}
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
            className={`px-4 py-2 rounded-lg font-body text-sm transition-all border ${filter === status
              ? theme === 'dark'
                ? 'bg-neon-pink/20 text-neon-pink border-neon-pink'
                : 'bg-pink-100 text-pink-800 border-pink-400'
              : theme === 'dark'
                ? 'bg-dark-lighter text-gray-400 hover:text-white border-transparent'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {filteredTestimonials.length > 0 ? (
        <div className="space-y-6">
          {filteredTestimonials.map((testimonial) => (
            <div key={testimonial._id} className={`rounded-xl p-6 border transition-all ${theme === 'dark'
              ? 'glass-effect border-gray-800 hover:border-neon-pink/30'
              : 'bg-white border-gray-200 shadow-md hover:shadow-lg hover:border-pink-300'
              }`}>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-heading font-bold ${theme === 'dark'
                    ? 'bg-gradient-to-br from-neon-pink to-neon-purple'
                    : 'bg-gradient-to-br from-pink-500 to-purple-600'
                    }`}>
                    {testimonial.name.charAt(0)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className={`text-xl font-heading font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                        {testimonial.name}
                      </h3>
                      <p className={`text-sm font-body mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        {testimonial.role} • {testimonial.email}
                      </p>
                      <div className="flex items-center gap-3">
                        {renderStars(testimonial.rating)}
                        <span className={`text-xs font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          }`}>
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
                    <span className={`px-4 py-2 rounded-full text-sm font-body font-semibold ${testimonial.status === 'approved'
                      ? theme === 'dark'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-green-100 text-green-700 border border-green-300'
                      : testimonial.status === 'rejected'
                        ? theme === 'dark'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-red-100 text-red-700 border border-red-300'
                        : theme === 'dark'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      }`}>
                      {testimonial.status.charAt(0).toUpperCase() + testimonial.status.slice(1)}
                    </span>
                  </div>

                  {/* Message */}
                  <div className={`mb-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'
                    }`}>
                    <p className={`font-body leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                      "{testimonial.message}"
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {testimonial.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(testimonial._id, 'approved')}
                        className={`px-4 py-2 border rounded-lg text-sm font-body transition-all flex items-center gap-2 ${theme === 'dark'
                          ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                          : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                          }`}
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                    )}
                    {testimonial.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(testimonial._id, 'rejected')}
                        className={`px-4 py-2 border rounded-lg text-sm font-body transition-all flex items-center gap-2 ${theme === 'dark'
                          ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                          : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                          }`}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    )}
                    {testimonial.status !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(testimonial._id, 'pending')}
                        className={`px-4 py-2 border rounded-lg text-sm font-body transition-all flex items-center gap-2 ${theme === 'dark'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100'
                          }`}
                      >
                        <Clock size={16} />
                        Mark Pending
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(testimonial._id, testimonial.name)}
                      className={`px-4 py-2 border rounded-lg text-sm font-body transition-all flex items-center gap-2 ${theme === 'dark'
                        ? 'bg-gray-500/10 text-gray-400 border-gray-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
                        }`}
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
          <MessageSquare size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
          <p className={`font-body mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
            {filter === 'all' ? 'No testimonials found' : `No ${filter} testimonials found`}
          </p>
          <a
            href="/feedback"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-6 py-3 text-white font-body rounded-xl transition-all ${theme === 'dark'
              ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
              }`}
          >
            <MessageSquare size={18} />
            Go to Feedback Page
          </a>
        </div>
      )}

      {/* Quick Stats */}
      {filteredTestimonials.length > 0 && (
        <div className={`mt-8 p-6 rounded-xl ${theme === 'dark' ? 'bg-dark-lighter' : 'bg-gray-100'
          }`}>
          <h3 className={`text-lg font-heading font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-neon-pink' : 'text-pink-600'
                }`}>{statusCounts.all}</div>
              <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Testimonials</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'
                }`}>{statusCounts.pending}</div>
              <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Pending Review</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'
                }`}>{statusCounts.approved}</div>
              <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Approved</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'
                }`}>{statusCounts.rejected}</div>
              <div className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>Rejected</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MembersContent = ({ members, onCreate, onEdit, onDelete }) => {
  const { theme } = useTheme();

  const getRoleIcon = (role) => {
    const roleColors = {
      'faculty-incharge': 'text-purple-500',
      'president': 'text-red-500',
      'vice-president': 'text-orange-500',
      'event-coordinator': 'text-yellow-500',
      'technical-lead': 'text-blue-500',
      'developer': 'text-green-500',
      'designer': 'text-pink-500',
      'content-writer': 'text-indigo-500',
      'social-media-manager': 'text-cyan-500',
      'other': 'text-gray-500'
    };
    return roleColors[role] || 'text-gray-500';
  };

  const formatRole = (role) => {
    return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-heading font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Team Members
          </h2>
          <p className={`font-body text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Members: <span className={`font-semibold ${theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-700'}`}>{members.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className={`flex items-center gap-2 px-4 py-2 text-white font-body rounded-xl transition-all ${theme === 'dark'
            ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
            }`}
        >
          <Users size={18} />
          Add New Member
        </button>
      </div>

      {members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {members.map((member) => (
            <div key={member._id} className={`rounded-2xl p-6 border transition-all hover:scale-105 transform duration-300 ${theme === 'dark'
              ? 'glass-effect border-gray-800 hover:border-neon-cyan/50'
              : 'bg-white border-gray-200 shadow-md hover:shadow-xl hover:border-cyan-400'
              }`}>
              {/* Photo */}
              <div className="text-center mb-4">
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name}
                    className={`w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 ${theme === 'dark' ? 'border-neon-cyan/30' : 'border-cyan-300'
                      }`}
                  />
                ) : (
                  <div className={`w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl font-heading font-bold ${theme === 'dark'
                    ? 'bg-gradient-to-br from-neon-cyan to-neon-blue'
                    : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                    }`}>
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Name and Role */}
              <div className="text-center mb-4">
                <h3 className={`text-lg font-heading font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {member.name}
                </h3>
                <p className={`text-sm font-body font-semibold ${getRoleIcon(member.role)}`}>
                  {formatRole(member.role)}
                </p>
              </div>

              {/* Bio */}
              {member.bio && (
                <div className="mb-4">
                  <p className={`text-xs font-body text-center line-clamp-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {member.bio}
                  </p>
                </div>
              )}

              {/* Social Links */}
              <div className="flex items-center justify-center gap-3 mb-4">
                {member.github && (
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    title="GitHub"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                      ? 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-400'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                      }`}
                    title="LinkedIn"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                )}
                {member.twitter && (
                  <a
                    href={member.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                      ? 'bg-sky-900/30 hover:bg-sky-900/50 text-sky-400'
                      : 'bg-sky-50 hover:bg-sky-100 text-sky-600'
                      }`}
                    title="Twitter"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(member)}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-1 ${theme === 'dark'
                    ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30 hover:bg-neon-cyan/20'
                    : 'bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-100'
                    }`}
                >
                  <Eye size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(member._id, member.name)}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm font-body transition-all flex items-center justify-center gap-1 ${theme === 'dark'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                    : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                    }`}
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
          <Users size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
          <p className={`font-body mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>No members found</p>
          <button
            type="button"
            onClick={onCreate}
            className={`inline-flex items-center gap-2 px-6 py-3 text-white font-body rounded-xl transition-all ${theme === 'dark'
              ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
              }`}
          >
            <Users size={18} />
            Add First Member
          </button>
        </div>
      )
      }
    </div >
  );
};

// Students Content Component - Excel-like Table View
const StudentsContent = ({ students }) => {
  const { theme } = useTheme();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-heading font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            All Students
          </h2>
          <p className={`font-body text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Total Approved Students: <span className={`font-semibold ${theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-700'}`}>{students.length}</span>
          </p>
        </div>
        <button
          onClick={() => {
            // Export to Excel functionality
            const csvContent = [
              ['Photo', 'Name', 'Registration No', 'Email', 'Phone', 'Course', 'Department', 'Section', 'Year', 'GitHub'],
              ...students.map(s => [
                s.photo || 'No Photo',
                s.name,
                s.registrationNumber,
                s.email,
                s.phone,
                s.course,
                s.department,
                s.section,
                s.year || 'N/A',
                s.github || 'N/A'
              ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-white font-body rounded-xl transition-all ${theme === 'dark'
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-neon'
            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg'
            }`}
        >
          <Download size={18} />
          Export to Excel
        </button>
      </div>

      {students.length > 0 ? (
        <div className={`overflow-x-auto rounded-xl border ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <table className="w-full">
            <thead className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Photo
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Name
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Reg. Number
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Email
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Phone
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Course
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Department
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Section
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  Year
                </th>
                <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
                  GitHub
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-800' : 'divide-gray-200'}`}>
              {students.map((student, index) => (
                <tr
                  key={student._id || index}
                  className={`transition-colors ${theme === 'dark'
                    ? 'hover:bg-gray-900/50'
                    : 'hover:bg-gray-50'
                    }`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    {student.photo ? (
                      <img
                        src={student.photo}
                        alt={student.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-cyan-300"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${theme === 'dark'
                        ? 'bg-gradient-to-br from-neon-cyan to-neon-blue'
                        : 'bg-gradient-to-br from-cyan-500 to-blue-600'
                        }`}>
                        {student.name.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {student.name}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {student.registrationNumber}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {student.email}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {student.phone}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {student.course}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {student.department}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {student.section}
                  </td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {student.year || 'N/A'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {student.github ? (
                      <a
                        href={student.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-sm hover:underline ${theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'}`}
                      >
                        View Profile
                      </a>
                    ) : (
                      <span className={`text-sm ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <Users size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
          <p className={`font-body mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            No approved students found
          </p>
        </div>
      )}
    </div>
  );
};

export default Admin;

// Modal Components
const CreateModal = ({ type, onClose, onSuccess }) => {
  const { theme } = useTheme();
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
        case 'submission':
          await submissionsAPI.create({ ...dataToSubmit, status: 'approved' });
          break;
        case 'testimonial':
          await testimonialsAPI.create(dataToSubmit);
          break;
        case 'gallery':
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
        const fieldName = type === 'submission' ? 'photo' : 'image';
        setFormData(prev => ({ ...prev, [fieldName]: base64String }));
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
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'bg-black/80' : 'bg-gray-900/50'
      }`} onClick={onClose}>
      <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border ${theme === 'dark'
        ? 'glass-effect border-gray-800'
        : 'bg-white border-gray-200 shadow-2xl'
        }`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
          <h3 className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
            Create New {type.charAt(0).toUpperCase() + type.slice(1)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-100'
              }`}
          >
            <X size={24} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {type === 'event' && (
              <>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Short Description * (for event cards)
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription || ''}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Brief description (max 150 characters)"
                  />
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                    {(formData.shortDescription || '').length}/150 characters
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Full Description * (with rich formatting)
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={formData.description || ''}
                    onChange={handleQuillChange}
                    className={`rounded-lg quill-editor ${theme === 'dark' ? 'quill-dark' : 'quill-light'
                      }`}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    placeholder="Enter detailed event description with rich formatting..."
                  />
                  <style>{`
                    .quill-dark .ql-container {
                      min-height: 200px;
                      background: rgba(17, 24, 39, 0.5);
                      border: 1px solid rgb(55, 65, 81);
                      border-top: none;
                      border-radius: 0 0 0.5rem 0.5rem;
                      color: white;
                    }
                    .quill-dark .ql-toolbar {
                      background: rgba(17, 24, 39, 0.5);
                      border: 1px solid rgb(55, 65, 81);
                      border-radius: 0.5rem 0.5rem 0 0;
                    }
                    .quill-dark .ql-editor {
                      color: white;
                      font-family: inherit;
                    }
                    .quill-dark .ql-editor.ql-blank::before {
                      color: rgb(107, 114, 128);
                    }
                    .quill-dark .ql-stroke {
                      stroke: rgb(156, 163, 175);
                    }
                    .quill-dark .ql-fill {
                      fill: rgb(156, 163, 175);
                    }
                    .quill-dark .ql-picker-label {
                      color: rgb(156, 163, 175);
                    }
                    .quill-light .ql-container {
                      min-height: 200px;
                      background: white;
                      border: 1px solid rgb(209, 213, 219);
                      border-top: none;
                      border-radius: 0 0 0.5rem 0.5rem;
                      color: rgb(17, 24, 39);
                    }
                    .quill-light .ql-toolbar {
                      background: rgb(249, 250, 251);
                      border: 1px solid rgb(209, 213, 219);
                      border-radius: 0.5rem 0.5rem 0 0;
                    }
                    .quill-light .ql-editor {
                      color: rgb(17, 24, 39);
                      font-family: inherit;
                    }
                    .quill-light .ql-editor.ql-blank::before {
                      color: rgb(156, 163, 175);
                    }
                    .quill-light .ql-stroke {
                      stroke: rgb(75, 85, 99);
                    }
                    .quill-light .ql-fill {
                      fill: rgb(75, 85, 99);
                    }
                    .quill-light .ql-picker-label {
                      color: rgb(75, 85, 99);
                    }
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
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                      }`}>
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date || ''}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                      }`}>
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time || ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Enter event location"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Event Image *
                  </label>

                  {/* Image Upload Button */}
                  <div className="mb-3">
                    <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${theme === 'dark'
                      ? 'bg-neon-blue/10 border-neon-blue/30 hover:bg-neon-blue/20'
                      : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                      }`}>
                      <Upload size={20} className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'} />
                      <span className={`font-body font-semibold ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                        }`}>
                        {uploadingImage ? 'Compressing...' : 'Upload Image (Auto-compress to less than 1MB)'}
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
                    <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <span className={`text-xs font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>OR</span>
                    <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>

                  {/* Image URL Input */}
                  <input
                    type="text"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Or paste image URL here"
                  />

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className={`w-full h-48 object-contain rounded-lg border ${theme === 'dark'
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-white border-gray-300'
                          }`}
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

                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                    Upload an image (will be compressed to under 1MB) or paste a URL. Image will be displayed with full aspect ratio.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                      }`}>
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status || 'upcoming'}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                      }`}>
                      Event Type *
                    </label>
                    <select
                      name="eventType"
                      value={formData.eventType || 'other'}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
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
                  <div className={`border rounded-lg p-4 ${theme === 'dark'
                    ? 'border-neon-purple/30 bg-neon-purple/5'
                    : 'border-purple-300 bg-purple-50'
                    }`}>
                    <h4 className={`text-lg font-heading font-bold mb-3 ${theme === 'dark' ? 'text-neon-purple' : 'text-purple-700'
                      }`}>
                      Team Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                          }`}>
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
                          className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                          }`}>
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
                          className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                        />
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                      Teams must have between {formData.teamSettings?.minTeamSize || 1} and {formData.teamSettings?.maxTeamSize || 4} members
                    </p>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees || ''}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="e.g., Workshop, Technical, Coding, Web Development"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tags help categorize and filter events</p>
                </div>
              </>
            )}

            {type === 'member' && (
              <>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Enter member name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role || 'developer'}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
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
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Member Image *
                  </label>

                  {/* Image Upload Button */}
                  <div className="mb-3">
                    <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${theme === 'dark'
                      ? 'bg-neon-blue/10 border-neon-blue/30 hover:bg-neon-blue/20'
                      : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                      }`}>
                      <Upload size={20} className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'} />
                      <span className={`font-body font-semibold ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                        }`}>
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
                    <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <span className={`text-xs font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>OR</span>
                    <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>

                  {/* Image URL Input */}
                  <input
                    type="text"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Or paste image URL here"
                  />

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className={`w-full h-48 object-contain rounded-lg border ${theme === 'dark'
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-white border-gray-300'
                          }`}
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

                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                    Upload an image (compressed to less than 1MB) or paste a URL.
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </>
            )}

            {type === 'submission' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Full Name *</label>
                    <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="Enter full name" />
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Registration Number *</label>
                    <input type="text" name="registrationNumber" value={formData.registrationNumber || ''} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="e.g. 12345678" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Email Address *</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="email@example.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Phone *</label>
                      <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} required className={`w-full px-4 py-2 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="Phone" />
                    </div>
                    <div>
                      <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>WhatsApp *</label>
                      <input type="tel" name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} required className={`w-full px-4 py-2 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="WhatsApp" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Course *</label>
                    <input type="text" name="course" value={formData.course || ''} onChange={handleChange} required className={`w-full px-4 py-2 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="e.g. MCA" />
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Dept *</label>
                    <input type="text" name="department" value={formData.department || ''} onChange={handleChange} required className={`w-full px-4 py-2 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="e.g. CS" />
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Section *</label>
                    <input type="text" name="section" value={formData.section || ''} onChange={handleChange} required className={`w-full px-4 py-2 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="Section" />
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Year *</label>
                    <select name="year" value={formData.year || ''} onChange={handleChange} required className={`w-full px-4 py-2 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'}`}>
                      <option value="">Select</option>
                      <option value="1st">1st Year</option>
                      <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option>
                      <option value="4th">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Batch Year *</label>
                    <input type="text" name="batch" value={formData.batch || ''} onChange={handleChange} required className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="e.g. 2023-25" />
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>GitHub URL</label>
                    <input type="url" name="github" value={formData.github || ''} onChange={handleChange} className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-cyan' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'}`} placeholder="https://github.com/username" />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'}`}>Student Photo *</label>
                  <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${theme === 'dark' ? 'bg-neon-cyan/10 border-neon-cyan/30 hover:bg-neon-cyan/20' : 'bg-cyan-50 border-cyan-300 hover:bg-cyan-100'}`}>
                    <Upload size={20} className={theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-600'} />
                    <span className={`font-body font-semibold ${theme === 'dark' ? 'text-neon-cyan' : 'text-cyan-700'}`}>
                      {uploadingImage ? 'Compressing...' : 'Upload Student Photo'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" required={!imagePreview} />
                  </label>
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img src={imagePreview} alt="Preview" className={`w-full h-32 object-contain rounded-lg border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`} />
                      <button type="button" onClick={() => { setFormData(prev => ({ ...prev, photo: '' })); setImagePreview(''); }} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"><X size={14} /></button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-3 text-white font-body font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
                  }`}
              >
                {loading ? 'Creating...' : `Create ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-3 font-body font-semibold rounded-xl transition-all ${theme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
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
  const { theme } = useTheme();
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
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'bg-black/80' : 'bg-gray-900/50'
      }`} onClick={onClose}>
      <div className={`rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border ${theme === 'dark'
        ? 'glass-effect border-gray-800'
        : 'bg-white border-gray-200 shadow-2xl'
        }`} onClick={(e) => e.stopPropagation()}>
        <div className={`p-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
          }`}>
          <h3 className={`text-2xl font-heading font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
            Edit {type.charAt(0).toUpperCase() + type.slice(1)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-gray-100'
              }`}
          >
            <X size={24} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {type === 'event' && (
              <>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Short Description * (for event cards)
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription || ''}
                    onChange={handleChange}
                    required
                    maxLength={150}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Brief description (max 150 characters)"
                  />
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                    {(formData.shortDescription || '').length}/150 characters
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Full Description * (with rich formatting)
                  </label>
                  <ReactQuill
                    theme="snow"
                    value={formData.description || ''}
                    onChange={handleQuillChange}
                    className={`rounded-lg quill-editor ${theme === 'dark' ? 'quill-dark' : 'quill-light'
                      }`}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'image'],
                        ['clean']
                      ]
                    }}
                    placeholder="Enter detailed event description with rich formatting..."
                  />
                  <style>{`
                    .quill-dark .ql-container {
                      min-height: 200px;
                      background: rgba(17, 24, 39, 0.5);
                      border: 1px solid rgb(55, 65, 81);
                      border-top: none;
                      border-radius: 0 0 0.5rem 0.5rem;
                      color: white;
                    }
                    .quill-dark .ql-toolbar {
                      background: rgba(17, 24, 39, 0.5);
                      border: 1px solid rgb(55, 65, 81);
                      border-radius: 0.5rem 0.5rem 0 0;
                    }
                    .quill-dark .ql-editor {
                      color: white;
                      font-family: inherit;
                    }
                    .quill-dark .ql-editor.ql-blank::before {
                      color: rgb(107, 114, 128);
                    }
                    .quill-dark .ql-stroke {
                      stroke: rgb(156, 163, 175);
                    }
                    .quill-dark .ql-fill {
                      fill: rgb(156, 163, 175);
                    }
                    .quill-dark .ql-picker-label {
                      color: rgb(156, 163, 175);
                    }
                    .quill-light .ql-container {
                      min-height: 200px;
                      background: white;
                      border: 1px solid rgb(209, 213, 219);
                      border-top: none;
                      border-radius: 0 0 0.5rem 0.5rem;
                      color: rgb(17, 24, 39);
                    }
                    .quill-light .ql-toolbar {
                      background: rgb(249, 250, 251);
                      border: 1px solid rgb(209, 213, 219);
                      border-radius: 0.5rem 0.5rem 0 0;
                    }
                    .quill-light .ql-editor {
                      color: rgb(17, 24, 39);
                      font-family: inherit;
                    }
                    .quill-light .ql-editor.ql-blank::before {
                      color: rgb(156, 163, 175);
                    }
                    .quill-light .ql-stroke {
                      stroke: rgb(75, 85, 99);
                    }
                    .quill-light .ql-fill {
                      fill: rgb(75, 85, 99);
                    }
                    .quill-light .ql-picker-label {
                      color: rgb(75, 85, 99);
                    }
                  `}</style>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                      }`}>
                      Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date ? formData.date.split('T')[0] : ''}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                      }`}>
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time || ''}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Enter event location"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Event Image *
                  </label>

                  {/* Image Upload Button */}
                  <div className="mb-3">
                    <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${theme === 'dark'
                      ? 'bg-neon-blue/10 border-neon-blue/30 hover:bg-neon-blue/20'
                      : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                      }`}>
                      <Upload size={20} className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'} />
                      <span className={`font-body font-semibold ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                        }`}>
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
                    <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <span className={`text-xs font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>OR</span>
                    <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>

                  {/* Image URL Input */}
                  <input
                    type="text"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Or paste image URL here"
                  />

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className={`w-full h-48 object-contain rounded-lg border ${theme === 'dark'
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-white border-gray-300'
                          }`}
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

                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                    Upload an image (will be compressed to under 1MB) or paste a URL. Image will be displayed with full aspect ratio.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                      }`}>
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status || 'upcoming'}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                      }`}>
                      Event Type *
                    </label>
                    <select
                      name="eventType"
                      value={formData.eventType || 'other'}
                      onChange={handleChange}
                      required
                      className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        }`}
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
                  <div className={`border rounded-lg p-4 ${theme === 'dark'
                    ? 'border-neon-purple/30 bg-neon-purple/5'
                    : 'border-purple-300 bg-purple-50'
                    }`}>
                    <h4 className={`text-lg font-heading font-bold mb-3 ${theme === 'dark' ? 'text-neon-purple' : 'text-purple-700'
                      }`}>
                      Team Settings
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                          }`}>
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
                          className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                          }`}>
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
                          className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                            }`}
                        />
                      </div>
                    </div>
                    <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                      Teams must have between {formData.teamSettings?.minTeamSize || 1} and {formData.teamSettings?.maxTeamSize || 4} members
                    </p>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Max Attendees
                  </label>
                  <input
                    type="number"
                    name="maxAttendees"
                    value={formData.maxAttendees || ''}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={Array.isArray(formData.tags) ? formData.tags.join(', ') : (formData.tags || '')}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="e.g., Workshop, Technical, Coding, Web Development"
                  />
                  <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>Tags help categorize and filter events</p>
                </div>

                {/* Gallery Management Section */}
                <div className={`border-t pt-6 mt-6 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                  }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className={`block text-sm font-heading font-semibold mb-1 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                        }`}>
                        Event Gallery (Up to 20 images)
                      </label>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                        Add images to showcase this event. Images will be displayed in a lightbox gallery.
                      </p>
                    </div>
                    <span className={`text-sm font-body ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      {(formData.gallery || []).length}/20
                    </span>
                  </div>

                  {/* Add Image Form */}
                  <div className={`mb-4 p-4 rounded-lg border ${theme === 'dark'
                    ? 'bg-gray-900/50 border-gray-700'
                    : 'bg-gray-50 border-gray-300'
                    }`}>
                    <div className="space-y-3">
                      {/* Image Upload */}
                      <div>
                        <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${theme === 'dark'
                          ? 'bg-neon-purple/10 border-neon-purple/30 hover:bg-neon-purple/20'
                          : 'bg-purple-50 border-purple-300 hover:bg-purple-100'
                          }`}>
                          <Upload size={18} className={theme === 'dark' ? 'text-neon-purple' : 'text-purple-600'} />
                          <span className={`font-body font-semibold text-sm ${theme === 'dark' ? 'text-neon-purple' : 'text-purple-700'
                            }`}>
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
                        <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                          }`}></div>
                        <span className={`text-xs font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          }`}>OR</span>
                        <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                          }`}></div>
                      </div>

                      {/* URL Input */}
                      <div className="flex gap-2">
                        <input
                          type="url"
                          id="galleryImageUrl"
                          placeholder="Paste image URL"
                          className={`flex-1 px-3 py-2 border rounded-lg transition font-body text-sm focus:outline-none ${theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-purple'
                            : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                            }`}
                        />
                        <input
                          type="text"
                          id="galleryImageCaption"
                          placeholder="Caption (optional)"
                          className={`flex-1 px-3 py-2 border rounded-lg transition font-body text-sm focus:outline-none ${theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-purple'
                            : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
                            }`}
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
                          className={`px-4 py-2 border rounded-lg font-body text-sm transition-all whitespace-nowrap ${theme === 'dark'
                            ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/30 hover:bg-neon-purple/30'
                            : 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200'
                            }`}
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
                            className={`w-full h-full object-cover rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                              }`}
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
                    <div className={`text-center py-8 border-2 border-dashed rounded-lg ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
                      }`}>
                      <Image size={40} className={`mx-auto mb-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      <p className={`text-sm font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>No gallery images yet</p>
                      <p className={`text-xs font-body mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-500'
                        }`}>Upload or add image URLs above</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {type === 'member' && (
              <>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Enter member name"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Role *
                  </label>
                  <select
                    name="role"
                    value={formData.role || 'developer'}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
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
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    Member Image *
                  </label>

                  {/* Image Upload Button */}
                  <div className="mb-3">
                    <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${theme === 'dark'
                      ? 'bg-neon-blue/10 border-neon-blue/30 hover:bg-neon-blue/20'
                      : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                      }`}>
                      <Upload size={20} className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'} />
                      <span className={`font-body font-semibold ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                        }`}>
                        {uploadingImage ? 'Compressing...' : 'Upload Image (Auto-compress to less than 1MB)'}
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
                    <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                    <span className={`text-xs font-body ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>OR</span>
                    <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}></div>
                  </div>

                  {/* Image URL Input */}
                  <input
                    type="text"
                    name="image"
                    value={formData.image || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="Or paste image URL here"
                  />

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className={`w-full h-48 object-contain rounded-lg border ${theme === 'dark'
                          ? 'bg-gray-900 border-gray-700'
                          : 'bg-white border-gray-300'
                          }`}
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

                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                    Upload an image (compressed to less than 1MB) or paste a URL.
                  </p>
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    name="github"
                    value={formData.github || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                    }`}>
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      }`}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </>
            )}

            {type === 'testimonial' && (
              <div>
                <label className={`block text-sm font-heading font-semibold mb-2 ${theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                  }`}>
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status || 'pending'}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-lg transition font-body focus:outline-none ${theme === 'dark'
                    ? 'bg-gray-900/50 border-gray-700 text-white focus:border-neon-blue'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
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
                className={`flex-1 py-3 text-white font-body font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark'
                  ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg'
                  }`}
              >
                {loading ? 'Updating...' : `Update ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-3 font-body font-semibold rounded-xl transition-all ${theme === 'dark'
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
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


