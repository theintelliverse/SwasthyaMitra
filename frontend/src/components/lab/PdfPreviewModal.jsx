import React from 'react';
import { X, Download, CloudUpload, Eye, CheckCircle, FileText } from 'lucide-react';

const PdfPreviewModal = ({
  isOpen,
  pdfBlob,
  pdfFile,
  patientName = 'Patient',
  testName = 'Lab Report',
  onConfirmUpload,
  onCancel,
  isUploading = false
}) => {
  if (!isOpen || !pdfBlob) return null;

  const pdfUrl = URL.createObjectURL(pdfBlob);
  const fileName = pdfFile?.name || `LabReport_${patientName.replace(/\s+/g, '_')}.pdf`;

  const handleDownloadLocal = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                Generated Report PDF Preview
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Review report for <span className="font-bold text-teal-300">{patientName}</span> ({testName})
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Live PDF Preview */}
        <div className="flex-grow p-4 bg-slate-100/70 overflow-hidden flex flex-col">
          <div className="w-full flex-grow rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-inner min-h-[450px]">
            <iframe
              src={pdfUrl}
              title="Report PDF Preview"
              className="w-full h-full min-h-[450px] border-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <Eye size={14} className="text-teal-600" />
            First preview, then download locally or upload to Cloudinary & DB
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Download Local Copy */}
            <button
              onClick={handleDownloadLocal}
              disabled={isUploading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
            >
              <Download size={15} />
              Save Local PDF
            </button>

            {/* Cancel / Edit */}
            <button
              onClick={onCancel}
              disabled={isUploading}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all border border-slate-200 active:scale-95 disabled:opacity-50"
            >
              Cancel / Edit
            </button>

            {/* Confirm & Upload to Cloudinary & DB */}
            <button
              onClick={onConfirmUpload}
              disabled={isUploading}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-teal-600/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading to Cloudinary...
                </>
              ) : (
                <>
                  <CloudUpload size={16} />
                  Confirm & Upload to Cloudinary
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
