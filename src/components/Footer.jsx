import { Github, Linkedin, Twitter, Mail, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="glass-effect border-t border-gray-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/logo.png" 
                alt="Bodh Script Club Logo" 
                className="h-12 w-12 object-contain"
              />
              <h3 className="text-3xl font-heading font-bold gradient-text">BODH SCRIPT CLUB</h3>
            </div>
            <p className="font-body text-gray-400 leading-relaxed">
              Empowering students through code, creativity, and collaboration. Join us in shaping the future of technology.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-heading font-semibold mb-4 text-neon-blue">Quick Links</h4>
            <ul className="space-y-3 font-body text-gray-400">
              <li><a href="/about" className="hover:text-neon-blue transition">About Us</a></li>
              <li><a href="/events" className="hover:text-neon-blue transition">Events</a></li>
              <li><a href="/gallery" className="hover:text-neon-blue transition">Gallery</a></li>
              <li><a href="/members" className="hover:text-neon-blue transition">Team</a></li>
              <li><a href="/join" className="hover:text-neon-blue transition">Join Us</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-heading font-semibold mb-4 text-neon-blue">Connect With Us</h4>
            <div className="flex space-x-4 mb-6">
              {[
                { icon: <Github size={24} />, href: '#' },
                { icon: <Linkedin size={24} />, href: '#' },
                { icon: <Twitter size={24} />, href: '#' },
                { icon: <Instagram size={24} />, href: '#' },
                { icon: <Mail size={24} />, href: '#' },
              ].map((social, idx) => (
                <a 
                  key={idx}
                  href={social.href} 
                  className="text-gray-400 hover:text-neon-blue transition-all hover:scale-110"
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <p className="font-mono text-sm text-gray-500">
              contact@bodhscript.club
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="font-body text-gray-400">
            &copy; 2024 Bodh Script Club. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
