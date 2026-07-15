import React from 'react';
import { Plus, X } from 'lucide-react';

const NewTestModal = ({
  showNewTestModal,
  setShowNewTestModal,
  newTestForm,
  setNewTestForm,
  connectedClinics,
  handleNewTestRequest
}) => {
  if (!showNewTestModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="text-emerald-600" size={20} />
            <h3 className="font-extrabold text-slate-900 text-base">New Walk-In Request</h3>
          </div>
          <button onClick={() => setShowNewTestModal(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Select Partner Clinic</label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-extrabold text-slate-800"
              value={newTestForm.clinicId}
              onChange={(e) => setNewTestForm({ ...newTestForm, clinicId: e.target.value })}
            >
              <option value="">Choose partner clinic...</option>
              {connectedClinics.map(clinic => (
                <option key={clinic._id} value={clinic._id}>
                  {clinic.name} ({clinic.clinicCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Patient Full Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-extrabold text-slate-800"
              value={newTestForm.patientName}
              onChange={(e) => setNewTestForm({ ...newTestForm, patientName: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Patient Phone Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-extrabold text-slate-800"
              value={newTestForm.patientPhone}
              onChange={(e) => setNewTestForm({ ...newTestForm, patientPhone: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Test Name / Parameters</label>
            <input
              type="text"
              placeholder="e.g. CBC, Lipid Profile, Thyroid"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-extrabold text-slate-800"
              value={newTestForm.testType}
              onChange={(e) => setNewTestForm({ ...newTestForm, testType: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Clinical Notes / Symptoms (Optional)</label>
            <textarea
              rows="2"
              placeholder="e.g. Patient requests fasting lipid panel"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-xs font-extrabold text-slate-800 resize-none"
              value={newTestForm.notes}
              onChange={(e) => setNewTestForm({ ...newTestForm, notes: e.target.value })}
            />
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={() => setShowNewTestModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider">Cancel</button>
          <button onClick={handleNewTestRequest} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider">Create Request</button>
        </div>
      </div>
    </div>
  );
};

export default NewTestModal;
