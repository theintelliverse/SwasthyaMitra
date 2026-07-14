import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  User, Phone, Search, AlertCircle, RefreshCw, Activity,
  ArrowLeft, Stethoscope, Heart, ShieldCheck, HeartPulse, Sparkles
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { API_URL } from '../../config/runtime';

const AddPatient = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientAge: '',
    patientGender: 'Male',
    patientBloodGroup: 'O+',
    doctorId: '',
    visitType: 'Walk-in',
    isEmergency: false,
    vitals: {
      bloodPressure: '',
      pulseRate: '',
      temperature: '',
      sugarLevel: '',
    }
  });

  const token = localStorage.getItem('token');

  // Fetch Doctors for Assignment
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await axios.get(`${API_URL}/api/staff/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDoctors(res.data.staff.filter(s => s.role === 'doctor' && s.isActive !== false));
      } catch (err) {
        console.error("Failed to load doctor roster:", err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [token]);

  // Search Patient Locker (Auto-Fill)
  const handleSearchPatient = async () => {
    if (!searchPhone || searchPhone.length < 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Number',
        text: 'Please enter a valid 10-digit mobile number to search.',
        confirmButtonColor: '#0F766E',
        background: '#EEF6FA'
      });
      return;
    }

    setSearching(true);
    try {
      const res = await axios.get(`${API_URL}/api/staff/patient-full-profile/${searchPhone}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success && res.data.data) {
        const patient = res.data.data;
        setFormData(prev => ({
          ...prev,
          patientName: patient.name || '',
          patientPhone: patient.phone || searchPhone,
          patientAge: patient.age || '',
          patientGender: patient.gender || 'Male',
          patientBloodGroup: patient.bloodGroup || 'O+',
        }));

        Swal.fire({
          icon: 'success',
          title: 'Digital Locker Synced!',
          text: `Auto-filled details for ${patient.name}.`,
          timer: 2000,
          showConfirmButton: false,
          background: '#EEF6FA'
        });
      }
    } catch (err) {
      console.warn("Locker profile not found, checking raw input", err);
      // Auto fill the searched phone number into the form at least
      setFormData(prev => ({
        ...prev,
        patientPhone: searchPhone
      }));
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'New Patient: Please enter details manually.',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setSearching(false);
    }
  };

  // Submit Patient to Queue
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId) {
      Swal.fire('Required Field', 'Please assign a medical practitioner.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Add patient token to live queue
      const res = await axios.post(`${API_URL}/api/queue/add`, {
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        doctorId: formData.doctorId,
        visitType: formData.visitType,
        isEmergency: formData.isEmergency
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        // 2. Try to sync vitals & profile details if entered
        const vitalsEntered = Object.values(formData.vitals).some(v => v.trim() !== '');
        if (vitalsEntered) {
          try {
            await axios.patch(`${API_URL}/api/staff/update-patient-vitals/${formData.patientPhone}`, {
              vitals: formData.vitals
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            // Update profile info (Age, Gender, Blood group)
            await axios.patch(`${API_URL}/api/staff/update-patient-profile/${formData.patientPhone}`, {
              age: Number(formData.patientAge),
              gender: formData.patientGender,
              bloodGroup: formData.patientBloodGroup
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (e) {
            console.error("Vitals/Profile auto-sync error:", e);
          }
        }

        Swal.fire({
          icon: formData.isEmergency ? 'warning' : 'success',
          title: formData.isEmergency ? '🚨 Emergency Token Issued' : 'Token Generated Successfully',
          html: `<p class="font-bold text-lg">Token Number: ${res.data.queueEntry?.tokenNumber || 'TK'}</p><p class="text-[14px] mt-2 text-slate-500">${formData.patientName} is now active in queue.</p>`,
          confirmButtonColor: '#0F766E',
          background: '#EEF6FA'
        });

        // Reset form
        setFormData({
          patientName: '',
          patientPhone: '',
          patientAge: '',
          patientGender: 'Male',
          patientBloodGroup: 'O+',
          doctorId: '',
          visitType: 'Walk-in',
          isEmergency: false,
          vitals: {
            bloodPressure: '',
            pulseRate: '',
            temperature: '',
            sugarLevel: '',
          }
        });
        setSearchPhone('');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Action Failed', err.response?.data?.message || 'Error registering patient.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak flex-col md:flex-row">
      <Sidebar role="receptionist" />
      
      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-32 lg:pb-0">
        <main className="p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full flex-grow space-y-8">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <button 
                onClick={() => navigate('/receptionist/dashboard')}
                className="flex items-center gap-2 text-[14px] font-bold text-khaki hover:text-marigold transition-colors mb-2 uppercase tracking-wider"
              >
                <ArrowLeft size={12} /> Back to Dashboard
              </button>
              <h1 className="text-2xl font-black tracking-tight text-teak leading-tight">Patient Entry Portal</h1>
              <p className="text-[14px] text-khaki font-medium mt-1">Register walk-in patients and generate live queue tokens instantly.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-marigold/10 text-marigold rounded-full text-[14px] font-black uppercase tracking-widest border border-marigold/10 flex items-center gap-2">
                <Sparkles size={10} className="animate-pulse" /> Live Synchronization
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Section: Registration Form */}
            <div className="lg:col-span-2 space-y-4">
              <form onSubmit={handleSubmit} className="bg-white border border-sandstone rounded-[2rem] shadow-sm overflow-hidden p-5 md:p-8 space-y-6 relative">
                {formData.isEmergency && (
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500 animate-pulse"></div>
                )}

                <div className="flex justify-between items-center pb-3 border-b border-sandstone/40">
                  <h2 className="text-lg font-heading text-teak flex items-center gap-2">
                    <User size={18} className="text-marigold" /> Basic Profile Info
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-black text-khaki uppercase tracking-widest">Emergency Priority?</span>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ ...formData, isEmergency: !formData.isEmergency })}
                      className={`w-12 h-6 rounded-full relative transition-all ${formData.isEmergency ? 'bg-red-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isEmergency ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Patient Full Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-khaki" />
                      <input 
                        type="text" required placeholder="e.g. Sameer Dixit"
                        className="w-full pl-10 pr-3 py-2.5 bg-parchment/30 border border-sandstone rounded-xl outline-none focus:border-marigold text-[14px] font-bold text-teak"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Mobile Number *</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-khaki" />
                      <input 
                        type="tel" required placeholder="10-digit mobile number"
                        className="w-full pl-10 pr-3 py-2.5 bg-parchment/30 border border-sandstone rounded-xl outline-none focus:border-marigold text-[14px] font-bold text-teak"
                        value={formData.patientPhone}
                        onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Age */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Patient Age</label>
                    <input 
                      type="number" placeholder="Age in years"
                      className="w-full px-3 py-2.5 bg-parchment/30 border border-sandstone rounded-xl outline-none focus:border-marigold text-[14px] font-bold text-teak"
                      value={formData.patientAge}
                      onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    />
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Biological Gender</label>
                    <select 
                      className="w-full px-3 py-2.5 bg-parchment/30 border border-sandstone rounded-xl outline-none focus:border-marigold text-[14px] font-bold text-teak"
                      value={formData.patientGender}
                      onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Blood Group */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Blood Group</label>
                    <select 
                      className="w-full px-3 py-2.5 bg-parchment/30 border border-sandstone rounded-xl outline-none focus:border-marigold text-[14px] font-bold text-teak"
                      value={formData.patientBloodGroup}
                      onChange={(e) => setFormData({ ...formData, patientBloodGroup: e.target.value })}
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  {/* Visit Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Visit Description</label>
                    <select 
                      className="w-full px-3 py-2.5 bg-parchment/30 border border-sandstone rounded-xl outline-none focus:border-marigold text-[14px] font-bold text-teak"
                      value={formData.visitType}
                      onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                    >
                      <option value="Walk-in">Walk-in consultation</option>
                      <option value="Appointment">Scheduled Appointment</option>
                      <option value="Follow-up">Clinical Follow-up</option>
                    </select>
                  </div>
                </div>

                {/* Vitals Input Grid */}
                <div className="space-y-3 pt-3 border-t border-sandstone/40">
                  <h2 className="text-lg font-heading text-teak flex items-center gap-2">
                    <HeartPulse size={18} className="text-teal-600" /> Walk-in Vitals (Optional)
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-black uppercase tracking-widest text-khaki ml-1">BP (eg. 120/80)</span>
                      <input 
                        type="text" placeholder="120/80"
                        className="px-3 py-2 bg-teal-50/10 border border-teal-100 rounded-lg outline-none focus:border-teal-600 text-[14px] font-bold text-teak placeholder:text-khaki/30"
                        value={formData.vitals.bloodPressure}
                        onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, bloodPressure: e.target.value } })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-black uppercase tracking-widest text-khaki ml-1">Pulse (bpm)</span>
                      <input 
                        type="text" placeholder="72"
                        className="px-3 py-2 bg-teal-50/10 border border-teal-100 rounded-lg outline-none focus:border-teal-600 text-[14px] font-bold text-teak placeholder:text-khaki/30"
                        value={formData.vitals.pulseRate}
                        onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, pulseRate: e.target.value } })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-black uppercase tracking-widest text-khaki ml-1">Temp (°F)</span>
                      <input 
                        type="text" placeholder="98.6"
                        className="px-3 py-2 bg-teal-50/10 border border-teal-100 rounded-lg outline-none focus:border-teal-600 text-[14px] font-bold text-teak placeholder:text-khaki/30"
                        value={formData.vitals.temperature}
                        onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, temperature: e.target.value } })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-black uppercase tracking-widest text-khaki ml-1">Sugar (mg/dL)</span>
                      <input 
                        type="text" placeholder="100"
                        className="px-3 py-2 bg-teal-50/10 border border-teal-100 rounded-lg outline-none focus:border-teal-600 text-[14px] font-bold text-teak placeholder:text-khaki/30"
                        value={formData.vitals.sugarLevel}
                        onChange={(e) => setFormData({ ...formData, vitals: { ...formData.vitals, sugarLevel: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>

                {/* Practitioner Assignment */}
                <div className="space-y-3 pt-3 border-t border-sandstone/40">
                  <h2 className="text-lg font-heading text-teak flex items-center gap-2">
                    <Stethoscope size={18} className="text-sky-600" /> Assign Medical Practitioner *
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {loadingDoctors ? (
                      <div className="py-2 text-center text-[14px] animate-pulse font-medium text-slate-400">Loading Doctors...</div>
                    ) : (
                      doctors.map(doc => (
                        <div 
                          key={doc._id}
                          onClick={() => setFormData({ ...formData, doctorId: doc._id })}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${formData.doctorId === doc._id ? 'border-teal-600 bg-teal-50/20' : 'border-sandstone bg-parchment/10 hover:border-marigold'}`}
                        >
                          <div>
                            <p className="text-[14px] font-black text-teak leading-tight">Dr. {doc.name}</p>
                            <p className="text-[14px] font-bold text-khaki uppercase tracking-wider mt-0.5">{doc.specialization}</p>
                          </div>
                          <div className={`w-2.5 h-2.5 rounded-full ${doc.isAvailable ? 'bg-green-500 shadow-sm' : 'bg-slate-200'}`} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Form Action */}
                <div className="pt-2">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-3.5 rounded-xl font-black text-[14px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98] ${formData.isEmergency ? 'bg-red-600 text-white' : 'bg-marigold text-white hover:bg-teak'} disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {submitting ? (
                      <><RefreshCw size={12} className="animate-spin" /> Issuing Access Token...</>
                    ) : (
                      formData.isEmergency ? '🚨 Process Critical Emergency Token' : 'Generate Queue Access Token'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Section: Digital Locker Search & Lookup */}
            <div className="space-y-6">
              
              {/* Database Search Card */}
              <div className="bg-white border border-sandstone rounded-[2.5rem] p-8 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-none">Auto-Fill Sync</h3>
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Lookup patient digital locker</p>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-khaki" />
                    <input 
                      type="tel" placeholder="Search 10-digit mobile..."
                      className="w-full pl-11 pr-4 py-4 bg-parchment/30 border border-sandstone rounded-2xl outline-none focus:border-marigold text-sm font-bold text-teak"
                      value={searchPhone}
                      onChange={(e) => setSearchPhone(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleSearchPatient}
                    disabled={searching}
                    className="w-full py-4 bg-teak hover:bg-marigold text-white rounded-2xl font-black text-[14px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                  >
                    {searching ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    Search Digital Locker
                  </button>
                </div>

                <div className="p-4 bg-teal-50/20 border border-teal-100 rounded-2xl flex items-start gap-3">
                  <ShieldCheck size={20} className="text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-black text-teal-800 uppercase tracking-wider">Locker Sync Enabled</p>
                    <p className="text-[14px] text-teal-700 mt-1 leading-relaxed">If the patient has set up a SwasthyaMitra health locker, searching their phone will instantly pull and auto-fill details, saving reception setup time.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AddPatient;
