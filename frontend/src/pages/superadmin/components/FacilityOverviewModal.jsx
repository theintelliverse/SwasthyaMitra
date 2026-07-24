import React, { useState, useEffect } from 'react';
import { 
  X, Users, UserCheck, Calendar, DollarSign, Activity, FileText, 
  CheckCircle, XCircle, Clock, Shield, Search, Award, MapPin, ExternalLink,
  ChevronRight, AlertTriangle, Send, Download, Tag, RefreshCw, BarChart2
} from 'lucide-react';

const FacilityOverviewModal = ({
  facility,
  facilityType, // 'clinic' or 'lab'
  isOpen,
  onClose,
  token,
  onRefreshData,
  onApproveReject,
  onGiftSubscription,
  onToggleActive
}) => {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'members', 'patients', 'catalog', 'financials', 'support', 'seo', 'controls'
  const [timeframe, setTimeframe] = useState('weekly'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [loading, setLoading] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // Fetch detailed facility overview data when modal opens
  useEffect(() => {
    if (isOpen && facility?._id) {
      fetchFacilityOverview();
    }
  }, [isOpen, facility?._id, facilityType]);

  const fetchFacilityOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/facility/${facility._id}/overview?type=${facilityType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOverviewData(data);
      }
    } catch (err) {
      console.error('Failed to fetch facility overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !facility) return null;

  const fac = overviewData?.facility || facility;
  const members = overviewData?.members || [];
  const patients = overviewData?.patients || [];
  const financials = overviewData?.financials || { payments: [], totalRevenue: 0 };
  const supportTickets = overviewData?.supportTickets || [];
  const analytics = overviewData?.analytics || {
    daily: { labels: [], patients: [], revenue: [], consultations: [] },
    weekly: { labels: [], patients: [], revenue: [], consultations: [] },
    monthly: { labels: [], patients: [], revenue: [], consultations: [] },
    yearly: { labels: [], patients: [], revenue: [], consultations: [] }
  };

  const currentAnalytics = analytics[timeframe] || analytics.weekly;

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
    (m.role || '').toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredPatients = patients.filter(p => 
    (p.name || '').toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone || '').includes(patientSearch)
  );

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(overviewData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${facilityType}_${fac.name || fac.labName}_overview.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-sandstone/30 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Top Banner & Header */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-950 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 pr-12">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-black tracking-tight">{fac.name || fac.labName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-teal-950">
                  {facilityType === 'clinic' ? 'Clinic Facility' : 'Independent Lab'}
                </span>
                
                {/* Approval Status Badge */}
                {fac.approvalStatus === 'pending' ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 animate-pulse">
                    <Clock size={12} /> Pending Approval
                  </span>
                ) : fac.approvalStatus === 'rejected' ? (
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1.5">
                    <XCircle size={12} /> Rejected
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
                    <CheckCircle size={12} /> Approved & Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-teal-100 font-medium">
                <span>Code: <strong className="text-amber-300 font-mono">{fac.clinicCode || fac.labCode}</strong></span>
                <span>•</span>
                <span>Contact: {fac.contactPhone || fac.phone}</span>
                <span>•</span>
                <span>Joined: {new Date(fac.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Quick Actions Header Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              {fac.approvalStatus === 'pending' && (
                <>
                  <button
                    onClick={() => onApproveReject(fac._id, facilityType, 'approved')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle size={14} /> Approve Facility
                  </button>
                  <button
                    onClick={() => onApproveReject(fac._id, facilityType, 'rejected')}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              )}

              <button
                onClick={() => onGiftSubscription(fac._id, facilityType)}
                className="px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-100 border border-indigo-300/30 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Award size={14} /> Gift Trial
              </button>

              <button
                onClick={() => onToggleActive(fac._id, facilityType)}
                className={`px-3 py-2 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  fac.isActive
                    ? 'bg-rose-500/20 text-rose-200 border-rose-400/30 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/30'
                }`}
              >
                <Activity size={14} /> {fac.isActive ? 'Suspend Facility' : 'Activate Facility'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-50 border-b border-sandstone/25 px-6 pt-3 flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'analytics', label: 'Analytics & Charts', icon: BarChart2 },
            { id: 'members', label: `Staff & Doctors (${members.length})`, icon: Users },
            { id: 'patients', label: `Patients Directory (${patients.length})`, icon: UserCheck },
            { id: 'catalog', label: facilityType === 'clinic' ? 'Pricing & Fees' : 'Test Catalog', icon: Tag },
            { id: 'financials', label: 'Financials & Ledger', icon: DollarSign },
            { id: 'support', label: `Support Tickets (${supportTickets.length})`, icon: FileText },
            { id: 'seo', label: 'SEO & Public Profile', icon: ExternalLink },
            { id: 'controls', label: 'Quick Admin Actions', icon: Shield }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border-b-2 ${
                  isActive
                    ? 'bg-white text-teal-900 border-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-white/50'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-parchment/20 space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="animate-spin text-teal-700 mx-auto" size={32} />
              <p className="text-sm font-bold text-slate-600">Loading comprehensive overview data...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: ANALYTICS & CHARTS */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Timeframe Filter Controls */}
                  <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-2xl border border-sandstone/30 shadow-sm">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="text-teal-700" size={18} />
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Performance Analytics Overview</h3>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {[
                        { id: 'daily', label: 'Per Day (Today)' },
                        { id: 'weekly', label: 'Weekly (7 Days)' },
                        { id: 'monthly', label: 'Monthly (30 Days)' },
                        { id: 'yearly', label: 'Yearly (12 Months)' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTimeframe(t.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            timeframe === t.id
                              ? 'bg-teal-700 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary KPI Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-sandstone/30 shadow-sm space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Patients Volume</div>
                      <div className="text-2xl font-black text-slate-800">
                        {currentAnalytics.patients.reduce((a, b) => a + b, 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600">
                        Total recorded visits in {timeframe}
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-sandstone/30 shadow-sm space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sales Revenue Contributed</div>
                      <div className="text-2xl font-black text-emerald-700">
                        ₹{(financials.totalRevenue || currentAnalytics.revenue.reduce((a, b) => a + b, 0)).toLocaleString()}
                      </div>
                      <div className="text-[11px] font-semibold text-teal-600">
                        Ledger verified payments
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-sandstone/30 shadow-sm space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {facilityType === 'clinic' ? 'Consultations Completed' : 'Lab Reports Processed'}
                      </div>
                      <div className="text-2xl font-black text-indigo-700">
                        {currentAnalytics.consultations.reduce((a, b) => a + b, 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] font-semibold text-indigo-600">
                        Successful transactions
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-sandstone/30 shadow-sm space-y-1">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Staff & Doctors</div>
                      <div className="text-2xl font-black text-amber-700">
                        {members.length}
                      </div>
                      <div className="text-[11px] font-semibold text-amber-600">
                        Active facility users
                      </div>
                    </div>
                  </div>

                  {/* Visual Bar Chart Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Volume Trend Chart */}
                    <div className="bg-white p-5 rounded-2xl border border-sandstone/30 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Patient Volume Trend ({timeframe})</h4>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Visits/Day</span>
                      </div>
                      
                      <div className="h-44 flex items-end justify-between gap-2 pt-6 border-b border-sandstone/20 pb-2">
                        {currentAnalytics.labels.map((lbl, idx) => {
                          const val = currentAnalytics.patients[idx] || 0;
                          const maxVal = Math.max(...currentAnalytics.patients, 1);
                          const heightPct = Math.max(12, Math.round((val / maxVal) * 100));

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                              <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">{val}</span>
                              <div 
                                style={{ height: `${heightPct}%` }}
                                className="w-full bg-gradient-to-t from-teal-700 to-teal-500 rounded-t-lg transition-all group-hover:brightness-110"
                              />
                              <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{lbl}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Revenue & Sales Trend Chart */}
                    <div className="bg-white p-5 rounded-2xl border border-sandstone/30 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Revenue Generated (₹)</h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Sales (INR)</span>
                      </div>

                      <div className="h-44 flex items-end justify-between gap-2 pt-6 border-b border-sandstone/20 pb-2">
                        {currentAnalytics.labels.map((lbl, idx) => {
                          const val = currentAnalytics.revenue[idx] || 0;
                          const maxVal = Math.max(...currentAnalytics.revenue, 1);
                          const heightPct = Math.max(12, Math.round((val / maxVal) * 100));

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                              <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">₹{val}</span>
                              <div 
                                style={{ height: `${heightPct}%` }}
                                className="w-full bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-lg transition-all group-hover:brightness-110"
                              />
                              <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{lbl}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MEMBER DETAILS */}
              {activeTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="relative max-w-sm flex-1">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search doctor or staff name/role..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        className="w-full bg-white border border-sandstone/30 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-teal-600"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">Showing {filteredMembers.length} members</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-sandstone/30 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-sandstone/20">
                          <th className="p-3.5">Name</th>
                          <th className="p-3.5">Role</th>
                          <th className="p-3.5">Contact Info</th>
                          <th className="p-3.5">Joined Date</th>
                          <th className="p-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sandstone/15">
                        {filteredMembers.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-slate-400 font-bold">No registered staff or doctors found</td>
                          </tr>
                        ) : (
                          filteredMembers.map((m, idx) => (
                            <tr key={m._id || idx} className="hover:bg-slate-50/60 transition">
                              <td className="p-3.5 font-bold text-slate-800 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-black flex items-center justify-center text-xs">
                                  {(m.name || 'U')[0].toUpperCase()}
                                </div>
                                {m.name}
                              </td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold uppercase text-[10px]">
                                  {m.role || 'Staff'}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-600">
                                <div>{m.email}</div>
                                <div className="text-[10px] text-slate-400">{m.phoneNumber || 'No phone'}</div>
                              </td>
                              <td className="p-3.5 text-slate-500">
                                {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  m.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {m.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: PATIENTS DIRECTORY */}
              {activeTab === 'patients' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="relative max-w-sm flex-1">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search patient name or phone..."
                        value={patientSearch}
                        onChange={e => setPatientSearch(e.target.value)}
                        className="w-full bg-white border border-sandstone/30 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-teal-600"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">Showing {filteredPatients.length} patients</span>
                  </div>

                  <div className="bg-white rounded-2xl border border-sandstone/30 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-sandstone/20">
                          <th className="p-3.5">Patient Name</th>
                          <th className="p-3.5">Phone</th>
                          <th className="p-3.5">Age / Gender</th>
                          <th className="p-3.5">Total Visits</th>
                          <th className="p-3.5">Last Visit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sandstone/15">
                        {filteredPatients.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-slate-400 font-bold">No patient history found for this facility</td>
                          </tr>
                        ) : (
                          filteredPatients.map((p, idx) => (
                            <tr key={p._id || idx} className="hover:bg-slate-50/60 transition">
                              <td className="p-3.5 font-bold text-slate-800">{p.name}</td>
                              <td className="p-3.5 text-slate-600 font-mono">{p.phone}</td>
                              <td className="p-3.5 text-slate-600">
                                {p.age ? `${p.age} yrs` : 'N/A'} • {p.gender || 'Unknown'}
                              </td>
                              <td className="p-3.5 font-bold text-teal-700">{p.totalVisits || (p.visitedClinics?.length || 1)}</td>
                              <td className="p-3.5 text-slate-500">
                                {p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: PRICING & SERVICE CATALOG */}
              {activeTab === 'catalog' && (
                <div className="space-y-6">
                  {facilityType === 'clinic' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 rounded-2xl border border-sandstone/30 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Clinic Fee Configuration</h4>
                        <div className="space-y-3 divide-y divide-slate-100 text-xs">
                          <div className="flex justify-between py-1.5">
                            <span className="font-semibold text-slate-600">Doctor Consultation Fee:</span>
                            <span className="font-bold text-teal-800">₹{fac.feeConsult || 500}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="font-semibold text-slate-600">In-house Lab Fee:</span>
                            <span className="font-bold text-teal-800">₹{fac.feeLab || 450}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="font-semibold text-slate-600">Emergency Priority Fee:</span>
                            <span className="font-bold text-teal-800">₹{fac.feeEmergency || 300}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="font-semibold text-slate-600">Base Medicine Charge:</span>
                            <span className="font-bold text-teal-800">₹{fac.feeMedicine || 120}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-sandstone/30 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Operating Schedule & Rules</h4>
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="font-semibold text-slate-600">Working Hours:</span>
                            <div className="font-bold text-slate-800 mt-0.5">{fac.openingTime || '09:00'} - {fac.closingTime || '17:00'}</div>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-600">Average Wait Factor:</span>
                            <div className="font-bold text-slate-800 mt-0.5">{fac.avgWaitFactor || 8} minutes per token</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-sandstone/30 overflow-hidden shadow-sm space-y-4 p-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Lab Diagnostic Test Catalog</h4>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-sandstone/20">
                            <th className="p-3">Test Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Price (₹)</th>
                            <th className="p-3">Sample Type</th>
                            <th className="p-3">Turnaround</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sandstone/15">
                          {(fac.availableTests || []).length === 0 ? (
                            <tr>
                              <td colSpan="5" className="p-6 text-center text-slate-400 font-bold">Standard pathology catalog active</td>
                            </tr>
                          ) : (
                            fac.availableTests.map((t, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-800">{t.testName}</td>
                                <td className="p-3 text-slate-600">{t.category}</td>
                                <td className="p-3 font-bold text-emerald-700">₹{t.price}</td>
                                <td className="p-3 text-slate-600">{t.sampleType}</td>
                                <td className="p-3 text-slate-600">{t.turnAroundHours} hrs</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: FINANCIALS & LEDGER */}
              {activeTab === 'financials' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-sandstone/30 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Subscription Plan</div>
                      <div className="text-lg font-black text-teal-800 uppercase mt-0.5">{fac.subscriptionPlan || 'Free Tier'}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        Expires: {fac.subscriptionExpiresAt ? new Date(fac.subscriptionExpiresAt).toLocaleDateString() : 'Never / Unsubscribed'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue Contributed</div>
                      <div className="text-2xl font-black text-emerald-700">₹{financials.totalRevenue.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-sandstone/30 overflow-hidden shadow-sm">
                    <h4 className="p-4 bg-slate-50 border-b border-sandstone/20 text-xs font-black uppercase tracking-wider text-slate-700">
                      Subscription Payment History
                    </h4>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="text-slate-500 font-bold uppercase tracking-wider border-b border-sandstone/20">
                          <th className="p-3.5">Order ID</th>
                          <th className="p-3.5">Payment ID</th>
                          <th className="p-3.5">Plan</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sandstone/15">
                        {financials.payments.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-6 text-center text-slate-400 font-bold">No payment transaction records found</td>
                          </tr>
                        ) : (
                          financials.payments.map((p, idx) => (
                            <tr key={p._id || idx} className="hover:bg-slate-50">
                              <td className="p-3.5 font-mono text-slate-800">{p.razorpayOrderId}</td>
                              <td className="p-3.5 font-mono text-slate-600">{p.razorpayPaymentId || 'N/A'}</td>
                              <td className="p-3.5 font-bold uppercase text-teal-800">{p.plan}</td>
                              <td className="p-3.5 font-bold text-emerald-700">₹{p.amount}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  p.status === 'captured' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: SUPPORT TICKETS */}
              {activeTab === 'support' && (
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-sandstone/30 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-sandstone/20">
                          <th className="p-3.5">Subject</th>
                          <th className="p-3.5">Sender</th>
                          <th className="p-3.5">Message</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sandstone/15">
                        {supportTickets.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-6 text-center text-slate-400 font-bold">No support tickets submitted by this facility</td>
                          </tr>
                        ) : (
                          supportTickets.map((t, idx) => (
                            <tr key={t._id || idx} className="hover:bg-slate-50">
                              <td className="p-3.5 font-bold text-slate-800">{t.subject}</td>
                              <td className="p-3.5 text-slate-600">{t.senderName} ({t.senderEmail})</td>
                              <td className="p-3.5 text-slate-600 max-w-xs truncate">{t.message}</td>
                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                  t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {t.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: SEO & PUBLIC PROFILE */}
              {activeTab === 'seo' && (
                <div className="bg-white p-6 rounded-2xl border border-sandstone/30 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-800">Public Network Profile Card</h4>
                      <p className="text-xs text-slate-500">Live preview of facility on Appointory public directory</p>
                    </div>
                    {fac.slug && (
                      <a 
                        href={`/${facilityType === 'clinic' ? 'c' : 'lab'}/${fac.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <ExternalLink size={14} /> Open Public Page
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-slate-500">Public Slug:</span>
                      <div className="font-bold text-teal-900 mt-0.5 font-mono">{fac.slug || 'Not set'}</div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">Public Rating:</span>
                      <div className="font-bold text-amber-600 mt-0.5 flex items-center gap-1">
                        ★ {fac.rating?.score || 4.8} ({fac.rating?.count || 12} reviews)
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">SEO Title:</span>
                      <div className="font-bold text-slate-800 mt-0.5">{fac.seoTitle || fac.name || fac.labName}</div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-500">SEO Description:</span>
                      <div className="text-slate-600 mt-0.5">{fac.seoDescription || 'No custom description provided.'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: QUICK ADMIN ACTIONS */}
              {activeTab === 'controls' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-sandstone/30 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Download size={15} className="text-teal-700" /> Export Facility Audit Summary
                    </h4>
                    <p className="text-xs text-slate-500">Download a full JSON diagnostic report containing staff, patients, analytics, and billing logs.</p>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
                    >
                      <Download size={14} /> Download Facility Report
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-sandstone/30 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Shield size={15} className="text-amber-600" /> Administrative Governance
                    </h4>
                    <p className="text-xs text-slate-500">Directly modify approval status or subscription expiration dates for this facility.</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onGiftSubscription(fac._id, facilityType)}
                        className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition"
                      >
                        Gift 1 Month Trial
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityOverviewModal;
