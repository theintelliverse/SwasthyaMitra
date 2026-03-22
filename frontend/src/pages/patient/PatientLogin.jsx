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

    // ✅ Validate phone number
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Phone',
        text: 'Please enter a valid 10-digit phone number',
        confirmButtonColor: '#FF6B6B',
        background: '#FFF5F5',
        color: '#C92A2A'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/patient/send-otp`, {
        phone: formData.phone
      });

      if (res.data.success) {
        setStep(2);

        // ✅ Show OTP in dev mode if available
        const devOtp = res.data.debugOtp ? ` (Dev OTP: ${res.data.debugOtp})` : '';

        Swal.fire({
          icon: 'success',
          title: '📱 OTP Sent!',
          html: `<p>${res.data.message}</p><p style="font-size: 12px; color: #666; margin-top: 10px;">${devOtp}</p>`,
          confirmButtonText: 'OK',
          background: '#EEF6FA',
          color: '#0F766E',
          confirmButtonColor: '#FFA800',
          allowOutsideClick: false
        });
      } else {
        throw new Error(res.data.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('OTP Send Error:', err);

      // ✅ Show dev OTP if available
      const devOtp = err.response?.data?.debugOtp ? `<br/><br/><small><strong>Dev OTP:</strong> ${err.response.data.debugOtp}</small>` : '';

      Swal.fire({
        icon: 'error',
        title: '❌ Failed to Send OTP',
        html: `<p>${err.response?.data?.message || 'Unable to send OTP. Please check your phone number and try again.'}</p>${devOtp}`,
        confirmButtonColor: '#FF6B6B',
        background: '#FFF5F5',
        color: '#C92A2A'
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP for Locker Access
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    // ✅ Validate OTP
    const cleanOtp = formData.otp.replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length !== 6) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid OTP',
        text: 'Please enter a valid 6-digit OTP',
        confirmButtonColor: '#FF6B6B',
        background: '#FFF5F5',
        color: '#C92A2A'
      });
      return;
    }

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
          title: '🔐 Vault Unlocked!',
          html: `<p>Namaste, <strong>${nameToStore}</strong>!</p><p style="font-size: 12px; color: #666; margin-top: 10px;">Redirecting to your health locker...</p>`,
          timer: 1500,
          showConfirmButton: false,
          background: '#EEF6FA',
          color: '#0F766E',
          didOpen: () => {
            // 🔊 Play success sound using Web Audio API
            playSuccessSound();
          }
        });

        // 🚀 Redirect to the Patient Dashboard after a short delay
        setTimeout(() => {
          navigate('/patient/dashboard');
        }, 500);
      } else {
        throw new Error(res.data.message || 'Verification failed');
      }
    } catch (err) {
      console.error('OTP Verification Error:', err);

      // 🚨 FAILED VERIFICATION: Show detailed error
      const errorMessage = err.response?.data?.message || 'Invalid OTP. Please try again.';

      Swal.fire({
        icon: 'error',
        title: '❌ Access Denied',
        html: `<p>${errorMessage}</p><p style="font-size: 12px; color: #666; margin-top: 10px;">Please check your OTP and try again.</p>`,
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#FF6B6B',
        background: '#FFF5F5',
        color: '#C92A2A',
        allowOutsideClick: false
      }).then(() => {
        // Reset OTP field but keep phone for retry
        setFormData({ ...formData, otp: '' });
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

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigate('/patient/forgot-password')}
                className="text-xs text-khaki hover:text-marigold font-bold uppercase tracking-widest transition-colors"
              >
                Can't Access Account?
              </button>
            </div>
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
          <div className="space-y-2 text-center w-full">
            <button onClick={() => navigate('/')} className="text-[10px] font-bold text-khaki hover:text-teak block w-full">
              Back to Tracker
            </button>
            <div className="text-[9px] text-khaki">
              New to Appointory?{' '}
              <button
                onClick={() => navigate('/patient/register')}
                className="font-bold text-marigold hover:text-saffron transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔊 SUCCESS SOUND GENERATOR using Web Audio API
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;

    // Create oscillator for a pleasant beep
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    // Play two tones for a success "ding-ding" effect
    osc.frequency.setValueAtTime(800, now); // Higher frequency
    osc.frequency.setValueAtTime(600, now + 0.15); // Lower frequency

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);

    console.log('✅ Success sound played');
  } catch (error) {
    console.warn('🔊 Sound playback unavailable (might be blocked by browser):', error);
  }
};

export default PatientLogin;