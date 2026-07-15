import React from 'react';
import { Upload, X, FileText, Eye } from 'lucide-react';

const UploadReportModal = ({
  showUploadModal,
  setShowUploadModal,
  uploadModalPatient,
  handleUploadModalFileSelect,
  selectedUploadFiles,
  handleRemoveSelectedFile,
  handleConfirmUpload
}) => {
  if (!showUploadModal || !uploadModalPatient) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="text-emerald-600" size={20} />
            <h3 className="font-extrabold text-slate-900 text-base">Upload Scanned Lab Report</h3>
          </div>
          <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-2 text-xs font-bold text-slate-500 border border-slate-150">
            <p>Patient Name: <span className="text-slate-800 font-extrabold">{uploadModalPatient.patientName}</span></p>
            <p>Phone: <span className="text-slate-800 font-extrabold">{uploadModalPatient.patientPhone}</span></p>
            <p className="col-span-2">Test: <span className="text-emerald-700 font-extrabold">{uploadModalPatient.testName || 'Routine Diagnosis'}</span></p>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-all cursor-pointer bg-slate-50/50 hover:bg-white relative">
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleUploadModalFileSelect}
            />
            <Upload className="mx-auto text-slate-400 mb-2" size={28} />
            <p className="text-xs font-black text-slate-700 uppercase tracking-wide">Drag & Drop files here or click to browse</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Supports PDF, JPG, PNG up to 5MB</p>
          </div>

          {selectedUploadFiles.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto font-medium">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added Files ({selectedUploadFiles.length})</p>
              {selectedUploadFiles.map(file => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {file.isPdf ? <FileText className="text-red-500 shrink-0" size={14} /> : <Eye className="text-emerald-500 shrink-0" size={14} />}
                    <span className="font-bold text-slate-700 truncate max-w-xs">{file.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold">({file.size})</span>
                  </div>
                  <button onClick={() => handleRemoveSelectedFile(file.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider">Cancel</button>
          <button onClick={handleConfirmUpload} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider">Publish Results</button>
        </div>
      </div>
    </div>
  );
};

export default UploadReportModal;
