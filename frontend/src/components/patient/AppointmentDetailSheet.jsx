import React, { useState } from 'react';
import { X, Calendar, Clock, Stethoscope, AlertCircle, ArrowRight, Loader2, Star, Building2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config/runtime';
import RatingModal from './RatingModal';

const AppointmentDetailSheet = ({ appointment, onClose, onReschedule, onCancel }) => {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [ratingConfig, setRatingConfig] = useState(null); // { targetType, targetId, targetName }

  if (!appointment) return null;

  const statusColors = {
    Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Waiting: 'bg-teal-50 text-teal-700 border-teal-200',
    Scheduled: 'bg-teal-50 text-teal-700 border-teal-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-slate-100 text-slate-600 border-slate-200',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const status = appointment.status || 'Scheduled';
  const isCancellable = status !== 'Completed' && status !== 'Cancelled';

  const handleCancel = async () => {
    if (!isCancellable) return;
    
    // Use queueId from appointment object (returned by getPatientAppointments)
    const queueId = appointment.queueId || appointment._id;
    
    if (!queueId) {
      setError('Could not find appointment ID to cancel.');
      return;
    }

    setCancelling(true);
    setError('');
    try {
      // Cancel the queue entry (public route - no auth needed)
      await axios.delete(`${API_URL}/api/queue/public/cancel/${queueId}`);
      
      // Also update patient's local appointment status via protected route
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.patch(
            `${API_URL}/api/auth/patient/cancel-appointment/${queueId}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch {
          // Non-fatal: local status update failed, the queue entry is still deleted
        }
      }

      // Notify parent to close & refresh
      if (onCancel) onCancel(appointment);
    } catch (err) {
      console.error('Cancel error:', err);
      setError(err.response?.data?.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle Bar */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors.Scheduled}`}>
              {status}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
              {appointment.clinicName || 'Clinic Appointment'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Appointment Details Grid */}
        <div className="py-5 space-y-4">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-10 h-10 rounded-full bg-teal-100/80 text-teal-700 flex items-center justify-center font-bold text-sm">
              <Stethoscope size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Doctor</p>
              <p className="text-base font-semibold text-slate-900">Dr. {appointment.doctorName || 'Consultant Doctor'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <Calendar size={18} className="text-teal-600" />
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Date</p>
                <p className="text-sm font-semibold text-slate-900">
                  {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <Clock size={18} className="text-teal-600" />
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Token / Slot</p>
                <p className="text-sm font-semibold text-slate-900">
                  {appointment.tokenNumber ? `Token ${appointment.tokenNumber}` : '—'}
                </p>
              </div>
            </div>
          </div>

          {appointment.reason && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[11px] font-medium text-slate-500 uppercase">Reason for Visit</p>
              <p className="text-sm font-medium text-slate-800 mt-1">{appointment.reason}</p>
            </div>
          )}

          {/* Rating Options for Patient (Doctor & Clinic) */}
          {(appointment.doctorId || appointment.clinicId) && (
            <div className="bg-gradient-to-br from-amber-50/80 to-teal-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Rate Your Experience
                  </span>
                </div>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full border border-teal-200">
                  Verified Patient
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Help other patients by leaving a verified 1 to 5 star rating for your doctor and clinic.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {(appointment.doctorId?._id || appointment.doctorId) && (
                  <button
                    type="button"
                    onClick={() => setRatingConfig({
                      targetType: 'doctor',
                      targetId: appointment.doctorId?._id || appointment.doctorId,
                      targetName: appointment.doctorId?.name || appointment.doctorName || 'Doctor'
                    })}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition active:scale-95"
                  >
                    <Stethoscope size={14} className="text-teal-600 shrink-0" />
                    <span className="truncate">Rate Dr. {appointment.doctorId?.name || appointment.doctorName || 'Doctor'}</span>
                  </button>
                )}
                {(appointment.clinicId?._id || appointment.clinicId) && (
                  <button
                    type="button"
                    onClick={() => setRatingConfig({
                      targetType: 'clinic',
                      targetId: appointment.clinicId?._id || appointment.clinicId,
                      targetName: appointment.clinicId?.name || appointment.clinicName || 'Clinic'
                    })}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs transition active:scale-95"
                  >
                    <Building2 size={14} className="text-teal-600 shrink-0" />
                    <span className="truncate">Rate {appointment.clinicId?.name || appointment.clinicName || 'Clinic'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          {isCancellable && (
            <button
              onClick={() => onReschedule && onReschedule(appointment)}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Reschedule Appointment</span>
              <ArrowRight size={16} />
            </button>
          )}
          
          {isCancellable ? (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-semibold text-sm rounded-xl transition-colors text-center flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cancelling ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 text-slate-600 font-semibold text-sm rounded-xl transition-colors text-center"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Rating Modal for Doctor & Clinic */}
      {ratingConfig && (
        <RatingModal
          isOpen={!!ratingConfig}
          onClose={() => setRatingConfig(null)}
          targetType={ratingConfig.targetType}
          targetId={ratingConfig.targetId}
          targetName={ratingConfig.targetName}
          onSuccess={() => {
            setRatingConfig(null);
          }}
        />
      )}
    </div>
  );
};

export default AppointmentDetailSheet;
