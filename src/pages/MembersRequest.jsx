import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { UserPlus, Upload, X, CheckCircle, Github, Linkedin, Twitter, Info } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import Footer from '../components/Footer';
import { membersAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const MembersRequest = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    image: '',
    github: '',
    linkedin: '',
    twitter: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    gsap.fromTo('.request-form',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const options = {
        maxSizeMB: 0.5, // Compress to ~500KB
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // Convert to Base64
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, image: base64String }));
        setImagePreview(base64String);
        setUploadingImage(false);
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      setError('Failed to process image. Please try another one.');
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use image link if provided, otherwise use the uploaded image
      const dataToSubmit = {
        ...formData,
        image: imageUrl || formData.image
      };
      
      await membersAPI.request(dataToSubmit);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error submitting member request:', err);
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`min-h-screen pt-24 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center request-form">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500 mb-8">
            <CheckCircle size={48} />
          </div>
          <h1 className={`text-4xl md:text-5xl font-heading font-bold mb-6 ${
            theme === 'dark' ? 'gradient-text' : 'text-gray-900'
          }`}>
            Request Submitted!
          </h1>
          <p className={`text-xl font-body mb-8 ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Thank you for your interest in joining the Bodh Script Club team. 
            Your request has been sent to the administrators for review.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className={`px-8 py-3 rounded-xl font-body font-bold transition-all ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-neon'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
            }`}
          >
            Back to Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-24 ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 request-form">
          <div className="inline-flex items-center gap-3 mb-6">
            <UserPlus size={48} className={theme === 'dark' ? 'text-neon-blue' : 'text-blue-600'} />
            <h1 className={`text-5xl md:text-6xl font-heading font-bold ${
              theme === 'dark' ? 'gradient-text' : 'text-gray-900'
            }`}>
              Member Request
            </h1>
          </div>
          <p className={`text-xl font-body max-w-2xl mx-auto ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Apply to become an official member of Bodh Script Club. Fill in your details below to get started.
          </p>
        </div>

        {/* Form Container */}
        <div className={`request-form rounded-3xl p-8 md:p-12 border transition-all duration-500 ${
          theme === 'dark'
            ? 'glass-effect border-gray-800 hover:border-neon-blue/30 shadow-2xl'
            : 'bg-white border-gray-200 shadow-xl'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 flex items-center gap-3">
                <X size={20} />
                <p className="font-body text-sm font-semibold">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${
                    theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                  }`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl transition font-body focus:outline-none ${
                      theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${
                    theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                  }`}>
                    Brief Bio
                  </label>
                  <textarea
                    name="bio"
                    rows="4"
                    value={formData.bio}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl transition font-body focus:outline-none resize-none ${
                      theme === 'dark'
                        ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                    placeholder="Tell us a bit about yourself and your skills..."
                  ></textarea>
                </div>

                <div className="space-y-4">
                  <h3 className={`text-lg font-heading font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    Social Profiles
                  </h3>
                  
                  <div className="relative">
                    <Github className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl transition font-body focus:outline-none ${
                        theme === 'dark'
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="GitHub URL"
                    />
                  </div>

                  <div className="relative">
                    <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl transition font-body focus:outline-none ${
                        theme === 'dark'
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="LinkedIn URL"
                    />
                  </div>

                  <div className="relative">
                    <Twitter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl transition font-body focus:outline-none ${
                        theme === 'dark'
                          ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                      placeholder="Twitter URL"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Photo Upload */}
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-heading font-semibold mb-2 ${
                    theme === 'dark' ? 'text-neon-blue' : 'text-blue-700'
                  }`}>
                    Profile Photo *
                  </label>
                  
                  <div className="space-y-4">
                    {/* Image URL Input */}
                    <div>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl transition font-body focus:outline-none mb-2 ${
                          theme === 'dark'
                            ? 'bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-neon-blue'
                            : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500'
                        }`}
                        placeholder="Paste direct image link (optional)"
                      />
                      <p className={`text-[10px] font-body mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Upload your image to any site like <a href="https://postimages.org/" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">PostImages</a> or <a href="https://imgbb.com/" target="_blank" rel="noreferrer" className="underline hover:text-blue-500">ImgBB</a> and paste the <strong>direct image link</strong> here.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                      <span className="text-xs text-gray-500 uppercase font-heading">OR</span>
                      <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
                    </div>

                    {!imagePreview ? (
                      <label className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                        theme === 'dark'
                          ? 'bg-gray-900/30 border-gray-700 hover:border-neon-blue/50 hover:bg-gray-900/50'
                          : 'bg-gray-50 border-gray-300 hover:border-blue-500 hover:bg-gray-100'
                      }`}>
                        <div className="flex flex-col items-center p-6 text-center">
                          <div className={`p-4 rounded-full mb-4 ${
                            theme === 'dark' ? 'bg-neon-blue/10 text-neon-blue' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <Upload size={32} />
                          </div>
                          <p className={`font-body font-semibold mb-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {uploadingImage ? 'Processing...' : 'Upload Photo'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Max 1MB (Auto-compressed)
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                          required={!imageUrl}
                        />
                      </label>
                    ) : (
                      <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-neon-blue/30 group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    )}
                    
                    <div className={`p-4 rounded-xl flex gap-3 ${
                      theme === 'dark' ? 'bg-blue-500/5 border border-blue-500/20' : 'bg-blue-50 border border-blue-100'
                    }`}>
                      <Info size={20} className="text-blue-500 shrink-0" />
                      <p className={`text-xs font-body ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Your photo will be used on the official members page. Please use a professional-looking headshot.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading || uploadingImage}
                className={`w-full py-4 rounded-2xl font-body font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-neon-blue via-neon-purple to-neon-blue bg-[length:200%_auto] animate-gradient-x text-white hover:shadow-neon'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Submitting Request...</span>
                  </div>
                ) : (
                  'Submit Member Request'
                )}
              </button>
              <p className="text-center mt-4 text-xs text-gray-500 font-body">
                By submitting this form, you agree to be contacted by the Bodh Script Club team.
              </p>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MembersRequest;
