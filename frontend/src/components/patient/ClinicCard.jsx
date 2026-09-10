import React from 'react';
import { MapPin, Star, Clock, Stethoscope, ChevronRight } from 'lucide-react';

const ClinicCard = ({ clinic, onBook }) => {
  const name = clinic.name || 'Swasthya Healthcare Clinic';
  const specialty = clinic.specialty || clinic.category || 'General Medicine & Care';
  const rating = clinic.rating || '4.8';
  const distance = clinic.distance || '1.2 km away';
  const openTime = clinic.openingTime || '09:00 AM - 08:00 PM';

  return (
    <div className="bg-white border border-slate-200 hover:border-teal-500/50 rounded-xl p-4 transition-all duration-200 flex flex-col gap-3 group">
      <div className="flex items-start gap-3.5">
        <div className="w-14 h-14 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0 font-bold text-lg overflow-hidden">
          {clinic.photo ? (
            <img src={clinic.photo} alt={name} className="w-full h-full object-cover" />
          ) : (
            <Stethoscope size={24} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-slate-900 text-base truncate group-hover:text-teal-700 transition-colors">
              {name}
            </h4>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-semibold flex-shrink-0 border border-amber-200/60">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{specialty}</p>

          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-teal-600" />
              {distance}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} className="text-teal-600" />
              {openTime}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
        <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
          Token Available Today
        </span>

        <button
          onClick={() => onBook && onBook(clinic)}
          className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 shadow-sm active:scale-95"
        >
          <span>Book Now</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ClinicCard;
