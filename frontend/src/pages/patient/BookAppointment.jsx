import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
    Building2, Stethoscope, Calendar, CalendarOff, ArrowRight, ArrowLeft,
    MapPin, Phone, CheckCircle, AlertCircle, Loader, Search, Clock, Activity, Zap, Check, ChevronRight, X, CalendarDays, ShieldCheck, GraduationCap, Briefcase
} from 'lucide-react';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';
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

const BookAppointment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const rescheduleApp = location.state?.rescheduleApp;

    const initialClinicId = rescheduleApp?.clinicId?._id 
        || (typeof rescheduleApp?.clinicId === 'string' ? rescheduleApp.clinicId : '') 
        || rescheduleApp?.clinicId?.toString?.() 
        || '';
    const initialDoctorId = rescheduleApp?.doctorId?._id 
        || (typeof rescheduleApp?.doctorId === 'string' ? rescheduleApp.doctorId : '') 
        || rescheduleApp?.doctorId?.toString?.() 
        || '';
    const initialQueueId = rescheduleApp?.queueId?._id 
        || (typeof rescheduleApp?.queueId === 'string' ? rescheduleApp.queueId : '') 
        || rescheduleApp?.queueId?.toString?.() 
        || rescheduleApp?._id?.toString?.() 
        || '';

    const [step, setStep] = useState(rescheduleApp ? 3 : 1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [clinicHolidays, setClinicHolidays] = useState([]);
    const [doctorLeaves, setDoctorLeaves] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
    const [searchClinic, setSearchClinic] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => {
        if (rescheduleApp?.appointmentDate) {
            const d = new Date(rescheduleApp.appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!isNaN(d.getTime()) && d >= today) {
                return d;
            }
        }
        return new Date();
    });

    const [formData, setFormData] = useState({
        clinicId: initialClinicId,
        doctorId: initialDoctorId,
        appointmentDate: '',
        appointmentType: rescheduleApp?.appointmentType || 'new',
        reason: rescheduleApp?.reason || 'Rescheduled consultation visit',
        slotMode: 'quick',
        rescheduleAppointmentId: initialQueueId
    });

    useEffect(() => {
        if (rescheduleApp) {
            const cId = rescheduleApp.clinicId?._id || (typeof rescheduleApp.clinicId === 'string' ? rescheduleApp.clinicId : '') || rescheduleApp.clinicId?.toString?.() || '';
            const dId = rescheduleApp.doctorId?._id || (typeof rescheduleApp.doctorId === 'string' ? rescheduleApp.doctorId : '') || rescheduleApp.doctorId?.toString?.() || '';
            const qId = rescheduleApp.queueId?._id || (typeof rescheduleApp.queueId === 'string' ? rescheduleApp.queueId : '') || rescheduleApp.queueId?.toString?.() || rescheduleApp._id?.toString?.() || '';

            setFormData(prev => ({
                ...prev,
                clinicId: cId || prev.clinicId,
                doctorId: dId || prev.doctorId,
                appointmentType: rescheduleApp.appointmentType || prev.appointmentType,
                reason: rescheduleApp.reason !== undefined ? rescheduleApp.reason : prev.reason,
                rescheduleAppointmentId: qId || prev.rescheduleAppointmentId
            }));

            if (rescheduleApp.appointmentDate) {
                const d = new Date(rescheduleApp.appointmentDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (!isNaN(d.getTime()) && d >= today) {
                    setSelectedDate(d);
                }
            }
            setStep(3);
        }
    }, [rescheduleApp]);

    // Fallback: match clinic by name if clinicId was not resolved from object
    useEffect(() => {
        if (rescheduleApp && !formData.clinicId && clinics.length > 0) {
            const nameToFind = rescheduleApp.clinicName || rescheduleApp.clinicId?.name;
            if (nameToFind) {
                const matched = clinics.find(c => c.name?.toLowerCase().trim() === nameToFind.toLowerCase().trim());
                if (matched) {
                    setFormData(prev => ({ ...prev, clinicId: matched._id }));
                }
            }
        }
    }, [clinics, rescheduleApp, formData.clinicId]);

    // Fallback: match doctor by name once doctors list is available
    useEffect(() => {
        if (rescheduleApp && !formData.doctorId && doctors.length > 0) {
            const nameToFind = rescheduleApp.doctorName || rescheduleApp.doctorId?.name;
            if (nameToFind) {
                const clean = nameToFind.replace(/^Dr\.?\s*/i, '').trim().toLowerCase();
                const matched = doctors.find(d => d.name?.toLowerCase().includes(clean) || clean.includes(d.name?.toLowerCase()));
                if (matched) {
                    setFormData(prev => ({ ...prev, doctorId: matched._id }));
                }
            }
        }
    }, [doctors, rescheduleApp, formData.doctorId]);

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
            } catch {
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
                } catch {
                    setError('Could not retrieve specialist list.');
                } finally {
                    setLoading(false);
                }
            };
            fetchDoctors();

            const fetchClinicLeaves = async () => {
                try {
                    const res = await axios.get(`${API_URL}/api/clinic/public/leaves/${formData.clinicId}`);
                    if (res.data.success) {
                        setClinicHolidays(res.data.data.holidays || []);
                        setDoctorLeaves(res.data.data.doctorLeaves || []);
                    }
                } catch {
                    setClinicHolidays([]);
                    setDoctorLeaves([]);
                }
            };
            fetchClinicLeaves();
        }
    }, [formData.clinicId]);

    const getSelectedClinic = useCallback(() => {
        const found = clinics.find(c => c._id === formData.clinicId);
        if (found) return found;
        if (rescheduleApp) {
            return {
                _id: formData.clinicId,
                name: rescheduleApp.clinicName || rescheduleApp.clinicId?.name || 'Clinic Facility',
                address: rescheduleApp.clinicAddress || rescheduleApp.clinicId?.address || 'Clinical Facility'
            };
        }
        return null;
    }, [clinics, formData.clinicId, rescheduleApp]);

    const getSelectedDoctor = useCallback(() => {
        const found = doctors.find(d => d._id === formData.doctorId);
        if (found) return found;
        if (rescheduleApp) {
            return {
                _id: formData.doctorId,
                name: rescheduleApp.doctorName || rescheduleApp.doctorId?.name || 'Consultant Specialist',
                specialization: rescheduleApp.doctorSpecialization || rescheduleApp.doctorId?.specialization || 'Specialist'
            };
        }
        return null;
    }, [doctors, formData.doctorId, rescheduleApp]);

    const getDateAvailability = useCallback((date) => {
        if (!date || isNaN(date.getTime())) {
            return { isAvailable: true };
        }

        const weekday = WEEKDAY_MAP[date.getDay()];
        const selectedClinic = getSelectedClinic();
        const workingDays = selectedClinic?.workingDays?.length
            ? selectedClinic.workingDays.map(w => w.toLowerCase())
            : DEFAULT_WORKING_DAYS;

        // 1. Clinic weekly schedule (e.g. Sunday or off-days)
        if (!workingDays.includes(weekday)) {
            const isSunday = weekday === 'sunday';
            return {
                isAvailable: false,
                type: isSunday ? 'sunday_off' : 'weekly_off',
                badgeText: isSunday ? 'Sun Closed' : 'Closed',
                reason: isSunday
                    ? 'The clinic is closed on Sundays (Weekly Holiday).'
                    : `The clinic is closed on ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}s (Weekly Off).`
            };
        }

        // 2. Doctor custom weekly available days
        const selectedDoc = getSelectedDoctor();
        if (selectedDoc && Array.isArray(selectedDoc.availableDays) && selectedDoc.availableDays.length > 0) {
            const docDays = selectedDoc.availableDays.map(d => d.toLowerCase());
            if (!docDays.includes(weekday)) {
                return {
                    isAvailable: false,
                    type: 'doctor_weekly_off',
                    badgeText: 'Doc Off',
                    reason: `Dr. ${selectedDoc.name} is not available on ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}s.`
                };
            }
        }

        // 3. Clinic-wide holiday
        const checkTime = new Date(date).setHours(12, 0, 0, 0);
        for (const holiday of clinicHolidays) {
            const start = new Date(holiday.startDate).setHours(0, 0, 0, 0);
            const end = new Date(holiday.endDate).setHours(23, 59, 59, 999);
            if (checkTime >= start && checkTime <= end) {
                return {
                    isAvailable: false,
                    type: 'clinic_holiday',
                    badgeText: 'Holiday',
                    title: holiday.title,
                    reason: `Clinic Holiday: ${holiday.title}${holiday.reason ? ` (${holiday.reason})` : ''}`
                };
            }
        }

        // 4. Doctor-specific leave
        if (formData.doctorId) {
            for (const leave of doctorLeaves) {
                const leaveDocId = leave.doctorId?._id || leave.doctorId;
                if (leaveDocId && leaveDocId.toString() === formData.doctorId.toString()) {
                    const start = new Date(leave.startDate).setHours(0, 0, 0, 0);
                    const end = new Date(leave.endDate).setHours(23, 59, 59, 999);
                    if (checkTime >= start && checkTime <= end) {
                        return {
                            isAvailable: false,
                            type: 'doctor_leave',
                            badgeText: 'On Leave',
                            title: leave.title,
                            reason: `Dr. ${selectedDoc?.name || 'Specialist'} is on leave on this date: "${leave.title}"${leave.reason ? ` (${leave.reason})` : ''}`
                        };
                    }
                }
            }
        }

        return { isAvailable: true };
    }, [getSelectedClinic, getSelectedDoctor, clinicHolidays, doctorLeaves, formData.doctorId]);

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
        } catch {
            setBookedSlots([]);
            return [];
        }
    }, [formData.clinicId, formData.doctorId, selectedDate]);

    useEffect(() => {
        let active = true;
        if (formData.doctorId && step === 3) {
            Promise.resolve().then(() => {
                if (active) fetchBookedSlots();
            });
        }
        return () => { active = false; };
    }, [formData.doctorId, selectedDate, step, fetchBookedSlots]);

    const generateAvailableSlots = useCallback(() => {
        const slots = [];
        const { openingTime, closingTime, breakStartTime, breakEndTime, slotDurationMinutes, workingDays } = getClinicTimingConfig();

        const [openHour, openMinute] = openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);
        const [breakStartHour, breakStartMinute] = breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = breakEndTime.split(':').map(Number);

        const currentDay = WEEKDAY_MAP[selectedDate.getDay()];
        if (!workingDays.includes(currentDay) || !getDateAvailability(selectedDate).isAvailable) {
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
    }, [bookedSlots, getClinicTimingConfig, selectedDate, formData.slotMode, getDateAvailability]);

    useEffect(() => {
        let active = true;
        if (formData.clinicId && formData.doctorId && step === 3) {
            Promise.resolve().then(() => {
                if (active) generateAvailableSlots();
            });
        }
        return () => { active = false; };
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
    }, [formData.clinicId, formData.doctorId, formData.appointmentType, formData.appointmentDate, selectedDate, getSelectedDoctor]);

    const handleConfirmBooking = async () => {
        if (!formData.appointmentDate) { setError('Selection required: Please pick a clinical slot.'); return; }
        if (!formData.reason.trim()) { setError('Required: Please state the purpose of your visit.'); return; }

        const datePart = formData.appointmentDate.split('T')[0];
        const [y, m, d] = datePart.split('-').map(Number);
        const targetDate = new Date(y, m - 1, d);
        const dateAvail = getDateAvailability(targetDate);
        if (!dateAvail.isAvailable) {
            setError(`Cannot book appointment: ${dateAvail.reason}`);
            Swal.fire({
                icon: 'error',
                title: 'Date Unavailable',
                text: dateAvail.reason,
                confirmButtonColor: '#0D9488'
            });
            return;
        }

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
                        confirmButton: 'rounded-xl px-10 py-3 font-semibold text-sm'
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
        <div className="px-4 py-4 md:p-6 lg:p-10 max-w-6xl mx-auto w-full">
            <SEO title="Book Appointment" noindex={true} />

            <div className="w-full">
                {/* Header Section */}
                <header className="flex items-center justify-between gap-3 mb-5 md:mb-8 lg:mb-10">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold uppercase tracking-wider border border-teal-100">
                                {rescheduleApp ? (step === 4 ? 'Review Reschedule' : 'Step 1/2 • Pick Date & Slot') : (step === 4 ? 'Final Review' : `Step ${step}/4`)}
                            </span>
                        </div>
                        <h1 className="text-xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            {rescheduleApp ? 'Reschedule Appointment' : 'Book Appointment'} <span className="text-teal-600 hidden md:inline">.</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-xs mt-0.5 hidden sm:block">
                            {rescheduleApp ? 'Pick a new date and convenient time slot for your consultation.' : 'Schedule your next clinical consultation.'}
                        </p>
                    </div>

                    {step > 1 && (
                        <button
                            onClick={() => {
                                if (rescheduleApp && step === 3) {
                                    navigate('/patient/dashboard');
                                } else {
                                    setStep(step - 1);
                                }
                            }}
                            className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm active:scale-95 font-semibold text-xs shrink-0"
                        >
                            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="hidden sm:inline">Back</span>
                        </button>
                    )}
                </header>

                {/* Progress Tracker - Responsive */}
                <div className="grid grid-cols-4 gap-1.5 md:gap-4 mb-5 md:mb-12">
                    <StepBar num={1} label="Clinic" active={step >= 1 || !!rescheduleApp} current={step === 1} />
                    <StepBar num={2} label="Doctor" active={step >= 2 || !!rescheduleApp} current={step === 2} />
                    <StepBar num={3} label="Time" active={step >= 3} current={step === 3} />
                    <StepBar num={4} label="Confirm" active={step >= 4} current={step === 4} />
                </div>

                {/* Main Content Area */}
                <main className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    {step === 1 && (
                        <div className="space-y-4 md:space-y-10">
                            {/* Search Bar */}
                            <div className="relative group">
                                <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search clinic or city..."
                                    className="w-full pl-12 md:pl-16 pr-4 py-3.5 md:py-6 bg-white border border-slate-100 rounded-2xl md:rounded-3xl outline-none focus:border-teal-500 text-sm md:text-base font-medium shadow-sm transition-all placeholder:text-slate-300"
                                    value={searchClinic}
                                    onChange={(e) => setSearchClinic(e.target.value)}
                                />
                            </div>

                            {/* Clinic Grid — 1 column on mobile, 2 on md, 3 on lg */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                                {loading ? (
                                    [1, 2, 3].map(i => <div key={i} className="h-24 md:h-64 bg-slate-50 animate-pulse rounded-2xl md:rounded-[2.5rem]" />)
                                ) : filteredClinics.length > 0 ? (
                                    filteredClinics.map(clinic => (
                                        <button
                                            key={clinic._id}
                                            onClick={() => { setFormData({ ...formData, clinicId: clinic._id }); setStep(2); }}
                                            className="bg-white w-full rounded-2xl md:rounded-[2.5rem] border border-slate-100 text-left hover:border-teal-400 hover:shadow-xl transition-all group relative overflow-hidden active:scale-[0.99]"
                                        >
                                            {/* Mobile: horizontal row layout */}
                                            <div className="md:hidden flex items-center gap-3 p-4">
                                                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-500 group-active:bg-teal-600 group-active:text-white transition-all shrink-0">
                                                    <Building2 size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-teal-600 transition-colors">{clinic.name}</h3>
                                                    <p className="text-xs font-normal text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                        <MapPin size={10} className="text-teal-500 shrink-0" /> {clinic.address}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100">{clinic.doctorCount || '0'} Dr</span>
                                                    <ArrowRight size={16} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                                                </div>
                                            </div>

                                            {/* Desktop: vertical card layout */}
                                            <div className="hidden md:block p-8">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-bl-[4rem] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                                <div className="flex justify-between items-start mb-8 relative z-10">
                                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                                                        <Building2 size={28} />
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-semibold border border-green-100">
                                                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> Available
                                                    </div>
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-3 group-hover:text-teal-600 transition-colors">{clinic.name}</h3>
                                                <div className="space-y-3 mb-8">
                                                    <div className="flex items-start gap-3 text-slate-500 text-sm font-normal">
                                                        <MapPin size={14} className="text-teal-500 shrink-0" /> {clinic.address}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-slate-500 text-sm font-normal">
                                                        <Phone size={14} className="text-teal-500 shrink-0" /> {clinic.contactPhone}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative z-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-sm font-bold">{clinic.doctorCount || '0'}</span>
                                                        <span className="text-xs font-medium text-slate-500">Specialists</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                                                        <ArrowRight size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-12 md:py-20 text-center">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Search size={28} className="text-slate-200" />
                                        </div>
                                        <h3 className="text-base md:text-xl font-bold text-slate-400">No Clinics Found</h3>
                                        <p className="text-xs md:text-sm font-normal text-slate-400 mt-1">Try a different name or city.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 md:space-y-10">
                            {/* Selected clinic banner — compact on mobile */}
                            <div className="bg-slate-900 p-4 md:p-8 rounded-2xl md:rounded-3xl text-white flex items-center md:flex-row justify-between gap-3 md:gap-8 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 md:p-12 opacity-5 rotate-12 hidden md:block"><Activity size={180} /></div>
                                <div className="relative z-10 flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider mb-1">Facility Confirmed</p>
                                    <h3 className="text-base md:text-2xl font-bold tracking-tight truncate">{getSelectedClinic()?.name}</h3>
                                    <p className="text-slate-400 text-xs md:text-sm font-medium mt-0.5 flex items-center gap-1.5 truncate">
                                        <MapPin size={12} className="text-teal-500 shrink-0" /> {getSelectedClinic()?.address}
                                    </p>
                                </div>
                                <button onClick={() => setStep(1)} className="relative z-10 px-3.5 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-white font-semibold text-xs uppercase tracking-wider transition-all border border-white/10 shrink-0">
                                    Change
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8">
                                {doctors.map(doctor => (
                                    <div
                                        key={doctor._id}
                                        className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-100 text-left hover:border-teal-400 hover:shadow-xl transition-all group flex flex-col"
                                    >
                                        {/* Mobile: compact row */}
                                        <div className="md:hidden flex items-center gap-3 p-4">
                                            <div className="relative shrink-0">
                                                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-600 text-xl font-bold group-hover:from-teal-500 group-hover:to-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                                    {doctor.name?.charAt(0)}
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide truncate">{doctor.specialization || 'General'}</p>
                                                <h3 className="text-sm font-bold text-slate-900 truncate">Dr. {doctor.name}</h3>
                                                <p className="text-xs font-medium text-slate-400 mt-0.5">{doctor.experience || 0} yrs exp</p>
                                            </div>
                                            <button
                                                onClick={() => { setFormData({ ...formData, doctorId: doctor._id }); setStep(3); }}
                                                className="px-3 py-2 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-xl font-semibold text-xs tracking-wide transition-all active:scale-95 shrink-0 flex items-center gap-1"
                                            >
                                                Pick <ArrowRight size={12} />
                                            </button>
                                        </div>

                                        {/* Desktop: full card */}
                                        <div className="hidden md:flex flex-col flex-1 p-8">
                                            <div>
                                                <div className="flex items-start gap-6 mb-6">
                                                    <div className="relative shrink-0">
                                                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[2rem] flex items-center justify-center text-slate-500 text-2xl font-bold group-hover:from-teal-500 group-hover:to-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-xl">
                                                            {doctor.name?.charAt(0)}
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full animate-pulse" />
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mb-1">{doctor.specialization || 'General Practitioner'}</p>
                                                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight truncate">Dr. {doctor.name}</h3>
                                                        {doctor.education && (
                                                            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                                                                <GraduationCap size={14} className="text-teal-500 shrink-0" /> {doctor.education}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {doctor.bio && (
                                                    <p className="text-sm text-slate-600 italic line-clamp-2 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100/50 mb-6">
                                                        &ldquo;{doctor.bio}&rdquo;
                                                    </p>
                                                )}

                                                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 mb-6">
                                                    <div className="flex items-center gap-1.5 bg-slate-50/50 px-3.5 py-2 rounded-xl border border-slate-100/20">
                                                        <Briefcase size={13} className="text-teal-500" /> {doctor.experience || 0} Yrs Exp
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-slate-50/50 px-3.5 py-2 rounded-xl border border-slate-100/20">
                                                        <Clock size={13} className="text-teal-500" /> Active
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => { setFormData({ ...formData, doctorId: doctor._id }); setStep(3); }}
                                                className="w-full py-4 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                Select Doctor <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5">

                            {/* Reschedule Overview Card */}
                            {formData.rescheduleAppointmentId && (
                                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-5 md:p-6 rounded-3xl text-white shadow-xl border border-teal-500/20 relative overflow-hidden animate-in fade-in duration-300">
                                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                                        <Calendar size={120} />
                                    </div>
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-teal-300 text-xs font-semibold uppercase tracking-wider">
                                                <Clock size={12} className="animate-pulse" /> Rescheduling Appointment
                                            </div>
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                                                    {getSelectedClinic()?.name || 'Clinic Consultation'}
                                                </h3>
                                                <p className="text-teal-300 text-sm font-semibold flex items-center gap-1.5 mt-0.5">
                                                    <Stethoscope size={15} />
                                                    Dr. {getSelectedDoctor()?.name || 'Specialist'}
                                                    {getSelectedDoctor()?.specialization && (
                                                        <span className="text-xs text-slate-400 font-medium">• {getSelectedDoctor()?.specialization}</span>
                                                    )}
                                                </p>
                                            </div>
                                            {rescheduleApp?.appointmentDate && (
                                                <p className="text-xs text-slate-400 font-medium">
                                                    Original Date: <span className="text-slate-300 font-semibold">{new Date(rescheduleApp.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 self-start md:self-center">
                                            <button
                                                onClick={() => setStep(1)}
                                                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 transition-all active:scale-95"
                                            >
                                                Change Clinic/Dr
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── DATE SELECTION ─── */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                                            <CalendarDays size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900">Choose New Date</h3>
                                            <p className="text-xs font-medium text-slate-400">
                                                Selected: {selectedDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-100 cursor-pointer flex items-center gap-1.5 transition-colors">
                                            <Calendar size={13} />
                                            <span>Pick Date</span>
                                            <input
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                className="sr-only"
                                                value={selectedDate.toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const [y, m, d] = e.target.value.split('-').map(Number);
                                                        const newD = new Date(y, m - 1, d);
                                                        setSelectedDate(newD);
                                                        setFormData(prev => ({ ...prev, appointmentDate: '' }));
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Date Strip – tight, scrollable with availability badges */}
                                <div className="flex gap-2.5 overflow-x-auto px-5 pb-5 no-scrollbar">
                                    {dateStrip.map((date, idx) => {
                                        const isSelected = selectedDate.toDateString() === date.toDateString();
                                        const dateAvail = getDateAvailability(date);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => { setSelectedDate(date); setFormData({ ...formData, appointmentDate: '' }); }}
                                                className={`relative flex flex-col items-center shrink-0 min-w-[62px] py-2.5 px-1 rounded-2xl border-2 transition-all ${isSelected
                                                    ? (dateAvail.isAvailable
                                                        ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-500/25 scale-105'
                                                        : 'border-rose-500 bg-rose-600 text-white shadow-lg shadow-rose-500/25 scale-105')
                                                    : (!dateAvail.isAvailable
                                                        ? 'border-rose-100 bg-rose-50/50 text-rose-500 hover:border-rose-300'
                                                        : 'border-slate-100 bg-slate-50/60 text-slate-500 hover:border-teal-200 hover:bg-white')
                                                    }`}
                                            >
                                                <span className={`text-[11px] font-semibold mb-0.5 ${isSelected ? (dateAvail.isAvailable ? 'text-teal-100' : 'text-rose-100') : (!dateAvail.isAvailable ? 'text-rose-400' : 'text-slate-400')}`}>
                                                    {idx === 0 ? 'Today' : WEEKDAY_MAP[date.getDay()].slice(0, 3)}
                                                </span>
                                                <span className="text-lg font-bold leading-none">{date.getDate()}</span>
                                                {!dateAvail.isAvailable && (
                                                    <span className={`mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded leading-none whitespace-nowrap ${
                                                        isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {dateAvail.badgeText}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Unavailable Alert Banner for Selected Date */}
                                {(() => {
                                    const selectedAvail = getDateAvailability(selectedDate);
                                    if (!selectedAvail.isAvailable) {
                                        return (
                                            <div className="mx-5 mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center gap-3 text-rose-700 animate-in fade-in duration-200">
                                                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                                                    <CalendarOff size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-bold leading-tight">Bookings Closed on this Date</p>
                                                        <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-rose-200/70 rounded text-rose-800">
                                                            {selectedAvail.badgeText}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-rose-600/90 mt-0.5 leading-snug">{selectedAvail.reason}</p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            {/* ─── SLOT SELECTION ─── */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                {(() => {
                                    const selectedAvail = getDateAvailability(selectedDate);
                                    if (!selectedAvail.isAvailable) {
                                        return (
                                            <div className="p-8 text-center bg-rose-50/30">
                                                <div className="w-14 h-14 mx-auto mb-3 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
                                                    <CalendarOff size={26} />
                                                </div>
                                                <h4 className="text-sm font-bold text-slate-800">
                                                    {selectedAvail.type === 'weekly_off' ? 'Weekly Closed Day' :
                                                     selectedAvail.type === 'doctor_weekly_off' ? 'Specialist Weekly Off' :
                                                     selectedAvail.type === 'clinic_holiday' ? 'Clinic Holiday / Festival Closure' : 'Specialist on Leave'}
                                                </h4>
                                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                                    {selectedAvail.reason}. Please select another date from the calendar strip above to view open slots.
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <>
                                            {/* Header + Mode Toggle */}
                                            <div className="px-5 pt-5 pb-3">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                                                            <Clock size={16} />
                                                        </div>
                                                        <h3 className="text-sm font-bold text-slate-900">Select Time Slot</h3>
                                                    </div>
                                                </div>
                                                {/* Slot Mode Tabs */}
                                                <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 gap-1">
                                                    {[['quick', 'Hourly Slots'], ['shift', 'Shift Booking'], ['manual', 'Custom Time']].map(([mode, label]) => (
                                                        <button
                                                            key={mode}
                                                            onClick={() => setFormData({ ...formData, slotMode: mode, appointmentDate: '' })}
                                                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${formData.slotMode === mode
                                                                ? 'bg-white text-teal-600 shadow-sm border border-slate-100'
                                                                : 'text-slate-400'
                                                                }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Slot Grid – quick mode */}
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
                                                                        className={`py-3 px-2 rounded-xl border-2 transition-all text-center ${isActive
                                                                            ? 'border-teal-500 bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                                                                            : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-teal-200 hover:bg-white'
                                                                            }`}
                                                                    >
                                                                        <div className="text-sm font-bold tracking-tight leading-none">
                                                                            {slot.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                                            <p className="text-slate-400 font-medium text-xs">No availability on this date</p>
                                                            <p className="text-xs text-slate-400 mt-1">Try another date from the strip above.</p>
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
                                                        className={`p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${formData.appointmentDate.endsWith(getClinicTimingConfig().openingTime)
                                                            ? 'border-teal-500 bg-teal-600 text-white shadow-lg'
                                                            : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:border-teal-200 hover:bg-white'
                                                            }`}
                                                    >
                                                        <h4 className="text-sm font-bold mb-1">Morning Shift</h4>
                                                        <p className={`text-xs font-medium ${formData.appointmentDate.endsWith(getClinicTimingConfig().openingTime) ? 'text-teal-100' : 'text-slate-400'}`}>
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
                                                        className={`p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${formData.appointmentDate.endsWith(getClinicTimingConfig().breakEndTime)
                                                            ? 'border-teal-500 bg-teal-600 text-white shadow-lg'
                                                            : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:border-teal-200 hover:bg-white'
                                                            }`}
                                                    >
                                                        <h4 className="text-sm font-bold mb-1">Afternoon Shift</h4>
                                                        <p className={`text-xs font-medium ${formData.appointmentDate.endsWith(getClinicTimingConfig().breakEndTime) ? 'text-teal-100' : 'text-slate-400'}`}>
                                                            {getClinicTimingConfig().breakEndTime} - {getClinicTimingConfig().closingTime}
                                                        </p>
                                                    </button>
                                                </div>
                                            )}

                                            {/* Custom Time */}
                                            {formData.slotMode === 'manual' && (
                                                <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-slate-500 ml-1">Selected Date</label>
                                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl font-semibold text-slate-900 text-sm flex items-center justify-between">
                                                            {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            <Calendar size={16} className="text-teal-500" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-xs font-medium text-slate-500 ml-1">Select Time</label>
                                                        <input
                                                            type="time"
                                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-teal-500 font-semibold text-slate-900 text-sm"
                                                            value={formData.appointmentDate.split('T')[1] || '10:00'}
                                                            onChange={(e) => setFormData({ ...formData, appointmentDate: `${selectedDate.toISOString().split('T')[0]}T${e.target.value}` })}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            {/* ─── WAIT INTELLIGENCE + VERIFY BOOKING ─── */}
                            <div
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Predictive Wait Intelligence 🧠',
                                        html: `
                                            <div class="text-left space-y-4 text-slate-600 font-sans mt-4">
                                                <p>This estimate is dynamically computed using Appointory's AI Engine based on:</p>
                                                <ul class="list-disc pl-5 space-y-2 text-[14px]">
                                                    <li>Doctor's average consultation duration.</li>
                                                    <li>Today's active queue load &amp; scheduling density.</li>
                                                    <li>Statistical delay factor (~14 min per ahead patient).</li>
                                                </ul>
                                                <div class="p-4 bg-teal-50 rounded-2xl border border-teal-100 mt-6 text-center">
                                                    <p class="text-teal-700 font-bold text-sm">Estimated Waiting: ~${estimatedWaitTime || 15} mins</p>
                                                </div>
                                            </div>
                                        `,
                                        confirmButtonColor: '#0D9488',
                                        confirmButtonText: 'Understood',
                                        customClass: {
                                            popup: 'rounded-[2rem]',
                                            confirmButton: 'rounded-xl px-10 py-3 font-semibold text-sm'
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
                                        <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Predictive Wait Intelligence</p>
                                        <p className="text-white font-bold text-base tracking-tight mt-0.5">
                                            Est. Wait: <span className="text-teal-300">{estimatedWaitTime || 15} Mins</span>
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-white/30 shrink-0" />
                                </div>

                                {/* Verify Booking Button */}
                                {(() => {
                                    let isValid = false;
                                    let errorMsg = '';
                                    const selectedAvail = getDateAvailability(selectedDate);

                                    if (!selectedAvail.isAvailable) {
                                        errorMsg = selectedAvail.badgeText || 'Date Closed';
                                    } else if (formData.appointmentDate) {
                                        const parts = formData.appointmentDate.split('T');
                                        if (parts.length === 2) {
                                            const [year, month, day] = parts[0].split('-').map(Number);
                                            const [hour, min] = parts[1].split(':').map(Number);
                                            const selectedDateTime = new Date(year, month - 1, day, hour, min);
                                            if (selectedDateTime < new Date()) {
                                                errorMsg = 'Time has passed';
                                            } else {
                                                const { closingTime, openingTime } = getClinicTimingConfig();
                                                const [ch, cm] = closingTime.split(':').map(Number);
                                                const [oh, om] = openingTime.split(':').map(Number);
                                                const closeDateTime = new Date(year, month - 1, day, ch, cm);
                                                const openDateTime = new Date(year, month - 1, day, oh, om);
                                                if (selectedDateTime > closeDateTime) { errorMsg = 'Clinic Closed'; }
                                                else if (selectedDateTime < openDateTime) { errorMsg = 'Before Clinic Opens'; }
                                                else { isValid = true; }
                                            }
                                        }
                                    }
                                    return (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setStep(4); }}
                                            disabled={!isValid}
                                            className="w-full py-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 disabled:grayscale text-white font-semibold text-sm transition-all flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            {!selectedAvail.isAvailable ? (
                                                <><CalendarOff size={16} /> {selectedAvail.badgeText || 'Bookings Closed on this Date'}</>
                                            ) : !formData.appointmentDate ? (
                                                <><Clock size={16} /> Select a Slot First</>
                                            ) : !isValid ? (
                                                <><Clock size={16} /> {errorMsg}</>
                                            ) : (
                                                <><CheckCircle size={16} /> Verify Booking</>
                                            )}
                                            {isValid && <ArrowRight size={16} />}
                                        </button>
                                    );
                                })()}
                            </div>

                        </div>
                    )}

                    {step === 4 && (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-slate-100 rounded-[4rem] shadow-2xl overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-2xl text-slate-900 tracking-tight">Final Confirmation</h3>
                        <p className="text-xs font-medium text-slate-400 mt-1">Review your visit details below</p>
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

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Consultation Type</label>
                                <div className="flex gap-3">
                                    {['new', 'followup'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, appointmentType: type })}
                                            className={`flex-1 py-3 rounded-2xl border-2 font-semibold text-xs uppercase tracking-wider transition-all ${formData.appointmentType === type ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-500'}`}
                                        >
                                            {type} Visit
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Clinical Notes / Reason</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-teal-500 text-sm font-medium resize-none shadow-sm"
                                    rows="3"
                                    placeholder="Briefly describe your symptoms or reason for visit..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-xs font-semibold animate-in shake duration-500">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <button
                        onClick={handleConfirmBooking}
                        disabled={loading}
                        className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-lg shadow-teal-600/25 flex items-center justify-center gap-3 transition-all active:scale-98 disabled:opacity-50"
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : <><CheckCircle size={20} /> {formData.rescheduleAppointmentId ? 'Confirm Reschedule' : 'Finalize Appointment'}</>}
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
        <div className={`h-1 md:h-1.5 w-full rounded-full transition-all duration-700 ${active ? 'bg-teal-600 shadow-[0_0_12px_rgba(13,148,136,0.4)]' : 'bg-slate-200'}`} />
        <div className="mt-2 md:mt-4 flex items-center gap-1.5 md:gap-3">
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-700 ${current ? 'bg-teal-600 text-white shadow-lg md:shadow-xl md:rotate-12' : active ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                {active && !current ? <Check size={11} /> : num}
            </div>
            <span className={`text-[10px] md:text-xs font-semibold uppercase tracking-wider ${current ? 'text-teal-600' : 'text-slate-400'} hidden sm:inline`}>{label}</span>
        </div>
    </div>
);

const ReviewItem = ({ icon, label, val, sub }) => (
    <div className="flex items-start gap-6 group">
        <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all duration-300 shrink-0 shadow-sm">
            {icon}
        </div>
        <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-base font-bold text-slate-900 leading-tight">{val || '---'}</p>
            {sub && <p className="text-xs font-normal text-slate-400 mt-1">{sub}</p>}
        </div>
    </div>
);

export default BookAppointment;
