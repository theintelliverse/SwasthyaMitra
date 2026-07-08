import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FlaskConical, ClipboardList, CheckCircle2, Clock, XCircle,
  LogOut, Settings, Link2, RefreshCw, Eye, FileText,
  User, Phone, TestTube, ChevronDown, ChevronUp, AlertCircle,
  Building, Loader2, BadgeCheck, ArrowLeft, Send, Check, X, ShieldAlert
} from 'lucide-react';
import SEO from '../../components/SEO';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('accepted'); // 'accepted' or 'pending' or 'rejected'

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labApi().get('/api/lab-connect/lab');
      setConnections(res.data.data || []);
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
    <div className="min-h-screen font-body" style={{ background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f9ff 100%)' }}>
      <SEO
        title="Lab Connections Hub"
        description="Private panel to manage connected partner clinics."
        url="/lab/portal/connections"
        noindex={true}
      />
      
      {/* ─── Top Nav ─── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-blue-100 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/lab/portal/dashboard')}
              className="mr-1 p-2 rounded-xl text-slate-500 hover:bg-blue-50 transition-all border border-blue-100 bg-white"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}>
              <FlaskConical className="text-white" size={22} />
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold leading-none text-slate-800">{labName}</h1>
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-500">{labCode} · Connections Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchConnections}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
            <button
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

        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              Clinic Connections <span className="text-blue-500">.</span>
            </h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Manage diagnostic link requests from partner clinics</p>
          </div>

          {/* Tab Selection */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 border border-blue-50 shadow-sm flex gap-1">
            {[
              { id: 'accepted', label: 'Active', count: connections.filter(c => c.status === 'accepted').length, color: 'bg-emerald-500' },
              { id: 'pending', label: 'Requests', count: connections.filter(c => c.status === 'pending').length, color: 'bg-amber-500' },
              { id: 'rejected', label: 'Rejected', count: connections.filter(c => c.status === 'rejected').length, color: 'bg-red-500' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-xl text-[13px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-blue-50'}`}
              >
                {t.label}
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === t.id ? 'bg-white/35 text-white font-extrabold' : 'bg-slate-100 text-slate-400'}`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Connections List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-blue-50">
            <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
            <p className="text-slate-400 font-black text-[13px] uppercase tracking-widest">Fetching connections...</p>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-blue-50">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="text-blue-400" size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-600">No {activeTab} connections</h3>
            <p className="text-slate-400 text-sm mt-1">Partnerships will appear here once requested or approved.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnections.map(conn => {
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
                    <div className="flex gap-2.5 pt-4 border-t border-slate-100/50">
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
  );
};

export default LabPortalConnections;
