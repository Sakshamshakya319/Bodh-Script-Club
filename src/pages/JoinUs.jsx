import { useState, useEffect } from 'react';
import { UserPlus, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { gsap } from 'gsap';
import Footer from '../components/Footer';
import { submissionsAPI } from '../utils/api';

const JoinUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    registrationNumber: '',
    phone: '',
    whatsapp: '',
    course: '',
    section: '',
    year: '',
    batch: '',
    github: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    gsap.fromTo('.form-container',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  useEffect(() => {
    if (sameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phone }));
    }
  }, [sameAsPhone, formData.phone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'phone' && sameAsPhone) {
      setFormData(prev => ({ ...prev, whatsapp: value }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setMessage({ type: 'error', text: 'Photo size must be less than 1MB' });
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('Starting form submission...');
      console.log('Form data:', formData);
      
      // Check if registration number already exists
      console.log('Checking registration number:', formData.registrationNumber);
      const { data: checkData } = await submissionsAPI.checkRegistration(formData.registrationNumber);
      console.log('Check result:', checkData);
      
      if (checkData.exists) {
        setMessage({ 
          type: 'error', 
          text: 'Registration number already exists. Each student can only submit once.' 
        });
        setLoading(false);
        return;
      }

      // Create FormData object
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) { // Only append non-empty values
          submitData.append(key, formData[key]);
        }
      });
      
      if (photo) {
        console.log('Appending photo:', photo.name, photo.size);
        submitData.append('photo', photo);
      }

      console.log('Submitting form data...');
      const response = await submissionsAPI.create(submitData);
      console.log('Submission response:', response);
      
      setMessage({ 
        type: 'success', 
        text: 'Application submitted successfully! We will review your application soon.' 
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        registrationNumber: '',
        phone: '',
        whatsapp: '',
        course: '',
        section: '',
        year: '',
        batch: '',
        github: '',
      });
      setPhoto(null);
      setPhotoPreview(null);
      setSameAsPhone(false);
      
      // Scroll to success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Submission error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message || errorMessage;
        console.error('Server error status:', error.response.status);
        console.error('Server error data:', error.response.data);
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
        console.error('No response received:', error.request);
      } else {
        // Error in request setup
        errorMessage = error.message || errorMessage;
        console.error('Request setup error:', error.message);
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const batchYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-neon-purple/10 via-transparent to-transparent"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-3 mb-6">            
            <h1 className="text-6xl md:text-8xl font-heading font-bold gradient-text animate-float">
              Join The Team
            </h1>
          </div>
          <p className="text-xl md:text-2xl font-body text-gray-400 max-w-2xl mx-auto">
            Become a part of Bodh Script Club and shape the future of technology
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto form-container">
          <div className="glass-effect rounded-3xl p-8 md:p-12">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="text-green-500" size={24} />
                ) : (
                  <AlertCircle className="text-red-500" size={24} />
                )}
                <p className={`font-body ${
                  message.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {message.text}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                  Registration Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300"
                  placeholder="Enter your registration number"
                />
                <p className="text-xs text-gray-500 mt-1 font-body">
                  Each registration number can only be used once
                </p>
              </div>

              {/* Phone and WhatsApp */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300"
                    placeholder="10-digit phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                    WhatsApp Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    required
                    disabled={sameAsPhone}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="WhatsApp number"
                  />
                </div>
              </div>

              {/* Same as Phone Checkbox */}
              <div className="flex items-center gap-3 p-4 bg-gray-900/30 rounded-xl border border-gray-800">
                <input
                  type="checkbox"
                  id="sameAsPhone"
                  checked={sameAsPhone}
                  onChange={(e) => setSameAsPhone(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-neon-cyan focus:ring-neon-cyan focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="sameAsPhone" className="text-sm font-body text-gray-300 cursor-pointer select-none">
                  WhatsApp number is same as phone number
                </label>
              </div>

              {/* Course, Section, Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                    Course <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300"
                    placeholder="e.g., B.Tech CSE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                    Section <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300"
                    placeholder="e.g., A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                    Year <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300 cursor-pointer"
                  >
                    <option value="" className="bg-gray-900 text-gray-400">Select</option>
                    <option value="1st" className="bg-gray-900 text-white">1st Year</option>
                    <option value="2nd" className="bg-gray-900 text-white">2nd Year</option>
                    <option value="3rd" className="bg-gray-900 text-white">3rd Year</option>
                    <option value="4th" className="bg-gray-900 text-white">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Batch */}
              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                  Batch Year <span className="text-red-400">*</span>
                </label>
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300 cursor-pointer"
                >
                  <option value="" className="bg-gray-900 text-gray-400">Select batch year</option>
                  {batchYears.map(year => (
                    <option key={year} value={year} className="bg-gray-900 text-white">{year}</option>
                  ))}
                </select>
              </div>

              {/* GitHub Link */}
              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                  GitHub Profile (Optional)
                </label>
                <input
                  type="url"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white font-body placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan focus:bg-gray-900/70 transition-all duration-300"
                  placeholder="https://github.com/username"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-body font-medium text-gray-300 mb-2">
                  Upload Photo (Max 1MB)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer group">
                    <div className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-gray-400 font-body hover:border-neon-cyan hover:bg-gray-900/70 transition-all duration-300 flex items-center justify-center gap-2">
                      <Upload size={20} className="group-hover:text-neon-cyan transition-colors" />
                      <span className="group-hover:text-white transition-colors">{photo ? photo.name : 'Choose a photo'}</span>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {photoPreview && (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-neon-cyan shadow-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2 font-body">
                  Accepted formats: JPEG, JPG, PNG, WEBP (Max size: 1MB)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink text-white font-heading font-bold text-lg rounded-xl hover:shadow-neon hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <span className="text-xl">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default JoinUs;
