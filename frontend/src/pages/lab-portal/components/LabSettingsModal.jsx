import React, { useState, useEffect } from 'react';
import { Settings, X, Save, TrendingUp, Clock, FileCheck, Building } from 'lucide-react';
import Swal from 'sweetalert2';

const LabSettingsModal = ({
  isOpen,
  onClose,
  reportConfig,
  setReportConfig,
  handleSaveReportConfig,
  requests
}) => {
  if (!isOpen) return null;

  // Calculate stats for the right side panel
  const completedCount = requests.filter(r => r.status === 'Completed').length;
  const pendingCount = requests.filter(r => r.status === 'Pending' || r.status === 'Accepted' || r.status === 'Processing').length;
  const totalRevenue = completedCount * (reportConfig.testFee || 450);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform scale-100 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={24} />
              Lab Revenue & Billing Settings
            </h2>
            <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage billing rates, branding, and PDF reports</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Form: Rates & Settings */}
            <div className="lg:col-span-3 space-y-6 text-left">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-2 border-slate-100 flex items-center gap-2">
                <Settings size={18} className="text-teal-600" />
                Define Base Rates & Branding
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-2 tracking-wider">Lab Test Fee (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                    <input
                      type="number"
                      className="w-full bg-white border border-slate-200/60 pl-8 pr-3 py-2.5 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-teal-500 transition-colors"
                      value={reportConfig.testFee}
                      onChange={(e) => setReportConfig({ ...reportConfig, testFee: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-2 tracking-wider">Branding Color</label>
                  <input
                    type="color"
                    className="w-full h-10 p-1 bg-white border border-slate-200/60 rounded-xl outline-none focus:border-teal-500"
                    value={reportConfig.primaryColor}
                    onChange={(e) => setReportConfig({ ...reportConfig, primaryColor: e.target.value })}
                  />
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-2 tracking-wider">Authorized Signatory Name</label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200/60 px-3.5 py-2.5 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-teal-500 transition-colors"
                  value={reportConfig.defaultDoctorName}
                  onChange={(e) => setReportConfig({ ...reportConfig, defaultDoctorName: e.target.value })}
                  placeholder="e.g. Dr. John Doe, MD (Pathology)"
                />
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-2 tracking-wider">Default Report Footnotes</label>
                <textarea
                  rows="3"
                  className="w-full bg-white border border-slate-200/60 px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-800 outline-none focus:border-teal-500 transition-colors resize-none"
                  value={reportConfig.defaultNotes}
                  onChange={(e) => setReportConfig({ ...reportConfig, defaultNotes: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button 
                  onClick={handleSaveReportConfig}
                  className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Save Operational Rules
                </button>
              </div>
            </div>

            {/* Right Panel: Summary */}
            <div className="lg:col-span-2 space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 text-left">
              <div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnostic Revenue</h3>
                <div className="text-3xl font-black text-slate-900">₹{totalRevenue.toLocaleString('en-IN')}</div>
                <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
                  <span className="px-1.5 py-0.2 bg-emerald-50 rounded">Live</span>
                  <span>Based on Completed Reports</span>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200/60">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Diagnostic Metrics</h4>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <span>Completed Reports</span>
                    <span className="font-black text-slate-800">{completedCount}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: requests.length > 0 ? `${(completedCount / requests.length) * 100}%` : '0%' }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <span>Pending Processing</span>
                    <span className="font-black text-slate-800">{pendingCount}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: requests.length > 0 ? `${(pendingCount / requests.length) * 100}%` : '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between mt-6">
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Stream</h5>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">Real-time Connection</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>Live Syncing
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabSettingsModal;
