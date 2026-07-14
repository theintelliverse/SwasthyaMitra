import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldCheck, Mail, LockKeyhole, Hash, RefreshCw, ArrowRight, Activity, AlertCircle, X, Wifi, WifiOff } from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

import { API_URL } from '../../config/runtime';

const Login = () => {
  const [formData, setFormData] = useState({
    clinicCode: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loginError, setLoginError] = useState(null); // { message, type: 'credentials' | 'network' | 'server' }
  const navigate = useNavigate();

  const clearError = () => setLoginError(null);

  const handleInputChange = (field, value) => {
    if (loginError) clearError();
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();

    try {
      console.log('📡 Attempting login with:', { ...formData, password: '***' });
      const response = await axios.post(`${API_URL}/api/auth/login`, formData);

      if (response.data.success) {
        const { token, user, sessionId } = response.data;

        // 🔑 CORE AUTH DATA
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userName', user.name);
        if (user.specialization) localStorage.setItem('specialization', user.specialization);
        if (user.education) localStorage.setItem('education', user.education);
        localStorage.setItem('sessionId', sessionId);

        // 🏥 CLINIC DATA (Crucial for WebSockets)
        localStorage.setItem('clinicId', user.clinicId);
        localStorage.setItem('clinicName', user.clinicName || 'Our Clinic');
        localStorage.setItem('clinicCode', formData.clinicCode.toUpperCase());
        if (user.clinicLocation) localStorage.setItem('clinicLocation', user.clinicLocation);
        if (user.clinicContact) localStorage.setItem('clinicContact', user.clinicContact);

        Swal.fire({
          icon: 'success',
          title: `<span style="font-family: inherit">Welcome, ${user.name}</span>`,
          text: `Accessing ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard...`,
          timer: 1500,
          showConfirmButton: false,
          background: '#FFFFFF',
          color: '#1A3C34',
          customClass: {
            popup: 'rounded-[2rem] border border-sandstone'
          }
        });

        setTimeout(() => {
          switch (user.role) {
            case 'admin': navigate('/admin/dashboard'); break;
            case 'doctor': navigate('/doctor/dashboard'); break;
            case 'receptionist': navigate('/receptionist/dashboard'); break;
            case 'lab': navigate('/lab/dashboard'); break;
            default: navigate('/');
          }
        }, 1500);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      if (!error.response) {
        // Network error — server unreachable
        setLoginError({
          type: 'network',
          message: 'Cannot reach the server. Check your connection or ensure the backend is running.'
        });
      } else if (status === 401 || status === 403) {
        setLoginError({
          type: 'credentials',
          message: serverMessage || 'Invalid email, clinic code, or password. Please try again.'
        });
      } else if (status === 429) {
        setLoginError({
          type: 'server',
          message: 'Too many login attempts. Please wait a moment before trying again.'
        });
      } else {
        setLoginError({
          type: 'server',
          message: serverMessage || 'Something went wrong on our end. Please try again shortly.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col relative overflow-hidden">
      <SEO
        title="Login"
        description="Login to your Appointory clinic account to manage queues, patient records, and lab referrals."
        url="/login"
      />
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] bg-marigold/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] bg-saffron/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="flex-grow flex flex-col justify-center items-center px-6 py-6 relative z-10">

        {/* Brand Header */}
        <div
          className="flex items-center gap-4 mb-6 cursor-pointer group transition-all duration-500 hover:opacity-80"
          onClick={() => navigate('/')}
        >
          <div className="w-14 h-14 bg-gradient-to-br from-marigold to-saffron rounded-2xl flex items-center justify-center shadow-2xl shadow-marigold/30 group-hover:rotate-[10deg] transition-all duration-500">
            <Activity className="text-white" size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight leading-none text-teak">Appointory</h1>
            <p className="text-[14px] font-bold uppercase tracking-[0.4em] text-khaki mt-1.5 opacity-70">Healthcare Clinical OS</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(26,60,52,0.08)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-marigold/20 via-marigold to-marigold/20"></div>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-heading font-bold mb-2 text-teak">Clinic Portal</h2>
              <p className="text-sm text-khaki font-medium mb-3">Authenticate to access your facility dashboard</p>
              
              {/* Visual Role Badges */}
              <div className="flex justify-center gap-1.5 mt-2">
                <span className="px-2.5 py-0.5 bg-teal-50 text-teal-600 border border-teal-100 rounded-full text-[10px] font-black uppercase tracking-wider">Admin</span>
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-wider">Doctor</span>
                <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-wider">Receptionist</span>
              </div>
            </div>

            {/* Inline Error Banner */}
            {loginError && (
              <div
                className={`mb-6 flex items-start gap-4 p-5 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300 ${loginError.type === 'network'
                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : 'bg-red-50 border-red-200 text-red-800'
                  }`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${loginError.type === 'network' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                  }`}>
                  {loginError.type === 'network'
                    ? <WifiOff size={18} />
                    : <AlertCircle size={18} />}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-[14px] font-black uppercase tracking-widest mb-1 opacity-70">
                    {loginError.type === 'network' ? 'Connection Error' :
                      loginError.type === 'credentials' ? 'Authentication Failed' : 'Server Error'}
                  </p>
                  <p className="text-sm font-medium leading-relaxed">{loginError.message}</p>
                </div>
                <button
                  type="button"
                  onClick={clearError}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Clinic Code */}
              <div className="space-y-2 group/field">
                <label className={`text-[14px] font-bold uppercase tracking-widest ml-4 transition-colors duration-300 ${focusedField === 'clinicCode' ? 'text-marigold' : 'text-khaki/60'}`}>
                  Clinic Identification Code
                </label>
                <div className={`relative transition-all duration-300 transform ${focusedField === 'clinicCode' ? 'scale-[1.02]' : ''}`}>
                  <Hash className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'clinicCode' ? 'text-marigold' : 'text-khaki/40'}`} size={18} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. CITY01"
                    autoComplete="off"
                    className={`w-full pl-12 pr-6 py-3 bg-parchment/50 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-bold placeholder:text-khaki/30 uppercase text-teak ${loginError?.type === 'credentials' ? 'border-red-300 focus:border-red-400 focus:ring-red-500/5' : 'border-sandstone focus:border-marigold focus:ring-marigold/5'
                      }`}
                    value={formData.clinicCode}
                    onFocus={() => setFocusedField('clinicCode')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => handleInputChange('clinicCode', e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2 group/field">
                <label className={`text-[14px] font-bold uppercase tracking-widest ml-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-marigold' : 'text-khaki/60'}`}>
                  Authorized Email Address
                </label>
                <div className={`relative transition-all duration-300 transform ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'email' ? 'text-marigold' : 'text-khaki/40'}`} size={18} />
                  <input
                    type="email"
                    required
                    placeholder="name@clinic.com"
                    autoComplete="email"
                    className={`w-full pl-12 pr-6 py-3 bg-parchment/50 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium placeholder:text-khaki/30 text-teak ${loginError?.type === 'credentials' ? 'border-red-300 focus:border-red-400 focus:ring-red-500/5' : 'border-sandstone focus:border-marigold focus:ring-marigold/5'
                      }`}
                    value={formData.email}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2 group/field">
                <div className="flex justify-between items-end px-4">
                  <label className={`text-[14px] font-bold uppercase tracking-widest transition-colors duration-300 ${focusedField === 'password' ? 'text-marigold' : 'text-khaki/60'}`}>
                    Secure Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-[14px] text-khaki/60 hover:text-marigold font-bold uppercase tracking-widest transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className={`relative transition-all duration-300 transform ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <LockKeyhole className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-marigold' : 'text-khaki/40'}`} size={18} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full pl-12 pr-6 py-3 bg-parchment/50 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-medium text-teak ${loginError?.type === 'credentials' ? 'border-red-300 focus:border-red-400 focus:ring-red-500/5' : 'border-sandstone focus:border-marigold focus:ring-marigold/5'
                      }`}
                    value={formData.password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-marigold to-saffron text-white rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-xl shadow-marigold/20 hover:shadow-marigold/40 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group/btn"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center pt-6 border-t border-sandstone/30 space-y-3">
              <p className="text-[14px] text-khaki font-medium">
                New facility?{' '}
                <button
                  onClick={() => navigate('/register-clinic')}
                  className="text-marigold font-bold hover:text-teak transition-colors underline-offset-4"
                >
                  Create an account
                </button>
              </p>
              <button
                onClick={() => navigate('/lab/login')}
                className="flex items-center gap-2 mx-auto text-[13px] font-bold transition-colors hover:opacity-80"
                style={{ color: '#1B6CA8' }}
              >
                <span>🔬</span>
                Independent Lab? Sign in to Lab Portal
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-marigold" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teak">HIPAA Compliant</span>
            </div>
            <div className="w-1.5 h-1.5 bg-sandstone rounded-full"></div>
            <div className="flex items-center gap-1.5">
              <Activity size={14} className="text-marigold" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teak">24/7 Monitoring</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
