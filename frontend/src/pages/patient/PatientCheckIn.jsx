import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Phone, User, Stethoscope, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../../config/runtime';

const API_URL = API_BASE_URL;

const normalizePhone = (value = '') => value.replace(/\D/g, '').slice(-10);

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

const shouldTryAlternatePatientRoute = (error) => {
  const status = error?.response?.status;
  if (status === 404 || status === 405) {
    return true;
  }

  return !error?.response && !!error?.request;
};

const postPatientAuthWithFallback = async (endpoint, payload) => {
  const primaryUrl = `${API_URL}/api/auth/patient/${endpoint}`;
  const fallbackUrl = `${API_URL}/api/patient/${endpoint}`;

  try {
    return await axios.post(primaryUrl, payload);
  } catch (error) {
    if (!shouldTryAlternatePatientRoute(error)) {
      throw error;
    }
    return axios.post(fallbackUrl, payload);
  }
};

const PatientCheckIn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clinicCode = (searchParams.get('code') || '').trim().toUpperCase();

  const [doctors, setDoctors] = useState([]);
  const [clinicName, setClinicName] = useState('Clinic');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: ''
  });

  useEffect(() => {
    const fetchClinicDoctors = async () => {
      try {
        setLoading(true);
        setFetchError('');
        if (!API_URL) {
          throw new Error('API URL is not configured. Please set VITE_API_URL.');
        }
        if (!clinicCode) {
          throw new Error('Invalid clinic code. Please use a valid check-in link.');
        }
        const res = await axios.get(`${API_URL}/api/staff/public/doctors/${clinicCode}`);
        const responseDoctors = Array.isArray(res.data?.doctors) ? res.data.doctors : [];
        const sortedDoctors = [...responseDoctors].sort((a, b) => {
          const aUnavailable = a?.isAvailable === false;
          const bUnavailable = b?.isAvailable === false;
          if (aUnavailable === bUnavailable) return 0;
          return aUnavailable ? 1 : -1;
        });
        setDoctors(sortedDoctors);
        setClinicName(res.data?.clinicName || 'Clinic');
        setLoading(false);
      } catch (error) {
        const message = getErrorMessage(error, 'Could not load doctors.');
        setFetchError(message);
        setDoctors([]);
        setLoading(false);
      }
    };
    if (clinicCode) fetchClinicDoctors();
    else {
      setLoading(false);
      setFetchError('Clinic code missing in URL.');
    }
  }, [clinicCode]);

  // --- Step 1: Send OTP ---
  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      setSendingOtp(true);
      if (!API_URL) {
        throw new Error('API URL is not configured. Please set VITE_API_URL.');
      }
      if (!formData.doctorId) {
        throw new Error('Please choose a consulting specialist first.');
      }
      const cleanPhone = normalizePhone(formData.patientPhone);
      if (cleanPhone.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      await postPatientAuthWithFallback('send-otp', {
        phone: cleanPhone
      });
      setOtpSent(true);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'OTP Sent successfully',
        text: 'Check your mobile SMS for the code.',
        showConfirmButton: false,
        timer: 4000,
        background: '#EEF6FA'
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to send OTP. Please check the phone number.');
      Swal.fire({
        icon: 'error',
        title: 'Dispatch Failed',
        text: message,
        confirmButtonColor: '#0F766E'
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // --- Step 2: Verify OTP & Request Check-in ---
  const handleVerifyAndCheckin = async (e) => {
    e.preventDefault();
    try {
      setVerifyingOtp(true);
      if (!API_URL) {
        throw new Error('API URL is not configured. Please set VITE_API_URL.');
      }
      const cleanPhone = normalizePhone(formData.patientPhone);
      if (cleanPhone.length !== 10) {
        throw new Error('Invalid mobile number. Please go back and correct it.');
      }
      const cleanOtp = otp.trim();
      if (!/^\d{6}$/.test(cleanOtp)) {
        throw new Error('Please enter a valid 6-digit OTP.');
      }
      // 1. Verify OTP first
      await postPatientAuthWithFallback('verify-otp', {
        phone: cleanPhone,
        otp: cleanOtp
      });

      // 2. Submit the Gatekeeper Check-in Request
      const res = await axios.post(`${API_URL}/api/queue/public/checkin`, {
        patientName: formData.patientName,
        patientPhone: cleanPhone,
        doctorId: formData.doctorId,
        clinicCode: clinicCode.toUpperCase()
      });

      if (res.data.success) {
        const queueId = res.data.id || res.data.requestId;
        if (!queueId) {
          throw new Error('Request created but queue id is missing. Please retry once.');
        }
        Swal.fire({
          title: 'Request Sent!',
          text: 'The receptionist has been notified. Please wait for approval.',
          icon: 'success',
          confirmButtonColor: '#1F6FB2',
          background: '#EEF6FA'
        }).then(() => {
          navigate(`/patient/status?id=${queueId}`);
        });
      }
    } catch (error) {
      console.error('Check-in Error:', error?.response || error);
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: getErrorMessage(error, 'Invalid code or check-in error.'),
        confirmButtonColor: '#0F766E'
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#EEF6FA] flex flex-col items-center justify-center gap-4">
      <RefreshCw size={32} className="text-[#1F6FB2] animate-spin" />
      <p className="font-heading text-xl text-[#0F766E]">Syncing with {clinicName}...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EEF6FA] font-body text-[#0F766E] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10 border border-[#AFC4D8] relative overflow-hidden">

        {/* Decorative Morning Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#1F6FB2]/5 rounded-full -mr-16 -mt-16"></div>

        <header className="text-center mb-10">
          <div className="w-16 h-16 bg-[#1F6FB2] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-marigold/20">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-heading text-[#0F766E]">{clinicName}</h1>
          <p className="text-[#3FA28C] text-[10px] font-black uppercase tracking-[0.3em] mt-2">Verified Self Check-in</p>
        </header>

        {fetchError && (
          <div className="mb-6 p-4 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold">
            {fetchError}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#3FA28C] ml-2 tracking-widest">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3FA28C]" />
                <input
                  type="text" required placeholder="Dr. Patient Name"
                  className="w-full pl-12 pr-6 py-4 bg-[#EEF6FA] border border-[#AFC4D8] rounded-2xl outline-none focus:border-[#1F6FB2] font-bold text-[#0F766E] transition-all placeholder:font-normal"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#3FA28C] ml-2 tracking-widest">Mobile Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3FA28C]" />
                <input
                  type="tel" required placeholder="91XXXXXXXXXX"
                  className="w-full pl-12 pr-6 py-4 bg-[#EEF6FA] border border-[#AFC4D8] rounded-2xl outline-none focus:border-[#1F6FB2] font-medium text-[#0F766E] transition-all placeholder:font-normal"
                  value={formData.patientPhone}
                  onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] font-black uppercase text-[#3FA28C] ml-2 tracking-widest">Consulting Specialist</label>
              <div className="relative">
                <Stethoscope size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#3FA28C] z-10" />
                <select
                  required
                  disabled={doctors.length === 0}
                  className="w-full pl-12 pr-6 py-4 bg-[#EEF6FA] border border-[#AFC4D8] rounded-2xl outline-none focus:border-[#1F6FB2] font-bold text-[#0F766E] appearance-none cursor-pointer relative z-0"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                >
                  <option value="">{doctors.length === 0 ? 'No specialist available' : 'Choose Specialist'}</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id} disabled={doc.isAvailable === false}>
                      Dr. {doc.name} ({doc.specialization || 'General'}){doc.isAvailable === false ? ' • On break' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button disabled={sendingOtp || doctors.length === 0} type="submit" className="w-full py-5 bg-[#1F6FB2] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#0F766E] transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#1F6FB2]">
              {sendingOtp ? 'Sending OTP...' : 'Send OTP'} <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndCheckin} className="space-y-8 animate-in slide-in-from-right duration-500">
            <div className="text-center">
              <p className="text-sm text-[#0F766E] font-bold">Verify Security Code</p>
              <p className="text-[11px] text-[#3FA28C] mt-1">Sent to <b>{formData.patientPhone}</b></p>
            </div>

            <input
              type="text" required maxLength="6" placeholder="0 0 0 0 0 0"
              className="w-full text-center text-4xl tracking-[0.4em] py-8 bg-[#EEF6FA] border-2 border-[#1F6FB2]/20 rounded-[2.5rem] outline-none focus:border-[#1F6FB2] font-heading text-[#0F766E] shadow-inner"
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            />

            <div className="flex flex-col gap-4">
              <button disabled={verifyingOtp} type="submit" className="w-full py-5 bg-[#0F766E] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#1F6FB2] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#0F766E]">
                {verifyingOtp ? 'Verifying...' : 'Confirm & Request Entry'}
              </button>
              <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] font-black uppercase text-[#3FA28C] tracking-[0.2em] hover:text-[#0F766E] transition-all">
                ← Edit Information
              </button>
            </div>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-[#AFC4D8] text-center">
          <button
            onClick={() => navigate('/patient/login')}
            className="text-[10px] font-black uppercase tracking-widest text-[#0F766E] hover:text-[#1F6FB2] transition-colors"
          >
            Access Health Locker →
          </button>
        </div>
      </div>

      <p className="mt-8 text-[9px] font-black uppercase tracking-[0.4em] text-[#3FA28C] opacity-50">
        Powered by Appointory Clinical Network
      </p>
    </div>
  );
};

export default PatientCheckIn;