import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  Save,
  MapPin,
  Phone,
  ShieldAlert,
  Building,
  QrCode,
  AlertCircle,
  Settings as SettingsIcon,
  FlaskConical,
  Search,
  Link2,
  X,
  RefreshCw,
  Calendar,
  CalendarOff,
  Stethoscope,
  UserCheck,
  Plus,
  Sun,
  Trash2
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ClinicQR from '../../components/ClinicQR';
import { API_URL } from '../../config/runtime';

const ClinicSettings = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'schedule' || searchParams.get('tab') === 'leaves' ? 'schedule' : 'profile';

  const [loading, setLoading] = useState(true);
  const [activeSettingsTab, setActiveSettingsTab] = useState(initialTab); // 'profile', 'schedule', 'labs', or 'seo'
  const [formData, setFormData] = useState({
    name: '',
    clinicCode: '',
    contactNumber: '',
    address: '',
    openingTime: '09:00',
    closingTime: '17:00',
    breakStartTime: '12:00',
    breakEndTime: '14:00',
    slotDurationMinutes: 30,
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    slug: '',
    bio: '',
    specialtiesStr: '',
    seoTitle: '',
    seoDescription: ''
  });

  // Lab Connection States
  const [labSearchQuery, setLabSearchQuery] = useState('');
  const [myConnections, setMyConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [allLabs, setAllLabs] = useState([]);
  const [loadingAllLabs, setLoadingAllLabs] = useState(false);

  // Schedule & Leaves Management States
  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDoctorDays, setSelectedDoctorDays] = useState([]);
  const [isSavingDoctorSchedule, setIsSavingDoctorSchedule] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const [holidayForm, setHolidayForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [doctorLeaveForm, setDoctorLeaveForm] = useState({
    doctorId: '',
    title: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [labLeaveForm, setLabLeaveForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const weekdayOptions = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchClinicData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/clinic/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          const { name, clinicCode, contactNumber, contactPhone, address, openingTime, closingTime, breakStartTime, breakEndTime, slotDurationMinutes, workingDays, slug, bio, specialties, seoTitle, seoDescription } = res.data.data;
          setFormData({
            name: name || '',
            clinicCode: clinicCode || '',
            contactNumber: contactNumber || contactPhone || '',
            address: address || '',
            openingTime: openingTime || '09:00',
            closingTime: closingTime || '17:00',
            breakStartTime: breakStartTime || '12:00',
            breakEndTime: breakEndTime || '14:00',
            slotDurationMinutes: slotDurationMinutes || 30,
            workingDays: workingDays && workingDays.length ? workingDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            slug: slug || '',
            bio: bio || '',
            specialtiesStr: Array.isArray(specialties) ? specialties.join(', ') : '',
            seoTitle: seoTitle || '',
            seoDescription: seoDescription || ''
          });
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching clinic data", err);
        setLoading(false);
      }
    };
    fetchClinicData();
  }, [token]);

  const fetchClinicConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const res = await axios.get(`${API_URL}/api/lab-connect/clinic`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMyConnections(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoadingConnections(false);
    }
  }, [token]);

  const fetchAllLabs = useCallback(async () => {
    setLoadingAllLabs(true);
    try {
      const res = await axios.get(`${API_URL}/api/lab-connect/clinic/labs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setAllLabs(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching all labs:", err);
    } finally {
      setLoadingAllLabs(false);
    }
  }, [token]);

  const fetchDoctorsList = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/staff/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && Array.isArray(res.data.staff)) {
        const docs = res.data.staff.filter(s => s.role === 'doctor' && s.isActive !== false);
        setDoctorsList(docs);
        if (docs.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docs[0]._id);
          setSelectedDoctorDays(docs[0].availableDays && docs[0].availableDays.length ? docs[0].availableDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
        }
      }
    } catch (err) {
      console.error('Error fetching doctors list:', err);
    }
  }, [token, selectedDoctorId]);

  const fetchLeaves = useCallback(async () => {
    setLoadingLeaves(true);
    try {
      const res = await axios.get(`${API_URL}/api/clinic/leaves`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setLeaves(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching clinic leaves:', err);
    } finally {
      setLoadingLeaves(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeSettingsTab === 'labs') {
      fetchClinicConnections();
      fetchAllLabs();
    } else if (activeSettingsTab === 'schedule') {
      fetchDoctorsList();
      fetchLeaves();
    }
  }, [activeSettingsTab, fetchClinicConnections, fetchAllLabs, fetchDoctorsList, fetchLeaves]);

  const handleSelectDoctorForSchedule = (doctorId) => {
    setSelectedDoctorId(doctorId);
    const doc = doctorsList.find(d => d._id === doctorId);
    if (doc) {
      setSelectedDoctorDays(doc.availableDays && doc.availableDays.length ? doc.availableDays : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
    }
  };

  const handleSaveDoctorSchedule = async () => {
    if (!selectedDoctorId) return;
    setIsSavingDoctorSchedule(true);
    try {
      const res = await axios.patch(
        `${API_URL}/api/clinic/doctor-schedule/${selectedDoctorId}`,
        { availableDays: selectedDoctorDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Schedule Updated',
          text: res.data.message || 'Specialist available days saved successfully.',
          confirmButtonColor: '#0F766E'
        });
        setDoctorsList(prev => prev.map(d => d._id === selectedDoctorId ? { ...d, availableDays: selectedDoctorDays } : d));
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to update specialist schedule.',
        confirmButtonColor: '#0F766E'
      });
    } finally {
      setIsSavingDoctorSchedule(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api/clinic/leaves`,
        {
          type: 'clinic_holiday',
          title: holidayForm.title,
          startDate: holidayForm.startDate,
          endDate: holidayForm.endDate,
          reason: holidayForm.reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Holiday Added',
          text: `"${holidayForm.title}" scheduled successfully. Patients will not be able to book on these dates.`,
          confirmButtonColor: '#0F766E'
        });
        setHolidayForm({ title: '', startDate: '', endDate: '', reason: '' });
        fetchLeaves();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error Adding Holiday',
        text: err.response?.data?.message || 'Failed to schedule holiday.',
        confirmButtonColor: '#0F766E'
      });
    }
  };

  const handleAddDoctorLeave = async (e) => {
    e.preventDefault();
    if (!doctorLeaveForm.doctorId) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Select Doctor',
        text: 'Select which doctor is taking leave.',
        confirmButtonColor: '#0F766E'
      });
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/api/clinic/leaves`,
        {
          doctorId: doctorLeaveForm.doctorId,
          type: 'doctor_leave',
          title: doctorLeaveForm.title,
          startDate: doctorLeaveForm.startDate,
          endDate: doctorLeaveForm.endDate,
          reason: doctorLeaveForm.reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Leave Recorded',
          text: `Doctor leave recorded. Patients will not be able to book this doctor on these dates.`,
          confirmButtonColor: '#0F766E'
        });
        setDoctorLeaveForm({ doctorId: '', title: '', startDate: '', endDate: '', reason: '' });
        fetchLeaves();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error Recording Leave',
        text: err.response?.data?.message || 'Failed to record doctor leave.',
        confirmButtonColor: '#0F766E'
      });
    }
  };

  const handleAddLabLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api/clinic/leaves`,
        {
          type: 'lab_leave',
          title: labLeaveForm.title,
          startDate: labLeaveForm.startDate,
          endDate: labLeaveForm.endDate,
          reason: labLeaveForm.reason
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'In-House Lab Holiday Added',
          text: `"${labLeaveForm.title}" recorded. Doctors and receptionists will be notified that the in-house lab is closed on these dates.`,
          confirmButtonColor: '#0F766E'
        });
        setLabLeaveForm({ title: '', startDate: '', endDate: '', reason: '' });
        fetchLeaves();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error Adding Lab Holiday',
        text: err.response?.data?.message || 'Failed to record in-house lab holiday.',
        confirmButtonColor: '#0F766E'
      });
    }
  };

  const handleDeleteLeave = async (leaveId, title) => {
    const result = await Swal.fire({
      title: 'Remove Leave/Holiday?',
      text: `Are you sure you want to remove "${title}"? Bookings will reopen for these dates.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E11D48',
      cancelButtonColor: '#64748B',
      confirmButtonText: 'Yes, Remove It'
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.delete(`${API_URL}/api/clinic/leaves/${leaveId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Removed',
            text: 'Leave record removed successfully.',
            confirmButtonColor: '#0F766E'
          });
          fetchLeaves();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Failed to Remove',
          text: err.response?.data?.message || 'Could not delete leave.',
          confirmButtonColor: '#0F766E'
        });
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.patch(`${API_URL}/api/clinic/settings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        localStorage.setItem('clinicName', formData.name);
        localStorage.setItem('clinicCode', formData.clinicCode.toUpperCase());

        Swal.fire({
          icon: 'success',
          title: 'Profile Updated',
          text: 'Clinic settings have been synced successfully.',
          confirmButtonColor: '#0F766E',
          background: '#EEF6FA'
        });
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handleLinkLab = async (labId) => {
    try {
      const res = await axios.post(`${API_URL}/api/lab-connect/request`, { labId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Request Sent',
          text: res.data.message || 'Connection request successfully sent to the lab.',
          confirmButtonColor: '#0F766E'
        });
        fetchClinicConnections();
        fetchAllLabs();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to send request', 'error');
    }
  };

  const handleRespondToRequest = async (connId, action) => {
    try {
      const res = await axios.patch(`${API_URL}/api/lab-connect/clinic/${connId}/respond`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: `Request ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
          text: `You have successfully ${action === 'accept' ? 'accepted' : 'rejected'} the lab connection request.`,
          confirmButtonColor: '#0F766E'
        });
        fetchClinicConnections();
        fetchAllLabs();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to respond to request', 'error');
    }
  };

  const handleDisconnectLab = async (connId) => {
    try {
      const result = await Swal.fire({
        title: 'Disconnect Lab?',
        text: 'Are you sure you want to remove this lab partner? Diagnostic tests cannot be sent to this lab unless re-linked.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, Disconnect'
      });
      if (!result.isConfirmed) return;

      const res = await axios.delete(`${API_URL}/api/lab-connect/${connId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        Swal.fire('Disconnected', 'Lab connection has been removed.', 'success');
        fetchClinicConnections();
        fetchAllLabs();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to disconnect', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center">
      <div className="animate-pulse font-heading text-xl text-khaki">Opening Clinic Vault...</div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-parchment font-body text-teak">
      {/* --- Sidebar Integrated --- */}
      <Sidebar role="admin" />

      <div className="flex-grow flex flex-col h-screen overflow-y-auto pb-32 lg:pb-0">
        {/* --- Header Section --- */}
        <header className="bg-white border-b border-sandstone px-8 py-6 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-teak rounded-2xl flex items-center justify-center text-white shadow-lg">
              <SettingsIcon size={24} />
            </div>
            <div>
              <h1 className="font-heading text-2xl leading-none">Clinic Settings</h1>
              <p className="text-[14px] font-black uppercase tracking-widest text-khaki mt-1">Configure Global Facility & Integrations</p>
            </div>
          </div>
        </header>

        {/* --- Tab Navigation --- */}
        <div className="bg-white border-b border-sandstone px-8 flex gap-4">
          <button
            onClick={() => setActiveSettingsTab('profile')}
            className={`py-3 px-4 font-bold text-sm uppercase tracking-wider relative transition-all ${activeSettingsTab === 'profile' ? 'text-teak font-black' : 'text-khaki hover:text-teak'}`}
          >
            Clinic Profile
            {activeSettingsTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teak rounded-t" />}
          </button>
          <button
            onClick={() => setActiveSettingsTab('schedule')}
            className={`py-3 px-4 font-bold text-sm uppercase tracking-wider relative transition-all flex items-center gap-2 ${activeSettingsTab === 'schedule' ? 'text-teak font-black' : 'text-khaki hover:text-teak'}`}
          >
            <CalendarOff size={16} />
            Schedule & Leaves
            {activeSettingsTab === 'schedule' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teak rounded-t" />}
          </button>
          <button
            onClick={() => setActiveSettingsTab('labs')}
            className={`py-3 px-4 font-bold text-sm uppercase tracking-wider relative transition-all ${activeSettingsTab === 'labs' ? 'text-teak font-black' : 'text-khaki hover:text-teak'}`}
          >
            Lab Partners
            {activeSettingsTab === 'labs' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teak rounded-t" />}
          </button>
        </div>

        <main className="flex-grow max-w-6xl w-full mx-auto p-4 md:p-6">
          {activeSettingsTab === 'profile' && (
            <div className="grid lg:grid-cols-3 gap-6">

              {/* --- Main Settings Form --- */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-sandstone rounded-3xl p-6 md:p-8 shadow-sm">
                  <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Clinic Name */}
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Clinic Display Name</label>
                        <div className="relative">
                          <Building size={16} className="absolute left-5 top-4.5 text-sandstone" />
                          <input
                            type="text" required
                            className="w-full pl-12 pr-6 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-bold text-teak transition-all text-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Clinic Code */}
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Unique Gateway Code</label>
                        <div className="relative">
                          <QrCode size={16} className="absolute left-5 top-4.5 text-sandstone" />
                          <input
                            type="text" required
                            className="w-full pl-12 pr-6 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-black uppercase text-marigold transition-all text-sm"
                            value={formData.clinicCode}
                            onChange={(e) => setFormData({ ...formData, clinicCode: e.target.value })}
                          />
                        </div>
                        <p className="text-[14px] text-khaki ml-2 flex items-center gap-1 italic">
                          <AlertCircle size={10} /> Affects your public check-in URL.
                        </p>
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-2">
                      <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Verified Contact Number</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-5 top-4.5 text-sandstone" />
                        <input
                          type="text"
                          placeholder="+91 00000 00000"
                          className="w-full pl-12 pr-6 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak text-sm"
                          value={formData.contactNumber}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Physical Address */}
                    <div className="space-y-2">
                      <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Clinic Address</label>
                      <div className="relative">
                        <MapPin size={16} className="absolute left-5 top-4.5 text-sandstone" />
                        <textarea
                          placeholder="Street, Landmark, City, Pincode..."
                          className="w-full pl-12 pr-6 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium h-24 resize-none transition-all text-sm"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        ></textarea>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Opening Time</label>
                        <input
                          type="time"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.openingTime}
                          onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Closing Time</label>
                        <input
                          type="time"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.closingTime}
                          onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Break Start</label>
                        <input
                          type="time"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.breakStartTime}
                          onChange={(e) => setFormData({ ...formData, breakStartTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Break End</label>
                        <input
                          type="time"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.breakEndTime}
                          onChange={(e) => setFormData({ ...formData, breakEndTime: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Slot (Minutes)</label>
                        <input
                          type="number"
                          min="10"
                          max="120"
                          className="w-full px-6 py-4 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak"
                          value={formData.slotDurationMinutes}
                          onChange={(e) => setFormData({ ...formData, slotDurationMinutes: Number(e.target.value) || 30 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[14px] font-black uppercase tracking-widest text-khaki ml-2">Working Days</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {weekdayOptions.map((day) => {
                          const selected = formData.workingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const nextDays = selected
                                  ? formData.workingDays.filter((d) => d !== day)
                                  : [...formData.workingDays, day];
                                setFormData({ ...formData, workingDays: nextDays });
                              }}
                              className={`px-4 py-3 rounded-xl border text-[14px] font-black uppercase tracking-widest transition-all ${selected ? 'bg-teak text-white border-teak' : 'bg-parchment text-khaki border-sandstone hover:border-marigold'}`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[14px] text-khaki italic ml-2">Quick Slots will be shown only on selected days.</p>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        className="w-full md:w-auto px-12 py-5 bg-marigold text-white rounded-2xl font-bold uppercase text-[14px] tracking-widest hover:bg-teak transition-all shadow-xl shadow-marigold/20 active:scale-95 flex items-center justify-center gap-3"
                      >
                        <Save size={18} /> Update Facility Details
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* --- Right Sidebar: QR Live Preview & Danger Zone --- */}
              <div className="space-y-6">
                <div className="bg-white border border-sandstone p-6 md:p-8 rounded-3xl shadow-sm">
                  <h3 className="font-heading text-lg mb-4 border-b border-sandstone pb-3">Live QR Preview</h3>
                  <div className="flex flex-col items-center">
                    <div className="w-full max-w-xs origin-top md:scale-90 lg:scale-100">
                      <ClinicQR clinicCode={formData.clinicCode} clinicName={formData.name} />
                    </div>
                  </div>
                  <p className="mt-4 text-[14px] text-khaki leading-relaxed text-center px-4 font-medium italic">
                    This QR code allows patients to join your queue instantly from their mobile devices.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8">
                  <div className="flex items-center gap-2 mb-4 text-red-800">
                    <ShieldAlert size={20} />
                    <h4 className="font-heading text-lg">Danger Zone</h4>
                  </div>
                  <p className="text-red-600/70 text-[14px] mb-6 font-bold uppercase tracking-tight">
                    Deactivation will freeze all active queues and staff access.
                  </p>
                  <button
                    type="button"
                    className="w-full py-4 bg-white border border-red-200 text-red-600 rounded-xl text-[14px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    onClick={() => Swal.fire('Security Protocol', 'Facility deactivation requires administrative override. Please contact support.', 'info')}
                  >
                    Request Termination
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* --- SCHEDULE & LEAVES TAB --- */}
          {activeSettingsTab === 'schedule' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header Info Banner */}
              <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <CalendarOff size={160} />
                </div>
                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
                    <Sun size={13} /> Schedule & Leave Controller
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight">Facility Working Days, Holidays & Doctor Leaves</h2>
                  <p className="text-slate-300 text-xs md:text-sm mt-2 leading-relaxed">
                    Configure weekly off-days (such as Sunday closures), public holidays, and individual doctor time-off. Any dates marked as unavailable will automatically be badged on the booking calendar and blocked from receiving appointment bookings.
                  </p>
                </div>
              </div>

              {/* Grid: 1. Clinic Weekly Schedule & 2. Doctor Weekly Schedule */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* 1. Clinic Weekly Schedule */}
                <div className="bg-white border border-sandstone rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-sandstone pb-3">
                      <div>
                        <h3 className="font-heading text-lg font-bold text-teak flex items-center gap-2">
                          <Building size={18} className="text-teal-600" /> Clinic Weekly Schedule
                        </h3>
                        <p className="text-xs text-khaki mt-0.5">Toggle days when the entire clinic is open or closed.</p>
                      </div>
                    </div>

                    <div className="space-y-4 my-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {weekdayOptions.map((day) => {
                          const isSelected = formData.workingDays.includes(day);
                          const isSunday = day === 'sunday';
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const nextDays = isSelected
                                  ? formData.workingDays.filter((d) => d !== day)
                                  : [...formData.workingDays, day];
                                setFormData({ ...formData, workingDays: nextDays });
                              }}
                              className={`p-3 rounded-2xl border text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1.5 ${
                                isSelected
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-md shadow-teal-700/20'
                                  : isSunday
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-300'
                                  : 'bg-parchment text-khaki border-sandstone hover:border-marigold'
                              }`}
                            >
                              <span className="text-sm font-black">{day.slice(0, 3)}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                isSelected ? 'bg-teal-800 text-teal-100' : isSunday ? 'bg-rose-100 text-rose-800' : 'bg-sandstone/30 text-khaki'
                              }`}>
                                {isSelected ? 'Open' : 'Holiday'}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Sunday Special Indicator */}
                      <div className={`p-4 rounded-2xl border text-xs flex items-center gap-3 ${
                        formData.workingDays.includes('sunday')
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          formData.workingDays.includes('sunday') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="font-bold">
                            {formData.workingDays.includes('sunday') ? 'Sunday is marked as OPEN' : 'Sunday is marked as WEEKLY HOLIDAY'}
                          </p>
                          <p className="text-[11px] opacity-80 mt-0.5">
                            {formData.workingDays.includes('sunday')
                              ? 'Patients CAN book appointments on Sundays.'
                              : 'Patients CANNOT book appointments on Sundays. Sundays are marked closed.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl font-bold uppercase text-xs tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    <Save size={16} /> Save Clinic Operating Days
                  </button>
                </div>

                {/* 2. Doctor Weekly Schedule */}
                <div className="bg-white border border-sandstone rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4 border-b border-sandstone pb-3">
                      <div>
                        <h3 className="font-heading text-lg font-bold text-teak flex items-center gap-2">
                          <Stethoscope size={18} className="text-teal-600" /> Specialist Available Days
                        </h3>
                        <p className="text-xs text-khaki mt-0.5">Custom shifts for doctors who work specific weekdays.</p>
                      </div>
                    </div>

                    {doctorsList.length === 0 ? (
                      <div className="py-12 text-center text-khaki">
                        <UserCheck size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-bold">No Active Doctors Found</p>
                        <p className="text-xs mt-1">Add doctors in Staff Management first.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 my-4">
                        <div>
                          <label className="text-[11px] font-black uppercase tracking-wider text-khaki ml-1 mb-1.5 block">Select Specialist</label>
                          <select
                            value={selectedDoctorId}
                            onChange={(e) => handleSelectDoctorForSchedule(e.target.value)}
                            className="w-full px-4 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-bold text-teak text-sm transition-all"
                          >
                            {doctorsList.map((doc) => (
                              <option key={doc._id} value={doc._id}>
                                Dr. {doc.name} — {doc.specialization || 'General Practitioner'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-2">
                          <label className="text-[11px] font-black uppercase tracking-wider text-khaki ml-1 mb-2 block">Weekly Consulting Days</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {weekdayOptions.map((day) => {
                              const isSelected = selectedDoctorDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => {
                                    const next = isSelected
                                      ? selectedDoctorDays.filter(d => d !== day)
                                      : [...selectedDoctorDays, day];
                                    setSelectedDoctorDays(next);
                                  }}
                                  className={`p-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${
                                    isSelected
                                      ? 'bg-teak text-white border-teak shadow-sm'
                                      : 'bg-parchment text-khaki border-sandstone hover:border-marigold'
                                  }`}
                                >
                                  <span>{day.slice(0, 3)}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                                    {isSelected ? 'Available' : 'Off'}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {doctorsList.length > 0 && (
                    <button
                      type="button"
                      disabled={isSavingDoctorSchedule}
                      onClick={handleSaveDoctorSchedule}
                      className="w-full py-3.5 bg-marigold hover:bg-teak text-white rounded-2xl font-bold uppercase text-xs tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                    >
                      <Save size={16} /> {isSavingDoctorSchedule ? 'Saving...' : 'Save Doctor Schedule'}
                    </button>
                  )}
                </div>
              </div>

              {/* Grid: 3. Clinic Holidays & 4. Doctor Leaves */}
              <div className="grid lg:grid-cols-2 gap-6">

                {/* 3. CLINIC HOLIDAYS */}
                <div className="bg-white border border-sandstone rounded-3xl p-6 md:p-8 shadow-sm flex flex-col">
                  <div className="border-b border-sandstone pb-4 mb-6">
                    <h3 className="font-heading text-lg font-bold text-teak flex items-center gap-2">
                      <CalendarOff size={18} className="text-rose-600" /> Clinic Holidays & Festival Closures
                    </h3>
                    <p className="text-xs text-khaki mt-0.5">Whole facility closed (e.g., Diwali, National Holidays, Maintenance).</p>
                  </div>

                  {/* Add Holiday Form */}
                  <form onSubmit={handleAddHoliday} className="bg-parchment/60 p-5 rounded-2xl border border-sandstone/60 mb-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-teak flex items-center gap-1.5">
                      <Plus size={14} className="text-rose-600" /> Schedule New Clinic Holiday
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Holiday Title / Occasion *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Diwali Vacation, Republic Day, Renovation"
                        className="w-full px-4 py-2.5 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-sm font-semibold text-teak"
                        value={holidayForm.title}
                        onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Start Date *</label>
                        <input
                          type="date"
                          required
                          className="w-full px-3 py-2 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-xs font-semibold text-teak"
                          value={holidayForm.startDate}
                          onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-khaki">End Date *</label>
                        <input
                          type="date"
                          required
                          min={holidayForm.startDate || undefined}
                          className="w-full px-3 py-2 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-xs font-semibold text-teak"
                          value={holidayForm.endDate}
                          onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Public Note / Reason</label>
                      <input
                        type="text"
                        placeholder="e.g. Annual facility maintenance (optional)"
                        className="w-full px-4 py-2 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-xs text-teak font-medium"
                        value={holidayForm.reason}
                        onChange={(e) => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Plus size={14} /> Add Clinic Holiday
                    </button>
                  </form>

                  {/* Holidays List */}
                  <div className="flex-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-khaki mb-3">Scheduled Holidays ({leaves.filter(l => !l.doctorId || l.type === 'clinic_holiday').length})</h4>
                    {loadingLeaves ? (
                      <p className="text-xs text-khaki text-center py-6">Loading holidays...</p>
                    ) : leaves.filter(l => !l.doctorId || l.type === 'clinic_holiday').length === 0 ? (
                      <div className="p-8 text-center bg-parchment/30 rounded-2xl border border-dashed border-sandstone">
                        <Sun size={28} className="mx-auto text-khaki/50 mb-2" />
                        <p className="text-xs font-bold text-teak">No Clinic Holidays Scheduled</p>
                        <p className="text-[11px] text-khaki mt-0.5">Use the form above to declare upcoming closures.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {leaves.filter(l => !l.doctorId || l.type === 'clinic_holiday').map((holiday) => {
                          const s = new Date(holiday.startDate);
                          const e = new Date(holiday.endDate);
                          const now = new Date();
                          const isActive = now >= s && now <= e;
                          return (
                            <div key={holiday._id} className="p-3.5 bg-parchment/40 border border-sandstone rounded-2xl flex items-center justify-between gap-3 hover:border-marigold/60 transition-all">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-teak truncate">{holiday.title}</span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                    isActive ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {isActive ? 'Active Today' : 'Upcoming'}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-rose-700 mt-0.5">
                                  📅 {s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  {holiday.startDate !== holiday.endDate && ` – ${e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                </p>
                                {holiday.reason && <p className="text-[11px] text-khaki italic mt-0.5 truncate">{holiday.reason}</p>}
                              </div>
                              <button
                                onClick={() => handleDeleteLeave(holiday._id, holiday.title)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-rose-200"
                                title="Delete Holiday"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. DOCTOR LEAVES */}
                <div className="bg-white border border-sandstone rounded-3xl p-6 md:p-8 shadow-sm flex flex-col">
                  <div className="border-b border-sandstone pb-4 mb-6">
                    <h3 className="font-heading text-lg font-bold text-teak flex items-center gap-2">
                      <Stethoscope size={18} className="text-purple-600" /> Specialist Leaves & Absences
                    </h3>
                    <p className="text-xs text-khaki mt-0.5">Record doctor time-off so patients cannot book them on these dates.</p>
                  </div>

                  {/* Add Doctor Leave Form */}
                  <form onSubmit={handleAddDoctorLeave} className="bg-parchment/60 p-5 rounded-2xl border border-sandstone/60 mb-6 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-teak flex items-center gap-1.5">
                      <Plus size={14} className="text-purple-600" /> Record Specialist Leave
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Select Doctor *</label>
                      <select
                        required
                        value={doctorLeaveForm.doctorId}
                        onChange={(e) => setDoctorLeaveForm({ ...doctorLeaveForm, doctorId: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-sm font-semibold text-teak"
                      >
                        <option value="">-- Choose Doctor --</option>
                        {doctorsList.map((doc) => (
                          <option key={doc._id} value={doc._id}>
                            Dr. {doc.name} ({doc.specialization || 'Specialist'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Leave Title / Reason *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Medical Conference, Vacation, Sick Leave"
                        className="w-full px-4 py-2.5 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-sm font-semibold text-teak"
                        value={doctorLeaveForm.title}
                        onChange={(e) => setDoctorLeaveForm({ ...doctorLeaveForm, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Start Date *</label>
                        <input
                          type="date"
                          required
                          className="w-full px-3 py-2 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-xs font-semibold text-teak"
                          value={doctorLeaveForm.startDate}
                          onChange={(e) => setDoctorLeaveForm({ ...doctorLeaveForm, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-khaki">End Date *</label>
                        <input
                          type="date"
                          required
                          min={doctorLeaveForm.startDate || undefined}
                          className="w-full px-3 py-2 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-xs font-semibold text-teak"
                          value={doctorLeaveForm.endDate}
                          onChange={(e) => setDoctorLeaveForm({ ...doctorLeaveForm, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={doctorsList.length === 0}
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <Plus size={14} /> Record Doctor Leave
                    </button>
                  </form>

                  {/* Doctor Leaves List */}
                  <div className="flex-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-khaki mb-3">Active & Upcoming Leaves ({leaves.filter(l => l.doctorId && l.type === 'doctor_leave').length})</h4>
                    {loadingLeaves ? (
                      <p className="text-xs text-khaki text-center py-6">Loading doctor leaves...</p>
                    ) : leaves.filter(l => l.doctorId && l.type === 'doctor_leave').length === 0 ? (
                      <div className="p-8 text-center bg-parchment/30 rounded-2xl border border-dashed border-sandstone">
                        <Stethoscope size={28} className="mx-auto text-khaki/50 mb-2" />
                        <p className="text-xs font-bold text-teak">No Doctor Leaves Scheduled</p>
                        <p className="text-[11px] text-khaki mt-0.5">All doctors are currently available on their assigned days.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {leaves.filter(l => l.doctorId && l.type === 'doctor_leave').map((leave) => {
                          const s = new Date(leave.startDate);
                          const e = new Date(leave.endDate);
                          const now = new Date();
                          const isActive = now >= s && now <= e;
                          const docName = leave.doctorId?.name || 'Doctor';
                          const spec = leave.doctorId?.specialization || '';
                          return (
                            <div key={leave._id} className="p-3.5 bg-parchment/40 border border-sandstone rounded-2xl flex items-center justify-between gap-3 hover:border-marigold/60 transition-all">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-teak truncate">Dr. {docName}</span>
                                  {spec && <span className="text-[10px] text-khaki truncate font-medium">• {spec}</span>}
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                    isActive ? 'bg-purple-100 text-purple-700 animate-pulse' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {isActive ? 'On Leave Today' : 'Scheduled'}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-purple-700 mt-0.5">
                                  {leave.title} ({s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  {leave.startDate !== leave.endDate && ` – ${e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`})
                                </p>
                                {leave.reason && <p className="text-[11px] text-khaki italic mt-0.5 truncate">{leave.reason}</p>}
                              </div>
                              <button
                                onClick={() => handleDeleteLeave(leave._id, `${docName} - ${leave.title}`)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-rose-200"
                                title="Cancel Leave"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* 5. IN-HOUSE LAB HOLIDAYS & CLOSURES */}
              <div className="bg-white border border-sandstone rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="border-b border-sandstone pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-teak flex items-center gap-2">
                      <FlaskConical size={18} className="text-teal-600" /> In-House Diagnostic Lab Holidays & Raja
                    </h3>
                    <p className="text-xs text-khaki mt-0.5">
                      Schedule planned closures, calibration days, or technician leave for your internal clinic lab.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold w-fit">
                    In-House Pathology
                  </span>
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                  {/* Form */}
                  <form onSubmit={handleAddLabLeave} className="lg:col-span-2 bg-parchment/60 p-5 rounded-2xl border border-sandstone/60 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-teak flex items-center gap-1.5">
                      <Plus size={14} className="text-teal-600" /> Schedule In-House Lab Holiday
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Occasion / Reason *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Analyzer Maintenance, Deep Cleaning, Pathologist Leave"
                        className="w-full px-4 py-2.5 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-sm font-semibold text-teak"
                        value={labLeaveForm.title}
                        onChange={(e) => setLabLeaveForm({ ...labLeaveForm, title: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Start Date *</label>
                        <input
                          type="date"
                          required
                          className="w-full px-3 py-2 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-xs font-semibold text-teak"
                          value={labLeaveForm.startDate}
                          onChange={(e) => setLabLeaveForm({ ...labLeaveForm, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-black uppercase tracking-wider text-khaki">End Date *</label>
                        <input
                          type="date"
                          required
                          min={labLeaveForm.startDate || undefined}
                          className="w-full px-3 py-2 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-xs font-semibold text-teak"
                          value={labLeaveForm.endDate}
                          onChange={(e) => setLabLeaveForm({ ...labLeaveForm, endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black uppercase tracking-wider text-khaki">Public Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. In-house test turnaround delayed by 24 hrs"
                        className="w-full px-4 py-2 bg-white border border-sandstone rounded-xl outline-none focus:border-marigold text-xs text-teak font-medium"
                        value={labLeaveForm.reason}
                        onChange={(e) => setLabLeaveForm({ ...labLeaveForm, reason: e.target.value })}
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Plus size={14} /> Schedule Lab Holiday
                    </button>
                  </form>

                  {/* List */}
                  <div className="lg:col-span-3 flex flex-col">
                    <h4 className="text-xs font-black uppercase tracking-wider text-khaki mb-3">
                      Scheduled In-House Lab Holidays ({leaves.filter(l => l.type === 'lab_leave').length})
                    </h4>
                    {loadingLeaves ? (
                      <p className="text-xs text-khaki text-center py-6">Loading lab holidays...</p>
                    ) : leaves.filter(l => l.type === 'lab_leave').length === 0 ? (
                      <div className="p-8 text-center bg-parchment/30 rounded-2xl border border-dashed border-sandstone flex-1 flex flex-col items-center justify-center">
                        <FlaskConical size={28} className="text-khaki/50 mb-2" />
                        <p className="text-xs font-bold text-teak">No In-House Lab Holidays</p>
                        <p className="text-[11px] text-khaki mt-0.5">In-house lab is available for patient referrals every working day.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {leaves.filter(l => l.type === 'lab_leave').map((leave) => {
                          const s = new Date(leave.startDate);
                          const e = new Date(leave.endDate);
                          const now = new Date();
                          const isActive = now >= s && now <= e;
                          return (
                            <div key={leave._id} className="p-3.5 bg-parchment/40 border border-sandstone rounded-2xl flex items-center justify-between gap-3 hover:border-marigold/60 transition-all">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-teak truncate">{leave.title}</span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                                    isActive ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {isActive ? 'Closed Today' : 'Scheduled'}
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-teal-700 mt-0.5">
                                  📅 {s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  {leave.startDate !== leave.endDate && ` – ${e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                </p>
                                {leave.reason && <p className="text-[11px] text-khaki italic mt-0.5 truncate">{leave.reason}</p>}
                              </div>
                              <button
                                onClick={() => handleDeleteLeave(leave._id, leave.title)}
                                className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-rose-200"
                                title="Delete Lab Holiday"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- LAB PARTNERS TAB --- */}
          {activeSettingsTab === 'labs' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Search & Link labs panel */}
                <div className="md:col-span-1 bg-white border border-sandstone rounded-3xl p-6 shadow-sm h-fit">
                  <h3 className="font-heading text-lg mb-4 flex items-center gap-2">
                    <Search size={18} className="text-marigold" /> Link Lab Partner
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by Lab Name or Code..."
                        className="w-full px-4 py-3 bg-parchment border border-sandstone rounded-2xl outline-none focus:border-marigold font-medium text-teak text-sm"
                        value={labSearchQuery}
                        onChange={(e) => setLabSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Available Labs */}
                  <div className="mt-6 space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-khaki">Available Labs</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {loadingAllLabs ? (
                        <p className="text-[13px] text-khaki text-center py-4">Loading laboratories...</p>
                      ) : allLabs.filter(lab =>
                        !labSearchQuery.trim() ||
                        lab.labName.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
                        lab.labCode.toLowerCase().includes(labSearchQuery.toLowerCase())
                      ).length === 0 ? (
                        <p className="text-[13px] text-khaki text-center italic py-4">No labs found.</p>
                      ) : (
                        allLabs.filter(lab =>
                          !labSearchQuery.trim() ||
                          lab.labName.toLowerCase().includes(labSearchQuery.toLowerCase()) ||
                          lab.labCode.toLowerCase().includes(labSearchQuery.toLowerCase())
                        ).map((lab) => (
                          <div key={lab._id} className="p-3 bg-parchment border border-sandstone rounded-2xl flex flex-col gap-2">
                            <div>
                              <p className="font-bold text-sm text-teak leading-tight">{lab.labName}</p>
                              <p className="text-[11px] font-black text-khaki uppercase tracking-widest mt-0.5">{lab.labCode}</p>
                              <p className="text-[12px] text-teak/70 mt-1 line-clamp-1">{lab.address}</p>
                            </div>

                            {lab.connectionStatus === 'accepted' ? (
                              <div className="py-1.5 bg-green-50 text-green-700 text-[12px] font-black uppercase tracking-wider rounded-xl text-center border border-green-200">
                                Connected
                              </div>
                            ) : lab.connectionStatus === 'pending' ? (
                              <div className="py-1.5 bg-yellow-50 text-yellow-700 text-[12px] font-black uppercase tracking-wider rounded-xl text-center border border-yellow-200 animate-pulse">
                                {lab.initiatedBy === 'lab' ? 'Incoming Request' : 'Request Pending'}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleLinkLab(lab._id)}
                                className="py-1.5 bg-teak hover:bg-marigold text-white text-[12px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                              >
                                <Link2 size={12} /> Link Lab
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Connections List */}
                <div className="md:col-span-2 bg-white border border-sandstone rounded-3xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-heading text-lg flex items-center gap-2">
                      <FlaskConical size={18} className="text-teak" /> Linked Diagnostics
                    </h3>
                    <button
                      onClick={() => { fetchClinicConnections(); fetchAllLabs(); }}
                      className="p-2 text-khaki hover:text-teak rounded-xl hover:bg-parchment transition-all"
                      title="Reload connections"
                    >
                      <RefreshCw size={15} />
                    </button>
                  </div>

                  {loadingConnections ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teak mb-2" />
                      <p className="text-[13px] font-black text-khaki uppercase tracking-wider">Syncing connections...</p>
                    </div>
                  ) : myConnections.length === 0 ? (
                    <div className="text-center py-16">
                      <FlaskConical className="mx-auto text-khaki mb-3 animate-pulse" size={32} />
                      <p className="font-bold text-teak">No Lab Connections yet</p>
                      <p className="text-[13px] text-khaki mt-1">Search and link independent laboratories on the left to start sending tests.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {myConnections.map((conn) => {
                        const lab = conn.labId || {};
                        return (
                          <div key={conn._id} className="p-4 border border-sandstone rounded-2xl bg-parchment/30 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <h4 className="font-bold text-sm text-teak truncate" title={lab.labName}>{lab.labName}</h4>
                                <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${conn.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                  conn.status === 'pending' ? 'bg-yellow-100 text-yellow-700 animate-pulse' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                  {conn.status}
                                </span>
                              </div>
                              <p className="text-[11px] font-black text-khaki uppercase tracking-widest">{lab.labCode}</p>
                              <p className="text-[12px] text-teak/70 mt-2 line-clamp-1">{lab.address}</p>
                              {lab.phone && <p className="text-[12px] text-teak/70 mt-1">📞 {lab.phone}</p>}
                            </div>

                            {conn.status === 'pending' && conn.initiatedBy === 'lab' ? (
                              <div className="mt-4 pt-3 border-t border-sandstone/40 flex flex-col gap-2">
                                <p className="text-[10px] text-marigold font-black uppercase tracking-wider">Incoming Connection Request</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRespondToRequest(conn._id, 'accept')}
                                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-black uppercase tracking-wider rounded-xl transition-all"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRespondToRequest(conn._id, 'reject')}
                                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-black uppercase tracking-wider rounded-xl transition-all"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-4 pt-3 border-t border-sandstone/40 flex items-center justify-between">
                                <span className="text-[11px] text-khaki">
                                  {conn.status === 'accepted' ? 'Active Partner' : 'Requested'}
                                </span>
                                <button
                                  onClick={() => handleDisconnectLab(conn._id)}
                                  className="p-1.5 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg border border-sandstone/50 hover:border-red-200 transition-all"
                                  title="Disconnect Partnership"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default ClinicSettings;