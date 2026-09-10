import React from 'react';
import { FileText, Eye, Calendar, Beaker, Pill, Activity } from 'lucide-react';

const RecordRow = ({ record, onView }) => {
  const title = record.title || record.fileName || record.documentType || 'Medical Report';
  const type = record.documentType || record.category || 'General';
  const dateFormatted = record.date || record.uploadedAt || record.createdAt
    ? new Date(record.date || record.uploadedAt || record.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recent';

  const getTypeIcon = (t) => {
    const cleanType = String(t).toLowerCase();
    if (cleanType.includes('lab') || cleanType.includes('blood') || cleanType.includes('test')) {
      return <Beaker size={18} className="text-teal-700" />;
    }
    if (cleanType.includes('prescription') || cleanType.includes('medicine')) {
      return <Pill size={18} className="text-teal-700" />;
    }
    return <FileText size={18} className="text-teal-700" />;
  };

  return (
    <div className="bg-white border border-slate-200 hover:border-teal-500/50 rounded-xl p-3.5 transition-all duration-200 flex items-center justify-between gap-3 group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
          {getTypeIcon(type)}
        </div>

        <div className="min-w-0">
          <h5 className="font-semibold text-slate-900 text-sm truncate group-hover:text-teal-700 transition-colors">
            {title}
          </h5>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 font-medium">
            <span className="capitalize">{type}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-slate-400" />
              {dateFormatted}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onView && onView(record)}
        className="py-1.5 px-3 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
      >
        <Eye size={14} />
        <span>View</span>
      </button>
    </div>
  );
};

export default RecordRow;
