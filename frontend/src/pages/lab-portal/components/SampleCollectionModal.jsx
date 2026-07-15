import React from 'react';
import { TestTubes, X } from 'lucide-react';

const SampleCollectionModal = ({
  showSampleCollectionModal,
  setShowSampleCollectionModal
}) => {
  if (!showSampleCollectionModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TestTubes className="text-violet-600" size={20} />
            <h3 className="font-extrabold text-slate-900 text-base">Specimen Collection Guide</h3>
          </div>
          <button onClick={() => setShowSampleCollectionModal(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-grow text-xs text-slate-600 font-semibold leading-relaxed">
          <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100/50">
            <h4 className="font-extrabold text-violet-800 mb-1 uppercase tracking-wider">1. Blood Samples (SST / EDTA)</h4>
            <p>CBC/Hb: EDTA tube (purple), mix gently. Glucose/Lipids: SST (gold) or Plain (red). Require 8-12 hours overnight fasting.</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100/50">
            <h4 className="font-extrabold text-amber-800 mb-1 uppercase tracking-wider">2. Urine Collections (Sterile Cup)</h4>
            <p>Advise patient to collect first-morning clean-catch midstream sample. Process within 2 hours or refrigerate immediately.</p>
          </div>
          <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100/50">
            <h4 className="font-extrabold text-sky-800 mb-1 uppercase tracking-wider">3. Swabs & Culture Samples</h4>
            <p>Use sterile dacron swabs. Store in transport media (Amies). Ensure patient has not brushed or used mouthwash within 1 hour for oral tests.</p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button onClick={() => setShowSampleCollectionModal(false)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider">Understood</button>
        </div>
      </div>
    </div>
  );
};

export default SampleCollectionModal;
