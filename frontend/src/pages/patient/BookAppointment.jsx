import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    Building2, Stethoscope, Calendar, ArrowRight, ArrowLeft,
    MapPin, Phone, CheckCircle, AlertCircle, Loader
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const MAX_BOOKING_DAYS = 14;
const QUICK_SLOT_DAYS_AHEAD = 1;
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
const getCurrentLocalTime = () => toLocalDateTimeKey(new Date()).split('T')[1];
const getMaxLocalDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + MAX_BOOKING_DAYS);
    return toLocalDateTimeKey(d).split('T')[0];
};

const BookAppointment = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clinics, setClinics] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
    const [searchClinic, setSearchClinic] = useState('');

    const [formData, setFormData] = useState({
        clinicId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentType: 'new',
        reason: '',
        slotMode: 'quick'
    });

    // Fetch all clinics on component mount
    useEffect(() => {
        const fetchClinics = async () => {
            try {
                console.log('Fetching clinics from:', `${API_URL}/api/clinic/public/list`);
                const res = await axios.get(`${API_URL}/api/clinic/public/list`);
                console.log('Clinics response:', res.data);
                if (res.data.success) {
                    setClinics(res.data.data);
                }
            } catch (error) {
                const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch clinics';
                console.error('Clinic fetch error:', errorMsg);
                setError(errorMsg);
            }
        };
        fetchClinics();
    }, []);

    // Fetch doctors when clinic is selected
    useEffect(() => {
        if (formData.clinicId) {
            const fetchDoctors = async () => {
                try {
                    console.log('Fetching doctors for clinic:', formData.clinicId);
                    const res = await axios.get(`${API_URL}/api/clinic/public/doctors/${formData.clinicId}`);
                    console.log('Doctors response:', res.data);
                    if (res.data.success) {
                        console.log(`Found ${res.data.data.length} doctors for clinic ${formData.clinicId}`);
                        setDoctors(res.data.data);
                        if (res.data.data.length === 0) {
                            Swal.fire('Info', 'No doctors available at this clinic currently', 'info');
                        }
                    }
                } catch (error) {
                    const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch doctors';
                    console.error('Doctors fetch error:', errorMsg);
                    setError(errorMsg);
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

    const validateAppointmentSlot = useCallback((dateTimeString) => {
        if (!dateTimeString) return 'Please select a date and time';

        const selectedDate = new Date(dateTimeString);
        const now = new Date();
        const horizon = new Date(now);
        horizon.setDate(horizon.getDate() + MAX_BOOKING_DAYS);

        if (selectedDate < now) return 'Please select current or future time only.';
        if (selectedDate > horizon) return `Please select a slot within next ${MAX_BOOKING_DAYS} days.`;

        const { openingTime, closingTime, breakStartTime, breakEndTime, slotDurationMinutes, workingDays } = getClinicTimingConfig();
        const selectedDay = WEEKDAY_MAP[selectedDate.getDay()];
        if (!workingDays.includes(selectedDay)) return `Clinic is closed on ${selectedDay}.`;

        const [openHour, openMinute] = openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);
        const [breakStartHour, breakStartMinute] = breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = breakEndTime.split(':').map(Number);

        const open = new Date(selectedDate);
        open.setHours(openHour, openMinute, 0, 0);
        const close = new Date(selectedDate);
        close.setHours(closeHour, closeMinute, 0, 0);
        const breakStart = new Date(selectedDate);
        breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
        const breakEnd = new Date(selectedDate);
        breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

        if (selectedDate < open || selectedDate >= close) return `Please select time between ${openingTime} and ${closingTime}.`;
        if (selectedDate >= breakStart && selectedDate < breakEnd) return `Break time (${breakStartTime} - ${breakEndTime}) is unavailable.`;

        const minutesFromMidnight = selectedDate.getHours() * 60 + selectedDate.getMinutes();
        const openFromMidnight = openHour * 60 + openMinute;
        if ((minutesFromMidnight - openFromMidnight) % slotDurationMinutes !== 0) {
            return `Please select time in ${slotDurationMinutes}-minute interval.`;
        }

        return null;
    }, [getClinicTimingConfig]);

    const findNearestValidSlot = useCallback((dateTimeString) => {
        const { openingTime, closingTime, breakStartTime, breakEndTime, slotDurationMinutes, workingDays } = getClinicTimingConfig();

        let probe = new Date(dateTimeString || new Date());
        const now = new Date();
        if (probe < now) probe = new Date(now);

        probe.setSeconds(0, 0);
        const remainder = probe.getMinutes() % slotDurationMinutes;
        if (remainder !== 0) {
            probe.setMinutes(probe.getMinutes() + (slotDurationMinutes - remainder));
        }

        const horizon = new Date(now);
        horizon.setDate(horizon.getDate() + MAX_BOOKING_DAYS);

        const [openHour, openMinute] = openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);
        const [breakStartHour, breakStartMinute] = breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = breakEndTime.split(':').map(Number);

        while (probe <= horizon) {
            const day = WEEKDAY_MAP[probe.getDay()];
            if (!workingDays.includes(day)) {
                probe.setDate(probe.getDate() + 1);
                probe.setHours(openHour, openMinute, 0, 0);
                continue;
            }

            const open = new Date(probe);
            open.setHours(openHour, openMinute, 0, 0);
            const close = new Date(probe);
            close.setHours(closeHour, closeMinute, 0, 0);
            const breakStart = new Date(probe);
            breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
            const breakEnd = new Date(probe);
            breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

            if (probe < open) probe = new Date(open);
            if (probe >= close) {
                probe.setDate(probe.getDate() + 1);
                probe.setHours(openHour, openMinute, 0, 0);
                continue;
            }

            if (probe >= breakStart && probe < breakEnd) {
                probe = new Date(breakEnd);
            }

            const key = toLocalDateTimeKey(probe);
            if (!bookedSlots.includes(key) && !validateAppointmentSlot(key)) {
                return key;
            }

            probe = new Date(probe.getTime() + slotDurationMinutes * 60000);
        }

        return null;
    }, [bookedSlots, getClinicTimingConfig, validateAppointmentSlot]);

    const step3SlotError = useMemo(() => {
        if (step !== 3 || !formData.appointmentDate) return null;
        if (bookedSlots.includes(toLocalDateTimeKey(formData.appointmentDate))) {
            return 'This slot is already booked. Please choose another slot.';
        }
        return validateAppointmentSlot(formData.appointmentDate);
    }, [step, formData.appointmentDate, bookedSlots, validateAppointmentSlot]);

    // Generate available time slots based on clinic settings
    const generateAvailableSlots = useCallback(() => {
        const today = new Date();
        const slots = [];
        const { openingTime, closingTime, breakStartTime, breakEndTime, slotDurationMinutes, workingDays } = getClinicTimingConfig();

        const [openHour, openMinute] = openingTime.split(':').map(Number);
        const [closeHour, closeMinute] = closingTime.split(':').map(Number);
        const [breakStartHour, breakStartMinute] = breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = breakEndTime.split(':').map(Number);
        
        for (let d = 1; d <= QUICK_SLOT_DAYS_AHEAD; d++) {
            const date = new Date(today);
            date.setDate(date.getDate() + d);
            
            const currentDay = WEEKDAY_MAP[date.getDay()];
            if (!workingDays.includes(currentDay)) continue;

            const start = new Date(date);
            start.setHours(openHour, openMinute, 0, 0);

            const end = new Date(date);
            end.setHours(closeHour, closeMinute, 0, 0);

            const breakStart = new Date(date);
            breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);

            const breakEnd = new Date(date);
            breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

            for (let slot = new Date(start); slot < end; slot = new Date(slot.getTime() + slotDurationMinutes * 60000)) {
                // Skip break window
                if (slot >= breakStart && slot < breakEnd) continue;

                const slotKey = toLocalDateTimeKey(slot);
                // Hide already booked/filled slots from quick slots
                if (bookedSlots.includes(slotKey)) continue;

                slots.push(new Date(slot));
            }
        }
        setAvailableSlots(slots);
    }, [bookedSlots, getClinicTimingConfig]);

    // Fetch booked slots for the selected doctor
    const fetchBookedSlots = useCallback(async () => {
        if (!formData.clinicId || !formData.doctorId) return;

        try {
            console.log(`📅 Fetching booked slots for doctor ${formData.doctorId} at clinic ${formData.clinicId}`);
            
            const today = new Date().toISOString().split('T')[0];
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + MAX_BOOKING_DAYS);
            const endDateStr = endDate.toISOString().split('T')[0];

            const res = await axios.get(
                `${API_URL}/api/clinic/public/booked-slots/${formData.clinicId}/${formData.doctorId}`,
                { params: { startDate: today, endDate: endDateStr } }
            );

            if (res.data.success) {
                console.log(`✅ Found ${res.data.data.length} booked slots`);
                const bookedTimeSlots = res.data.data.map(slot => toLocalDateTimeKey(slot.appointmentDate || slot.timeSlot));
                setBookedSlots(bookedTimeSlots);
                return bookedTimeSlots;
            }
            return [];
        } catch (error) {
            console.error('Error fetching booked slots:', error.message);
            setBookedSlots([]);
            return [];
        }
    }, [formData.clinicId, formData.doctorId]);

    // Fetch booked slots when doctor is selected
    useEffect(() => {
        if (formData.doctorId) {
            fetchBookedSlots();
        }
    }, [formData.doctorId, fetchBookedSlots]);

    // Re-generate slots whenever booked slots or selected clinic changes
    useEffect(() => {
        if (formData.clinicId && formData.doctorId) {
            generateAvailableSlots();
        }
    }, [formData.clinicId, formData.doctorId, bookedSlots, generateAvailableSlots]);

    const bookingLoadMetrics = useMemo(() => {
        if (!formData.appointmentDate) {
            return { sameDayCount: 0, aheadCount: 0, nearbyCount: 0 };
        }

        const selected = new Date(formData.appointmentDate);
        const sameDayKey = toLocalDateTimeKey(selected).split('T')[0];

        const sameDay = bookedSlots
            .map((key) => new Date(key))
            .filter((d) => toLocalDateTimeKey(d).split('T')[0] === sameDayKey);

        const aheadCount = sameDay.filter((d) => d < selected).length;
        const nearbyCount = sameDay.filter((d) => Math.abs(d - selected) <= 60 * 60000).length;

        return {
            sameDayCount: sameDay.length,
            aheadCount,
            nearbyCount
        };
    }, [bookedSlots, formData.appointmentDate]);

    // Predict wait time using actual booked load on selected day/time
    const predictWaitTime = useCallback(() => {
        if (!formData.doctorId || !formData.appointmentDate) return null;

        const selectedHour = new Date(formData.appointmentDate).getHours();
        const { sameDayCount, aheadCount, nearbyCount } = bookingLoadMetrics;

        let waitMinutes = 8 + aheadCount * 7 + nearbyCount * 3 + sameDayCount * 1;

        if (formData.appointmentType === 'followup') {
            waitMinutes *= 0.85;
        } else {
            waitMinutes *= 1.15;
        }

        // Peak congestion windows
        if ((selectedHour >= 10 && selectedHour <= 12) || (selectedHour >= 17 && selectedHour <= 19)) {
            waitMinutes *= 1.2;
        }

        const rounded = Math.round(waitMinutes / 5) * 5;
        return Math.max(5, Math.min(180, rounded));
    }, [bookingLoadMetrics, formData.doctorId, formData.appointmentDate, formData.appointmentType]);

    useEffect(() => {
        setEstimatedWaitTime(predictWaitTime());
    }, [predictWaitTime]);

    const handleSelectClinic = (clinicId) => {
        try {
            setFormData({ ...formData, clinicId, doctorId: '', appointmentDate: '' });
            setAvailableSlots([]);
            setStep(2);
        } catch (error) {
            console.error('Error selecting clinic:', error);
            Swal.fire('Error', 'Failed to select clinic', 'error');
        }
    };

    const handleSelectDoctor = (doctorId) => {
        try {
            setFormData({ ...formData, doctorId });
            setStep(3);
        } catch (error) {
            console.error('Error selecting doctor:', error);
            Swal.fire('Error', 'Failed to select doctor', 'error');
        }
    };

    const handleSelectSlot = (slot) => {
        try {
            const isoString = toLocalDateTimeKey(slot);
            setFormData({ ...formData, appointmentDate: isoString });
        } catch (error) {
            console.error('Error selecting slot:', error);
            Swal.fire('Error', 'Failed to select time slot', 'error');
        }
    };

    const handleConfirmBooking = async () => {
        if (!formData.appointmentDate) {
            setError('Please select a date and time');
            return;
        }

        if (!formData.reason.trim()) {
            setError('Please provide a reason for appointment');
            return;
        }

        const slotValidationMessage = validateAppointmentSlot(formData.appointmentDate);
        if (slotValidationMessage) {
            setError(slotValidationMessage);
            return;
        }

        const latestBooked = await fetchBookedSlots();

        // Check if selected slot is booked
        const selectedSlotStr = toLocalDateTimeKey(formData.appointmentDate);
        if (latestBooked.includes(selectedSlotStr) || bookedSlots.includes(selectedSlotStr)) {
            setError('⚠️ This time slot has been booked by another patient. Please select a different time.');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found. Please login first.');
                setLoading(false);
                return;
            }

            const res = await axios.post(
                `${API_URL}/api/auth/patient/book-appointment`,
                {
                    clinicId: formData.clinicId,
                    doctorId: formData.doctorId,
                    appointmentDate: formData.appointmentDate,
                    appointmentType: formData.appointmentType,
                    reason: formData.reason
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                const selectedClinic = getSelectedClinic();
                const selectedDoctor = getSelectedDoctor();
                
                Swal.fire({
                    icon: 'info',
                    title: 'Request Submitted! ✅',
                    html: `<div style="text-align: left;">
                        <p><b>Appointment Request Submitted</b></p>
                        <p style="color: #d4a574; font-weight: bold; margin: 10px 0;">Awaiting Receptionist Verification</p>
                        <p><b>Doctor:</b> Dr. ${selectedDoctor?.name || res.data.data.doctorName}</p>
                        <p><b>Clinic:</b> ${selectedClinic?.name || res.data.data.clinicName}</p>
                        <p><b>Date:</b> ${new Date(formData.appointmentDate).toLocaleDateString('en-IN')}</p>
                        <p><b>Time:</b> ${new Date(formData.appointmentDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        <p style="margin-top: 15px; font-size: 12px; color: #888;">We'll send you an SMS confirmation once the receptionist verifies your appointment.</p>
                    </div>`,
                    timer: 4000,
                    showConfirmButton: false,
                    background: '#EEF6FA',
                    color: '#0F766E'
                }).then(() => {
                    navigate('/patient/dashboard');
                });
            } else {
                setError(res.data.message || 'Failed to book appointment');
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to book appointment';
            console.error('Booking error:', errorMsg);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const filteredClinics = clinics.filter(c => c.name.toLowerCase().includes(searchClinic.toLowerCase()));

    // Progress bar component
    const ProgressBar = () => (
        <div className="mb-8">
            <div className="flex justify-between mb-4">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            s <= step 
                                ? 'bg-marigold text-white' 
                                : 'bg-sandstone/30 text-khaki'
                        }`}>
                            {s}
                        </div>
                        <p className="text-[8px] font-black uppercase text-khaki mt-2">
                            {['Clinic', 'Doctor', 'Time', 'Confirm'][s-1]}
                        </p>
                    </div>
                ))}
            </div>
            <div className="h-1.5 bg-sandstone/30 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-marigold to-saffron transition-all duration-300"
                    style={{ width: `${(step / 4) * 100}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-parchment text-teak flex flex-col items-center justify-center p-6 font-body">
            <div className="w-full max-w-2xl">

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg">
                        <p className="text-red-800 font-bold">⚠️ Error</p>
                        <p className="text-red-700 text-sm">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 font-bold underline"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Header */}
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-heading text-teak mb-2">📅 Book Your Appointment</h1>
                    <p className="text-khaki text-sm">Quick & easy scheduling with Appointory</p>
                </header>

                {/* Progress Bar */}
                <ProgressBar />

                {/* Step 1: Select Clinic */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div>
                            <h2 className="text-2xl font-heading text-teak mb-4">Select a Clinic</h2>
                            <input
                                type="text"
                                placeholder="Search clinics by name..."
                                value={searchClinic}
                                onChange={(e) => setSearchClinic(e.target.value)}
                                className="w-full px-4 py-3 mb-6 border border-sandstone rounded-2xl focus:border-marigold outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredClinics.length > 0 ? (
                                filteredClinics.map(clinic => (
                                    <button
                                        key={clinic._id}
                                        onClick={() => handleSelectClinic(clinic._id)}
                                        className="p-6 bg-white rounded-3xl border border-sandstone/60 hover:border-marigold hover:shadow-xl transition-all text-left hover:scale-102"
                                    >
                                        <div className="flex items-start gap-4 mb-3">
                                            <Building2 size={28} className="text-marigold flex-shrink-0 mt-1" />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-teak text-lg">{clinic.name}</h3>
                                                <div className="flex items-center gap-1 text-khaki text-xs mt-2">
                                                    <MapPin size={14} /> {clinic.address}
                                                </div>
                                                <div className="flex items-center gap-1 text-khaki text-xs mt-1">
                                                    <Phone size={14} /> {clinic.contactPhone}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-sandstone/30">
                                            <span className="text-xs font-bold bg-marigold/10 text-marigold px-3 py-1 rounded-full">
                                                {clinic.doctorCount || 0} Doctors
                                            </span>
                                            <ArrowRight size={16} className="text-marigold" />
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-khaki col-span-2">No clinics match your search</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Doctor */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-6 border border-sandstone/60">
                            <p className="text-xs text-khaki font-black uppercase tracking-widest">Selected Clinic</p>
                            <h3 className="font-bold text-teak text-xl mt-2">{getSelectedClinic()?.name}</h3>
                        </div>

                        <div>
                            <h2 className="text-2xl font-heading text-teak mb-4">Select a Doctor</h2>
                            <p className="text-khaki text-sm mb-4">Choose a doctor to continue</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {doctors.length > 0 ? (
                                doctors.map(doctor => (
                                    <button
                                        key={doctor._id}
                                        onClick={() => handleSelectDoctor(doctor._id)}
                                        className="p-6 bg-white rounded-3xl border border-sandstone/60 hover:border-marigold hover:shadow-xl transition-all text-left hover:scale-105"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-marigold to-saffron rounded-full flex items-center justify-center text-white font-bold">
                                                {doctor.name?.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-teak">Dr. {doctor.name}</h3>
                                                <p className="text-xs text-marigold font-bold mt-1">{doctor.specialization}</p>
                                                {doctor.experience && (
                                                    <p className="text-xs text-khaki mt-1">🎓 {doctor.experience}y experience</p>
                                                )}
                                                <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                    doctor.isAvailable 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    <div className={`w-2 h-2 rounded-full ${doctor.isAvailable ? 'bg-green-700' : 'bg-red-700'}`} />
                                                    {doctor.isAvailable ? 'Available' : 'Not Available'}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-khaki col-span-2">No doctors available at this clinic</p>
                            )}
                        </div>

                        <button
                            onClick={() => setStep(1)}
                            className="w-full py-3 border border-khaki text-khaki rounded-2xl font-bold text-sm uppercase mt-6 hover:bg-parchment transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} /> Back to Clinics
                        </button>
                    </div>
                )}

                {/* Step 3: Select Date/Time */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-3xl p-6 border border-sandstone/60 space-y-4">
                            <div className="flex items-center gap-3">
                                <Building2 size={20} className="text-marigold" />
                                <div>
                                    <p className="text-xs text-khaki">Clinic</p>
                                    <p className="font-bold text-teak">{getSelectedClinic()?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Stethoscope size={20} className="text-marigold" />
                                <div>
                                    <p className="text-xs text-khaki">Doctor</p>
                                    <p className="font-bold text-teak">Dr. {getSelectedDoctor()?.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-heading text-teak">Appointment Details</h3>
                            
                            {/* Appointment Type */}
                            <div>
                                <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest block mb-3">
                                    Appointment Type *
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['new', 'followup'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, appointmentType: type })}
                                            className={`p-4 rounded-2xl border-2 font-bold uppercase text-sm transition-all ${
                                                formData.appointmentType === type
                                                    ? 'border-marigold bg-marigold text-white'
                                                    : 'border-sandstone bg-white text-teak hover:border-marigold'
                                            }`}
                                        >
                                            {type === 'new' ? 'New Patient' : 'Follow-up'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest block mb-2">
                                    Reason for Visit *
                                </label>
                                <textarea
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Describe your symptoms or reason for appointment..."
                                    className="w-full p-4 bg-parchment border border-sandstone rounded-2xl focus:border-marigold outline-none text-teak resize-none"
                                    rows="3"
                                />
                            </div>

                            {/* Time Slots */}
                            <div>
                                <label className="text-[10px] font-black uppercase text-khaki ml-2 tracking-widest block mb-3">
                                    Select or Enter a Time Slot *
                                </label>
                                <p className="text-xs text-khaki mb-3">
                                    Quick Slots shows only next-day available slots. Manual Entry supports up to {MAX_BOOKING_DAYS} days.
                                </p>

                                {/* Booked Slots Info (Manual mode only) */}
                                {formData.slotMode === 'manual' && bookedSlots.length > 0 && (
                                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <p className="text-xs text-orange-700 font-bold">⚠️ {bookedSlots.length} slot(s) already booked by other patients</p>
                                        <p className="text-xs text-orange-600 mt-1">Please avoid these times in Manual Entry.</p>
                                    </div>
                                )}

                                {/* Tabs for Quick Slots vs Manual Entry */}
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={() => setFormData({ ...formData, slotMode: 'quick' })}
                                        className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                                            (formData.slotMode !== 'manual')
                                                ? 'bg-marigold text-white'
                                                : 'bg-sandstone/20 text-teak hover:bg-sandstone/40'
                                        }`}
                                    >
                                        📅 Quick Slots
                                    </button>
                                    <button
                                        onClick={() => setFormData({ ...formData, slotMode: 'manual' })}
                                        className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                                            formData.slotMode === 'manual'
                                                ? 'bg-marigold text-white'
                                                : 'bg-sandstone/20 text-teak hover:bg-sandstone/40'
                                        }`}
                                    >
                                        ✍️ Manual Entry
                                    </button>
                                </div>

                                {/* Quick Slots Mode */}
                                {formData.slotMode !== 'manual' && (
                                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                        {availableSlots.map((slot, idx) => {
                                            const slotTimeStr = toLocalDateTimeKey(slot);
                                            
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectSlot(slot)}
                                                    className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                                        formData.appointmentDate === slotTimeStr
                                                            ? 'border-marigold bg-marigold text-white'
                                                            : 'border-sandstone bg-white text-teak hover:border-marigold'
                                                    }`}
                                                >
                                                    <div className="text-xs">{slot.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                                                    <div>{slot.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                                </button>
                                            );
                                        })}
                                        {availableSlots.length === 0 && (
                                            <div className="col-span-3 text-center py-6 bg-parchment rounded-xl border border-sandstone text-khaki text-xs font-bold uppercase">
                                                No empty slots for next day
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Manual Entry Mode */}
                                {formData.slotMode === 'manual' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-khaki block mb-2">Date *</label>
                                            <input
                                                type="date"
                                                value={formData.appointmentDate ? formData.appointmentDate.split('T')[0] : ''}
                                                onChange={(e) => {
                                                    const date = e.target.value;
                                                    const selectedTime = formData.appointmentDate ? formData.appointmentDate.split('T')[1] : getCurrentLocalTime();
                                                    const minTimeForDate = date === getCurrentLocalDate() ? getCurrentLocalTime() : '00:00';
                                                    const time = selectedTime < minTimeForDate ? minTimeForDate : selectedTime;
                                                    if (date && time) {
                                                        let dateTime = `${date}T${time}`;
                                                        const invalidMsg = validateAppointmentSlot(dateTime) || (bookedSlots.includes(toLocalDateTimeKey(dateTime)) ? 'booked' : null);
                                                        if (invalidMsg) {
                                                            const nearest = findNearestValidSlot(dateTime);
                                                            if (nearest) dateTime = nearest;
                                                        }
                                                        setFormData({ ...formData, appointmentDate: dateTime });
                                                    }
                                                }}
                                                min={getCurrentLocalDate()}
                                                max={getMaxLocalDate()}
                                                className="w-full px-4 py-3 bg-parchment border border-sandstone rounded-2xl focus:border-marigold outline-none text-teak font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-khaki block mb-2">Time *</label>
                                            <input
                                                type="time"
                                                value={formData.appointmentDate ? formData.appointmentDate.split('T')[1] : getCurrentLocalTime()}
                                                onChange={(e) => {
                                                    const time = e.target.value;
                                                    const date = formData.appointmentDate ? formData.appointmentDate.split('T')[0] : getCurrentLocalDate();
                                                    if (date && time) {
                                                        let dateTime = `${date}T${time}`;
                                                        const invalidMsg = validateAppointmentSlot(dateTime) || (bookedSlots.includes(toLocalDateTimeKey(dateTime)) ? 'booked' : null);
                                                        if (invalidMsg) {
                                                            const nearest = findNearestValidSlot(dateTime);
                                                            if (nearest) dateTime = nearest;
                                                        }
                                                        setFormData({ ...formData, appointmentDate: dateTime });
                                                    }
                                                }}
                                                min={(formData.appointmentDate ? formData.appointmentDate.split('T')[0] : getCurrentLocalDate()) === getCurrentLocalDate() ? getCurrentLocalTime() : undefined}
                                                step={getClinicTimingConfig().slotDurationMinutes * 60}
                                                className="w-full px-4 py-3 bg-parchment border border-sandstone rounded-2xl focus:border-marigold outline-none text-teak font-bold"
                                            />
                                        </div>

                                        {/* Show warning if selected time is booked */}
                                        {formData.appointmentDate && bookedSlots.includes(toLocalDateTimeKey(formData.appointmentDate)) && (
                                            <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                                                <p className="text-xs text-red-700 font-bold">❌ This time slot is already booked!</p>
                                                <p className="text-xs text-red-600 mt-1">Please select a different time or use the Quick Slots to see available times.</p>
                                            </div>
                                        )}

                                        {step3SlotError && (
                                            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                                                <p className="text-xs text-amber-700 font-bold">⚠️ Slot auto-adjustment applied</p>
                                                <p className="text-xs text-amber-600 mt-1">{step3SlotError}</p>
                                            </div>
                                        )}

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-xs text-blue-600 font-bold">💡 Tip: Clinic typically operates:</p>
                                            <p className="text-xs text-blue-600 mt-1">Hours: {getClinicTimingConfig().openingTime} - {getClinicTimingConfig().closingTime}</p>
                                            <p className="text-xs text-blue-600">Break: {getClinicTimingConfig().breakStartTime} - {getClinicTimingConfig().breakEndTime}</p>
                                            <p className="text-xs text-blue-600">Working days: {getClinicTimingConfig().workingDays.join(', ')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Wait Time Prediction */}
                            {estimatedWaitTime && (
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                    <p className="text-xs text-yellow-800 font-bold">⏱️ Estimated Wait Time</p>
                                    <p className="text-lg font-bold text-yellow-900">{estimatedWaitTime} minutes</p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Based on {bookingLoadMetrics.sameDayCount} booking(s) on selected day and {bookingLoadMetrics.aheadCount} ahead of your chosen time.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setStep(2)}
                                className="py-3 border border-khaki text-khaki rounded-2xl font-bold text-sm uppercase hover:bg-parchment transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button
                                onClick={() => setStep(4)}
                                disabled={!formData.appointmentDate || !formData.reason || !!step3SlotError}
                                className="py-3 bg-marigold text-white rounded-2xl font-bold text-sm uppercase hover:bg-saffron transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                Continue <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Confirm & Book */}
                {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-white rounded-3xl p-8 border border-sandstone/60 shadow-lg space-y-6">
                            <h2 className="text-2xl font-heading text-teak mb-8">Confirm Your Appointment</h2>

                            <div className="border-b border-sandstone pb-6">
                                <div className="flex items-center gap-3">
                                    <Building2 size={24} className="text-marigold" />
                                    <div>
                                        <p className="text-xs text-khaki font-black uppercase">Clinic</p>
                                        <p className="text-lg font-bold text-teak">{getSelectedClinic()?.name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-sandstone pb-6">
                                <div className="flex items-center gap-3">
                                    <Stethoscope size={24} className="text-marigold" />
                                    <div>
                                        <p className="text-xs text-khaki font-black uppercase">Doctor</p>
                                        <p className="text-lg font-bold text-teak">Dr. {getSelectedDoctor()?.name}</p>
                                        <p className="text-xs text-khaki mt-1">{getSelectedDoctor()?.specialization}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-sandstone pb-6">
                                <div className="flex items-center gap-3">
                                    <Calendar size={24} className="text-marigold" />
                                    <div>
                                        <p className="text-xs text-khaki font-black uppercase">Date & Time</p>
                                        <p className="text-lg font-bold text-teak">
                                            {new Date(formData.appointmentDate).toLocaleDateString('en-IN', { 
                                                weekday: 'long', 
                                                year: 'numeric', 
                                                month: 'long', 
                                                day: 'numeric' 
                                            })}
                                        </p>
                                        <p className="text-sm text-khaki mt-1">
                                            {new Date(formData.appointmentDate).toLocaleTimeString('en-IN', { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-b border-sandstone pb-6">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={24} className="text-marigold flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-khaki font-black uppercase">Reason for Visit</p>
                                        <p className="text-sm text-teak mt-1">{formData.reason}</p>
                                    </div>
                                </div>
                            </div>

                            {estimatedWaitTime && (
                                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                    <p className="text-xs text-blue-800 font-black uppercase">Est. Wait Time</p>
                                    <p className="text-2xl font-bold text-blue-900 mt-1">{estimatedWaitTime} min</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setStep(3)}
                                className="py-4 border border-khaki text-khaki rounded-2xl font-bold text-sm uppercase hover:bg-parchment transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button
                                onClick={handleConfirmBooking}
                                disabled={loading}
                                className="py-4 bg-gradient-to-r from-marigold to-saffron text-white rounded-2xl font-bold text-sm uppercase hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader size={16} className="animate-spin" />
                                        Booking...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Confirm & Book
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Back to Dashboard */}
                <div className="text-center mt-10">
                    <button
                        onClick={() => navigate('/patient/dashboard')}
                        className="text-sm font-bold text-khaki hover:text-marigold transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookAppointment;
