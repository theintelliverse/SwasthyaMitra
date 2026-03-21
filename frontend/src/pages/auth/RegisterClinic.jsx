import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Footer from '../../components/Footer';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const RegisterClinic = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clinicName: '',
    clinicCode: '',
    address: '',
    contactPhone: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Password Match Validation
    if (formData.password !== formData.confirmPassword) {
      return Swal.fire({
        icon: 'error',
        title: '<span style="font-family: var(--font-heading)">Passwords Mismatch</span>',
        text: 'Please ensure both passwords are identical.',
        confirmButtonColor: '#0F766E',
        background: '#EEF6FA',
      });
    }

    setLoading(true);

    try {
      // 2. Backend API Call
      const response = await axios.post(`${API_URL}/api/auth/register-clinic`, formData);

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: '<span style="font-family: var(--font-heading)">Clinic Registered!</span>',
          html: `
            <div style="font-family: var(--font-body)">
              <p>Your unique code is: <b style="color: #1F6FB2">${response.data.clinicCode}</b></p>
              <p style="font-size: 0.8rem; margin-top: 10px;">Please use this code to log in to your portal.</p>
            </div>
          `,
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#1F6FB2',
          background: '#EEF6FA',
          color: '#0F766E',
          allowOutsideClick: false
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/login');
          }
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: '<span style="font-family: var(--font-heading)">Registration Failed</span>',
        text: error.response?.data?.message || 'Something went wrong. Please try again.',
        confirmButtonColor: '#0F766E',
        background: '#EEF6FA',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col items-center">
      <div className="flex-grow w-full max-w-7xl px-6 py-12 flex flex-col items-center">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-marigold rounded-xl flex items-center justify-center shadow-lg shadow-marigold/20 group-hover:rotate-12 transition-transform">
            <span className="text-white font-heading text-2xl">A</span>
          </div>
          <h1 className="font-heading text-2xl tracking-tight">Appointory</h1>
        </div>

        <div className="w-full max-w-5xl bg-white border border-sandstone rounded-[3rem] shadow-2xl shadow-teak/5 overflow-hidden grid lg:grid-cols-5">

          {/* Left Sidebar - Information */}
          <div className="lg:col-span-2 bg-teak p-10 lg:p-12 text-parchment flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-saffron/80">Onboarding</span>
              <h2 className="text-4xl font-heading mt-4 mb-6 leading-tight">Register Your <br />Medical Facility</h2>
              <p className="text-parchment/70 text-sm leading-relaxed mb-8 font-medium italic">
                "Modernizing Indian healthcare, one clinic at a time."
              </p>

              <ul className="space-y-4">
                {['Multi-role Staff Management', 'AI Wait-time Prediction', 'WhatsApp Notifications'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-semibold">
                    <div className="w-5 h-5 rounded-full bg-marigold flex items-center justify-center text-[10px] text-white">✓</div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 pt-12 border-t border-parchment/10">
              <p className="text-xs text-parchment/50 font-medium">Already registered?</p>
              <button
                onClick={() => navigate('/login')}
                className="text-saffron font-bold hover:text-white transition-colors mt-1"
              >
                Sign in to your portal
              </button>
            </div>
          </div>

          {/* Right Sidebar - Form */}
          <div className="lg:col-span-3 p-10 lg:p-16">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Section 1: Clinic Info */}
              <div className="space-y-5">
                <h3 className="text-xs font-black uppercase tracking-widest text-khaki border-b border-sandstone pb-2">Clinic Information</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Clinic Name</label>
                    <input
                      type="text" required placeholder="City Care Hospital"
                      className="w-full px-5 py-3 bg-parchment border border-sandstone rounded-xl focus:outline-none focus:border-marigold transition-all text-sm font-bold"
                      onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Clinic Code (Unique)</label>
                    <input
                      type="text" required placeholder="e.g. CITY01"
                      className="w-full px-5 py-3 bg-parchment border border-sandstone rounded-xl focus:outline-none focus:border-marigold transition-all text-sm font-bold uppercase"
                      onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Full Address</label>
                  <input
                    type="text" required placeholder="Street, Sector, City, State"
                    className="w-full px-5 py-3 bg-parchment border border-sandstone rounded-xl focus:outline-none focus:border-marigold transition-all text-sm font-medium"
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              {/* Section 2: Admin Info */}
              <div className="space-y-5 pt-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-khaki border-b border-sandstone pb-2">Admin Account</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Admin Name</label>
                    <input
                      type="text" required placeholder="Dr. Haraprasad"
                      className="w-full px-5 py-3 bg-parchment border border-sandstone rounded-xl focus:outline-none focus:border-marigold transition-all text-sm font-medium"
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Contact Phone</label>
                    <input
                      type="tel" required placeholder="+91 XXXXX XXXXX"
                      className="w-full px-5 py-3 bg-parchment border border-sandstone rounded-xl focus:outline-none focus:border-marigold transition-all text-sm font-medium"
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Admin Email</label>
                  <input
                    type="email" required placeholder="admin@clinic.com"
                    className="w-full px-5 py-3 bg-parchment border border-sandstone rounded-xl focus:outline-none focus:border-marigold transition-all text-sm font-medium"
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Password</label>
                    <input
                      type="password" required placeholder="••••••••"
                      className="w-full px-5 py-3 bg-parchment border border-sandstone rounded-xl focus:outline-none focus:border-marigold transition-all text-sm font-medium"
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2">Confirm Password</label>
                    <input
                      type="password" required placeholder="••••••••"
                      className="w-full px-5 py-3 bg-parchment border border-sandstone rounded-xl focus:outline-none focus:border-marigold transition-all text-sm font-medium"
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 bg-marigold text-white rounded-2xl font-bold text-lg shadow-xl shadow-marigold/20 transition-all transform hover:-translate-y-1 active:translate-y-0 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teak'}`}
              >
                {loading ? 'Processing Registration...' : 'Finalize Registration'}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterClinic;