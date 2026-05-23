import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    Building2, Stethoscope, Calendar, ArrowRight, ArrowLeft,
    MapPin, Phone, CheckCircle, AlertCircle, Loader, Search, Clock, Activity, Zap, Check, ChevronRight, X, CalendarDays, ShieldCheck
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const MAX_BOOKING_DAYS = 14;
const DEFAULT_WORKING_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAY_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const toLocalDateTimeKey = (dateInput) => {
    const d = new Date(dateInput);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const getCurrentLocalDate = () => toLocalDateTimeKey(new Date()).split('T')[0];
const getMaxLocalDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + MAX_BOOKING_DAYS);
    return toLocalDateTimeKey(d).split('T')[0];
};

const BookAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rescheduleApp = location.state?.rescheduleApp;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
    const [searchClinic, setSearchClinic] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date()); // Default to today

    const [formData, setFormData] = useState({
        clinicId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentType: 'new',
        reason: '',
        slotMode: 'quick',
        rescheduleAppointmentId: ''
    });

    useEffect(() => {
        if (rescheduleApp) {
            setFormData(prev => ({
                ...prev,
                clinicId: rescheduleApp.clinicId?._id || rescheduleApp.clinicId,
                doctorId: rescheduleApp.doctorId?._id || rescheduleApp.doctorId,
                appointmentType: rescheduleApp.appointmentType || 'new',
                reason: rescheduleApp.reason || '',
                rescheduleAppointmentId: rescheduleApp.queueId
            }));
            if (rescheduleApp.appointmentDate) {
                setSelectedDate(new Date(rescheduleApp.appointmentDate));
            }
            setStep(3);
        }
    }, [rescheduleApp]);

    // Generate date strip for Step 3
    const dateStrip = useMemo(() => {
        const dates = [];
        for (let i = 0; i < MAX_BOOKING_DAYS; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, []);

    useEffect(() => {
        const fetchClinics = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`${API_URL}/api/clinic/public/list`);
                if (res.data.success) {
                    setClinics(res.data.data);
                }
            } catch (error) {
                setError('Failed to load clinical facilities.');
            } finally {
                setLoading(false);
            }
        };
        fetchClinics();
    }, []);

    useEffect(() => {
        if (formData.clinicId) {
            const fetchDoctors = async () => {
                try {
                    setLoading(true);
                    const res = await axios.get(`${API_URL}/api/clinic/public/doctors/${formData.clinicId}`);
                    if (res.data.success) {
                        setDoctors(res.data.data);
                    }
                } catch (error) {
                    setError('Could not retrieve specialist list.');
                } finally {
                    setLoading(false);
                }
            };
            fetchDoctors();
        }
    }, [formData.clinicId]);

    const getSelectedClinic = () => clinics.find(c => c._id === formData.clinicId);
    const getSelectedDoctor = () => doctors.find(d => d._id === formData.doctorId);

    const getClinicTimingConfig = useCallback(() => {
        const selectedClinic = clinics.find(c => c._id === formData.clinicId) || {};
        return {
            openingTime: selectedClinic.openingTime || '09:00',
            closingTime: selectedClinic.closingTime || '17:00',
            breakStartTime: selectedClinic.breakStartTime || '12:00',
            breakEndTime: selectedClinic.breakEndTime || '14:00',
            slotDurationMinutes: Number(selectedClinic.slotDurationMinutes || 30),
            workingDays: selectedClinic.workingDays?.length ? selectedClinic.workingDays : DEFAULT_WORKING_DAYS
        };
    }, [clinics, formData.clinicId]);

    const fetchBookedSlots = useCallback(async () => {
        if (!formData.clinicId || !formData.doctorId) return;
        try {
            const startStr = selectedDate.toISOString().split('T')[0];
            const res = await axios.get(
                `${API_URL}/api/clinic/public/booked-slots/${formData.clinicId}/${formData.doctorId}`,
                { params: { startDate: startStr, endDate: startStr } }
            );

            if (res.data.success) {
                const bookedTimeSlots = res.data.data.map(slot => toLocalDateTimeKey(slot.appointmentDate || slot.timeSlot));
                setBookedSlots(bookedTimeSlots);
                return bookedTimeSlots;
            }
            return [];
        } catch (error) {
            setBookedSlots([]);
            return [];
        }
    }, [formData.clinicId, formData.doctorId, selectedDate]);

    useEffect(() => {
        if (formData.doctorId && step === 3) {
            fetchBookedSlots();
        }
    }, [formData.doctorId, selectedDate, step, fetchBookedSlots]);

    const generateAvailableSlots = useCallback(() => {
        const slots = [];
        const { openingTime, closingTime, breakStartTime, breakEndTime, slotDurationMinutes, workingDays } = getClinicTimingConfig();

        const [openHour, openMinute] = openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);
        const [breakStartHour, breakStartMinute] = breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = breakEndTime.split(':').map(Number);
        
        const currentDay = WEEKDAY_MAP[selectedDate.getDay()];
        if (!workingDays.includes(currentDay)) {
            setAvailableSlots([]);
            return;
        }

        const start = new Date(selectedDate);
        start.setHours(openHour, openMinute, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(closeHour, closeMinute, 0, 0);
        const breakStart = new Date(selectedDate);
        breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
        const breakEnd = new Date(selectedDate);
        breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

        const finalDuration = formData.slotMode === 'quick' ? 60 : slotDurationMinutes;
        const now = new Date();

        for (let slot = new Date(start); slot < end; slot = new Date(slot.getTime() + finalDuration * 60000)) {
            if (slot >= breakStart && slot < breakEnd) continue;
            // Filter out past slots for today
            if (selectedDate.toDateString() === now.toDateString() && slot < now) continue;
            const slotKey = toLocalDateTimeKey(slot);
            if (bookedSlots.includes(slotKey)) continue;
            slots.push(new Date(slot));
        }
        setAvailableSlots(slots);
    }, [bookedSlots, getClinicTimingConfig, selectedDate, formData.slotMode]);

    useEffect(() => {
        if (formData.clinicId && formData.doctorId && step === 3) {
            generateAvailableSlots();
        }
    }, [formData.clinicId, formData.doctorId, bookedSlots, selectedDate, step, generateAvailableSlots]);

    // AI Wait Prediction (Dynamic from API)
    useEffect(() => {
        if (formData.clinicId && formData.doctorId) {
            const fetchWaitTime = async () => {
                try {
                    const params = {
                        clinicId: formData.clinicId,
                        doctorId: formData.doctorId,
                        visitType: formData.appointmentType
                    };
                    if (formData.appointmentDate) {
                        params.appointmentDate = formData.appointmentDate;
                        if (formData.appointmentDate.includes('T')) {
                            params.appointmentTime = formData.appointmentDate.split('T')[1];
                        }
                    } else {
                        params.appointmentDate = selectedDate.toISOString();
                    }
                    const res = await axios.get(`${API_URL}/api/queue/public/estimate-wait`, { params });
                    if (res.data.success) {
                        setEstimatedWaitTime(res.data.estimatedWait);
                    }
                } catch (error) {
                    console.error("Wait time estimation failed", error);
                    // Fallback to experience-based estimate if API fails
                    const doc = getSelectedDoctor();
                    const baseWait = doc?.experience ? Math.max(10, 30 - doc.experience) : 15;
                    setEstimatedWaitTime(baseWait);
                }
            };
            fetchWaitTime();
        }
    }, [formData.clinicId, formData.doctorId, formData.appointmentType, formData.appointmentDate, selectedDate]);

    const handleConfirmBooking = async () => {
        if (!formData.appointmentDate) { setError('Selection required: Please pick a clinical slot.'); return; }
        if (!formData.reason.trim()) { setError('Required: Please state the purpose of your visit.'); return; }
        
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${API_URL}/api/auth/patient/book-appointment`,
                {
                    clinicId: formData.clinicId,
                    doctorId: formData.doctorId,
                    appointmentDate: formData.appointmentDate,
                    appointmentType: formData.appointmentType,
                    reason: formData.reason,
                    rescheduleAppointmentId: formData.rescheduleAppointmentId
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: formData.rescheduleAppointmentId ? 'Reschedule Submitted!' : 'Booking Confirmed!',
                    text: formData.rescheduleAppointmentId 
                        ? 'Your reschedule request has been submitted to the receptionist for confirmation.' 
                        : 'Your request is being processed by the clinical team.',
                    background: '#F8FAFC',
                    confirmButtonColor: '#0D9488',
                    customClass: {
                        popup: 'rounded-[2rem]',
                        confirmButton: 'rounded-xl px-10 py-3 font-black uppercase text-[10px] tracking-widest'
                    }
                }).then(() => navigate('/patient/dashboard'));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'The clinical server encountered an error.');
        } finally {
            setLoading(false);
        }
    };

    const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(searchClinic.toLowerCase()) || c.address.toLowerCase().includes(searchClinic.toLowerCase()));

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-body">
            <Sidebar role="patient" />
            
            <div className="flex-grow p-6 lg:p-10 overflow-y-auto h-screen custom-scrollbar max-w-6xl mx-auto w-full">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                {step === 4 ? 'Final Review' : `Phase ${step} of 4`}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Book Slot <span className="text-teal-600">.</span>
                        </h1>
                        <p className="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-[0.2em]">Schedule your next clinical consultation.</p>
                    </div>

                    {step > 1 && (
                        <button 
                            onClick={() => setStep(step - 1)}
                            className="group flex items-center gap-3 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm active:scale-95 font-black text-[10px] uppercase tracking-widest"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
                        </button>
                    )}
                </header>

                {/* Progress Tracker - Premium Design */}
                <div className="grid grid-cols-4 gap-4 mb-12">
                    <StepBar num={1} label="Clinic" active={step >= 1} current={step === 1} />
                    <StepBar num={2} label="Specialist" active={step >= 2} current={step === 2} />
                    <StepBar num={3} label="Timeline" active={step >= 3} current={step === 3} />
                    <StepBar num={4} label="Confirm" active={step >= 4} current={step === 4} />
                </div>

                {/* Main Content Area */}
                <main className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {step === 1 && (
                        <div className="space-y-10">
                            <div className="relative group max-w-2xl">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={22} />
                                <input 
                                    type="text" 
                                    placeholder="Search clinical facility or city..."
                                    className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-3xl outline-none focus:border-teal-500 text-lg font-black shadow-sm group-hover:shadow-md transition-all placeholder:text-slate-200 placeholder:font-bold"
                                    value={searchClinic}
                                    onChange={(e) => setSearchClinic(e.target.value)}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[2.5rem]" />)
                                ) : filteredClinics.length > 0 ? (
                                    filteredClinics.map(clinic => (
                                        <button
                                            key={clinic._id}
                                            onClick={() => { setFormData({ ...formData, clinicId: clinic._id }); setStep(2); }}
                                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 text-left hover:border-teal-500 hover:shadow-2xl transition-all group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-[4rem] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                                                    <Building2 size={28} />
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-100">
                                                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Available
                                                </div>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-3 group-hover:text-teal-600 transition-colors">{clinic.name}</h3>
                                            <div className="space-y-3 mb-8">
                                                <div className="flex items-start gap-3 text-slate-400 text-[10px] font-bold">
                                                    <MapPin size={14} className="text-teal-500 shrink-0" /> {clinic.address}
                                                </div>
                                                <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold">
                                                    <Phone size={14} className="text-teal-500 shrink-0" /> {clinic.contactPhone}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-[10px] font-black uppercase">
                                                        {clinic.doctorCount || '0'}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Specialists</span>
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                                                    <ArrowRight size={18} />
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-20 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Search size={32} className="text-slate-200" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-400">No Clinics Found</h3>
                                        <p className="text-sm font-bold text-slate-300 mt-2">Try searching for a different name or city.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-10">
                            <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><Activity size={180} /></div>
                                <div className="relative z-10">
                                    <p className="text-[9px] font-black text-teal-400 uppercase tracking-[0.3em] mb-3">Facility Confirmed</p>
                                    <h3 className="text-3xl font-black tracking-tight">{getSelectedClinic()?.name}</h3>
                                    <p className="text-slate-400 text-xs font-bold mt-2 flex items-center gap-2">
                                        <MapPin size={14} className="text-teal-500" /> {getSelectedClinic()?.address}
                                    </p>
                                </div>
                                <button onClick={() => setStep(1)} className="relative z-10 px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest transition-all border border-white/10 backdrop-blur-md">
                                    Switch Facility
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {doctors.map(doctor => (
                                    <button
                                        key={doctor._id}
                                        onClick={() => { setFormData({ ...formData, doctorId: doctor._id }); setStep(3); }}
                                        className="bg-white p-8 rounded-[3rem] border border-slate-100 text-left hover:border-teal-500 hover:shadow-2xl transition-all group flex items-center gap-8"
                                    >
                                        <div className="relative">
                                            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[2.5rem] flex items-center justify-center text-slate-400 text-3xl font-black group-hover:from-teal-500 group-hover:to-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-xl">
                                                {doctor.name?.charAt(0)}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full animate-pulse" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-teal-600 uppercase tracking-[0.2em] mb-1">{doctor.specialization}</p>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Dr. {doctor.name}</h3>
                                            <div className="flex items-center gap-4 mt-6">
                                                <div className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {doctor.experience || 0} Years Exp
                                                </div>
                                                <div className="px-3 py-1 bg-teal-50 rounded-lg text-[9px] font-black text-teal-600 uppercase tracking-widest">
                                                    Active
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
                                            <ArrowRight size={22} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5">

                            {/* Rescheduling Banner */}
                            {formData.rescheduleAppointmentId && (
                                <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-100 rounded-2xl animate-in fade-in duration-300">
                                    <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                        <Clock size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-900 text-sm">Rescheduling Visit</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Select your new preferred slot below</p>
                                    </div>
                                    <span className="shrink-0 px-2.5 py-1 bg-teal-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl">Active</span>
                                </div>
                            )}

                            {/* â”€â”€ DATE SELECTION â”€â”€ */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                                            <CalendarDays size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900">Choose Date</h3>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                                Today: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-teal-100">14 Days</span>
                                </div>

                                {/* Date Strip â€” tight, scrollable */}
                                <div className="flex gap-2.5 overflow-x-auto px-5 pb-5 no-scrollbar">
                                    {dateStrip.map((date, idx) => {
                                        const isSelected = selectedDate.toDateString() === date.toDateString();
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => { setSelectedDate(date); setFormData({ ...formData, appointmentDate: '' }); }}
                                                className={`flex flex-col items-center shrink-0 w-[58px] py-3 px-1 rounded-2xl border-2 transition-all ${
                                                    isSelected
                                                        ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-500/25 scale-105'
                                                        : 'border-slate-100 bg-slate-50/60 text-slate-500 hover:border-teal-200 hover:bg-white'
                                                }`}
                                            >
                                                <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${isSelected ? 'text-teal-100' : 'text-slate-300'}`}>
                                                    {idx === 0 ? 'Today' : WEEKDAY_MAP[date.getDay()].slice(0, 3)}
                                                </span>
                                                <span className="text-lg font-black leading-none">{date.getDate()}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* â”€â”€ SLOT SELECTION â”€â”€ */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                {/* Header + Mode Toggle */}
                                <div className="px-5 pt-5 pb-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                                                <Clock size={16} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-900">Select Time Slot</h3>
                                        </div>
                                    </div>
                                    {/* Slot Mode Tabs */}
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-1">
                                        {[['quick','Hourly Slots'],['shift','Shift Booking'],['manual','Custom Time']].map(([mode, label]) => (
                                            <button
                                                key={mode}
                                                onClick={() => setFormData({ ...formData, slotMode: mode, appointmentDate: '' })}
                                                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                    formData.slotMode === mode
                                                        ? 'bg-white text-teal-600 shadow-sm border border-slate-100'
                                                        : 'text-slate-400'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Slot Grid â€” quick mode */}
                                {formData.slotMode === 'quick' && (
                                    <div className="px-5 pb-5">
                                        {availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                                                {availableSlots.map((slot, idx) => {
                                                    const slotKey = toLocalDateTimeKey(slot);
                                                    const isActive = formData.appointmentDate === slotKey;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setFormData({ ...formData, appointmentDate: slotKey })}
                                                            className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${
                                                                isActive
                                                                    ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                                                                    : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-teal-200 hover:bg-white'
                                                            }`}
                                                        >
                                                            <div className="text-[11px] font-black tracking-tight leading-none">
                                                                {slot.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No availability on this date</p>
                                                <p className="text-[9px] text-slate-300 mt-1 font-medium">Try another date from the strip above.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Shift Mode */}
                                {formData.slotMode === 'shift' && (
                                    <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Morning */}
                                        <button
                                            disabled={(() => {
                                                const now = new Date();
                                                if (selectedDate.toDateString() !== now.toDateString()) return false;
                                                const [bh, bm] = getClinicTimingConfig().breakStartTime.split(':').map(Number);
                                                const breakStart = new Date(selectedDate);
                                                breakStart.setHours(bh, bm, 0, 0);
                                                return now >= breakStart;
                                            })()}
                                            onClick={() => {
                                                const { openingTime } = getClinicTimingConfig();
                                                const slotKey = `${selectedDate.toISOString().split('T')[0]}T${openingTime}`;
                                                setFormData({ ...formData, appointmentDate: slotKey });
                                            }}
                                            className={`p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                                                formData.appointmentDate.endsWith(getClinicTimingConfig().openingTime)
                                                    ? 'border-teal-500 bg-teal-600 text-white shadow-lg'
                                                    : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:border-teal-200 hover:bg-white'
                                            }`}
                                        >
                                            <h4 className="text-sm font-black mb-1">Morning Shift</h4>
                                            <p className={`text-[10px] font-bold ${formData.appointmentDate.endsWith(getClinicTimingConfig().openingTime) ? 'text-teal-100' : 'text-slate-400'}`}>
                                                {getClinicTimingConfig().openingTime} - {getClinicTimingConfig().breakStartTime}
                                            </p>
                                        </button>

                                        {/* Afternoon */}
                                        <button
                                            disabled={(() => {
                                                const now = new Date();
                                                if (selectedDate.toDateString() !== now.toDateString()) return false;
                                                const [ch, cm] = getClinicTimingConfig().closingTime.split(':').map(Number);
                                                const closeTime = new Date(selectedDate);
                                                closeTime.setHours(ch, cm, 0, 0);
                                                return now >= closeTime;
                                            })()}
                                            onClick={() => {
                                                const { breakEndTime } = getClinicTimingConfig();
                                                const slotKey = `${selectedDate.toISOString().split('T')[0]}T${breakEndTime}`;
                                                setFormData({ ...formData, appointmentDate: slotKey });
                                            }}
                                            className={`p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                                                formData.appointmentDate.endsWith(getClinicTimingConfig().breakEndTime)
                                                    ? 'border-teal-500 bg-teal-600 text-white shadow-lg'
                                                    : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:border-teal-200 hover:bg-white'
                                            }`}
                                        >
                                            <h4 className="text-sm font-black mb-1">Afternoon Shift</h4>
                                            <p className={`text-[10px] font-bold ${formData.appointmentDate.endsWith(getClinicTimingConfig().breakEndTime) ? 'text-teal-100' : 'text-slate-400'}`}>
                                                {getClinicTimingConfig().breakEndTime} - {getClinicTimingConfig().closingTime}
                                            </p>
                                        </button>
                                    </div>
                                )}

                                {/* Custom Time */}
                                {formData.slotMode === 'manual' && (
                                    <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Selected Date</label>
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl font-black text-slate-900 text-sm flex items-center justify-between">
                                                {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                <Calendar size={16} className="text-teal-500" />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Select Time</label>
                                            <input
                                                type="time"
                                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-teal-500 font-black text-slate-900 text-sm"
                                                value={formData.appointmentDate.split('T')[1] || '10:00'}
                                                onChange={(e) => setFormData({ ...formData, appointmentDate: `${selectedDate.toISOString().split('T')[0]}T${e.target.value}` })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* â”€â”€ WAIT INTELLIGENCE + VERIFY BOOKING â”€â”€ */}
                            <div
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Predictive Wait Intelligence ðŸ§ ',
                                        html: `
                                            <div class="text-left space-y-4 text-slate-600 font-sans mt-4">
                                                <p>This estimate is dynamically computed using SwasthyaMitra's AI Engine based on:</p>
                                                <ul class="list-disc pl-5 space-y-2 text-xs">
                                                    <li>Doctor's average consultation duration.</li>
                                                    <li>Today's active queue load &amp; scheduling density.</li>
                                                    <li>Statistical delay factor (~14 min per ahead patient).</li>
                                                </ul>
                                                <div class="p-4 bg-teal-50 rounded-2xl border border-teal-100 mt-6 text-center">
                                                    <p class="text-teal-700 font-black text-sm">Estimated Waiting: ~${estimatedWaitTime || 15} mins</p>
                                                </div>
                                            </div>
                                        `,
                                        confirmButtonColor: '#0D9488',
                                        confirmButtonText: 'Understood',
                                        customClass: {
                                            popup: 'rounded-[2rem]',
                                            confirmButton: 'rounded-xl px-10 py-3 font-black uppercase text-[10px] tracking-widest'
                                        }
                                    });
                                }}
                                className="bg-slate-900 rounded-2xl overflow-hidden cursor-pointer hover:bg-slate-800 active:scale-[0.99] transition-all"
                            >
                                {/* Wait Info Row */}
                                <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-teal-400 shrink-0">
                                        <Activity size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-teal-400 uppercase tracking-[0.2em]">Predictive Wait Intelligence</p>
                                        <p className="text-white font-black text-base tracking-tight mt-0.5">
                                            Est. Wait: <span className="text-teal-300">{estimatedWaitTime || 15} Mins</span>
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-white/30 shrink-0" />
                                </div>

                                {/* Verify Booking Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStep(4);
                                    }}
                                    disabled={!formData.appointmentDate}
                                    className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:grayscale text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {formData.appointmentDate ? <><CheckCircle size={16} /> Verify Booking</> : <><Clock size={16} /> Select a Slot First</>}
                                    {formData.appointmentDate && <ArrowRight size={16} />}
                                </button>
                            </div>

                        </div>
                    )}

                    {step === 4 && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white border border-slate-100 rounded-[4rem] shadow-2xl overflow-hidden">
                                <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-black text-2xl text-slate-900 tracking-tight">Final Confirmation</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review your visit details below</p>
                                    </div>
                                    <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center border border-teal-100"><ShieldCheck size={24} /></div>
                                </div>
                                
                                <div className="p-12 space-y-12">
                                    <div className="grid md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <ReviewItem icon={<Building2 size={18} />} label="Clinic Facility" val={getSelectedClinic()?.name} sub={getSelectedClinic()?.address} />
                                            <ReviewItem icon={<Stethoscope size={18} />} label="Consulting Specialist" val={`Dr. ${getSelectedDoctor()?.name}`} sub={getSelectedDoctor()?.specialization} />
                                            <ReviewItem 
                                                icon={<Calendar size={18} />} 
                                                label="Appointment Date" 
                                                val={formData.appointmentDate ? new Date(formData.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} 
                                                sub={formData.appointmentDate ? WEEKDAY_MAP[new Date(formData.appointmentDate).getDay()] : ''} 
                                            />
                                            <ReviewItem 
                                                icon={<Clock size={18} />} 
                                                label="Arrival Window" 
                                                val={
                                                    formData.appointmentDate 
                                                        ? (formData.slotMode === 'shift' 
                                                            ? (formData.appointmentDate.endsWith(getClinicTimingConfig().openingTime) ? 'Morning Shift' : 'Afternoon / Evening Shift')
                                                            : new Date(formData.appointmentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
                                                        : ''
                                                } 
                                                sub={
                                                    formData.slotMode === 'shift'
                                                        ? `Arrival around start time: ${formData.appointmentDate ? formData.appointmentDate.split('T')[1] : ''}`
                                                        : "Check-in required 10m early"
                                                } 
                                            />
                                        </div>
                                        
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Consultation Type</label>
                                                <div className="flex gap-4">
                                                    {['new', 'followup'].map(type => (
                                                        <button 
                                                            key={type}
                                                            onClick={() => setFormData({ ...formData, appointmentType: type })}
                                                            className={`flex-1 py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.appointmentType === type ? 'border-teal-500 bg-teal-50 text-teal-600 shadow-md' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                                                        >
                                                            {type} Visit
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Clinical Notes / Reason</label>
                                                <textarea 
                                                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:border-teal-500 text-sm font-bold resize-none shadow-inner"
                                                    rows="4"
                                                    placeholder="Briefly describe your symptoms or reason for visit..."
                                                    value={formData.reason}
                                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 text-[10px] font-black uppercase tracking-widest animate-in shake duration-500">
                                            <AlertCircle size={20} /> {error}
                                        </div>
                                    )}

                                    <button 
                                        onClick={handleConfirmBooking}
                                        disabled={loading}
                                        className="w-full py-7 bg-teal-600 hover:bg-teal-700 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-teal-600/30 flex items-center justify-center gap-5 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? <Loader className="animate-spin" size={24} /> : <><CheckCircle size={24} /> Finalize Appointment</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

// UI Components
const StepBar = ({ num, label, active, current }) => (
    <div className={`relative transition-all duration-700 ${active ? 'opacity-100' : 'opacity-30'}`}>
        <div className={`h-1.5 w-full rounded-full transition-all duration-700 ${active ? 'bg-teal-600 shadow-[0_0_15px_rgba(13,148,136,0.5)]' : 'bg-slate-200'}`} />
        <div className="mt-4 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] transition-all duration-700 ${current ? 'bg-teal-600 text-white shadow-xl rotate-12' : active ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                {active && !current ? <Check size={14} /> : num}
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest ${current ? 'text-teal-600' : 'text-slate-400'}`}>{label}</span>
        </div>
    </div>
);

const ReviewItem = ({ icon, label, val, sub }) => (
    <div className="flex items-start gap-6 group">
        <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all duration-300 shrink-0 shadow-sm">
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-lg font-black text-slate-900 leading-tight">{val || '---'}</p>
            {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
        </div>
    </div>
);

export default BookAppointment;
