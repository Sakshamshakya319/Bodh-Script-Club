import { useEffect, useState } from 'react';
import { Users, Github, Linkedin, Twitter } from 'lucide-react';
import { gsap } from 'gsap';
import Footer from '../components/Footer';
import LazyImage from '../components/LazyImage';
import { membersAPI } from '../utils/api';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length > 0) {
      gsap.fromTo('.member-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, [members, selectedRole]);

  const fetchMembers = async () => {
    try {
      const { data } = await membersAPI.getAll();
      const list = Array.isArray(data) ? data : (data?.data ?? data?.members ?? []);
      setMembers(list.length > 0 ? list : demoMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers(demoMembers);
    } finally {
      setLoading(false);
    }
  };

  const roleFilters = [
    { id: 'all', label: 'All Members' },
    { id: 'leadership', label: 'Leadership', roles: ['president', 'vice-president'] },
    { id: 'event-coordinator', label: 'Event Coordinators' },
    { id: 'developer', label: 'Developers', roles: ['technical-lead', 'developer'] },
    { id: 'creative', label: 'Creative Team', roles: ['designer', 'content-writer', 'social-media-manager'] },
  ];

  const getRoleDisplay = (role) => {
    const roleMap = {
      'president': 'President',
      'vice-president': 'Vice President',
      'event-coordinator': 'Event Coordinator',
      'technical-lead': 'Technical Lead',
      'developer': 'Developer',
      'designer': 'Designer',
      'content-writer': 'Content Writer',
      'social-media-manager': 'Social Media Manager',
      'other': 'Team Member'
    };
    return roleMap[role] || role;
  };

  const demoMembers = [
    {
      _id: 1,
      name: 'Bharat Kumar',
      role: 'president',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      order: 1
    },
    {
      _id: 2,
      name: 'Vikram Malhotra',
      role: 'vice-president',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      order: 2
    },
    {
      _id: 3,
      name: 'Harshika Sharma',
      role: 'event-coordinator',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      linkedin: 'https://linkedin.com',
      order: 3
    },
    {
      _id: 4,
      name: 'Deepak Sodhi',
      role: 'event-coordinator',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      order: 4
    },
    {
      _id: 5,
      name: 'Priya Verma',
      role: 'technical-lead',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      order: 5
    },
    {
      _id: 6,
      name: 'Rahul Singh',
      role: 'developer',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      order: 6
    },
    {
      _id: 7,
      name: 'Arjun Patel',
      role: 'developer',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      order: 7
    },
    {
      _id: 8,
      name: 'Aditya Sharma',
      role: 'developer',
      image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      order: 8
    },
    {
      _id: 9,
      name: 'Ananya Gupta',
      role: 'designer',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      order: 9
    },
    {
      _id: 10,
      name: 'Riya Kapoor',
      role: 'designer',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
      linkedin: 'https://linkedin.com',
      order: 10
    },
    {
      _id: 11,
      name: 'Sneha Reddy',
      role: 'content-writer',
      image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
      linkedin: 'https://linkedin.com',
      order: 11
    },
    {
      _id: 12,
      name: 'Kavya Nair',
      role: 'social-media-manager',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      order: 12
    },
  ];

  const getFilteredMembers = () => {
    if (selectedRole === 'all') {
      return members;
    }
    
    const filter = roleFilters.find(f => f.id === selectedRole);
    if (filter?.roles) {
      return members.filter(m => filter.roles.includes(m.role));
    }
    
    return members.filter(m => m.role === selectedRole);
  };

  const filteredMembers = getFilteredMembers();

  // Group members by role for better organization
  const groupedMembers = {
    leadership: filteredMembers.filter(m => ['president', 'vice-president'].includes(m.role)),
    coordinators: filteredMembers.filter(m => m.role === 'event-coordinator'),
    technical: filteredMembers.filter(m => ['technical-lead', 'developer'].includes(m.role)),
    creative: filteredMembers.filter(m => ['designer', 'content-writer', 'social-media-manager'].includes(m.role)),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-2xl font-body text-gray-400">Loading team members...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-blue/10 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 mb-6">
            
            <h1 className="text-6xl md:text-8xl font-heading font-bold gradient-text animate-float">
              Meet The Team
            </h1>
          </div>
          <p className="text-xl md:text-2xl font-body text-gray-400 max-w-3xl mx-auto">
            The passionate individuals driving innovation and excellence
          </p>
        </div>
      </section>

      {/* Role Filter */}
      <section className="px-4 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {roleFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedRole(filter.id)}
                className={`px-6 py-3 rounded-xl font-body font-medium transition-all duration-300 ${
                  selectedRole === filter.id
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                    : 'glass-effect text-gray-300 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Members Grid - Organized by Role */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-16">
          {selectedRole === 'all' ? (
            <>
              {/* Leadership */}
              {groupedMembers.leadership.length > 0 && (
                <div>
                  <h2 className="text-4xl font-heading font-bold gradient-text mb-8 text-center">
                    Leadership
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {groupedMembers.leadership.map((member) => (
                      <MemberCard key={member._id} member={member} getRoleDisplay={getRoleDisplay} />
                    ))}
                  </div>
                </div>
              )}

              {/* Event Coordinators */}
              {groupedMembers.coordinators.length > 0 && (
                <div>
                  <h2 className="text-4xl font-heading font-bold gradient-text mb-8 text-center">
                    Event Coordinators
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {groupedMembers.coordinators.map((member) => (
                      <MemberCard key={member._id} member={member} getRoleDisplay={getRoleDisplay} />
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Team */}
              {groupedMembers.technical.length > 0 && (
                <div>
                  <h2 className="text-4xl font-heading font-bold gradient-text mb-8 text-center">
                    Technical Team
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {groupedMembers.technical.map((member) => (
                      <MemberCard key={member._id} member={member} getRoleDisplay={getRoleDisplay} />
                    ))}
                  </div>
                </div>
              )}

              {/* Creative Team */}
              {groupedMembers.creative.length > 0 && (
                <div>
                  <h2 className="text-4xl font-heading font-bold gradient-text mb-8 text-center">
                    Creative Team
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {groupedMembers.creative.map((member) => (
                      <MemberCard key={member._id} member={member} getRoleDisplay={getRoleDisplay} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredMembers.map((member) => (
                <MemberCard key={member._id} member={member} getRoleDisplay={getRoleDisplay} />
              ))}
            </div>
          )}

          {filteredMembers.length === 0 && (
            <div className="text-center py-20">
              <p className="text-xl font-body text-gray-400">No members found with this role.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

const MemberCard = ({ member, getRoleDisplay }) => {
  return (
    <div className="member-card group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer">
      {/* Member Image */}
      <LazyImage
        src={member.image || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400'}
        alt={member.name}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      {/* Gradient Overlay - Always visible on mobile, hover on desktop */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Name and Role */}
          <h3 className="text-2xl font-heading font-bold text-white mb-2">
            {member.name}
          </h3>
          <p className="text-neon-cyan font-body text-sm mb-4">
            {getRoleDisplay(member.role)}
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            {member.github && (
              <a
                href={member.github}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full glass-effect flex items-center justify-center hover:bg-neon-blue/20 transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <Github size={18} className="text-white" />
              </a>
            )}
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full glass-effect flex items-center justify-center hover:bg-neon-blue/20 transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <Linkedin size={18} className="text-white" />
              </a>
            )}
            {member.twitter && (
              <a
                href={member.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full glass-effect flex items-center justify-center hover:bg-neon-blue/20 transition-all duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                <Twitter size={18} className="text-white" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="absolute top-4 right-4">
        <span className="px-3 py-1 glass-effect rounded-full text-xs font-mono text-neon-purple">
          {getRoleDisplay(member.role)}
        </span>
      </div>
    </div>
  );
};

export default Members;
