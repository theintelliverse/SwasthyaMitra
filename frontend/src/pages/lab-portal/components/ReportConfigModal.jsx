import React from 'react';
import { Settings, X, Save } from 'lucide-react';

const ReportConfigModal = ({
  showReportConfigModal,
  setShowReportConfigModal,
  reportConfig,
  setReportConfig,
  handleSaveReportConfig
}) => {
  if (!showReportConfigModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="text-teal-600" size={20} />
            <h3 className="font-extrabold text-slate-900 text-base">Branding Customization</h3>
          </div>
          <button onClick={() => setShowReportConfigModal(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-grow">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Lab Name (Header)</label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800"
              value={reportConfig.labName}
              onChange={(e) => setReportConfig({ ...reportConfig, labName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Header Primary Color</label>
              <input
                type="color"
                className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                value={reportConfig.primaryColor}
                onChange={(e) => setReportConfig({ ...reportConfig, primaryColor: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Header Font Size (pt)</label>
              <input
                type="number"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800"
                value={reportConfig.headerFontSize}
                onChange={(e) => setReportConfig({ ...reportConfig, headerFontSize: parseInt(e.target.value) || 20 })}
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Authorized Signatory Name</label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800"
              value={reportConfig.defaultDoctorName}
              onChange={(e) => setReportConfig({ ...reportConfig, defaultDoctorName: e.target.value })}
              placeholder="e.g. Dr. John Doe, MD (Pathology)"
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Default Charge Per Lab Test (₹)</label>
            <input
              type="number"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800"
              value={reportConfig.testFee}
              onChange={(e) => setReportConfig({ ...reportConfig, testFee: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Default Report Footnotes</label>
            <textarea
              rows="3"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800 resize-none"
              value={reportConfig.defaultNotes}
              onChange={(e) => setReportConfig({ ...reportConfig, defaultNotes: e.target.value })}
            />
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button onClick={() => setShowReportConfigModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider">Cancel</button>
          <button onClick={handleSaveReportConfig} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Save size={14} /> Save Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportConfigModal;
