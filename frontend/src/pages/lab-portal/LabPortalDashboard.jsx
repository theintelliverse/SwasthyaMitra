import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import {
  FlaskConical, ClipboardList, CheckCircle2, Clock, XCircle,
  LogOut, Settings, Link2, RefreshCw, Upload, Eye, FileText,
  User, Phone, TestTube, ChevronDown, ChevronUp, AlertCircle,
  Building, Loader2, BadgeCheck, BarChart3, Plus, TestTubes,
  TrendingUp, X, Type, AlignLeft, Save, Beaker, FileCheck,
  Smartphone, Hash, Filter, Search
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as ChartTooltip } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import SEO from '../../components/SEO';
import { API_URL, SOCKET_URL } from '../../config/runtime';

const socket = io(SOCKET_URL || API_URL || 'http://localhost:5000');

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

// Quick Action Tile Component
const QuickActionTile = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-2xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all hover:scale-[1.03] active:scale-95 cursor-pointer ${color}`}
  >
    <div className="p-2 rounded-xl bg-white/80 shadow-sm">{icon}</div>
    <span className="text-[11px] font-black uppercase tracking-wider leading-tight">{label}</span>
  </button>
);

const LabPortalDashboard = () => {
  const navigate = useNavigate();
  const labName = localStorage.getItem('labName') || 'Lab';
  const labCode = localStorage.getItem('labCode') || '';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(null); 
  const [isSyncing, setIsSyncing] = useState(false);

  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals & Forms State
  const [showReportConfigModal, setShowReportConfigModal] = useState(false);
  const [showSampleCollectionModal, setShowSampleCollectionModal] = useState(false);
  const [showDigitalReportModal, setShowDigitalReportModal] = useState(false);
  const [activeDigitalPatient, setActiveDigitalPatient] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalPatient, setUploadModalPatient] = useState(null);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState([]);

  // New features states
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [connectedClinics, setConnectedClinics] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [newTestForm, setNewTestForm] = useState({
    patientName: '',
    patientPhone: '',
    testType: '',
    clinicId: '',
    notes: ''
  });

  const [reportConfig, setReportConfig] = useState({
    labName: localStorage.getItem('labPortal_labName') || labName || 'SwasthyaMitra Lab',
    primaryColor: localStorage.getItem('labPortal_primaryColor') || '#1B6CA8',
    headerFontSize: parseInt(localStorage.getItem('labPortal_headerFontSize') || '22'),
    bodyFontSize: parseInt(localStorage.getItem('labPortal_bodyFontSize') || '11'),
    reportType: 'Diagnostic',
    defaultNotes: localStorage.getItem('labPortal_defaultNotes') || 'Results are clinically validated. Correlate with symptoms.',
    defaultDoctorName: localStorage.getItem('labPortal_defaultDoctorName') || 'Pathologist'
  });

  const [digitalReportForm, setDigitalReportForm] = useState({
    title: 'Diagnostic Lab Report',
    findings: '',
    notes: reportConfig.defaultNotes || 'Results are clinically validated. Correlate with symptoms.',
    doctorName: reportConfig.defaultDoctorName || 'Pathologist'
  });

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const res = await labApi().get('/api/lab-connect/test-requests/lab');
      setRequests(res.data.data || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, []);

  const fetchConnectedClinics = useCallback(async () => {
    try {
      const res = await labApi().get('/api/lab-connect/lab');
      const activeConns = (res.data.data || []).filter(c => c.status === 'accepted');
      setConnectedClinics(activeConns.map(c => c.clinicId).filter(Boolean));
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('labToken');
    const labId = localStorage.getItem('labId');
    if (!token) { navigate('/lab/login'); return; }
    
    fetchRequests();
    fetchConnectedClinics();

    if (labId) {
      console.log("🔌 Initializing socket for Independent Lab:", labId);
      
      const setupSocketListeners = () => {
        if (socket.connected) {
          setSocketConnected(true);
          socket.emit('joinLab', labId);
        }

        socket.on('connect', () => {
          setSocketConnected(true);
          socket.emit('joinLab', labId);
          console.log("✅ Socket connected as Lab:", labId);
        });

        socket.on('disconnect', () => {
          setSocketConnected(false);
        });

        socket.on('testRequestUpdate', () => {
          console.log("♻️ Lab Portal received testRequestUpdate - syncing...");
          fetchRequests(true);
        });

        socket.on('queueUpdate', () => {
          console.log("♻️ Lab Portal received queueUpdate - syncing...");
          fetchRequests(true);
        });
      };

      setupSocketListeners();

      const interval = setInterval(() => {
        if (!socket.connected) {
          fetchRequests(true);
        }
      }, 15000);

      return () => {
        clearInterval(interval);
        socket.off('connect');
        socket.off('disconnect');
        socket.off('testRequestUpdate');
        socket.off('queueUpdate');
      };
    }
  }, [fetchRequests, fetchConnectedClinics, navigate]);

  const handleNewTestRequest = async () => {
    const { clinicId, patientName, patientPhone, testType, notes } = newTestForm;
    if (!clinicId || !patientName || !patientPhone || !testType) {
      return Swal.fire('Invalid Input', 'Please fill in patient details, test name and select a connected clinic.', 'warning');
    }

    try {
      const res = await labApi().post('/api/lab-connect/test-requests/lab/create', {
        clinicId,
        patientName,
        patientPhone,
        testName: testType,
        notes: notes || ''
      });

      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Test Request Created', text: 'Walk-in request successfully registered.', timer: 1500, showConfirmButton: false });
        setShowNewTestModal(false);
        setNewTestForm({ patientName: '', patientPhone: '', testType: '', clinicId: '', notes: '' });
        fetchRequests(true);
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create request', 'error');
    }
  };

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
    
    Swal.fire({
      title: 'Syncing to Locker...',
      html: `<p style="font-size: 12px; color: #1B6CA8;">Encrypting and publishing lab results...</p>`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#f8fafc'
    });

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

  // Multi-File Upload Logic
  const handleOpenUploadModal = (request) => {
    setUploadModalPatient(request);
    setSelectedUploadFiles([]);
    setShowUploadModal(true);
  };

  const handleUploadModalFileSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    for (const file of filesArray) {
      if (file.size > 5 * 1024 * 1024) { 
        Swal.fire('File Too Large', `"${file.name}" exceeds the 5MB limit.`, 'warning');
        return;
      }
    }

    const newFiles = filesArray.map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      isPdf: file.type === 'application/pdf'
    }));

    setSelectedUploadFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveSelectedFile = (id) => {
    setSelectedUploadFiles(prev => {
      const target = prev.find(f => f.id === id);
      if (target && target.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleConfirmUpload = async () => {
    if (selectedUploadFiles.length === 0) {
      return Swal.fire('No Files Added', 'Please add at least one report file to upload.', 'warning');
    }
    const files = selectedUploadFiles.map(f => f.file);
    const requestId = uploadModalPatient._id;
    setShowUploadModal(false);
    await handleUpload(requestId, files);
    setSelectedUploadFiles([]);
    setUploadModalPatient(null);
  };

  // Digital Report Builder Logic
  const handleOpenDigitalReportModal = (request) => {
    setActiveDigitalPatient(request);
    setDigitalReportForm({
      title: 'Diagnostic Lab Report',
      findings: '',
      notes: reportConfig.defaultNotes || 'Results are clinically validated. Correlate with symptoms.',
      doctorName: reportConfig.defaultDoctorName || 'Pathologist'
    });
    setShowDigitalReportModal(true);
  };

  const handlePublishDigitalReport = async () => {
    if (!digitalReportForm.findings.trim()) {
      return Swal.fire('Error', 'Please enter some test findings/results.', 'warning');
    }

    try {
      const doc = new jsPDF();
      const { primaryColor, headerFontSize, bodyFontSize, labName } = reportConfig;

      // Header
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(headerFontSize);
      doc.setFont("helvetica", "bold");
      doc.text(labName.toUpperCase(), 20, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);

      // Patient Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(bodyFontSize + 4);
      doc.setFont("helvetica", "bold");
      doc.text('PATIENT DIAGNOSTIC REPORT', 20, 55);
      doc.line(20, 58, 190, 58);

      doc.setFontSize(bodyFontSize + 1);
      doc.setFont("helvetica", "normal");
      doc.text(`Patient Name: ${activeDigitalPatient.patientName}`, 20, 70);
      doc.text(`Phone Number: ${activeDigitalPatient.patientPhone}`, 20, 78);
      doc.text(`Referred Tests: ${activeDigitalPatient.testName || 'Routine Diagnosis'}`, 20, 86);
      doc.text(`Date of Visit: ${new Date(activeDigitalPatient.createdAt).toLocaleDateString()}`, 130, 70);
      doc.text(`Report ID: LP-${activeDigitalPatient._id.slice(-8).toUpperCase()}`, 130, 78);

      // Findings Section
      doc.setFontSize(bodyFontSize + 4);
      doc.setFont("helvetica", "bold");
      doc.text('TEST RESULTS & OBSERVATIONS', 20, 105);
      doc.line(20, 108, 190, 108);

      doc.setFontSize(bodyFontSize + 1);
      doc.setFont("helvetica", "normal");
      const findingsLines = doc.splitTextToSize(digitalReportForm.findings, 170);
      doc.text(findingsLines, 20, 118);

      // Pathologist Notes Section
      const startNotesY = 118 + (findingsLines.length * 7) + 15;
      doc.setFontSize(bodyFontSize + 4);
      doc.setFont("helvetica", "bold");
      doc.text('CLINICAL NOTES & INTERPRETATION', 20, startNotesY);
      doc.line(20, startNotesY + 3, 190, startNotesY + 3);

      doc.setFontSize(bodyFontSize + 1);
      doc.setFont("helvetica", "normal");
      const notesLines = doc.splitTextToSize(digitalReportForm.notes, 170);
      doc.text(notesLines, 20, startNotesY + 12);

      // Sign-off
      const startSignY = startNotesY + 12 + (notesLines.length * 7) + 25;
      doc.line(130, startSignY, 190, startSignY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text('AUTHORIZED SIGNATORY', 130, startSignY + 8);
      doc.setFont("helvetica", "normal");
      doc.text(digitalReportForm.doctorName, 130, startSignY + 14);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('This is a digitally generated secure report verified by SwasthyaMitra health network.', 20, 280);

      const pdfBlob = doc.output('blob');
      const pdfFile = new File([pdfBlob], `digital_report_${activeDigitalPatient.patientName.replace(/\s+/g, '_')}.pdf`, {
        type: 'application/pdf'
      });

      await handleUpload(activeDigitalPatient._id, [pdfFile]);
      setShowDigitalReportModal(false);
    } catch (err) {
      console.error("Failed to generate digital report:", err);
      Swal.fire('Error', 'Failed to generate digital report PDF.', 'error');
    }
  };

  const handleSaveReportConfig = () => {
    localStorage.setItem('labPortal_defaultNotes', reportConfig.defaultNotes || '');
    localStorage.setItem('labPortal_defaultDoctorName', reportConfig.defaultDoctorName || '');
    localStorage.setItem('labPortal_labName', reportConfig.labName || '');
    localStorage.setItem('labPortal_primaryColor', reportConfig.primaryColor || '#1B6CA8');
    localStorage.setItem('labPortal_headerFontSize', reportConfig.headerFontSize?.toString() || '22');
    localStorage.setItem('labPortal_bodyFontSize', reportConfig.bodyFontSize?.toString() || '11');
    setShowReportConfigModal(false);
    Swal.fire({ icon: 'success', title: 'Branding Saved', text: 'PDF Report generation settings updated.', timer: 1500, showConfirmButton: false });
  };

  const handleDailySummary = () => {
    const todayStr = new Date().toDateString();
    const dailyRequests = requests.filter(r => new Date(r.createdAt).toDateString() === todayStr);

    const total = dailyRequests.length;
    const completed = dailyRequests.filter(r => r.status === 'Completed').length;
    const pending = dailyRequests.filter(r => r.status === 'Pending').length;
    const inProgress = dailyRequests.filter(r => ['Accepted', 'Processing'].includes(r.status)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    Swal.fire({
      title: 'Daily Lab Summary',
      html: `
        <div style="text-align: left; font-size: 14.5px; font-family: sans-serif; line-height: 1.6; padding: 4px;">
          <p style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US')}</p>
          <div style="border-top: 1px solid #e5e7eb; margin: 10px 0; padding-top: 10px;">
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>Total Requests:</strong></span> <span style="color: #1B6CA8; font-weight: bold;">${total}</span></p>
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>Completed:</strong></span> <span style="color: #10b981; font-weight: bold;">${completed}</span></p>
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>In Progress:</strong></span> <span style="color: #7c3aed; font-weight: bold;">${inProgress}</span></p>
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>Pending:</strong></span> <span style="color: #d97706; font-weight: bold;">${pending}</span></p>
          </div>
          <div style="border-top: 1px solid #e5e7eb; margin: 10px 0; padding-top: 10px; display: flex; justify-content: space-between;">
            <span><strong>Completion Rate:</strong></span>
            <span style="font-weight: 800; color: #10b981;">${completionRate}%</span>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#1B6CA8',
      confirmButtonText: 'Dismiss'
    });
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

  // Calculations for stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    processing: requests.filter(r => ['Accepted', 'Processing'].includes(r.status)).length,
    completed: requests.filter(r => r.status === 'Completed').length,
    rejected: requests.filter(r => r.status === 'Rejected').length
  };

  const getAvgTurnaroundTime = () => {
    const completedItems = requests.filter(r => r.status === 'Completed' && r.createdAt && r.updatedAt);
    if (completedItems.length === 0) return "N/A";
    let totalHours = 0;
    completedItems.forEach(r => {
      const diffHrs = Math.max(0.2, (new Date(r.updatedAt) - new Date(r.createdAt)) / (1000 * 60 * 60));
      totalHours += diffHrs;
    });
    return `${(totalHours / completedItems.length).toFixed(1)} hrs`;
  };

  const getQualityAccuracy = () => {
    if (stats.completed === 0) return "100%";
    const accuracy = (((stats.completed - stats.rejected) / stats.completed) * 100).toFixed(1);
    return `${accuracy}%`;
  };

  // Recharts configuration
  const getSampleStatusData = () => {
    return [
      { name: 'Pending', value: stats.pending, color: '#f59e0b' },
      { name: 'Processing', value: stats.processing, color: '#7c3aed' },
      { name: 'Completed', value: stats.completed, color: '#10b981' },
      { name: 'Rejected', value: stats.rejected, color: '#ef4444' }
    ].filter(item => item.value > 0);
  };

  const chartData = getSampleStatusData();

  // Search & Filtering & Pagination
  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.patientPhone.includes(searchTerm) ||
      (r.testName && r.testName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTab = filter === 'all' || r.status === filter;
    return matchesSearch && matchesTab;
  });

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

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
            <div className="flex items-center gap-1.5 mr-3 bg-blue-50/50 border border-blue-100/50 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className={socketConnected ? 'text-emerald-700 font-extrabold' : 'text-rose-700 font-extrabold'}>{socketConnected ? 'Live' : 'Offline'}</span>
            </div>
            <button
              onClick={() => navigate('/lab/portal/analytics')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all shadow-sm"
            >
              <BarChart3 size={15} />
              <span className="hidden sm:inline">Analytics & Samples</span>
            </button>
            <button
              id="btn-nav-connections"
              onClick={() => navigate('/lab/portal/connections')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-all shadow-sm"
            >
              <Link2 size={15} />
              <span className="hidden sm:inline">Connections Hub</span>
            </button>
            <button
              id="btn-nav-refresh"
              onClick={() => fetchRequests(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all bg-white"
              title="Refresh"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <button
              id="btn-nav-logout"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-all shadow-sm"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* Real-time status update banner */}
        <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-blue-50/50 text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-sm">
          <span>Last sync: {lastUpdate.toLocaleTimeString()}</span>
          <span className="flex items-center gap-1">Connected: {connectedClinics.length} clinics</span>
        </div>

        {/* ─── Split Layout: Main Queue (Left) & Widgets (Right) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Queue Column (Left 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Queue Control Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-1 border border-blue-50 shadow-sm gap-1 flex-nowrap overflow-x-auto max-w-full hide-scrollbar">
                {['all', 'Pending', 'Accepted', 'Processing', 'Completed', 'Rejected'].map(f => (
                  <button
                    key={f}
                    id={`filter-tab-${f.toLowerCase()}`}
                    onClick={() => { setFilter(f); setCurrentPage(1); }}
                    className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${filter === f ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-blue-50'}`}
                  >
                    {f === 'all' ? 'All' : f}
                    {f !== 'all' && (
                      <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${filter === f ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-400'}`}>
                        {requests.filter(r => r.status === f).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search patient, phone, test..."
                  className="pl-9 pr-4 py-2.5 bg-white border border-blue-50 rounded-2xl outline-none focus:border-blue-500 text-xs w-full transition-all font-bold shadow-sm"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Requests List */}
            {loading ? (
              <div className="flex justify-center py-16 bg-white rounded-3xl border border-blue-50 h-[380px] items-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Loading diagnostic queue...</p>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white/80 rounded-[2.5rem] border border-blue-50 p-12 text-center shadow-sm h-[380px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-blue-50">
                  <ClipboardList size={30} className="text-blue-500" />
                </div>
                <h3 className="font-heading text-lg font-bold text-slate-700 mb-2">Queue is Clear</h3>
                <p className="text-slate-500 text-sm max-w-sm mx-auto">
                  {filter === 'all'
                    ? 'Test requests from connected clinics will appear here.'
                    : `No ${filter} requests match your criteria.`}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-blue-50/60 shadow-sm flex flex-col h-[380px] justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-3 hide-scrollbar">
                  {(showAllRequests ? filteredRequests : filteredRequests.slice(0, 3)).map(req => {
                    const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
                    const isExpanded = expandedId === req._id;

                    return (
                      <div key={req._id} className="bg-white/90 backdrop-blur-sm rounded-3xl border border-blue-50 shadow-sm overflow-hidden transition-all hover:shadow-md">
                        {/* Card Header */}
                        <div
                          className="p-5 cursor-pointer flex items-center justify-between gap-4"
                          onClick={() => setExpandedId(isExpanded ? null : req._id)}
                        >
                          <div className="flex items-start gap-4 flex-grow min-w-0">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-50">
                              <TestTube size={20} className="text-blue-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <h3 className="font-extrabold text-slate-800 text-base">{req.testName || 'Laboratory Test'}</h3>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                  {req.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap font-bold">
                                <span className="flex items-center gap-1"><User size={13} className="text-blue-500" />{req.patientName}</span>
                                <span className="flex items-center gap-1"><Phone size={13} className="text-blue-500" />{req.patientPhone}</span>
                                {req.clinicId && <span className="flex items-center gap-1"><Building size={13} className="text-blue-500" />{req.clinicId.name || req.clinicId.clinicCode}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[12px] text-slate-400 font-bold uppercase hidden sm:block">
                              {new Date(req.requestedAt || req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                          </div>
                        </div>

                        {/* Expanded Actions */}
                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-blue-50 pt-4 space-y-4">
                            {req.notes && (
                              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/30">
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Clinic Diagnosis / Observations</p>
                                <p className="text-sm text-slate-700 font-semibold">{req.notes}</p>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                              {req.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => updateStatus(req._id, 'Accepted')}
                                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md shadow-blue-500/10 hover:shadow-lg transition-all flex items-center gap-1.5"
                                    style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}
                                  >
                                    <BadgeCheck size={14} /> Accept Request
                                  </button>
                                  <button
                                    onClick={() => { Swal.fire({ title: 'Reject request?', text: 'This request will be sent back as rejected.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, Reject' }).then(r => r.isConfirmed && updateStatus(req._id, 'Rejected')); }}
                                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all"
                                  >
                                    <XCircle size={14} className="inline mr-1" /> Reject
                                  </button>
                                </>
                              )}
                              {req.status === 'Accepted' && (
                                <button
                                  onClick={() => updateStatus(req._id, 'Processing')}
                                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-md shadow-purple-500/10 hover:shadow-lg transition-all flex items-center gap-1.5"
                                  style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)' }}
                                >
                                  <Loader2 size={14} className="animate-spin" /> Start Processing
                                </button>
                              )}
                              {(req.status === 'Accepted' || req.status === 'Processing') && (
                                <>
                                  <button
                                    onClick={() => handleOpenUploadModal(req)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                                  >
                                    <Upload size={14} /> Upload Scans
                                  </button>
                                  <button
                                    onClick={() => handleOpenDigitalReportModal(req)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center gap-1.5"
                                  >
                                    <FileCheck size={14} /> Compose Digital PDF
                                  </button>
                                </>
                              )}
                            </div>

                            {/* Display Published Records */}
                            {req.reports && req.reports.length > 0 && (
                              <div className="pt-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2.5">Uploaded Records ({req.reports.length})</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {req.reports.map((report, i) => (
                                    <a
                                      key={i}
                                      href={report.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                    >
                                      <FileText size={16} className="text-blue-500 shrink-0" />
                                      <span className="text-xs font-bold text-slate-700 flex-grow truncate">{report.title || `Report ${i + 1}`}</span>
                                      <span className="text-[9px] font-black text-slate-400 uppercase bg-white border border-slate-100 px-1.5 py-0.5 rounded-md">{report.fileType}</span>
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
                {filteredRequests.length > 3 && (
                  <div className="p-3 border-t border-slate-100 flex justify-center shrink-0 bg-slate-50/50">
                    <button
                      onClick={() => setShowAllRequests(!showAllRequests)}
                      className="px-4 py-2 text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all"
                    >
                      {showAllRequests ? 'Show Less' : `Show More (${filteredRequests.length - 3} more)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column Widgets (Right 1/3) */}
          <div className="lg:col-span-1">
            
            {/* Dashboard Summary */}
            <div className="bg-white rounded-3xl p-6 border border-blue-100/60 shadow-sm h-[380px] flex flex-col justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-3">Dashboard Summary</h3>
              <div className="space-y-3.5 flex-1 flex flex-col justify-center">
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                      <FileCheck size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Reports Published</p>
                      <p className="text-base font-black text-slate-800">{stats.completed}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                    {stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}%` : '0%'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Avg Turnaround</p>
                      <p className="text-base font-black text-slate-800">{getAvgTurnaroundTime()}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    Validated
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Lab Accuracy</p>
                      <p className="text-base font-black text-slate-800">{getQualityAccuracy()}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                    Target 99%
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100">
                      <XCircle size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Rejected Requests</p>
                      <p className="text-base font-black text-slate-800">{stats.rejected}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                    Action Required
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ─── Recent Completed Reports (Full Width) ─── */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100/60 shadow-sm w-full">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Recent Reports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {requests.filter(r => r.status === 'Completed').slice(0, 8).map((req, i) => (
              <div key={req._id || i} className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-blue-50/50 rounded-2xl transition-all hover:border-blue-200 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-700 truncate">{req.patientName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{req.testName || 'Diagnostic Report'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {req.reports && req.reports[0] && (
                    <a 
                      href={req.reports[0].fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-1.5 hover:bg-blue-100 rounded-xl text-blue-600 hover:text-blue-700 transition-all border border-transparent hover:border-blue-200 shadow-sm bg-white"
                      title="View PDF"
                    >
                      <Eye size={13} />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {requests.filter(r => r.status === 'Completed').length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-wider border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                No completed reports yet
              </div>
            )}
          </div>
        </div>

      </main>

      {/* ─── Modals ─── */}

      {/* New Test Request Modal (Walk-in direct booking) */}
      {showNewTestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="text-emerald-600" size={20} />
                <h3 className="font-extrabold text-slate-900 text-base">New Walk-In Request</h3>
              </div>
              <button onClick={() => setShowNewTestModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
                    <option key={clinic._id} value={clinic._id}>{clinic.name} ({clinic.clinicCode})</option>
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
      )}

      {/* Report Customization Modal */}
      {showReportConfigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="text-teal-600" size={20} />
                <h3 className="font-extrabold text-slate-900 text-base">Branding Customization</h3>
              </div>
              <button onClick={() => setShowReportConfigModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Lab Name (Header)</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800"
                  value={reportConfig.labName}
                  onChange={(e) => setReportConfig({ ...reportConfig, labName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Header Primary Color</label>
                  <input
                    type="color"
                    className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                    value={reportConfig.primaryColor}
                    onChange={(e) => setReportConfig({ ...reportConfig, primaryColor: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Header Font Size (pt)</label>
                  <input
                    type="number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800"
                    value={reportConfig.headerFontSize}
                    onChange={(e) => setReportConfig({ ...reportConfig, headerFontSize: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Authorized Signatory Name</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800"
                  value={reportConfig.defaultDoctorName}
                  onChange={(e) => setReportConfig({ ...reportConfig, defaultDoctorName: e.target.value })}
                  placeholder="e.g. Dr. John Doe, MD (Pathology)"
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Default Report Footnotes</label>
                <textarea
                  rows="3"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 text-xs font-extrabold text-slate-800 resize-none"
                  value={reportConfig.defaultNotes}
                  onChange={(e) => setReportConfig({ ...reportConfig, defaultNotes: e.target.value })}
                />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
              <button onClick={() => setShowReportConfigModal(false)} className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase tracking-wider">Cancel</button>
              <button onClick={handleSaveReportConfig} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"><Save size={14} /> Save Config</button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Collection Guide Modal */}
      {showSampleCollectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TestTubes className="text-violet-600" size={20} />
                <h3 className="font-extrabold text-slate-900 text-base">Specimen Collection Guide</h3>
              </div>
              <button onClick={() => setShowSampleCollectionModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
      )}

      {/* Digital Report Builder Modal */}
      {showDigitalReportModal && activeDigitalPatient && (
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
              <button onClick={() => setShowDigitalReportModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
              <button onClick={handlePublishDigitalReport} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"><BadgeCheck size={14} /> Compile & Publish Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Image Upload Panel Modal */}
      {showUploadModal && uploadModalPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
            <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="text-emerald-600" size={20} />
                <h3 className="font-extrabold text-slate-900 text-base">Upload Scanned Lab Report</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Added Files ({selectedUploadFiles.length})</p>
                  {selectedUploadFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {file.isPdf ? <FileText className="text-red-500 shrink-0" size={14} /> : <Eye className="text-emerald-500 shrink-0" size={14} />}
                        <span className="font-bold text-slate-700 truncate max-w-xs">{file.name}</span>
                        <span className="text-[9px] text-slate-400 font-bold">({file.size})</span>
                      </div>
                      <button onClick={() => handleRemoveSelectedFile(file.id)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14} /></button>
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
      )}

      {/* Floating Action Button (Quick Action Ball) */}
      <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-50 flex flex-col items-end gap-3 max-w-[calc(100vw-2rem)]">
        <div className={`transition-all duration-300 transform origin-bottom-right ${showQuickActions ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
          <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-blue-100 mb-2 w-[300px] flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1.5">Quick Operations</h3>
              <p className="text-[12px] text-slate-400 font-bold uppercase tracking-wider mb-5">Lab workflow shortcuts</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <QuickActionTile 
                icon={<Plus size={14} className="text-emerald-600" />} 
                label="New Test" 
                color="bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50" 
                onClick={() => {
                  if (connectedClinics.length === 0) {
                    Swal.fire('No Connections', 'You must have accepted connections from at least one clinic to register a test manually.', 'warning');
                    return;
                  }
                  setShowNewTestModal(true);
                  setShowQuickActions(false);
                }} 
              />
              <QuickActionTile 
                icon={<BarChart3 size={14} className="text-blue-600" />} 
                label="Summary" 
                color="bg-blue-50 text-blue-700 hover:bg-blue-100/50" 
                onClick={() => { handleDailySummary(); setShowQuickActions(false); }} 
              />
              <QuickActionTile 
                icon={<Settings size={14} className="text-teal-600" />} 
                label="Branding" 
                color="bg-teal-50 text-teal-700 hover:bg-teal-100/50" 
                onClick={() => { setShowReportConfigModal(true); setShowQuickActions(false); }} 
              />
              <QuickActionTile 
                icon={<TestTubes size={14} className="text-violet-600" />} 
                label="Guide" 
                color="bg-violet-50 text-violet-700 hover:bg-violet-100/50" 
                onClick={() => { setShowSampleCollectionModal(true); setShowQuickActions(false); }} 
              />
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-bold">Avg Turnaround</p>
                <p className="text-xs font-black text-slate-800 mt-1">{getAvgTurnaroundTime()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-bold">Quality Score</p>
                <p className="text-xs font-black text-emerald-600 mt-1">{getQualityAccuracy()}</p>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-16 h-16 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all z-50 border-4 border-white group"
          style={{ background: 'linear-gradient(135deg, #0F4C75, #1B6CA8)' }}
          title="Open Quick Actions"
        >
          {showQuickActions ? <X size={28} className="transform rotate-0 transition-transform duration-300" /> : <Plus size={28} className="transform rotate-90 transition-transform duration-300 group-hover:rotate-180" />}
        </button>
      </div>

    </div>
  );
};

export default LabPortalDashboard;
