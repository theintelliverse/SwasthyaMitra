import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FlaskConical, Mail, LockKeyhole, Building, Phone, MapPin,
  Hash, RefreshCw, ArrowRight, ArrowLeft, ShieldCheck, CheckCircle,
  Eye, EyeOff
} from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

import { API_URL } from '../../config/runtime';

const LabRegister = () => {
  const [formData, setFormData] = useState({
    labName: '', labCode: '', email: '', password: '', confirmPassword: '', phone: '', address: ''
  });
  const [showPasswords, setShowPasswords] = useState({ password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!formData.labName.trim()) errs.labName = 'Lab name is required.';
    if (!formData.labCode.trim()) errs.labCode = 'Lab code is required.';
    if (!/^[A-Za-z0-9]+$/.test(formData.labCode)) errs.labCode = 'Lab code must be alphanumeric (no spaces).';
    if (!formData.email.trim()) errs.email = 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Enter a valid email.';
    if (!formData.password) errs.password = 'Password is required.';
    if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
    if (!formData.address.trim()) errs.address = 'Address is required.';
    return errs;
  };

  const handleInputChange = (field, value) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/lab/register`, {
        labName: formData.labName,
        labCode: formData.labCode.toUpperCase(),
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address
      });

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: '🎉 Lab Registered!',
          html: `<p>Your lab code is: <strong style="color:#1B6CA8;font-size:1.2em">${response.data.labCode}</strong></p><p style="font-size:0.9em;color:#666">Share this code with clinics to connect.</p>`,
          confirmButtonColor: '#1B6CA8',
          confirmButtonText: 'Proceed to Login'
        });
        navigate('/lab/login');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      Swal.fire({ icon: 'error', title: 'Registration Failed', text: message, confirmButtonColor: '#1B6CA8' });
    } finally {
      setLoading(false);
    }
  };

  const fieldConfig = [
    { key: 'labName', label: 'Lab / Diagnostic Center Name', placeholder: 'e.g. City Diagnostics', icon: Building, type: 'text' },
    { key: 'labCode', label: 'Unique Lab Code', placeholder: 'e.g. CITYLAB01 (no spaces)', icon: Hash, type: 'text', hint: 'Clinics use this code to find and connect to your lab.' },
    { key: 'email', label: 'Lab Email Address', placeholder: 'lab@diagnostics.com', icon: Mail, type: 'email' },
    { key: 'phone', label: 'Contact Phone', placeholder: '+91 98765 43210', icon: Phone, type: 'text' },
    { key: 'password', label: 'Password', placeholder: '••••••••', icon: LockKeyhole, type: 'password' },
    { key: 'confirmPassword', label: 'Confirm Password', placeholder: '••••••••', icon: LockKeyhole, type: 'password' }
  ];

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col relative overflow-hidden">
      <SEO
        title="Lab Registration"
        description="Register your independent diagnostic lab on SwasthyaMitra to receive test requests from clinics."
        url="/lab/register"
      />

      <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(27,108,168,0.06)' }} />
      <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(6,182,212,0.05)', animationDelay: '2s' }} />

      <div className="flex-grow flex flex-col justify-center items-center px-6 py-10 relative z-10">

        {/* Brand Header */}
        <div
          className="flex items-center gap-4 mb-8 cursor-pointer group transition-all duration-500 hover:opacity-80"
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
            <p className="text-[14px] font-bold uppercase tracking-[0.4em] text-khaki mt-1.5 opacity-70">Register Your Diagnostic Lab</p>
          </div>
        </div>

        <div className="w-full max-w-xl">
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(15,76,117,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-[3rem]" style={{ background: 'linear-gradient(90deg, rgba(27,108,168,0.2), #1B6CA8, rgba(27,108,168,0.2))' }} />

            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold mb-2 text-teak">Create Lab Account</h2>
              <p className="text-sm text-khaki font-medium">Set up your lab to start receiving test requests from clinics</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {fieldConfig.map(({ key, label, placeholder, icon: Icon, type, hint }) => (
                <div key={key} className="space-y-1.5">
                  <label className={`text-[14px] font-bold uppercase tracking-widest ml-4 transition-colors duration-300 ${focusedField === key ? 'text-blue-600' : 'text-khaki/60'}`}>
                    {label}
                  </label>
                  <div className={`relative transition-all duration-300 transform ${focusedField === key ? 'scale-[1.01]' : ''}`}>
                    <Icon
                      className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === key ? 'text-blue-600' : 'text-khaki/40'}`}
                      size={17}
                    />
                    <input
                      type={key === 'password' || key === 'confirmPassword' ? (showPasswords[key] ? 'text' : 'password') : type}
                      placeholder={placeholder}
                      className={`w-full pl-12 ${key === 'password' || key === 'confirmPassword' ? 'pr-14' : 'pr-6'} py-3 bg-parchment/50 border rounded-2xl focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 transition-all font-medium placeholder:text-khaki/30 text-teak text-sm ${errors[key] ? 'border-red-300' : 'border-sandstone'} ${key === 'labCode' ? 'uppercase font-black' : ''}`}
                      value={formData[key]}
                      onFocus={() => setFocusedField(key)}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                    />
                    {(key === 'password' || key === 'confirmPassword') && (
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-khaki/40 hover:text-blue-600 transition-colors"
                      >
                        {showPasswords[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </div>
                  {hint && !errors[key] && <p className="text-[12px] text-khaki/60 ml-4">{hint}</p>}
                  {errors[key] && <p className="text-[12px] text-red-500 ml-4 font-medium">{errors[key]}</p>}
                </div>
              ))}

              {/* Address — textarea */}
              <div className="space-y-1.5">
                <label className={`text-[14px] font-bold uppercase tracking-widest ml-4 transition-colors duration-300 ${focusedField === 'address' ? 'text-blue-600' : 'text-khaki/60'}`}>
                  Lab Address
                </label>
                <div className={`relative transition-all duration-300 transform ${focusedField === 'address' ? 'scale-[1.01]' : ''}`}>
                  <MapPin className={`absolute left-5 top-4 transition-colors duration-300 ${focusedField === 'address' ? 'text-blue-600' : 'text-khaki/40'}`} size={17} />
                  <textarea
                    placeholder="Street, Area, City, Pincode..."
                    rows={3}
                    className={`w-full pl-12 pr-6 py-3 bg-parchment/50 border rounded-2xl focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 transition-all font-medium placeholder:text-khaki/30 text-teak text-sm resize-none ${errors.address ? 'border-red-300' : 'border-sandstone'}`}
                    value={formData.address}
                    onFocus={() => setFocusedField('address')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                {errors.address && <p className="text-[12px] text-red-500 ml-4 font-medium">{errors.address}</p>}
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
                      <CheckCircle size={18} />
                      Register Lab
                      <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" size={18} />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center pt-5 border-t border-sandstone/30 space-y-3">
              <p className="text-[14px] text-khaki font-medium">
                Already registered?{' '}
                <button
                  onClick={() => navigate('/lab/login')}
                  className="font-bold hover:text-teak transition-colors"
                  style={{ color: '#1B6CA8' }}
                >
                  Sign in to Lab Portal
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
              <span className="text-[14px] font-bold uppercase tracking-widest text-teak">Secure Registration</span>
            </div>
            <div className="w-1.5 h-1.5 bg-sandstone rounded-full" />
            <div className="flex items-center gap-1.5">
              <FlaskConical size={14} className="text-blue-500" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teak">Multi-Clinic Network</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LabRegister;
