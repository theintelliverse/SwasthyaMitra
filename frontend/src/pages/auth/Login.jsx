import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
// 🛠️ Fixed the icon imports here
import { ShieldCheck, Mail, LockKeyhole, Hash, RefreshCw, ArrowRight } from 'lucide-react';
import Footer from '../../components/Footer';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const Login = () => {
  const [formData, setFormData] = useState({
    clinicCode: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, formData);

      if (response.data.success) {
        const { token, user } = response.data;

        // 🔑 CORE AUTH DATA
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
        localStorage.setItem('userName', user.name);

        // 🏥 CLINIC DATA (Crucial for WebSockets)
        // This ensures localStorage.getItem('clinicId') will no longer be null
        localStorage.setItem('clinicId', user.clinicId);
        localStorage.setItem('clinicName', user.clinicName || 'Our Clinic');
        localStorage.setItem('clinicCode', formData.clinicCode.toUpperCase());

        Swal.fire({
          icon: 'success',
          title: `<span style="font-family: inherit">Welcome, ${user.name}</span>`,
          text: `Accessing ${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard...`,
          timer: 1500,
          showConfirmButton: false,
          background: '#EEF6FA',
          color: '#0F766E',
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
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || 'Invalid credentials.',
        confirmButtonColor: '#1F6FB2',
        background: '#EEF6FA',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col">
      <div className="flex-grow flex flex-col justify-center items-center px-6 py-12">

        <div className="flex items-center gap-4 mb-12 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="w-12 h-12 bg-marigold rounded-2xl flex items-center justify-center shadow-xl shadow-marigold/20 group-hover:scale-110 transition-transform duration-300">
            <span className="text-white font-heading text-3xl">A</span>
          </div>
          <div>
            <h1 className="font-heading text-2xl tracking-tight leading-none">Appointory</h1>
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-khaki mt-1">Provider Portal</p>
          </div>
        </div>

        <div className="w-full max-w-md bg-white border border-sandstone/50 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl shadow-teak/5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-marigold/5 rounded-full"></div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-heading mb-2 text-teak">Clinic Portal</h2>
            <p className="text-sm text-khaki font-medium italic">Authenticate to access your facility dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-khaki ml-4">Clinic Identification Code</label>
              <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-khaki" size={16} />
                <input
                  type="text" required placeholder="e.g. CITY01"
                  className="w-full pl-12 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl focus:outline-none focus:border-marigold transition-all font-bold placeholder:text-khaki/30 uppercase"
                  value={formData.clinicCode}
                  onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-khaki ml-4">Authorized Email Address</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-khaki" size={16} />
                <input
                  type="email" required placeholder="name@clinic.com"
                  className="w-full pl-12 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl focus:outline-none focus:border-marigold transition-all font-medium placeholder:text-khaki/30"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-khaki ml-4">Secure Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-5 top-1/2 -translate-y-1/2 text-khaki" size={16} />
                <input
                  type="password" required placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-parchment border border-sandstone/60 rounded-2xl focus:outline-none focus:border-marigold transition-all font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit" disabled={loading}
                className="w-full py-5 bg-marigold text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-marigold/20 hover:bg-saffron transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={20} /></>}
              </button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-xs text-khaki font-medium">
              First time here?{' '}
              <button onClick={() => navigate('/register-clinic')} className="text-marigold font-bold hover:underline underline-offset-4">
                Register your facility
              </button>
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4 opacity-40">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest text-teak">End-to-End Encrypted</span>
          </div>
          <div className="w-1 h-1 bg-teak rounded-full"></div>
          <span className="text-[9px] font-black uppercase tracking-widest text-teak">Secure Cloud Sync</span>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;