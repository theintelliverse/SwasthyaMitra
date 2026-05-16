import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../config/runtime';
import { useNavigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Beaker, Upload, Smartphone, Hash, FileCheck,
  RefreshCw, Activity, Search, ChevronDown, Download,
  Plus, TestTubes, BarChart3, Filter, Eye, TrendingUp, Clock
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import MobileNav from '../../components/MobileNav';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const LabDashboard = () => {
  const navigate = useNavigate();
  const [labQueue, setLabQueue] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('All');
  const [recentReports, setRecentReports] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [showAddSampleModal, setShowAddSampleModal] = useState(false);
  const [showSampleCollectionModal, setShowSampleCollectionModal] = useState(false);
  const [showReportConfigModal, setShowReportConfigModal] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    labName: localStorage.getItem('clinicName') || 'SwasthyaMitra Lab',
    primaryColor: '#14B8A6',
    headerFontSize: 24,
    bodyFontSize: 12,
    reportType: 'Daily'
  });
  const [newTestForm, setNewTestForm] = useState({ patientName: '', patientPhone: '', testType: '' });
  const [addSampleForm, setAddSampleForm] = useState({ patientId: '', sampleType: '', collectionTime: '' });
  const itemsPerPage = 8;

  const token = localStorage.getItem('token');
  const clinicId = localStorage.getItem('clinicId');

  // Calculate statistics
  const getStats = () => {
    const queue = Array.isArray(labQueue) ? labQueue : [];
    const total = queue.length;
    const inProcess = queue.filter(p => p?.currentStage === 'Lab-Processing').length;
    const completed = queue.filter(p => p?.currentStage === 'Lab-Completed').length;
    const pending = queue.filter(p => p?.currentStage === 'Lab-Pending').length;
    const samplesCollected = queue.filter(p => p?.currentStage && p.currentStage !== 'Lab-Pending').length;

    return { total, inProcess, completed, pending, samplesCollected };
  };

  // Sample status data for pie chart
  const getSampleStatusData = () => {
    const stats = getStats();
    return [
      { name: 'Collected', value: stats.samplesCollected, color: '#14B8A6' },
      { name: 'In Process', value: stats.inProcess, color: '#0EA5E9' },
      { name: 'Testing', value: Math.max(0, Math.floor(stats.total * 0.08)), color: '#F59E0B' },
      { name: 'Completed', value: stats.completed, color: '#10B981' },
      { name: 'Rejected', value: Math.max(0, Math.floor(stats.total * 0.02)), color: '#EF4444' }
    ];
  };

  const fetchLabDashboardStats = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    setIsSyncing(true);
    try {
      console.log("🧪 Fetching lab stats from:", `${API_URL}/api/lab/dashboard/stats`);
      console.log("🔐 Token:", token ? "exists" : "missing");
      console.log("🏥 Clinic ID:", clinicId ? "exists" : "missing");

      const res = await axios.get(`${API_URL}/api/lab/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      });

      if (res.data.success) {
        const queueData = res.data.data.queueData || [];
        setLabQueue(queueData);
        setLastUpdate(new Date());
        setLoading(false);
        setError(null);
        console.log("✅ Lab stats loaded:", queueData.length, "items");
      } else {
        setError(res.data.message || 'Failed to fetch data');
        setLabQueue([]);
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Lab Stats Fetch Error:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to connect to server';
      setError(errorMsg);
      setLabQueue([]);
      setLoading(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const fetchRecentReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/lab/reports/recent?limit=3`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setRecentReports(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error("Recent Reports Fetch Error:", err);
    }
  };

  useEffect(() => {
    if (!token) {
      setError('No authentication token found. Please login again.');
      setLoading(false);
      return;
    }

    if (!clinicId) {
      setError('No clinic information found. Please login again.');
      setLoading(false);
      return;
    }

    // Initial data load
    fetchLabDashboardStats();
    fetchRecentReports();
    console.log("🔌 Initializing Socket.io connections...");

    // Socket connection handlers
    const setupSocketListeners = () => {
      // Connection events
      socket.on('connect', () => {
        console.log("✅ Socket.io connected:", socket.id);
        setSocketConnected(true);
        // Join clinic room after connection
        socket.emit('joinClinic', clinicId);
        console.log("🧪 Lab Dashboard joined Clinic Room:", clinicId);
      });

      socket.on('disconnect', () => {
        console.log("❌ Socket.io disconnected");
        setSocketConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error("⚠️ Socket connection error:", error);
      });

      // Queue update listener
      socket.on('queueUpdate', () => {
        console.log("♻️ Lab Dashboard received queueUpdate event - syncing...");
        setLastUpdate(new Date());
        fetchLabDashboardStats(true);
        fetchRecentReports();
      });

      // Live queue updates (real-time patient data)

    };

    setupSocketListeners();

    // Set up polling as backup if socket fails
    const pollInterval = setInterval(() => {
      if (!socketConnected) {
        console.log("📡 Socket not connected, polling for updates...");
        fetchLabDashboardStats(true);
      }
    }, 15000); // Poll every 15 seconds

    return () => {
      clearInterval(pollInterval);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('queueUpdate');
      socket.off('liveQueueUpdate');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, clinicId]);

  const handleNewTestRequest = async () => {
    if (!newTestForm.patientName || !newTestForm.patientPhone) {
      return Swal.fire('Invalid Input', 'Please enter patient name and phone', 'warning');
    }
    
    try {
      const res = await axios.post(`${API_URL}/api/queue/create`, {
        patientName: newTestForm.patientName,
        patientPhone: newTestForm.patientPhone,
        requiredTest: newTestForm.testType || 'General',
        currentStage: 'Lab-Pending',
        clinicId: clinicId,
        tokenNumber: Math.floor(Math.random() * 1000)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        Swal.fire('Success', 'New test request created', 'success');
        setNewTestForm({ patientName: '', patientPhone: '', testType: '' });
        setShowNewTestModal(false);
        fetchLabDashboardStats(false);
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to create test request', 'error');
    }
  };

  const handleAddSample = async () => {
    if (!addSampleForm.patientId || !addSampleForm.sampleType) {
      return Swal.fire('Invalid Input', 'Please select patient and sample type', 'warning');
    }
    
    try {
      const res = await axios.put(`${API_URL}/api/queue/${addSampleForm.patientId}`, {
        currentStage: 'Lab-Processing'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        Swal.fire('Success', `${addSampleForm.sampleType} sample added`, 'success');
        setAddSampleForm({ patientId: '', sampleType: '', collectionTime: '' });
        setShowAddSampleModal(false);
        fetchLabDashboardStats(true);
      }
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to add sample', 'error');
    }
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const stats = getStats();
    const { labName, primaryColor, headerFontSize, bodyFontSize, reportType } = reportConfig;
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor('#FFFFFF');
    doc.setFontSize(headerFontSize);
    doc.text(labName, 20, 25);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);
    
    // Content
    doc.setTextColor('#333333');
    doc.setFontSize(headerFontSize - 4);
    doc.text(`Lab Summary Report - ${reportType}`, 20, 60);
    
    doc.setFontSize(bodyFontSize);
    const tableData = [
      ['Metric', 'Value'],
      ['Total Requests', stats.total.toString()],
      ['Samples Collected', stats.samplesCollected.toString()],
      ['In Process', stats.inProcess.toString()],
      ['Completed', stats.completed.toString()],
      ['Pending', stats.pending.toString()],
      ['Completion Rate', `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`]
    ];
    
    autoTable(doc, {
      startY: 70,
      head: [tableData[0]],
      body: tableData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: primaryColor, fontSize: bodyFontSize + 2 },
      bodyStyles: { fontSize: bodyFontSize }
    });
    
    doc.save(`lab-report-${reportType}-${new Date().getTime()}.pdf`);
    setShowReportConfigModal(false);
    Swal.fire('Success', `${reportType} PDF report generated`, 'success');
  };

  const handleDownloadReport = (report) => {
    const doc = new jsPDF();
    const primaryColor = reportConfig.primaryColor;
    
    // Header
    doc.setFillColor(primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(reportConfig.labName, 20, 25);
    
    // Patient Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('PATIENT REPORT', 20, 55);
    doc.line(20, 58, 190, 58);
    
    doc.setFontSize(10);
    doc.text(`Patient Name: ${report.patientName}`, 20, 70);
    doc.text(`Phone: ${report.patientPhone}`, 20, 75);
    doc.text(`Date: ${new Date(report.createdAt).toLocaleDateString()}`, 140, 70);
    doc.text(`Report ID: ${report._id.slice(-8).toUpperCase()}`, 140, 75);
    
    // Results Table
    const tableData = [
      ['Test Description', 'Result / Notes'],
      [report.requiredTest || 'Diagnostic Test', report.diagnosis || report.notes || 'Results pending review']
    ];
    
    autoTable(doc, {
      startY: 90,
      head: [tableData[0]],
      body: [tableData[1]],
      theme: 'striped',
      headStyles: { fillColor: primaryColor }
    });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer-generated report and does not require a physical signature.', 20, 280);
    
    doc.save(`report-${report.patientName.replace(/\s+/g, '-')}-${report._id.slice(-4)}.pdf`);
    Swal.fire('Success', 'Report downloaded successfully', 'success');
  };

  const handleDailySummary = () => {
    const stats = getStats();
    Swal.fire({
      title: 'Daily Lab Summary',
      html: `<div style="text-align: left; font-size: 14px;"><p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p><p><strong>Total Requests:</strong> <span style="color: #0284c7;">${stats.total}</span></p><p><strong>Samples Collected:</strong> <span style="color: #14B8A6;">${stats.samplesCollected}</span></p><p><strong>In Process:</strong> <span style="color: #f59e0b;">${stats.inProcess}</span></p><p><strong>Completed:</strong> <span style="color: #10b981;">${stats.completed}</span></p><p><strong>Pending:</strong> <span style="color: #ef4444;">${stats.pending}</span></p><hr /><p><strong>Completion Rate:</strong> ${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</p></div>`,
      icon: 'info',
      confirmButtonColor: '#14B8A6'
    });
  };

  const handleFileUpload = async (patientPhone, queueId, file) => {
    if (!file) return;

    // 🔍 Pre-upload validation
    if (file.size > 5 * 1024 * 1024) { // 5MB Limit
      return Swal.fire('File Too Large', 'Please upload a file smaller than 5MB', 'warning');
    }

    const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10);

    const formData = new FormData();
    // 🔑 IMPORTANT: Ensure this key ('file') matches upload.single('file') in your backend route
    formData.append('file', file);
    formData.append('title', 'Diagnostic Report');
    formData.append('fileType', file.type.includes('pdf') ? 'PDF' : 'Image');

    Swal.fire({
      title: 'Syncing to Locker...',
      html: '<p style="font-size: 12px; color: #14B8A6;">Encrypting and notifying doctor...</p>',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#EEF6FA'
    });

    try {
      console.log(`📤 Sending upload request for ${cleanPhone}...`);
      const res = await axios.post(`${API_URL}/api/lab/upload/${cleanPhone}/${queueId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Results Published',
          text: 'Patient locker updated successfully.',
          timer: 2000,
          showConfirmButton: false,
          background: '#EEF6FA'
        });

        // Manually trigger a refresh to remove the patient from the list immediately
        fetchLabDashboardStats(true);
        fetchRecentReports();
      }
    } catch (err) {
      console.error("Upload Error Details:", err.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Sync Failed',
        text: err.response?.data?.message || 'Check your connection or file format.',
        confirmButtonColor: '#14B8A6',
        background: '#EEF6FA'
      });
    }
  };

  const filteredQueue = labQueue.filter(p => {
    const matchesSearch = p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientPhone.includes(searchTerm);
    const matchesTab = activeTab === 'All' || (activeTab === 'In Process' && p.currentStage === 'Lab-Processing') ||
      (activeTab === 'Pending' && p.currentStage === 'Lab-Pending') ||
      (activeTab === 'Completed' && p.currentStage === 'Lab-Completed');
    return matchesSearch && matchesTab;
  });

  // Pagination
  const totalPages = Math.ceil(filteredQueue.length / itemsPerPage);
  const paginatedQueue = filteredQueue.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = getStats();
  const sampleStatusData = getSampleStatusData();

  return (
    <div className="flex min-h-screen bg-gray-50 font-body text-gray-900 flex-col md:flex-row">
      <Sidebar role="lab" />

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-20 md:pb-0">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center gap-4 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Beaker size={20} />
            </div>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search patient by name, ID, phone or test..."
                className="pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white text-sm w-full transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchLabDashboardStats(false)}
              className={`p-2 text-gray-600 hover:text-teal-600 transition-colors ${isSyncing ? 'animate-spin' : ''}`}
              title="Refresh lab dashboard data"
            >
              <RefreshCw size={18} />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{localStorage.getItem('userName') || 'Lab Technician'}</p>
                <p className="text-xs text-gray-500">{localStorage.getItem('clinicName') || 'Central Lab'}</p>
              </div>
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold uppercase">
                {(localStorage.getItem('userName') || 'LT').substring(0, 2)}
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="px-4 md:px-8 py-6 flex-grow max-w-7xl mx-auto w-full">
          {/* Loading State - Show on first load only */}
          {loading && labQueue.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-semibold">Loading lab dashboard...</p>
              <p className="text-xs text-gray-500">Connecting to {API_URL}</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">Connection Error</p>
              <p className="text-sm text-gray-600 max-w-md text-center">{error}</p>
              <div className="text-xs text-gray-500 text-center max-w-md mt-4 bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold mb-2">Quick fixes:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Check if backend is running: npm run dev</li>
                  <li>Backend should be on http://localhost:5000</li>
                  <li>Check if you're logged in</li>
                  <li>Open DevTools (F12) to see error details</li>
                </ul>
              </div>
              <button onClick={() => fetchLabDashboardStats(false)} className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                Retry
              </button>
            </div>
          )}

          {!error && (
            <>
              {/* Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">LabDashboard</h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Activity size={16} className="text-teal-500" />
                    Diagnostic Laboratory Management
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Last update: {lastUpdate.toLocaleTimeString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-600">
                      {isSyncing ? 'Syncing...' : socketConnected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-bold uppercase text-gray-600 tracking-wider">Total Requests</p>
                    <span className="text-xs text-green-600 font-semibold">+12%</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total}</p>
                  <p className="text-xs text-gray-500">from yesterday</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-bold uppercase text-gray-600 tracking-wider">Samples Collected</p>
                    <span className="text-xs text-green-600 font-semibold">+8%</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stats.samplesCollected}</p>
                  <p className="text-xs text-gray-500">from yesterday</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-bold uppercase text-gray-600 tracking-wider">In Process</p>
                    <span className="text-xs text-blue-600 font-semibold">-5%</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-500 mb-1">{stats.inProcess}</p>
                  <p className="text-xs text-gray-500">from yesterday</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-bold uppercase text-gray-600 tracking-wider">Completed</p>
                    <span className="text-xs text-green-600 font-semibold">+15%</span>
                  </div>
                  <p className="text-3xl font-bold text-green-500 mb-1">{stats.completed}</p>
                  <p className="text-xs text-gray-500">from yesterday</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-bold uppercase text-gray-600 tracking-wider">Pending Reports</p>
                    <span className="text-xs text-red-600 font-semibold">-30%</span>
                  </div>
                  <p className="text-3xl font-bold text-red-500 mb-1">{stats.pending}</p>
                  <p className="text-xs text-gray-500">from yesterday</p>
                </div>
              </div>

              {/* Main Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Quick Actions */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      <button
                        onClick={() => setShowNewTestModal(true)}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-teal-100 transition-all text-gray-700 hover:text-teal-600 font-semibold text-sm group"
                      >
                        <div className="w-12 h-12 bg-white border border-gray-200 group-hover:border-teal-200 rounded-lg flex items-center justify-center text-teal-600 shadow-sm transition-all group-hover:shadow text-teal-600">
                          <Plus size={20} />
                        </div>
                        <span className="text-xs text-center leading-tight">New Test Request</span>
                      </button>
                      <button
                        onClick={() => setShowAddSampleModal(true)}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-teal-100 transition-all text-gray-700 hover:text-teal-600 font-semibold text-sm group"
                      >
                        <div className="w-12 h-12 bg-white border border-gray-200 group-hover:border-teal-200 rounded-lg flex items-center justify-center text-teal-600 shadow-sm transition-all group-hover:shadow text-teal-600">
                          <TestTubes size={20} />
                        </div>
                        <span className="text-xs text-center leading-tight">Add New Sample</span>
                      </button>
                      <button
                        onClick={() => { setReportConfig({...reportConfig, reportType: 'Daily'}); setShowReportConfigModal(true); }}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-teal-100 transition-all text-gray-700 hover:text-teal-600 font-semibold text-sm group"
                      >
                        <div className="w-12 h-12 bg-white border border-gray-200 group-hover:border-teal-200 rounded-lg flex items-center justify-center text-teal-600 shadow-sm transition-all group-hover:shadow text-teal-600">
                          <BarChart3 size={20} />
                        </div>
                        <span className="text-xs text-center leading-tight">Generate Report</span>
                      </button>
                      <button
                        onClick={() => setShowSampleCollectionModal(true)}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-teal-100 transition-all text-gray-700 hover:text-teal-600 font-semibold text-sm group"
                      >
                        <div className="w-12 h-12 bg-white border border-gray-200 group-hover:border-teal-200 rounded-lg flex items-center justify-center text-teal-600 shadow-sm transition-all group-hover:shadow text-teal-600">
                          <Upload size={20} />
                        </div>
                        <span className="text-xs text-center leading-tight">Upload Report</span>
                      </button>
                      <button
                        onClick={() => fetchLabDashboardStats(false)}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-teal-100 transition-all text-gray-700 hover:text-teal-600 font-semibold text-sm group"
                      >
                        <div className="w-12 h-12 bg-white border border-gray-200 group-hover:border-teal-200 rounded-lg flex items-center justify-center text-teal-600 shadow-sm transition-all group-hover:shadow text-teal-600">
                          <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                        </div>
                        <span className="text-xs text-center leading-tight">Check Status</span>
                      </button>
                      <button
                        onClick={handleDailySummary}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-teal-100 transition-all text-gray-700 hover:text-teal-600 font-semibold text-sm group"
                      >
                        <div className="w-12 h-12 bg-white border border-gray-200 group-hover:border-teal-200 rounded-lg flex items-center justify-center text-teal-600 shadow-sm transition-all group-hover:shadow text-teal-600">
                          <TrendingUp size={20} />
                        </div>
                        <span className="text-xs text-center leading-tight">Daily Summary</span>
                      </button>
                      <button
                        onClick={() => setShowSampleCollectionModal(true)}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg hover:bg-gray-50 border border-transparent hover:border-teal-100 transition-all text-gray-700 hover:text-teal-600 font-semibold text-sm group"
                      >
                        <div className="w-12 h-12 bg-white border border-gray-200 group-hover:border-teal-200 rounded-lg flex items-center justify-center text-teal-600 shadow-sm transition-all group-hover:shadow text-teal-600">
                          <Eye size={20} />
                        </div>
                        <span className="text-xs text-center leading-tight">Sample Collection</span>
                      </button>
                    </div>
                  </div>

                  {/* Test Requests Table */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900">Test Requests</h2>
                      <button onClick={() => navigate('/lab/requests')} className="text-teal-600 text-sm font-semibold hover:text-teal-700">View All</button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6">
                      <div className="flex">
                        {['All', 'In Process', 'Pending', 'Completed', 'Cancelled'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === tab
                              ? 'text-teal-600 border-teal-600'
                              : 'text-gray-600 border-transparent hover:text-gray-900'
                              }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      <button className="flex items-center gap-2 text-gray-600 text-sm font-semibold hover:text-teal-600 transition-colors">
                        <Filter size={16} /> Filters
                      </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 bg-white">
                            <th className="px-6 py-3 text-left font-bold text-gray-700">Request ID</th>
                            <th className="px-6 py-3 text-left font-bold text-gray-700">Patient Name</th>
                            <th className="px-6 py-3 text-left font-bold text-gray-700">Tests</th>
                            <th className="px-6 py-3 text-left font-bold text-gray-700">Status</th>
                            <th className="px-6 py-3 text-left font-bold text-gray-700">Priority</th>
                            <th className="px-6 py-3 text-left font-bold text-gray-700">Requested On</th>
                            <th className="px-6 py-3 text-center font-bold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                <Beaker className="mx-auto mb-2 text-gray-400 animate-pulse" size={32} />
                                <p>Loading requests...</p>
                              </td>
                            </tr>
                          ) : paginatedQueue.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                <FileCheck className="mx-auto mb-2 text-gray-400" size={32} />
                                <p>No test requests found</p>
                              </td>
                            </tr>
                          ) : (
                            paginatedQueue.map((request) => (
                              <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-teal-600 font-bold">TRF-2025-{request.tokenNumber}</td>
                                <td className="px-6 py-4">
                                  <p className="text-gray-900 font-bold">{request.patientName}</p>
                                  <p className="text-xs text-gray-500">{request._id.slice(-6).toUpperCase()}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-700">{request.requiredTest || 'CBC, RBS, Lipid Profile'}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-xs font-semibold ${request.currentStage === 'Lab-Completed' ? 'bg-green-50 text-green-600' :
                                    request.currentStage === 'Lab-Processing' ? 'bg-blue-50 text-blue-600' :
                                      'bg-orange-50 text-orange-600'
                                    }`}>
                                    {request.currentStage === 'Lab-Completed' ? 'Completed' :
                                      request.currentStage === 'Lab-Processing' ? 'In Process' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${request.isEmergency ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                  <span className={`text-xs font-semibold text-gray-700`}>
                                    {request.isEmergency ? 'High' : 'Low'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 text-xs">
                                  <p>22 May 2025</p>
                                  <p>{new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </td>
                                <td className="px-6 py-4 text-center flex justify-center items-center h-full pt-6">
                                  <button
                                    className="text-gray-400 hover:text-teal-600 transition-colors"
                                    onClick={() => handleFileUpload(request.patientPhone, request._id)}
                                  >
                                    <Eye size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 0 && (
                      <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-white">
                        <p className="text-sm text-gray-600">
                          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredQueue.length)} of {filteredQueue.length} entries
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm font-semibold"
                          >
                            &lt;
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                            <button
                              key={num}
                              onClick={() => setCurrentPage(num)}
                              className={`w-8 h-8 flex items-center justify-center rounded text-sm font-semibold ${currentPage === num
                                ? 'bg-teal-50 text-teal-600 border border-transparent'
                                : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                                }`}
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 text-sm font-semibold"
                          >
                            &gt;
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Samples */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-gray-900">Recent Samples</h2>
                      <button onClick={() => navigate('/lab/samples')} className="text-teal-600 text-sm font-semibold hover:text-teal-700">View All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Sample Cards */}
                      {labQueue.slice(0, 4).map((patient, idx) => (
                        <div key={patient._id || idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center flex-shrink-0">
                              {patient.currentStage === 'Lab-Pending' ? <Beaker size={16} /> : patient.currentStage === 'Lab-Processing' ? <TestTubes size={16} /> : <FileCheck size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">SMP-2025-{patient.tokenNumber}</p>
                              <p className="text-[10px] text-gray-500 truncate">{patient.patientName}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-semibold text-gray-700 mb-4 truncate">{patient.requiredTest || 'CBC, RBS, Lipid Profile'}</p>
                          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${patient.currentStage === 'Lab-Pending' ? 'bg-orange-50 text-orange-600 border border-orange-100' : patient.currentStage === 'Lab-Processing' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                              {patient.currentStage === 'Lab-Pending' ? 'Testing' : patient.currentStage === 'Lab-Processing' ? 'In Process' : 'Collected'}
                            </span>
                            <span className="text-[9px] font-bold text-gray-500">
                              {new Date(patient.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      {labQueue.length === 0 && (
                        <div className="col-span-full py-6 text-center text-gray-500 text-sm">No recent samples available</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="lg:col-span-1 space-y-8">
                  {/* Sample Status Pie Chart */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-gray-900">Sample Status Overview</h2>
                      <button onClick={() => navigate('/lab/analytics')} className="text-teal-600 text-xs font-semibold hover:text-teal-700">View Details</button>
                    </div>
                    <div className="flex items-center justify-center mb-6 relative min-h-[180px]">
                      {sampleStatusData.length > 0 && stats.total > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie
                                data={sampleStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {sampleStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry?.color || '#ccc'} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
                            <span className="text-xs text-gray-500">Total Samples</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[180px] text-gray-400">
                          <Activity size={32} className="opacity-20 mb-2" />
                          <p className="text-xs">No data to visualize</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {sampleStatusData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-gray-700 font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold text-gray-900">
                            {item.value} 
                            <span className="text-gray-400 font-normal ml-1">
                              ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dashboard Summary */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900">Dashboard Summary</h2>
                      <div className="flex items-center gap-1 text-sm font-semibold text-gray-600 cursor-pointer">
                        This Month <ChevronDown size={14} />
                      </div>
                    </div>
                    <div className="p-6 space-y-5">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded flex items-center justify-center">
                            <FileCheck size={16} />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Reports Generated</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-gray-900">245</p>
                          <span className="text-xs font-bold text-green-600 w-10 text-right">↑ 18%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded flex items-center justify-center">
                            <Clock size={16} />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Average Turnaround Time</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-gray-900">24.6 hrs</p>
                          <span className="text-xs font-bold text-green-600 w-10 text-right">↓ 8%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-50 text-green-600 rounded flex items-center justify-center">
                            <Activity size={16} />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Test Accuracy</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-gray-900">99.2%</p>
                          <span className="text-xs font-bold text-green-600 w-10 text-right">↑ 2%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-50 text-red-600 rounded flex items-center justify-center">
                            <RefreshCw size={16} />
                          </div>
                          <p className="text-sm font-semibold text-gray-700">Repeat Tests</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-gray-900">14</p>
                          <span className="text-xs font-bold text-red-600 w-10 text-right">↓ 12%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Reports */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center p-6 border-b border-gray-200">
                      <h2 className="text-lg font-bold text-gray-900">Recent Reports</h2>
                      <button onClick={() => navigate('/lab/reports')} className="text-teal-600 text-sm font-semibold hover:text-teal-700">View All</button>
                    </div>
                    <div className="p-2">
                      {recentReports.length > 0 ? (
                        recentReports.map((report) => (
                          <div key={report._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors rounded-lg group border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-red-50 text-red-500 rounded flex items-center justify-center flex-shrink-0">
                                <FileCheck size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{report.patientName}</p>
                                <p className="text-xs text-gray-500 font-medium">{report.requiredTest || 'Lipid Profile'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-xs text-gray-500 font-medium hidden md:block">
                                {new Date(report.createdAt).toLocaleDateString()} at {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <button 
                                onClick={() => handleDownloadReport(report)}
                                className="text-gray-400 group-hover:text-teal-600 transition-colors"
                              >
                                <Download size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-gray-400">
                           <FileCheck className="mx-auto mb-2 opacity-20" size={32} />
                           <p className="text-xs font-bold uppercase tracking-widest">No recent reports found</p>
                        </div>
                      )}
                      <div className="p-4 text-center border-t border-gray-100">
                        <button onClick={() => navigate('/lab/reports')} className="text-teal-600 text-xs font-semibold hover:text-teal-700">+ 15 more reports</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>

        {/* New Test Request Modal */}
        {showNewTestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">New Test Request</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={newTestForm.patientName}
                    onChange={(e) => setNewTestForm({...newTestForm, patientName: e.target.value})}
                    placeholder="Enter patient name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newTestForm.patientPhone}
                    onChange={(e) => setNewTestForm({...newTestForm, patientPhone: e.target.value})}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Test Type</label>
                  <select
                    value={newTestForm.testType}
                    onChange={(e) => setNewTestForm({...newTestForm, testType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Test Type</option>
                    <option value="Blood Test">Blood Test</option>
                    <option value="Urine Test">Urine Test</option>
                    <option value="COVID Test">COVID Test</option>
                    <option value="General Checkup">General Checkup</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {setShowNewTestModal(false); setNewTestForm({ patientName: '', patientPhone: '', testType: '' });}}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNewTestRequest}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  Create Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Sample Modal */}
        {showAddSampleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Sample</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Patient</label>
                  <select
                    value={addSampleForm.patientId}
                    onChange={(e) => setAddSampleForm({...addSampleForm, patientId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">-- Select Patient --</option>
                    {labQueue.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.patientName} (#{patient.tokenNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Sample Type</label>
                  <select
                    value={addSampleForm.sampleType}
                    onChange={(e) => setAddSampleForm({...addSampleForm, sampleType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select Sample Type</option>
                    <option value="Blood">Blood</option>
                    <option value="Urine">Urine</option>
                    <option value="Saliva">Saliva</option>
                    <option value="Swab">Swab</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {setShowAddSampleModal(false); setAddSampleForm({ patientId: '', sampleType: '', collectionTime: '' });}}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSample}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Add Sample
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sample Collection Modal */}
        {showSampleCollectionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sample Collection / Upload Report</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowSampleCollectionModal(false);
                    document.getElementById('fileInput')?.click();
                  }}
                  className="w-full px-4 py-3 border-2 border-dashed border-teal-300 rounded-lg text-teal-600 font-semibold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={18} />
                  Upload Report File
                </button>
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && labQueue.length > 0) {
                      handleFileUpload(labQueue[0].patientPhone, labQueue[0]._id, e.target.files[0]);
                    }
                  }}
                />
                <p className="text-sm text-gray-600 text-center mt-4">Supported formats: PDF, JPG, PNG</p>
              </div>
              <button onClick={() => navigate('/lab/analytics')} className="w-full mt-4 py-2 bg-gray-50 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors text-sm">
                View Details
              </button>
              <button
                onClick={() => setShowSampleCollectionModal(false)}
                className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Report Customization Modal */}
        {showReportConfigModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Customize PDF Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lab Name</label>
                  <input
                    type="text"
                    value={reportConfig.labName}
                    onChange={(e) => setReportConfig({...reportConfig, labName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={reportConfig.primaryColor}
                      onChange={(e) => setReportConfig({...reportConfig, primaryColor: e.target.value})}
                      className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={reportConfig.primaryColor}
                      onChange={(e) => setReportConfig({...reportConfig, primaryColor: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Header Font Size</label>
                    <input
                      type="number"
                      value={reportConfig.headerFontSize}
                      onChange={(e) => setReportConfig({...reportConfig, headerFontSize: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Body Font Size</label>
                    <input
                      type="number"
                      value={reportConfig.bodyFontSize}
                      onChange={(e) => setReportConfig({...reportConfig, bodyFontSize: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowReportConfigModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                >
                  Generate PDF
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>

      <MobileNav role="lab" />
    </div>
  );
};

export default LabDashboard;