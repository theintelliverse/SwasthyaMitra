import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col">
      <div className="flex-grow flex flex-col justify-center items-center px-6 text-center">

        {/* Visual Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-saffron/20 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-5xl">🔐</span>
          </div>
          <div className="absolute -top-2 -right-2 bg-marigold text-white w-8 h-8 rounded-full flex items-center justify-center font-bold border-4 border-parchment">
            !
          </div>
        </div>

        {/* Text Content */}
        <h2 className="text-4xl font-heading mb-4 leading-tight">
          Access Restricted
        </h2>
        <p className="text-khaki max-w-md mx-auto mb-10 font-medium leading-relaxed">
          It looks like you don't have the necessary permissions to view this section of the
          <span className="text-teak font-bold"> Appointory</span> portal.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate(-1)} // Go back to previous page
            className="px-8 py-3 bg-white border-2 border-sandstone rounded-2xl font-bold hover:border-teak transition-all active:scale-95"
          >
            Go Back
          </button>

          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-teak text-parchment rounded-2xl font-bold hover:bg-marigold transition-all shadow-lg active:scale-95"
          >
            Return to Home
          </button>
        </div>

        {/* Help Note */}
        <p className="mt-12 text-[10px] font-black uppercase tracking-[0.2em] text-khaki/50">
          Security Protocol: Multi-Tenant Role Isolation Active
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Unauthorized;