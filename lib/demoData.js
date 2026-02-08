// Shared demo/fallback data for Vercel when DB is empty
export const aboutDemo = {
  whoWeAre: {
    title: 'Who We Are',
    description: 'Bodh Script Club is a vibrant community of tech enthusiasts, developers, and innovators dedicated to fostering a culture of learning and collaboration.'
  },
  whatWeDo: {
    title: 'What We Do',
    description: 'We organize workshops, hackathons, coding competitions, and tech talks to help students enhance their technical skills and stay updated with the latest technologies.'
  },
  ourMission: {
    title: 'Our Mission',
    description: 'To empower students with cutting-edge technical knowledge and practical skills, preparing them for successful careers in the tech industry.'
  },
  vision: {
    title: 'Our Vision',
    description: 'To become the leading tech community on campus, inspiring innovation and creating future tech leaders.',
    points: [
      { text: 'Foster a culture of continuous learning and innovation' },
      { text: 'Bridge the gap between academic knowledge and industry requirements' },
      { text: 'Create a supportive network of tech professionals and mentors' },
      { text: 'Promote open-source contribution and collaborative development' }
    ]
  },
  technologies: [
    { name: 'React', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', category: 'frontend' },
    { name: 'Node.js', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', category: 'backend' },
    { name: 'MongoDB', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg', category: 'backend' },
    { name: 'JavaScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', category: 'frontend' },
    { name: 'Git', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg', category: 'devops' },
  ],
  milestones: [
    { year: '2025', title: 'Founded', description: 'BodhScript Club was established.', order: 1 },
    { year: '2025', title: '10+ Members', description: 'Reached 10+ active developers.', order: 2 },
  ]
};
