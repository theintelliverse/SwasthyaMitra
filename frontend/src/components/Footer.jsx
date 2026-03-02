import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-sandstone py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

        {/* Logo & Creator */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-marigold rounded flex items-center justify-center shadow-sm">
              <span className="text-white font-heading text-xs">A</span>
            </div>
            <span className="font-heading text-sm tracking-tight text-teak">
              Appointory
            </span>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.1em] text-khaki">
            Designed & Developed by <span className="text-marigold">The Intelliverse</span>
          </p>
        </div>

        {/* Copyright & Slogan */}
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-khaki mb-1">
            © 2026 Built for Bharat — Smart Healthcare
          </p>
          <div className="h-0.5 w-12 bg-marigold/20 mx-auto rounded-full"></div>
        </div>

        {/* Links */}
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-teak">
          <Link to="/privacy" className="hover:text-marigold transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-marigold transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-marigold transition-colors">Contact</Link>
        </div>

      </div>
    </footer>
  );
};

export default Footer;