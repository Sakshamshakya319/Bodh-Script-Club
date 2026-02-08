import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { Image as ImageIcon, Calendar, Tag, Play, Pause, ChevronLeft, ChevronRight, X } from 'lucide-react';
import Footer from '../components/Footer';
import LazyImage from '../components/LazyImage';
import { galleryAPI } from '../utils/api';

const Gallery = () => {
  const [galleries, setGalleries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, [selectedCategory]);

  useEffect(() => {
    if (galleries.length > 0) {
      gsap.fromTo('.gallery-item',
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)' }
      );
    }
  }, [galleries]);

  // Auto-play slideshow
  useEffect(() => {
    if (isPlaying && selectedGallery && selectedGallery.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => 
          prev === selectedGallery.images.length - 1 ? 0 : prev + 1
        );
      }, 3000); // Change image every 3 seconds

      return () => clearInterval(interval);
    }
  }, [isPlaying, selectedGallery, currentImageIndex]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedGallery) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedGallery]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (!selectedGallery) return;
      
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [selectedGallery, currentImageIndex, isPlaying]);

  const fetchGallery = async () => {
    try {
      const params = selectedCategory !== 'all' ? { category: selectedCategory } : {};
      const { data } = await galleryAPI.getAll(params);
      console.log('Gallery data received:', data);
      
      const list = Array.isArray(data) ? data : (data?.data ?? data?.gallery ?? []);
      console.log('Gallery list:', list);
      
      // Transform data to match component structure
      const transformedList = list.map(item => {
        // If images is array of strings, convert to array of objects
        const images = Array.isArray(item.images) 
          ? item.images.map((img, idx) => {
              if (typeof img === 'string') {
                return { url: img, caption: '', order: idx };
              }
              return img;
            })
          : [];
        
        return {
          ...item,
          images,
          coverImageIndex: 0 // Always use first image as cover
        };
      });
      
      console.log('Transformed gallery list:', transformedList);
      setGalleries(transformedList.length > 0 ? transformedList : demoGalleries);
    } catch (error) {
      console.error('Error fetching gallery:', error);
      setGalleries(demoGalleries);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'event', label: 'Events' },
    { id: 'workshop', label: 'Workshops' },
    { id: 'hackathon', label: 'Hackathons' },
    { id: 'meetup', label: 'Meetups' },
  ];

  const demoGalleries = [
    {
      _id: 1,
      eventName: 'Tech Summit 2024',
      eventDate: '2024-01-15',
      category: 'event',
      description: 'Annual tech summit with 500+ attendees showcasing latest innovations',
      coverImageIndex: 0,
      images: [
        { url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', caption: 'Opening ceremony', order: 0 },
        { url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800', caption: 'Keynote speaker', order: 1 },
        { url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800', caption: 'Panel discussion', order: 2 },
        { url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800', caption: 'Networking session', order: 3 },
        { url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800', caption: 'Award ceremony', order: 4 },
      ]
    },
    {
      _id: 2,
      eventName: 'React Workshop',
      eventDate: '2024-01-20',
      category: 'workshop',
      description: 'Hands-on React development workshop for beginners and intermediate developers',
      coverImageIndex: 0,
      images: [
        { url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800', caption: 'Workshop setup', order: 0 },
        { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800', caption: 'Coding session', order: 1 },
        { url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800', caption: 'Team collaboration', order: 2 },
      ]
    },
    {
      _id: 3,
      eventName: 'Hackathon Finals',
      eventDate: '2024-02-01',
      category: 'hackathon',
      description: '24-hour coding marathon with amazing projects and prizes',
      coverImageIndex: 0,
      images: [
        { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800', caption: 'Hackathon kickoff', order: 0 },
        { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', caption: 'Teams working', order: 1 },
        { url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800', caption: 'Project presentations', order: 2 },
        { url: 'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800', caption: 'Winners announced', order: 3 },
      ]
    },
  ];

  const openGallery = (gallery) => {
    setSelectedGallery(gallery);
    setCurrentImageIndex(0);
    setIsPlaying(false);
  };

  const closeModal = () => {
    setSelectedGallery(null);
    setCurrentImageIndex(0);
    setIsPlaying(false);
  };

  const handleNextImage = () => {
    if (!selectedGallery) return;
    setCurrentImageIndex((prev) => 
      prev === selectedGallery.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    if (!selectedGallery) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? selectedGallery.images.length - 1 : prev - 1
    );
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-body text-gray-400">Loading gallery...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-purple/10 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">          
              <h1 className="text-6xl md:text-8xl font-heading font-bold gradient-text">
                GALLERY
              </h1>
            </div>
            <p className="text-xl font-body text-gray-300 max-w-2xl mx-auto">
              Capturing moments of innovation, collaboration, and growth
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-xl font-body font-medium transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                    : 'glass-effect text-gray-300 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {galleries.length > 0 ? (
              galleries.map((gallery, idx) => {
                const images = gallery.images || [];
                const coverImage = images[gallery.coverImageIndex || 0]?.url || images[0]?.url || gallery.coverImage;
                const imageCount = images.length;
                
                return (
                  <div
                    key={gallery._id || idx}
                    className="gallery-item group relative overflow-hidden rounded-2xl cursor-pointer"
                    onClick={() => openGallery(gallery)}
                  >
                    <div className="aspect-square relative">
                      <LazyImage
                        src={coverImage}
                        alt={gallery.eventName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                          <Play size={32} className="text-white ml-1" />
                        </div>
                      </div>

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-xl font-heading font-bold mb-2 text-white">
                            {gallery.eventName}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {gallery.eventDate ? new Date(gallery.eventDate).toLocaleDateString() : 'No date'}
                            </span>
                            <span className="flex items-center gap-1">
                              <ImageIcon size={14} />
                              {imageCount} {imageCount === 1 ? 'photo' : 'photos'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="px-3 py-1 glass-effect rounded-full text-xs font-mono text-neon-cyan">
                          {gallery.category || 'event'}
                        </span>
                      </div>

                      {/* Image Count Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs font-mono text-white flex items-center gap-1">
                          <ImageIcon size={12} />
                          {imageCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20">
                <ImageIcon size={64} className="mx-auto text-gray-600 mb-4" />
                <p className="text-xl text-gray-400 font-body">No gallery items found</p>
                <p className="text-sm text-gray-500 font-body mt-2">Create gallery items in the Admin Panel</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Image Player Modal */}
      {selectedGallery && selectedGallery.images && selectedGallery.images.length > 0 && (
        <div
          className="fixed inset-0 z-[9997] bg-black/95 backdrop-blur-lg animate-fadeIn flex flex-col"
        >
          {/* Header with Controls */}
          <div className="flex items-center justify-between p-4 md:p-6 glass-effect">
            <div className="flex items-center gap-4">
              <button
                onClick={closeModal}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-all duration-300"
              >
                <X size={20} />
                <span className="font-body hidden sm:inline">Close</span>
              </button>
              
              {/* Play/Pause Button */}
              {selectedGallery.images.length > 1 && (
                <button
                  onClick={togglePlayPause}
                  className="px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg font-body font-semibold hover:scale-105 transition-all duration-300 flex items-center gap-2"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={18} />
                      <span className="hidden sm:inline">Pause</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      <span className="hidden sm:inline">Play</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="text-right">
              <h2 className="text-lg md:text-xl font-heading font-bold gradient-text">
                {selectedGallery.eventName}
              </h2>
              <p className="text-sm text-gray-400 font-body mt-1">
                {currentImageIndex + 1} / {selectedGallery.images.length}
              </p>
            </div>
          </div>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
            <div className="relative w-full max-w-6xl">
              {/* Main Image */}
              <LazyImage
                src={selectedGallery.images[currentImageIndex]?.url || selectedGallery.images[currentImageIndex]}
                alt={selectedGallery.images[currentImageIndex]?.caption || `Image ${currentImageIndex + 1}`}
                className="w-full h-auto max-h-[60vh] md:max-h-[70vh] object-contain rounded-2xl mx-auto"
              />
              
              {/* Image Caption */}
              {selectedGallery.images[currentImageIndex]?.caption && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 glass-effect rounded-xl max-w-2xl">
                  <p className="text-white font-body text-center text-sm md:text-base">
                    {selectedGallery.images[currentImageIndex].caption}
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              {selectedGallery.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full glass-effect flex items-center justify-center hover:bg-neon-blue/20 transition-all duration-300"
                  >
                    <ChevronLeft size={24} className="text-white" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full glass-effect flex items-center justify-center hover:bg-neon-blue/20 transition-all duration-300"
                  >
                    <ChevronRight size={24} className="text-white" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="p-4 md:p-6 glass-effect">
            <div className="max-w-6xl mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {selectedGallery.images.map((img, idx) => {
                  const imgUrl = typeof img === 'string' ? img : img.url;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentImageIndex(idx);
                        setIsPlaying(false);
                      }}
                      className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                        idx === currentImageIndex
                          ? 'border-neon-blue scale-110'
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <LazyImage
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>

              {/* Keyboard Hints */}
              <div className="text-center mt-3 text-xs text-gray-500 font-body">
                Use ← → arrow keys to navigate • Space to play/pause • ESC to close
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Gallery;
