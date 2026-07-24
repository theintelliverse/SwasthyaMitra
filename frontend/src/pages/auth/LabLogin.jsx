import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FlaskConical, Mail, LockKeyhole, RefreshCw, ArrowRight,
  AlertCircle, X, WifiOff, ShieldCheck, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

import { API_URL } from '../../config/runtime';

const LabLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [loginError, setLoginError] = useState(null);
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
      const response = await axios.post(`${API_URL}/api/auth/lab/login`, formData);

      if (response.data.success) {
        const { token, lab } = response.data;

        // Store independent lab credentials separately from clinic staff
        localStorage.setItem('labToken', token);
        localStorage.setItem('labRole', 'independent_lab');
        localStorage.setItem('labName', lab.labName);
        localStorage.setItem('labCode', lab.labCode);
        localStorage.setItem('labId', lab.id);
        localStorage.setItem('labEmail', lab.email);
        localStorage.setItem('labPhone', lab.phone);
        localStorage.setItem('labAddress', lab.address);

        Swal.fire({
          icon: 'success',
          title: `<span style="font-family:inherit">Welcome, ${lab.labName}</span>`,
          text: 'Accessing Lab Portal Dashboard...',
          timer: 1500,
          showConfirmButton: false,
          background: '#FFFFFF',
          color: '#0F4C75'
        });

        setTimeout(() => navigate('/lab/portal/dashboard'), 1500);
      }
    } catch (error) {
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;

      if (!error.response) {
        setLoginError({ type: 'network', message: 'Cannot reach the server. Check your connection.' });
      } else if (error.response?.data?.isPendingApproval) {
        localStorage.setItem('pendingFacility', JSON.stringify(error.response.data.facility));
        navigate('/pending-approval');
        return;
      } else if (status === 401 || status === 403) {
        setLoginError({ type: 'credentials', message: serverMessage || 'Invalid email or password.' });
      }
 else if (status === 429) {
        setLoginError({ type: 'server', message: 'Too many attempts. Please wait before trying again.' });
      } else {
        setLoginError({ type: 'server', message: serverMessage || 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col relative overflow-hidden">
      <SEO
        title="Lab Portal Login"
        description="Login to your independent diagnostic lab portal to manage test requests and upload reports."
        url="/lab/login"
      />

      {/* Background blobs — blue theme for lab */}
      <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(27,108,168,0.06)' }} />
      <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(6,182,212,0.05)', animationDelay: '2s' }} />

      <div className="flex-grow flex flex-col justify-center items-center px-6 py-6 relative z-10">

        {/* Brand Header */}
        <div
          className="flex items-center gap-4 mb-6 cursor-pointer group transition-all duration-500 hover:opacity-80"
          onClick={() => navigate('/')}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl group-hover:rotate-[10deg] transition-all duration-500"
            style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}
          >
            <FlaskConical className="text-white" size={30} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight leading-none text-teak">Lab Portal</h1>
            <p className="text-[14px] font-bold uppercase tracking-[0.4em] text-khaki mt-1.5 opacity-70">Independent Diagnostic Lab</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(15,76,117,0.1)] relative overflow-hidden">
            {/* Blue top accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-[3rem]" style={{ background: 'linear-gradient(90deg, rgba(27,108,168,0.2), #1B6CA8, rgba(27,108,168,0.2))' }} />

            <div className="text-center mb-6">
              <h2 className="text-3xl font-heading font-bold mb-2 text-teak">Lab Sign In</h2>
              <p className="text-sm text-khaki font-medium">Access your diagnostic lab dashboard</p>
            </div>

            {/* Inline Error Banner */}
            {loginError && (
              <div className={`mb-6 flex items-start gap-4 p-5 rounded-2xl border animate-in fade-in slide-in-from-top-2 duration-300 ${loginError.type === 'network' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${loginError.type === 'network' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                  {loginError.type === 'network' ? <WifiOff size={18} /> : <AlertCircle size={18} />}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-[14px] font-black uppercase tracking-widest mb-1 opacity-70">
                    {loginError.type === 'network' ? 'Connection Error' : loginError.type === 'credentials' ? 'Authentication Failed' : 'Server Error'}
                  </p>
                  <p className="text-sm font-medium leading-relaxed">{loginError.message}</p>
                </div>
                <button type="button" onClick={clearError} className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className={`text-[14px] font-bold uppercase tracking-widest ml-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-600' : 'text-khaki/60'}`}>
                  Lab Email Address
                </label>
                <div className={`relative transition-all duration-300 transform ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                  <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'email' ? 'text-blue-600' : 'text-khaki/40'}`} size={18} />
                  <input
                    type="email"
                    required
                    placeholder="lab@diagnostics.com"
                    autoComplete="email"
                    className="w-full pl-12 pr-6 py-3 bg-parchment/50 border border-sandstone rounded-2xl focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 transition-all font-medium placeholder:text-khaki/30 text-teak"
                    value={formData.email}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-end px-4">
                  <label className={`text-[14px] font-bold uppercase tracking-widest transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-600' : 'text-khaki/60'}`}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate('/lab/forgot-password')}
                    className="text-[14px] text-khaki/60 hover:text-blue-600 font-bold uppercase tracking-widest transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className={`relative transition-all duration-300 transform ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                  <LockKeyhole className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-blue-600' : 'text-khaki/40'}`} size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-12 pr-14 py-3 bg-parchment/50 border border-sandstone rounded-2xl focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 transition-all font-medium text-teak"
                    value={formData.password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-khaki/40 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-white rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group/btn"
                  style={{ background: loading ? '#6b7280' : 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      Sign In to Lab Portal
                      <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center pt-5 border-t border-sandstone/30 space-y-3">
              <p className="text-[14px] text-khaki font-medium">
                New lab?{' '}
                <button
                  onClick={() => navigate('/lab/register')}
                  className="font-bold hover:text-teak transition-colors underline-offset-4"
                  style={{ color: '#1B6CA8' }}
                >
                  Register your lab
                </button>
              </p>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 mx-auto text-[13px] text-khaki/60 hover:text-teak transition-colors font-medium"
              >
                <ArrowLeft size={14} />
                Back to Clinic Portal
              </button>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teak">Secure Portal</span>
            </div>
            <div className="w-1.5 h-1.5 bg-sandstone rounded-full" />
            <div className="flex items-center gap-1.5">
              <FlaskConical size={14} className="text-blue-500" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teak">Lab Network</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LabLogin;
