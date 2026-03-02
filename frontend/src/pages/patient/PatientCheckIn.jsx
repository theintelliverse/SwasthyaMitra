import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Phone, User, Stethoscope, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
const API_URL = import.meta.env.VITE_API_URL;
const PatientCheckIn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clinicCode = searchParams.get('code') || '';

  const [doctors, setDoctors] = useState([]);
  const [clinicName, setClinicName] = useState('Clinic');
  const [loading, setLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: ''
  });

  useEffect(() => {
    const fetchClinicDoctors = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/staff/public/doctors/${clinicCode}`);
        setDoctors(res.data.doctors);
        setClinicName(res.data.clinicName);
        setLoading(false);
      } catch (err) {
        console.error("Could not load doctors");
        setLoading(false);
      }
    };
    if (clinicCode) fetchClinicDoctors();
  }, [clinicCode]);

  // --- Step 1: Send OTP ---
  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/auth/patient/send-otp`, {
        phone: formData.patientPhone
      });
      setOtpSent(true);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'OTP Sent successfully',
        text: 'Check your server console for the code.',
        showConfirmButton: false,
        timer: 4000,
        background: '#FFFBF5'
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Dispatch Failed',
        text: 'Failed to send OTP. Please check the phone number.',
        confirmButtonColor: '#422D0B'
      });
    }
  };

  // --- Step 2: Verify OTP & Request Check-in ---
  const handleVerifyAndCheckin = async (e) => {
    e.preventDefault();
    try {
      // 1. Verify OTP first
      await axios.post(`${API_URL}/api/auth/patient/verify-otp`, {
        phone: formData.patientPhone,
        otp
      });

      // 2. Submit the Gatekeeper Check-in Request
      const res = await axios.post(`${API_URL}/api/queue/public/checkin`, {
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        doctorId: formData.doctorId,
        clinicCode: clinicCode.toUpperCase()
      });

      if (res.data.success) {
        Swal.fire({
          title: 'Request Sent!',
          text: 'The receptionist has been notified. Please wait for approval.',
          icon: 'success',
          confirmButtonColor: '#FFA800',
          background: '#FFFBF5'
        }).then(() => {
          navigate(`/patient/status?id=${res.data.id}`);
        });
      }
    } catch (err) {
      console.error("Check-in Error:", err.response);
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: err.response?.data?.message || 'Invalid code or check-in error.',
        confirmButtonColor: '#422D0B'
      });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FFFBF5] flex flex-col items-center justify-center gap-4">
      <RefreshCw size={32} className="text-[#FFA800] animate-spin" />
      <p className="font-heading text-xl text-[#422D0B]">Syncing with {clinicName}...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFBF5] font-body text-[#422D0B] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10 border border-[#E8DDCB] relative overflow-hidden">

        {/* Decorative Morning Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFA800]/5 rounded-full -mr-16 -mt-16"></div>

        <header className="text-center mb-10">
          <div className="w-16 h-16 bg-[#FFA800] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-marigold/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-heading text-[#422D0B]">{clinicName}</h1>
          <p className="text-[#967A53] text-[10px] font-black uppercase tracking-[0.3em] mt-2">Verified Self Check-in</p>
        </header>

        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#967A53] ml-2 tracking-widest">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#967A53]" />
                <input
                  type="text" required placeholder="Dr. Patient Name"
                  className="w-full pl-12 pr-6 py-4 bg-[#FFFBF5] border border-[#E8DDCB] rounded-2xl outline-none focus:border-[#FFA800] font-bold text-[#422D0B] transition-all placeholder:font-normal"
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#967A53] ml-2 tracking-widest">Mobile Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#967A53]" />
                <input
                  type="tel" required placeholder="91XXXXXXXXXX"
                  className="w-full pl-12 pr-6 py-4 bg-[#FFFBF5] border border-[#E8DDCB] rounded-2xl outline-none focus:border-[#FFA800] font-medium text-[#422D0B] transition-all placeholder:font-normal"
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] font-black uppercase text-[#967A53] ml-2 tracking-widest">Consulting Specialist</label>
              <div className="relative">
                <Stethoscope size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#967A53] z-10" />
                <select
                  required
                  className="w-full pl-12 pr-6 py-4 bg-[#FFFBF5] border border-[#E8DDCB] rounded-2xl outline-none focus:border-[#FFA800] font-bold text-[#422D0B] appearance-none cursor-pointer relative z-0"
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                >
                  <option value="">Choose Specialist</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>
                      Dr. {doc.name} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="w-full py-5 bg-[#FFA800] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#422D0B] transition-all active:scale-95 flex items-center justify-center gap-3">
              Send OTP <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndCheckin} className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="text-center">
              <p className="text-sm text-[#422D0B] font-bold">Verify Security Code</p>
              <p className="text-[11px] text-[#967A53] mt-1">Sent to <b>{formData.patientPhone}</b></p>
            </div>

            <input
              type="text" required maxLength="6" placeholder="0 0 0 0 0 0"
              className="w-full text-center text-4xl tracking-[0.4em] py-8 bg-[#FFFBF5] border-2 border-[#FFA800]/20 rounded-[2.5rem] outline-none focus:border-[#FFA800] font-heading text-[#422D0B] shadow-inner"
              value={otp} onChange={(e) => setOtp(e.target.value)}
            />

            <div className="flex flex-col gap-4">
              <button type="submit" className="w-full py-5 bg-[#422D0B] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#FFA800] transition-all">
                Confirm & Request Entry
              </button>
              <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] font-black uppercase text-[#967A53] tracking-[0.2em] hover:text-[#422D0B] transition-all">
                ← Edit Information
              </button>
            </div>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-[#E8DDCB] text-center">
          <button
            onClick={() => navigate('/patient/login')}
            className="text-[10px] font-black uppercase tracking-widest text-[#422D0B] hover:text-[#FFA800] transition-colors"
          >
            Access Health Locker →
          </button>
        </div>
      </div>

      <p className="mt-8 text-[9px] font-black uppercase tracking-[0.4em] text-[#967A53] opacity-50">
        Powered by Appointory Clinical Network
      </p>
    </div>
  );
};

export default PatientCheckIn;