import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FlaskConical, ClipboardList, CheckCircle2, Clock, XCircle,
  LogOut, Settings, Link2, RefreshCw, Upload, Eye, FileText,
  User, Phone, TestTube, ChevronDown, ChevronUp, AlertCircle,
  Building, Loader2, BadgeCheck
} from 'lucide-react';
import SEO from '../../components/SEO';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// ─── Lab-specific axios instance ─────────────────────────────
const labApi = () => {
  const token = localStorage.getItem('labToken');
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });
};

const STATUS_CONFIG = {
  Pending: { color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', icon: Clock },
  Accepted: { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-400', icon: BadgeCheck },
  Processing: { color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-400', icon: Loader2 },
  Completed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', icon: CheckCircle2 },
  Rejected: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-400', icon: XCircle }
};

const LabPortalDashboard = () => {
  const navigate = useNavigate();
  const labName = localStorage.getItem('labName') || 'Lab';
  const labCode = localStorage.getItem('labCode') || '';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(null); // requestId being uploaded

  const fetchRequests = useCallback(async () => {
    try {
      const res = await labApi().get('/api/lab-connect/test-requests/lab');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('labToken');
    if (!token) { navigate('/lab/login'); return; }
    fetchRequests();
  }, [fetchRequests, navigate]);

  const updateStatus = async (requestId, status) => {
    try {
      await labApi().patch(`/api/lab-connect/test-requests/${requestId}/status`, { status });
      setRequests(prev => prev.map(r => r._id === requestId ? { ...r, status } : r));
      Swal.fire({ icon: 'success', title: `Status updated to ${status}`, timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const handleUpload = async (requestId, files) => {
    if (!files || files.length === 0) return;
    setUploading(requestId);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('file', f));
      formData.append('title', 'Lab Report');

      const res = await labApi().post(`/api/lab-connect/test-requests/${requestId}/upload-report`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setRequests(prev => prev.map(r => r._id === requestId ? res.data.data : r));
      Swal.fire({ icon: 'success', title: 'Report uploaded!', text: 'Request marked as Completed.', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire('Upload Failed', err.response?.data?.message || 'Please try again.', 'error');
    } finally {
      setUploading(null);
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'You will be signed out of the Lab Portal.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1B6CA8',
      cancelButtonText: 'Stay'
    }).then(result => {
      if (result.isConfirmed) {
        ['labToken', 'labRole', 'labName', 'labCode', 'labId', 'labEmail', 'labPhone', 'labAddress']
          .forEach(k => localStorage.removeItem(k));
        navigate('/lab/login');
      }
    });
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    processing: requests.filter(r => ['Accepted', 'Processing'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'Completed').length
  };

  return (
    <div className="min-h-screen font-body" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f9ff 100%)' }}>
      <SEO
        title="Lab Portal Dashboard"
        description="Private portal dashboard to manage test requests and report uploads."
        url="/lab/portal/dashboard"
        noindex={true}
      />

      {/* ─── Top Nav ─── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-blue-100 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}>
              <FlaskConical className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold leading-none text-slate-800">{labName}</h1>
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-500">{labCode} · Lab Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-nav-connections"
              onClick={() => navigate('/lab/portal/connections')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-all"
            >
              <Link2 size={15} />
              <span className="hidden sm:inline">Connections</span>
            </button>
            <button
              id="btn-nav-refresh"
              onClick={fetchRequests}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
              id="btn-nav-logout"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-all"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ─── Stats ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: stats.total, icon: ClipboardList, color: '#1B6CA8' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: '#d97706' },
            { label: 'In Progress', value: stats.processing, icon: TestTube, color: '#7c3aed' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: '#059669' }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} id={`stats-card-${label.toLowerCase().replace(/\s+/g, '-')}`} className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-blue-50 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon size={20} style={{ color }} />
                </div>
                <span className="text-3xl font-heading font-bold" style={{ color }}>{value}</span>
              </div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* ─── Filter Tabs ─── */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1.5 border border-blue-50 shadow-sm inline-flex gap-1 flex-wrap">
          {['all', 'Pending', 'Accepted', 'Processing', 'Completed', 'Rejected'].map(f => (
            <button
              key={f}
              id={`filter-tab-${f.toLowerCase()}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-blue-50'}`}
            >
              {f === 'all' ? 'All' : f}
              {f !== 'all' && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${filter === f ? 'bg-white/30' : 'bg-slate-100'}`}>
                  {requests.filter(r => r.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Requests List ─── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="animate-spin text-blue-500" size={32} />
              <p className="text-slate-500 font-medium">Loading test requests...</p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white/80 rounded-3xl border border-blue-50 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#1B6CA815' }}>
              <ClipboardList size={30} style={{ color: '#1B6CA8' }} />
            </div>
            <h3 className="font-heading text-xl font-bold text-slate-700 mb-2">No Requests Yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              {filter === 'all'
                ? 'Test requests from connected clinics will appear here.'
                : `No ${filter} requests at this time.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/lab/portal/connections')}
                className="mt-6 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}
              >
                <Link2 size={15} className="inline mr-2" />
                Manage Connections
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map(req => {
              const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === req._id;
              const isUploading = uploading === req._id;

              return (
                <div key={req._id} className="bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-50 shadow-sm overflow-hidden transition-all hover:shadow-md">
                  {/* ─ Card Header ─ */}
                  <div
                    className="p-5 cursor-pointer flex items-center justify-between gap-4"
                    onClick={() => setExpandedId(isExpanded ? null : req._id)}
                  >
                    <div className="flex items-start gap-4 flex-grow min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#1B6CA810' }}>
                        <TestTube size={20} style={{ color: '#1B6CA8' }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-slate-800 text-base">{req.testName}</h3>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {req.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1"><User size={13} />{req.patientName}</span>
                          <span className="flex items-center gap-1"><Phone size={13} />{req.patientPhone}</span>
                          {req.clinicId && <span className="flex items-center gap-1"><Building size={13} />{req.clinicId.name || req.clinicId.clinicCode}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[12px] text-slate-400 hidden sm:block">
                        {new Date(req.requestedAt || req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* ─ Expanded Details ─ */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-blue-50 pt-4 space-y-4">
                      {req.notes && (
                        <div className="bg-blue-50 rounded-xl p-3">
                          <p className="text-[12px] font-black uppercase tracking-widest text-blue-500 mb-1">Notes from Clinic</p>
                          <p className="text-sm text-slate-700">{req.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => updateStatus(req._id, 'Accepted')}
                              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                              style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}
                            >
                              <BadgeCheck size={15} className="inline mr-1.5" />Accept
                            </button>
                            <button
                              onClick={() => { Swal.fire({ title: 'Reject this request?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Reject' }).then(r => r.isConfirmed && updateStatus(req._id, 'Rejected')); }}
                              className="px-4 py-2 rounded-xl text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                            >
                              <XCircle size={15} className="inline mr-1.5" />Reject
                            </button>
                          </>
                        )}
                        {req.status === 'Accepted' && (
                          <button
                            onClick={() => updateStatus(req._id, 'Processing')}
                            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                            style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}
                          >
                            <Loader2 size={15} className="inline mr-1.5" />Mark Processing
                          </button>
                        )}
                        {(req.status === 'Accepted' || req.status === 'Processing') && (
                          <label className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1.5">
                            {isUploading ? <RefreshCw size={15} className="animate-spin" /> : <Upload size={15} />}
                            {isUploading ? 'Uploading...' : 'Upload Report'}
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => handleUpload(req._id, e.target.files)}
                            />
                          </label>
                        )}
                      </div>

                      {/* Uploaded Reports */}
                      {req.reports && req.reports.length > 0 && (
                        <div>
                          <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-2">Uploaded Reports ({req.reports.length})</p>
                          <div className="space-y-2">
                            {req.reports.map((report, i) => (
                              <a
                                key={i}
                                href={report.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                              >
                                <FileText size={16} className="text-blue-500 shrink-0" />
                                <span className="text-sm font-medium text-slate-700 flex-grow truncate">{report.title || `Report ${i + 1}`}</span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase">{report.fileType}</span>
                                <Eye size={14} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LabPortalDashboard;
