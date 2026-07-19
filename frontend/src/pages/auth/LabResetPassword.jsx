import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FlaskConical, LockKeyhole, Eye, EyeOff, ArrowRight, RefreshCw, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';

const LabResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Link',
        text: 'Lab password reset link is invalid or missing.',
        confirmButtonText: 'Back to Lab Login',
        confirmButtonColor: '#1B6CA8'
      }).then(() => navigate('/lab/login'));
    }
  }, [token, email, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.newPassword || !formData.confirmPassword) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'All fields are required.', confirmButtonColor: '#1B6CA8' });
        setLoading(false);
        return;
      }

      if (formData.newPassword.length < 6) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Password must be at least 6 characters.', confirmButtonColor: '#1B6CA8' });
        setLoading(false);
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Passwords do not match.', confirmButtonColor: '#1B6CA8' });
        setLoading(false);
        return;
      }

      const res = await axios.post(`${API_URL}/api/auth/lab/reset-password`, {
        email,
        token,
        newPassword: formData.newPassword
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Password Reset! 🔬',
          text: 'Your lab password has been reset successfully. Please log in.',
          timer: 2000,
          showConfirmButton: false,
          background: '#FFFFFF',
          color: '#0F4C75'
        }).then(() => {
          navigate('/lab/login');
        });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to reset password.', confirmButtonColor: '#1B6CA8' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment font-body text-teak flex flex-col relative overflow-hidden">
      <SEO
        title="Lab Reset Password"
        description="Set a new password for your independent diagnostic lab portal account."
        url="/lab/reset-password"
      />

      <div className="absolute top-[-10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(27,108,168,0.06)' }} />
      <div className="absolute bottom-[-10%] -right-[10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-pulse" style={{ background: 'rgba(6,182,212,0.05)', animationDelay: '2s' }} />

      <div className="flex-grow flex flex-col justify-center items-center px-6 py-10 relative z-10">

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
            <p className="text-[14px] font-bold uppercase tracking-[0.4em] text-khaki mt-1.5 opacity-70">Set New Password</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 sm:p-8 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(15,76,117,0.1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-[3rem]" style={{ background: 'linear-gradient(90deg, rgba(27,108,168,0.2), #1B6CA8, rgba(27,108,168,0.2))' }} />

            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}>
                <CheckCircle size={28} />
              </div>
              <h2 className="text-2xl font-heading font-bold mb-2 text-teak">Create New Password</h2>
              <p className="text-sm text-khaki font-medium">Enter your new credentials below</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold uppercase tracking-widest text-khaki/60 ml-4">
                  New Password *
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-5 top-1/2 -translate-y-1/2 text-khaki/40" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    required
                    placeholder="Enter new password"
                    className="w-full pl-12 pr-14 py-3.5 bg-parchment/50 border border-sandstone rounded-2xl focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 transition-all font-medium text-teak"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-khaki/40 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[12px] text-khaki/60 ml-4">Minimum 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-[14px] font-bold uppercase tracking-widest text-khaki/60 ml-4">
                  Confirm Password *
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-5 top-1/2 -translate-y-1/2 text-khaki/40" size={18} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    placeholder="Re-enter password"
                    className="w-full pl-12 pr-14 py-3.5 bg-parchment/50 border border-sandstone rounded-2xl focus:outline-none focus:ring-4 focus:border-blue-500 focus:ring-blue-500/5 transition-all font-medium text-teak"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-khaki/40 hover:text-blue-600 transition-colors"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-white rounded-2xl font-bold text-sm uppercase tracking-[0.2em] shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                style={{ background: loading ? '#6b7280' : 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Lab Password
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="text-center pt-4 border-t border-sandstone/30">
                <button
                  type="button"
                  onClick={() => navigate('/lab/login')}
                  className="flex items-center justify-center gap-2 text-sm font-bold text-khaki/70 hover:text-teak transition-colors mx-auto"
                >
                  <ArrowLeft size={16} />
                  Back to Lab Sign In
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-500" />
              <span className="text-[14px] font-bold uppercase tracking-widest text-teak">Encrypted Credentials</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LabResetPassword;
