
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FlaskConical, ClipboardList, CheckCircle2, Clock, XCircle,
  LogOut, Settings, Link2, RefreshCw, Eye, FileText, BarChart3,
  User, Phone, TestTube, ChevronDown, ChevronUp, AlertCircle,
  Building, Loader2, BadgeCheck, ArrowLeft, Send, Check, X, ShieldAlert
} from 'lucide-react';
import SEO from '../../components/SEO';
import Sidebar from '../../components/Sidebar';
import { API_URL } from '../../config/runtime';

const labApi = () => {
  const token = localStorage.getItem('labToken');
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });
};

const LabPortalConnections = () => {
  const navigate = useNavigate();
  const labName = localStorage.getItem('labName') || 'Lab';
  const labCode = localStorage.getItem('labCode') || '';

  const [connections, setConnections] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accepted'); // 'accepted', 'pending', 'rejected', or 'discover'

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const [connRes, clinicsRes] = await Promise.all([
        labApi().get('/api/lab-connect/lab'),
        labApi().get('/api/lab-connect/lab/clinics')
      ]);
      setConnections(connRes.data.data || []);
      setAllClinics(clinicsRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      Swal.fire('Error', 'Could not load clinic connections.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('labToken');
    if (!token) { navigate('/lab/login'); return; }
    fetchConnections();
  }, [fetchConnections, navigate]);

  const handleRequestConnection = async (clinicId) => {
    try {
      const res = await labApi().post('/api/lab-connect/lab/request', { clinicId });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Request Sent',
          text: 'Connection request sent to the clinic successfully!',
          timer: 1500,
          showConfirmButton: false
        });
        fetchConnections();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to send request', 'error');
    }
  };

  const handleResponse = async (connId, action) => {
    try {
      const result = await Swal.fire({
        title: action === 'accept' ? 'Accept Connection?' : 'Reject Connection?',
        text: action === 'accept' 
          ? 'This will allow the clinic to send you test requests directly.'
          : 'This request will be marked as rejected.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: action === 'accept' ? '#059669' : '#dc2626',
        cancelButtonColor: '#4b5563',
        confirmButtonText: action === 'accept' ? 'Yes, Accept' : 'Yes, Reject',
        background: '#f8fafc'
      });

      if (!result.isConfirmed) return;

      const res = await labApi().patch(`/api/lab-connect/${connId}/respond`, { action });
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: `Request ${action === 'accept' ? 'Accepted' : 'Rejected'}`,
          timer: 1500,
          showConfirmButton: false
        });
        fetchConnections();
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Action failed', 'error');
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

  // Filter connections by tab
  const filteredConnections = connections.filter(conn => {
    if (activeTab === 'pending') return conn.status === 'pending';
    if (activeTab === 'accepted') return conn.status === 'accepted';
    if (activeTab === 'rejected') return conn.status === 'rejected';
    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="lab" />

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-32 lg:pb-0">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-6xl mx-auto w-full space-y-6">
          <SEO
            title="Lab Connections Hub"
            description="Private panel to manage connected partner clinics."
            url="/lab/portal/connections"
            noindex={true}
          />

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Clinic Connections <span className="text-blue-500">.</span>
            </h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Manage diagnostic link requests from partner clinics</p>
          </div>

          {/* Tab Selection */}
          <div className="bg-slate-100/70 backdrop-blur-md rounded-[1.25rem] p-1.5 border border-slate-200/40 shadow-inner flex gap-1.5 overflow-x-auto max-w-full hide-scrollbar shrink-0">
            {[
              { id: 'accepted', label: 'Active', count: connections.filter(c => c.status === 'accepted').length },
              { id: 'pending', label: 'Requests', count: connections.filter(c => c.status === 'pending').length },
              { id: 'rejected', label: 'Rejected', count: connections.filter(c => c.status === 'rejected').length },
              { id: 'discover', label: 'Discover Clinics', count: allClinics.filter(c => c.connectionStatus === 'none').length }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap active:scale-[0.97] hover:scale-[1.01] ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/15 border border-blue-500/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}
              >
                {t.label}
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${
                  activeTab === t.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-500 group-hover:bg-slate-350'
                }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
 
        {/* Connections/Clinics List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-blue-50">
            <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
            <p className="text-slate-400 font-black text-[13px] uppercase tracking-widest">Fetching connections...</p>
          </div>
        ) : (activeTab !== 'discover' ? filteredConnections : allClinics).length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-blue-50">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-600">
              {activeTab === 'discover' ? 'No clinics registered' : `No ${activeTab} connections`}
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab === 'discover' ? 'Registered clinical centers will show up here.' : 'Partnerships will appear here once requested or approved.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'discover'
              ? allClinics.map(clinic => (
                  <div 
                    key={clinic._id} 
                    className="bg-white rounded-[2.5rem] p-6 border border-blue-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-black text-lg border border-blue-100/50">
                          {clinic.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${
                          clinic.connectionStatus === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          clinic.connectionStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                          clinic.connectionStatus === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-slate-50 text-slate-500 border-slate-100'
                        }`}>
                          {clinic.connectionStatus === 'none' ? 'Not Connected' : clinic.connectionStatus}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 truncate">{clinic.name}</h3>
                      <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-4">Code: {clinic.clinicCode}</p>
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex items-start gap-2.5 text-slate-500 text-sm font-semibold">
                          <Building size={14} className="text-blue-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{clinic.address || 'N/A'}</span>
                        </div>
                        {clinic.contactPhone && (
                          <div className="flex items-center gap-2.5 text-slate-500 text-sm font-semibold">
                            <Phone size={14} className="text-blue-500 shrink-0" />
                            <span>{clinic.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100/50">
                      {clinic.connectionStatus === 'none' && (
                        <button
                          onClick={() => handleRequestConnection(clinic._id)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[13px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10 active:scale-95"
                        >
                          <Link2 size={14} /> Request Connection
                        </button>
                      )}
                      {clinic.connectionStatus === 'pending' && (
                        <div className="text-center text-amber-600 font-black text-[12px] uppercase tracking-widest bg-amber-50 border border-amber-100 py-2.5 rounded-xl">
                          {clinic.initiatedBy === 'lab' ? '⏳ Request Sent (Pending Approval)' : '📩 Action Required (Incoming request)'}
                        </div>
                      )}
                      {clinic.connectionStatus === 'accepted' && (
                        <div className="text-center text-emerald-600 font-black text-[12px] uppercase tracking-widest bg-emerald-50 border border-emerald-100 py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                          <BadgeCheck size={14} /> Active Connection
                        </div>
                      )}
                      {clinic.connectionStatus === 'rejected' && (
                        <div className="flex flex-col gap-2">
                          <div className="text-center text-red-600 font-black text-[12px] uppercase tracking-widest bg-red-50 border border-red-100 py-2 rounded-xl">
                            Connection Refused
                          </div>
                          {clinic.initiatedBy === 'lab' && (
                            <button
                              onClick={() => handleRequestConnection(clinic._id)}
                              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-slate-200"
                            >
                              <RefreshCw size={12} /> Send Request Again
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              : filteredConnections.map(conn => {
                  const clinic = conn.clinicId || {};
                  return (
                    <div 
                      key={conn._id} 
                      className="bg-white rounded-[2.5rem] p-6 border border-blue-50/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-black text-lg border border-blue-100/50">
                            {clinic.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${
                            conn.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            conn.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {conn.status}
                          </span>
                        </div>

                        {/* Clinic Details */}
                        <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 truncate">{clinic.name}</h3>
                        <p className="text-[12px] font-black uppercase tracking-widest text-slate-400 mb-4">Code: {clinic.clinicCode}</p>
                        
                        <div className="space-y-2 mb-6">
                          <div className="flex items-start gap-2.5 text-slate-500 text-sm font-semibold">
                            <Building size={14} className="text-blue-500 shrink-0 mt-0.5" />
                            <span className="leading-snug">{clinic.address}</span>
                          </div>
                          {clinic.contactPhone && (
                            <div className="flex items-center gap-2.5 text-slate-500 text-sm font-semibold">
                              <Phone size={14} className="text-blue-500 shrink-0" />
                              <span>{clinic.contactPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {conn.status === 'pending' && (
                        <div className="flex flex-col gap-2 pt-4 border-t border-slate-100/50">
                          {conn.initiatedBy === 'lab' ? (
                            <div className="text-center text-amber-600 font-black text-[12px] uppercase tracking-widest bg-amber-50 border border-amber-100 py-2.5 rounded-xl">
                              ⏳ Waiting for Clinic's response
                            </div>
                          ) : (
                            <div className="flex gap-2.5">
                              <button
                                onClick={() => handleResponse(conn._id, 'accept')}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[13px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 active:scale-95"
                              >
                                <Check size={14} /> Accept
                              </button>
                              <button
                                onClick={() => handleResponse(conn._id, 'reject')}
                                className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-black text-[13px] uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 border border-red-100 active:scale-95"
                              >
                                <X size={14} /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {conn.status === 'accepted' && (
                        <div className="pt-4 border-t border-slate-100/50 flex items-center justify-between text-slate-400 text-[12px] font-bold">
                          <span>Linked since:</span>
                          <span>{new Date(conn.respondedAt || conn.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {conn.status === 'rejected' && (
                        <div className="pt-4 border-t border-slate-100/50 flex items-center gap-1.5 text-red-500 text-[12px] font-bold">
                          <ShieldAlert size={14} /> Refused connection
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        )}

      </main>
      </div>
    </div>
  );
};

export default LabPortalConnections;
