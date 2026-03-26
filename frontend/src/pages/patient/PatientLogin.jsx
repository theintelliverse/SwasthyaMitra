import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldCheck, Lock, Smartphone, ArrowRight, RefreshCw, Eye, EyeOff } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const PatientLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Phone, 2: Password
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });

  // Step 1: Verify Phone Number
  const handlePhoneSubmit = (e) => {
    e.preventDefault();

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

    // Move to password step without OTP
    setStep(2);
  };

  // Step 2: Login with Password
  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    if (!formData.password || formData.password.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Password',
        text: 'Password must be at least 6 characters',
        confirmButtonColor: '#FF6B6B',
        background: '#FFF5F5',
        color: '#C92A2A'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/patient/login-with-password`, {
        phone: formData.phone,
        password: formData.password
      });

      if (res.data.success) {
        // Save authentication token
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', 'patient');
        localStorage.setItem('patientName', res.data.patient?.name || 'Valued Patient');

        Swal.fire({
          icon: 'success',
          title: '🔐 Welcome Back!',
          html: `<p>Hello, <strong>${res.data.patient?.name}</strong>!</p><p style="font-size: 12px; color: #666; margin-top: 10px;">Accessing your health locker...</p>`,
          timer: 1500,
          showConfirmButton: false,
          background: '#EEF6FA',
          color: '#0F766E',
          didOpen: () => {
            playSuccessSound();
          }
        });

        setTimeout(() => {
          navigate('/patient/dashboard');
        }, 500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Invalid password. Please try again.';
      Swal.fire({
        icon: 'error',
        title: '❌ Login Failed',
        text: errorMessage,
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#FF6B6B',
        background: '#FFF5F5',
        color: '#C92A2A'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment text-teak flex flex-col items-center justify-center p-6 font-body">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10 border border-sandstone/50 relative overflow-hidden">

        {/* Decorative Accent */}
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

        {/* Step 1: Phone Number */}
        {step === 1 ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Mobile Number</label>
              <div className="relative">
                <Smartphone size={18} className="absolute left-5 top-4.5 text-khaki" />
                <input
                  type="tel"
                  required
                  placeholder="91XXXXXXXXXX"
                  className="w-full pl-14 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <p className="text-[9px] text-khaki/70 ml-2 mt-2">Step 1 of 2</p>
            </div>

            <button
              disabled={loading}
              className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-saffron transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={18} />
            </button>

            <div className="text-center space-y-2">
              <p className="text-[9px] text-khaki/70">
                <button
                  type="button"
                  onClick={() => navigate('/patient/forgot-password')}
                  className="text-khaki hover:text-marigold font-bold uppercase tracking-widest transition-colors"
                >
                  Forgot Password?
                </button>
              </p>
            </div>
          </form>
        ) : (
          // Step 2: Password Entry
          <form onSubmit={handlePasswordLogin} className="space-y-6 animate-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-6">
              <p className="text-xs text-khaki">Signing in as</p>
              <p className="font-bold text-teak text-lg">{formData.phone}</p>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setFormData({ ...formData, password: '' });
                }}
                className="text-[9px] text-marigold font-black uppercase mt-2 hover:underline"
              >
                Use Different Number
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-5 top-4.5 text-khaki" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-14 pr-14 py-4 bg-parchment border border-sandstone/60 rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-4.5 text-khaki hover:text-marigold transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[9px] text-khaki/70 ml-2 mt-2">Step 2 of 2 • Min 6 characters</p>
            </div>

            <button
              disabled={loading}
              className="w-full py-5 bg-saffron text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl hover:bg-marigold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <>Unlock Vault <ShieldCheck size={18} /></>}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/patient/forgot-password')}
                className="text-[9px] text-khaki hover:text-marigold font-bold uppercase tracking-widest transition-colors"
              >
                Wrong Password?
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-10 pt-8 border-t border-sandstone/50 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-khaki/70 tracking-tighter">
            <ShieldCheck size={12} /> Privacy Protected by Appointory
          </div>
          <div className="space-y-2 text-center w-full">
            <button onClick={() => navigate('/')} className="text-[10px] font-bold text-khaki hover:text-teak block w-full">
              Back to Tracker
            </button>
            <div className="text-[9px] text-khaki">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/patient/register')}
                className="font-bold text-marigold hover:text-saffron transition-colors"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// SUCCESS SOUND
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(600, now + 0.15);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (error) {
    console.warn('Sound unavailable:', error);
  }
};

export default PatientLogin;