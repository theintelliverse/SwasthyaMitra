import React from 'react';
import { Calendar, Clock, MapPin, ChevronRight, Stethoscope } from 'lucide-react';

const AppointmentCard = ({ appointment, onClick }) => {
  const status = appointment.status || 'Confirmed';
  
  const statusStyles = {
    Confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Waiting: 'bg-teal-50 text-teal-700 border-teal-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-slate-100 text-slate-600 border-slate-200',
    Cancelled: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  const apptDate = appointment.appointmentDate || appointment.createdAt;
  const dateFormatted = apptDate 
    ? new Date(apptDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Today';

  return (
    <div 
      onClick={() => onClick && onClick(appointment)}
      className="bg-white border border-slate-200 hover:border-teal-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer active:scale-[0.99] flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-100 flex-shrink-0">
            <Stethoscope size={18} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 text-base group-hover:text-teal-700 transition-colors leading-snug">
              {appointment.clinicName || appointment.clinicId?.name || 'Clinic Consultation'}
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Dr. {appointment.doctorName || appointment.doctorId?.name || 'Consulting Specialist'}
            </p>
          </div>
        </div>

        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyles[status] || statusStyles.Confirmed}`}>
          {status}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-teal-600" />
            {dateFormatted}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-teal-600" />
            {appointment.tokenNumber ? `Token ${appointment.tokenNumber}` : 'Scheduled'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === 'Completed' && (
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              ★ Rate
            </span>
          )}
          <div className="flex items-center text-teal-700 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Details</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
