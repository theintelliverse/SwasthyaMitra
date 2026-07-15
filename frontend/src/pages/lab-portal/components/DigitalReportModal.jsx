import React from 'react';
import { FileCheck, X, BadgeCheck } from 'lucide-react';

const DigitalReportModal = ({
  showDigitalReportModal,
  setShowDigitalReportModal,
  activeDigitalPatient,
  digitalReportForm,
  setDigitalReportForm,
  handlePublishDigitalReport
}) => {
  if (!showDigitalReportModal || !activeDigitalPatient) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="text-indigo-600" size={20} />
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Digital Report Builder</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Generating report for {activeDigitalPatient.patientName}</p>
            </div>
          </div>
          <button onClick={() => setShowDigitalReportModal(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-grow">
          <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
            <p>Patient Name: <span className="text-slate-900 font-black">{activeDigitalPatient.patientName}</span></p>
            <p>Phone: <span className="text-slate-900 font-black">{activeDigitalPatient.patientPhone}</span></p>
            <p className="col-span-2">Diagnostic Test Referral: <span className="text-indigo-700 font-black">{activeDigitalPatient.testName || 'Routine Diagnosis'}</span></p>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Test Parameters, Values & Findings</label>
            <textarea
              rows="7"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-bold text-slate-800"
              value={digitalReportForm.findings}
              onChange={(e) => setDigitalReportForm({ ...digitalReportForm, findings: e.target.value })}
              placeholder={`E.g.\nParameter            Observed    Ref. Range\n---------------------------------------------\nHemoglobin (Hb)      14.2 g/dL   13.0 - 17.0\nRBC Count            4.8 M/uL    4.5 - 5.5\nWBC Count            6,500 /uL   4,000 - 11,000\nPlatelets            2.5 L/uL    1.5 - 4.5`}
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Pathologist Notes & Interpretation</label>
            <textarea
              rows="3"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-bold text-slate-800 resize-none"
              value={digitalReportForm.notes}
              onChange={(e) => setDigitalReportForm({ ...digitalReportForm, notes: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Authorized Signatory</label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs font-bold text-slate-800"
              value={digitalReportForm.doctorName}
              onChange={(e) => setDigitalReportForm({ ...digitalReportForm, doctorName: e.target.value })}
            />
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button onClick={() => setShowDigitalReportModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider">Cancel</button>
          <button onClick={handlePublishDigitalReport} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <BadgeCheck size={14} /> Compile & Publish Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default DigitalReportModal;
