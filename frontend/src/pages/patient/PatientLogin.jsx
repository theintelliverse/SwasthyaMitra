import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldCheck, Lock, Smartphone, ArrowRight, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config/runtime';

const PatientLogin = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    otp: ''
  });

  const normalizePhone = (value) => {
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length < 10) return null;
    return digits.slice(-10);
  };

  const backendSendOtp = async (cleanPhone) => {
    const apiUrl = `${API_BASE_URL}/api/auth/patient/send-otp`;
    const res = await axios.post(apiUrl, { phone: cleanPhone });
    if (!res.data?.success) {
      throw new Error('Failed to send OTP from backup service.');
    }
  };

  const completePatientSession = (responseData, fallbackPhone) => {
    sessionStorage.setItem('token', responseData.token);
    sessionStorage.setItem('role', 'patient');
    sessionStorage.setItem('userPhone', responseData.patient?.phone || fallbackPhone);

    localStorage.setItem('token', responseData.token);
    localStorage.setItem('role', 'patient');
    localStorage.setItem('userPhone', responseData.patient?.phone || fallbackPhone);

    const nameToStore = responseData.patient?.name || 'Valued Patient';
    sessionStorage.setItem('patientName', nameToStore);
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

    navigate('/patient/dashboard');
  };

  // Step 1: Request OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanPhone = normalizePhone(formData.phone);
      if (!cleanPhone) {
        Swal.fire('Error', 'Please enter a valid 10-digit mobile number.', 'error');
        return;
      }

      await backendSendOtp(cleanPhone);
      setFormData((prev) => ({ ...prev, phone: cleanPhone }));
      setStep(2);

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'OTP sent via backup service',
        showConfirmButton: false,
        timer: 3000,
        background: '#EEF6FA',
        color: '#0F766E'
      });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || err.message || 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP via backend
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiUrl = `${API_BASE_URL}/api/auth/patient/verify-locker`;
      const res = await axios.post(apiUrl, {
        phone: formData.phone,
        otp: formData.otp
      });

      if (res.data.success) {
        completePatientSession(res.data, formData.phone);
      }
    } catch (err) {
      // 🚨 FAILED VERIFICATION: Reset to Step 1
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: err.response?.data?.message || err.message || 'OTP verification failed.',
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