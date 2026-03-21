import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldCheck, Lock, Smartphone, ArrowRight, RefreshCw } from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const PatientLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    otp: ''
  });

  // Step 1: Request OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/patient/send-otp`, {
        phone: formData.phone
      });
      if (res.data.success) {
        setStep(2);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'OTP sent to your server console',
          showConfirmButton: false,
          timer: 3000,
          background: '#EEF6FA',
          color: '#0F766E'
        });
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP for Locker Access
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Hits the dedicated locker verification route
      const res = await axios.post(`${API_URL}/api/auth/patient/verify-locker`, {
        phone: formData.phone,
        otp: formData.otp
      });

      if (res.data.success) {
        // --- 🔐 SESSION MANAGEMENT ---
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', 'patient');

        // Ensure we save the name correctly for the Dashboard Welcome Banner
        const nameToStore = res.data.patient?.name || 'Valued Patient';
        localStorage.setItem('patientName', nameToStore);

        Swal.fire({
          icon: 'success',
          title: 'Vault Unlocked',
          text: `Namaste, ${nameToStore}`,
          timer: 1500,
          showConfirmButton: false,
          background: '#EEF6FA',
          color: '#0F766E'
        });

        // 🚀 Redirect to the Patient Dashboard
        navigate('/patient/dashboard');
      }
    } catch (err) {
      // 🚨 FAILED VERIFICATION: Reset to Step 1
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: err.response?.data?.message || 'Invalid OTP. Please try again.',
        confirmButtonColor: '#1F6FB2',
        background: '#EEF6FA',
        color: '#0F766E'
      }).then(() => {
        setFormData({ ...formData, otp: '' });
        setStep(1); // Kick back to phone entry on failure
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment text-teak flex flex-col items-center justify-center p-6 font-body">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10 border border-sandstone/50 relative overflow-hidden">

        {/* Morning Marigold Decorative Accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-marigold/5 rounded-full"></div>

        <header className="text-center mb-10">
          <div className="w-16 h-16 bg-marigold rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-marigold/20 text-white">
            <Lock size={28} />
          </div>
          <h1 className="text-2xl font-heading text-teak">Health Locker</h1>
          <p className="text-khaki text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Secure Patient Access
          </p>
        </header>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Mobile Number</label>
              <div className="relative">
                <Smartphone size={18} className="absolute left-5 top-4.5 text-khaki" />
                <input
                  type="tel" required placeholder="91XXXXXXXXXX"
                  className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-saffron transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Request OTP <ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center">
              <p className="text-xs text-khaki">Verifying records for</p>
              <p className="font-bold text-teak">{formData.phone}</p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[9px] text-marigold font-black uppercase mt-1 hover:underline"
              >
                Change Number
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-khaki text-center block tracking-widest">6-Digit Access Code</label>
              <input
                type="text" required placeholder="0 0 0 0 0 0" maxLength="6"
                className="w-full py-6 bg-parchment border-2 border-sandstone rounded-[2rem] outline-none focus:border-marigold font-heading text-4xl text-center tracking-[0.3em] text-teak"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                autoFocus
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-5 bg-saffron text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-marigold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Unlock Vault <ShieldCheck size={18} /></>}
            </button>
          </form>
        )}

        <div className="mt-10 pt-8 border-t border-sandstone/50 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-khaki/70 tracking-tighter">
            <ShieldCheck size={12} /> Privacy Protected by Appointory
          </div>
          <button onClick={() => navigate('/')} className="text-[10px] font-bold text-khaki hover:text-teak">
            Back to Tracker
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientLogin;