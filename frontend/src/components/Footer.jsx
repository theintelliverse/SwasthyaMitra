import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Activity } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full bg-[#1A3C34] text-white border-t border-teal-800/40 pt-16 pb-8 mt-auto relative overflow-hidden">
      {/* Visual Accent Glows */}
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-teal-800/40">
          
          {/* Column 1: Branding & Philosophy */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D9B6F] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <span className="text-white font-heading text-xl font-bold">A</span>
              </div>
              <div>
                <span className="font-heading text-xl font-black tracking-tight text-white block">
                  Appointory<span className="text-[#2D9B6F]">.</span>
                </span>
                <span className="text-[14px] font-black uppercase tracking-widest text-[#D4E4DF]/40 block mt-0.5">Healthcare OS for Bharat</span>
              </div>
            </div>
            <p className="text-[14px] text-[#D4E4DF]/70 font-medium leading-relaxed max-w-sm">
              Revolutionizing healthcare access with intelligent queue management, secure cloud prescriptions, 
              and a unified digital health vault. Experience seamless, wait-free clinical care.
            </p>
          </div>

          {/* Column 2: Digital Patient Portals */}
          <div className="space-y-4 col-span-1 md:pl-12">
            <h4 className="text-[14px] font-black uppercase text-[#2D9B6F] tracking-widest">
              Patient Services
            </h4>
            <ul className="space-y-2 text-[14px] font-semibold text-[#D4E4DF]/80">
              <li>
                <Link to="/patient/login" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-[14px]">•</span> Health Record Locker
                </Link>
              </li>
              <li>
                <Link to="/patient/checkin" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-[14px]">•</span> Contactless Check-In
                </Link>
              </li>
              <li>
                <Link to="/patient/register" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="text-[14px]">•</span> Setup Wellness Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Live Status */}
          <div className="space-y-4">
            <h4 className="text-[14px] font-black uppercase text-[#2D9B6F] tracking-widest">
              Security & Compliance
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 bg-teal-950/40 rounded-2xl border border-teal-800/30">
                <ShieldCheck size={18} className="text-[#2D9B6F]" />
                <div>
                  <p className="text-[14px] font-black uppercase text-white tracking-wider">HIPAA Secure Vault</p>
                  <p className="text-[14px] font-bold text-[#D4E4DF]/60 uppercase">OTP-Protected Healthcare Records</p>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 bg-teal-950/40 rounded-2xl border border-teal-800/30">
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-[#2D9B6F]" />
                  <span className="text-[14px] font-black uppercase tracking-wider">Real-time Node</span>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[14px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Metadata Section */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-[14px] font-bold uppercase tracking-[0.2em] text-[#D4E4DF]/50">
              © 2026 Appointory. All rights reserved.
            </p>
            <p className="text-[14px] font-black uppercase tracking-widest text-[#D4E4DF]/30 flex items-center gap-1">
              Developed by <span className="text-[#2D9B6F] font-black">The Intelliverse</span>
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex gap-8 text-[14px] font-black uppercase tracking-widest text-[#D4E4DF]/70">
            <Link to="/privacy" className="hover:text-white transition-all hover:scale-105">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-all hover:scale-105">Terms of Use</Link>
            <Link to="/contact" className="hover:text-white transition-all hover:scale-105">Support Hub</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;