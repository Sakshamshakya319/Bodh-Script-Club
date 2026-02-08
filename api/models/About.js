import mongoose from 'mongoose';

const aboutSchema = new mongoose.Schema({
  // First Component - Info Cards
  whoWeAre: {
    title: { type: String, default: 'Who We Are' },
    description: { type: String, default: 'Bodh Script Club is a vibrant community of tech enthusiasts, developers, and innovators dedicated to fostering a culture of learning and collaboration.' }
  },
  whatWeDo: {
    title: { type: String, default: 'What We Do' },
    description: { type: String, default: 'We organize workshops, hackathons, coding competitions, and tech talks to help students enhance their technical skills and stay updated with the latest technologies.' }
  },
  ourMission: {
    title: { type: String, default: 'Our Mission' },
    description: { type: String, default: 'To empower students with cutting-edge technical knowledge and practical skills, preparing them for successful careers in the tech industry.' }
  },
  
  // Second Component - Vision
  vision: {
    title: { type: String, default: 'Our Vision' },
    description: { type: String, default: 'To become the leading tech community on campus, inspiring innovation and creating future tech leaders who will shape the digital world.' },
    points: [{
      text: { type: String }
    }]
  },
  
  // Third Component - Technologies
  technologies: [{
    name: { type: String, required: true },
    logo: { type: String, required: true }, // URL to logo image
    category: { type: String, enum: ['frontend', 'backend', 'mobile', 'ai-ml', 'devops', 'other'], default: 'other' }
  }],
  
  // Milestones Timeline
  milestones: [{
    year: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, default: 0 }
  }],
  
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('About', aboutSchema);
