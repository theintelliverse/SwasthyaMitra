import React from 'react';
import { X, Calendar, Clock, MapPin, User, Stethoscope, Phone, AlertCircle, ArrowRight } from 'lucide-react';

const AppointmentDetailSheet = ({ appointment, onClose, onReschedule, onCancel }) => {
  if (!appointment) return null;

  const statusColors = {
    Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Waiting: 'bg-teal-50 text-teal-700 border-teal-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-slate-100 text-slate-600 border-slate-200',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const status = appointment.status || 'Confirmed';

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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors[status] || statusColors.Confirmed}`}>
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
                  {new Date(appointment.appointmentDate || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <Clock size={18} className="text-teal-600" />
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Token / Slot</p>
                <p className="text-sm font-semibold text-slate-900">
                  {appointment.tokenNumber ? `Token ${appointment.tokenNumber}` : '10:30 AM'}
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
        </div>

        {/* Actions per spec */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <button
            onClick={() => onReschedule && onReschedule(appointment)}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Reschedule Appointment</span>
            <ArrowRight size={16} />
          </button>
          
          <button
            onClick={() => onCancel && onCancel(appointment)}
            className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-semibold text-sm rounded-xl transition-colors text-center"
          >
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailSheet;
