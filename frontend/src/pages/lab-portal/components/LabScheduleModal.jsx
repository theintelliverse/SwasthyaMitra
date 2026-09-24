import React, { useState, useEffect, useCallback } from 'react';
import { 
  CalendarOff, Clock, Calendar, CheckCircle2, AlertCircle, 
  Trash2, Plus, Save, X, Coffee, ShieldAlert, Sparkles, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { API_URL } from '../../../config/runtime';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const LabScheduleModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [submittingHoliday, setSubmittingHoliday] = useState(false);

  // Lab Schedule State
  const [workingDays, setWorkingDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
  const [isAvailable, setIsAvailable] = useState(true);
  const [liveUntilDate, setLiveUntilDate] = useState('');
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('20:00');

  // Leaves / Holidays State
  const [leaves, setLeaves] = useState([]);
  const [holidayForm, setHolidayForm] = useState({
    title: '',
    startDate: '',
    endDate: '',
    reason: '',
    type: 'lab_holiday'
  });

  const token = localStorage.getItem('labToken');

  const fetchScheduleAndLeaves = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/lab-connect/leaves/lab`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const d = res.data.data;
        setLeaves(d.leaves || []);
        if (d.workingDays && d.workingDays.length) {
          setWorkingDays(d.workingDays);
        }
        setIsAvailable(d.isAvailable !== false);
        setLiveUntilDate(d.liveUntilDate ? d.liveUntilDate.split('T')[0] : '');
        if (d.openingTime) setOpeningTime(d.openingTime);
        if (d.closingTime) setClosingTime(d.closingTime);
      }
    } catch (err) {
      console.error('Error fetching lab schedule & leaves:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchScheduleAndLeaves();
    }
  }, [isOpen, fetchScheduleAndLeaves]);

  if (!isOpen) return null;

  // Toggle weekday selection
  const toggleWeekday = (day) => {
    if (workingDays.includes(day)) {
      if (workingDays.length === 1) {
        Swal.fire({
          icon: 'warning',
          title: 'Minimum 1 Day Required',
          text: 'The lab must operate on at least one day per week.',
          confirmButtonColor: '#1B6CA8'
        });
        return;
      }
      setWorkingDays(workingDays.filter(d => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  // Save weekly operating schedule
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const res = await axios.patch(
        `${API_URL}/api/lab-connect/schedule/lab`,
        {
          workingDays,
          isAvailable,
          liveUntilDate: liveUntilDate || null,
          openingTime,
          closingTime
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Schedule Updated',
          text: 'Lab operating hours, working days, and availability status updated successfully.',
          confirmButtonColor: '#1B6CA8'
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to update schedule.',
        confirmButtonColor: '#1B6CA8'
      });
    } finally {
      setSavingSchedule(false);
    }
  };

  // Add new Holiday / Raja
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.title.trim() || !holidayForm.startDate || !holidayForm.endDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Details',
        text: 'Holiday title, start date, and end date are required.',
        confirmButtonColor: '#1B6CA8'
      });
      return;
    }

    if (new Date(holidayForm.startDate) > new Date(holidayForm.endDate)) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Date Range',
        text: 'Start date cannot be after end date.',
        confirmButtonColor: '#1B6CA8'
      });
      return;
    }

    setSubmittingHoliday(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/lab-connect/leaves/lab`,
        holidayForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Holiday / Raja Scheduled',
          text: `"${holidayForm.title}" recorded. Connected clinics will see this lab as closed during this period.`,
          confirmButtonColor: '#1B6CA8'
        });
        setHolidayForm({ title: '', startDate: '', endDate: '', reason: '', type: 'lab_holiday' });
        fetchScheduleAndLeaves();
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to Add Holiday',
        text: err.response?.data?.message || 'Could not schedule holiday.',
        confirmButtonColor: '#1B6CA8'
      });
    } finally {
      setSubmittingHoliday(false);
    }
  };

  // Delete Holiday / Raja
  const handleDeleteLeave = async (leaveId, title) => {
    const confirm = await Swal.fire({
      title: 'Remove Holiday / Raja?',
      text: `Are you sure you want to remove "${title}"? Connected clinics will see this lab as available on these dates.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Remove It'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.delete(`${API_URL}/api/lab-connect/leaves/lab/${leaveId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Holiday Removed',
            text: 'Holiday record has been removed.',
            confirmButtonColor: '#1B6CA8'
          });
          fetchScheduleAndLeaves();
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err.response?.data?.message || 'Failed to remove holiday.',
          confirmButtonColor: '#1B6CA8'
        });
      }
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[160] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col transform scale-100 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <CalendarOff size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Lab Operating Schedule & Holidays (રજા)
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Manage weekly working days, planned holidays, equipment maintenance closures, and live availability
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">Loading lab schedule & holidays...</p>
            </div>
          ) : (
            <>
              {/* SECTION 1: WEEKLY OPERATING DAYS & LIVE AVAILABILITY */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weekly Operating Days */}
                <div className="lg:col-span-2 bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-blue-600" />
                        Weekly Operating Days
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select which days your diagnostic lab operates. Off days will automatically flag as Weekly Off.
                      </p>
                    </div>
                  </div>

                  {/* Day Selector Chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {WEEKDAYS.map((day) => {
                      const isSelected = workingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleWeekday(day)}
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-black uppercase tracking-wider">
                            {day.slice(0, 3)}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isSelected ? 'Open' : 'Off'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Working Hours & Save Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 items-end">
                    <div>
                      <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">Opening Time</label>
                      <input
                        type="time"
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black uppercase text-slate-500 block mb-1">Closing Time</label>
                      <input
                        type="time"
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={savingSchedule}
                      onClick={handleSaveSchedule}
                      className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
                    >
                      <Save size={15} /> {savingSchedule ? 'Saving...' : 'Save Schedule'}
                    </button>
                  </div>
                </div>

                {/* Live Availability / Emergency Pause */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert size={16} className="text-amber-500" />
                      Live Service Status
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Pause new incoming clinic test requests temporarily for equipment maintenance or emergency.
                    </p>

                    <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200/70 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Lab Accepting Requests</span>
                        <button
                          type="button"
                          onClick={() => setIsAvailable(!isAvailable)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isAvailable ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              isAvailable ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="text-[11px] font-semibold text-slate-500">
                        Status:{' '}
                        {isAvailable ? (
                          <span className="text-emerald-600 font-bold">🟢 Active & Receiving Tests</span>
                        ) : (
                          <span className="text-rose-600 font-bold">🔴 Paused (Clinics warned)</span>
                        )}
                      </div>

                      {!isAvailable && (
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                            Pause Until Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={liveUntilDate}
                            onChange={(e) => setLiveUntilDate(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    💡 Click "Save Schedule" to update your live availability across connected clinics.
                  </p>
                </div>
              </div>

              {/* SECTION 2: SCHEDULE NEW LAB HOLIDAY / RAJA */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Form: Add Holiday */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/80 rounded-3xl p-6 space-y-4">
                  <div className="border-b border-slate-200/60 pb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Plus size={16} className="text-blue-600" />
                      Schedule Lab Holiday / Raja
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Set holiday closures for festivals, staff leave, or machine maintenance.
                    </p>
                  </div>

                  <form onSubmit={handleAddHoliday} className="space-y-3.5">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Holiday Title / Reason *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Diwali Vacation, Annual Calibration, Staff Holiday"
                        value={holidayForm.title}
                        onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={holidayForm.startDate}
                          onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                          End Date *
                        </label>
                        <input
                          type="date"
                          required
                          min={holidayForm.startDate || undefined}
                          value={holidayForm.endDate}
                          onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 shadow-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                        Public Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Routine autoclave & analyzer maintenance"
                        value={holidayForm.reason}
                        onChange={(e) => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingHoliday}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 active:scale-95"
                    >
                      <Plus size={15} /> {submittingHoliday ? 'Scheduling...' : 'Add Lab Holiday / Raja'}
                    </button>
                  </form>
                </div>

                {/* List: Scheduled Holidays */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col">
                  <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <CalendarOff size={16} className="text-rose-500" />
                        Scheduled Lab Holidays ({leaves.length})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dates when this lab is marked closed for test bookings
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 max-h-[360px] pr-1">
                    {leaves.length === 0 ? (
                      <div className="py-16 text-center text-slate-400 space-y-2">
                        <CalendarOff size={36} className="mx-auto opacity-30 text-slate-400" />
                        <p className="text-xs font-bold text-slate-500">No Lab Holidays Scheduled</p>
                        <p className="text-[11px] text-slate-400">
                          Use the form on the left to schedule planned closures or festival holidays.
                        </p>
                      </div>
                    ) : (
                      leaves.map((leave) => {
                        const start = new Date(leave.startDate);
                        const end = new Date(leave.endDate);
                        const isToday = now >= start && now <= end;
                        const isUpcoming = start > now;
                        const isPast = end < now;

                        const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

                        return (
                          <div
                            key={leave._id}
                            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                              isToday
                                ? 'bg-amber-50/80 border-amber-200'
                                : isUpcoming
                                ? 'bg-slate-50/80 border-slate-200 hover:border-blue-300'
                                : 'bg-slate-50/40 border-slate-100 opacity-60'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-black text-slate-900">{leave.title}</h4>
                                {isToday && (
                                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                                    <AlertTriangle size={10} /> Closed Today
                                  </span>
                                )}
                                {isUpcoming && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
                                    Upcoming ({diffDays} {diffDays === 1 ? 'day' : 'days'})
                                  </span>
                                )}
                                {isPast && (
                                  <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-medium">
                                    Past
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] font-semibold text-slate-600">
                                📅 {start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {diffDays > 1 && ` — ${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                <span className="text-slate-400 font-normal ml-2">({diffDays} {diffDays === 1 ? 'day' : 'days'})</span>
                              </p>

                              {leave.reason && (
                                <p className="text-[11px] text-slate-500 italic">
                                  "{leave.reason}"
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteLeave(leave._id, leave.title)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                              title="Delete Holiday"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-600" />
            Changes reflect immediately in connected clinic referrals and your public profile.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LabScheduleModal;
