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
  Plus, TestTubes, BarChart3, Filter, Eye, TrendingUp, Clock, X
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import MobileNav from '../../components/MobileNav';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const socket = io(SOCKET_URL || API_URL || 'http://localhost:5000');

// Quick Action Tile Component
const QuickActionTile = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl border border-transparent hover:border-gray-100 transition-all ${color} active:scale-95 shadow-sm hover:shadow-md w-full`}
  >
    <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg md:rounded-xl flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <span className="text-[9px] md:text-xs font-bold text-center leading-tight uppercase tracking-widest">{label}</span>
  </button>
);

// Lab Metric Card Component
const LabMetricCard = ({ title, value, change, icon, color }) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600'
  };

  const shortTitle = title
    .replace('Total Requests', 'Total')
    .replace('Samples Collected', 'Samples')
    .replace('In Process', 'Process')
    .replace('Completed', 'Done')
    .replace('Pending Reports', 'Pending');

  return (
    <div className="bg-white p-2 md:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center md:items-start text-center md:text-left h-24 justify-center min-w-[70px]">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full mb-1 md:mb-1.5 gap-1 md:gap-0">
        <h3 className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest flex-1 text-left leading-tight pr-2">{title}</h3>
        <div className={`p-1.5 rounded-lg shrink-0 ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <h3 className="md:hidden text-[8px] font-black text-gray-400 uppercase tracking-widest w-full mb-0.5 leading-tight">{shortTitle}</h3>
      <p className="text-sm md:text-2xl font-black text-gray-900 mb-0">{value}</p>
      {change && (
        <div className="hidden md:flex items-center gap-1 mt-0.5">
          <TrendingUp size={10} className={change.startsWith('+') ? 'text-green-500' : 'text-red-500'} />
          <span className={`text-[9px] font-bold ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{change}</span>
          <span className="text-[10px] text-gray-400 hidden sm:inline">from yesterday</span>
        </div>
      )}
    </div>
  );
};

const LabDashboard = () => {
  const navigate = useNavigate();
  const [labQueue, setLabQueue] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
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
    reportType: 'Daily',
    defaultNotes: localStorage.getItem('defaultNotes') || 'Results are within reference intervals. Clinically correlate if needed.',
    defaultDoctorName: localStorage.getItem('defaultDoctorName') || 'Dr. Swasthya Mitra, MBBS, MD'
  });
  const [newTestForm, setNewTestForm] = useState({ patientName: '', patientPhone: '', testType: '' });
  const [addSampleForm, setAddSampleForm] = useState({ patientId: '', sampleType: '', collectionTime: '' });
  const [showDigitalReportModal, setShowDigitalReportModal] = useState(false);
  const [activeDigitalPatient, setActiveDigitalPatient] = useState(null);
  const [digitalReportForm, setDigitalReportForm] = useState({
    title: 'Diagnostic Lab Report',
    findings: '',
    notes: localStorage.getItem('defaultNotes') || 'Results are within reference intervals. Clinically correlate if needed.',
    doctorName: localStorage.getItem('defaultDoctorName') || 'Laboratory'
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalPatient, setUploadModalPatient] = useState(null);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState([]);
  const itemsPerPage = 8;

  const token = localStorage.getItem('token');
  const clinicId = localStorage.getItem('clinicId');

  // Calculate statistics
  const getStats = () => {
    const queue = Array.isArray(labQueue) ? labQueue : [];
    const total = queue.length;

    // Exclusive states based on true stages
    const pending = queue.filter(p => p?.currentStage === 'Lab-Pending').length;
    const inProcess = queue.filter(p => p?.currentStage === 'Lab-Processing').length;
    const completed = queue.filter(p => p?.currentStage === 'Lab-Completed').length;
    const rejected = queue.filter(p => p?.currentStage === 'Lab-Rejected').length;
    const samplesCollected = inProcess + completed;

    return { total, inProcess, completed, pending, rejected, samplesCollected };
  };

  // Sample status data for pie chart
  const getSampleStatusData = () => {
    const stats = getStats();
    return [
      { name: 'Pending', value: stats.pending, color: '#F59E0B' },
      { name: 'In Process', value: stats.inProcess, color: '#0EA5E9' },
      { name: 'Completed', value: stats.completed, color: '#10B981' },
      { name: 'Rejected', value: stats.rejected, color: '#EF4444' }
    ];
  };

  // Real dynamic calculation of summary metrics
  const getAvgTurnaroundTime = () => {
    const completedItems = labQueue.filter(p => p.currentStage === 'Lab-Completed' && p.createdAt);
    if (completedItems.length === 0) return "24.6 hrs";

    let totalHours = 0;
    completedItems.forEach(p => {
      const start = new Date(p.createdAt);
      const end = p.updatedAt ? new Date(p.updatedAt) : new Date();
      const diffHrs = Math.max(0.5, (end - start) / (1000 * 60 * 60));
      totalHours += diffHrs;
    });

    return `${(totalHours / completedItems.length).toFixed(1)} hrs`;
  };

  const getDynamicAccuracy = () => {
    const stats = getStats();
    if (stats.completed === 0) return "99.2%";
    const accuracy = (((stats.completed - stats.rejected) / stats.completed) * 100).toFixed(1);
    return `${accuracy}%`;
  };

  const getDynamicRepeatTests = () => {
    const stats = getStats();
    return stats.rejected;
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
      // Check if already connected (e.g. from a previous fast connection)
      if (socket.connected) {
        setSocketConnected(true);
        socket.emit('joinClinic', clinicId);
        console.log("🧪 Lab Dashboard joined Clinic Room (instant):", clinicId);
      }

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

  const handleSaveReportConfig = () => {
    localStorage.setItem('defaultNotes', reportConfig.defaultNotes || '');
    localStorage.setItem('defaultDoctorName', reportConfig.defaultDoctorName || '');
    localStorage.setItem('clinicName', reportConfig.labName || '');
    setShowReportConfigModal(false);
    Swal.fire({
      icon: 'success',
      title: 'Settings Saved',
      text: 'Default digital report settings updated successfully.',
      timer: 1500,
      showConfirmButton: false
    });
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
    const queue = Array.isArray(labQueue) ? labQueue : [];
    const todayStr = new Date().toDateString();

    // Filter to only items created TODAY
    const dailyQueue = queue.filter(p => p.createdAt && new Date(p.createdAt).toDateString() === todayStr);

    const total = dailyQueue.length;
    const pending = dailyQueue.filter(p => p?.currentStage === 'Lab-Pending').length;
    const inProcess = dailyQueue.filter(p => p?.currentStage === 'Lab-Processing').length;
    const completed = dailyQueue.filter(p => p?.currentStage === 'Lab-Completed').length;
    const rejected = dailyQueue.filter(p => p?.currentStage === 'Lab-Rejected').length;
    const samplesCollected = inProcess + completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    Swal.fire({
      title: 'Daily Lab Summary',
      html: `
        <div style="text-align: left; font-size: 14.5px; font-family: sans-serif; line-height: 1.6; padding: 4px;">
          <p style="margin-bottom: 8px;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US')}</p>
          <div style="border-top: 1px solid #e5e7eb; margin: 10px 0; padding-top: 10px;">
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>Total Requests:</strong></span> <span style="color: #0ea5e9; font-weight: bold;">${total}</span></p>
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>Samples Collected:</strong></span> <span style="color: #0f9488; font-weight: bold;">${samplesCollected}</span></p>
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>In Process:</strong></span> <span style="color: #f59e0b; font-weight: bold;">${inProcess}</span></p>
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>Completed:</strong></span> <span style="color: #10b981; font-weight: bold;">${completed}</span></p>
            <p style="margin-bottom: 6px; display: flex; justify-content: space-between;"><span><strong>Pending:</strong></span> <span style="color: #ef4444; font-weight: bold;">${pending}</span></p>
          </div>
          <div style="border-top: 1px solid #e5e7eb; margin: 10px 0; padding-top: 10px; display: flex; justify-content: space-between;">
            <span><strong>Completion Rate:</strong></span>
            <span style="font-weight: 800; color: #0f9488;">${completionRate}%</span>
          </div>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#14B8A6',
      confirmButtonText: 'Understood'
    });
  };

  const handleOpenDigitalReportModal = (request) => {
    setActiveDigitalPatient(request);
    setDigitalReportForm({
      title: 'Diagnostic Lab Report',
      findings: '',
      notes: reportConfig.defaultNotes || 'Results are within reference intervals. Clinically correlate if needed.',
      doctorName: reportConfig.defaultDoctorName || 'Dr. Swasthya Mitra, MBBS, MD'
    });
    setShowDigitalReportModal(true);
  };

  const handlePublishDigitalReport = async () => {
    if (!digitalReportForm.findings.trim()) {
      return Swal.fire('Error', 'Please enter some test findings/results.', 'warning');
    }

    try {
      const doc = new jsPDF();
      const primaryColor = reportConfig.primaryColor || '#0f9488';

      // Professional Header
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(reportConfig.labName || 'SWASTHYAMITRA PATHOLOGY LAB', 20, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);

      // Patient Information
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('PATIENT DIAGNOSTIC REPORT', 20, 55);
      doc.line(20, 58, 190, 58);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Patient Name: ${activeDigitalPatient.patientName}`, 20, 70);
      doc.text(`Phone Number: ${activeDigitalPatient.patientPhone}`, 20, 78);
      doc.text(`Referred Tests: ${activeDigitalPatient.requiredTest || 'CBC, RBS'}`, 20, 86);

      doc.text(`Date of Visit: ${new Date(activeDigitalPatient.createdAt).toLocaleDateString()}`, 130, 70);
      doc.text(`Report ID: SMP-${activeDigitalPatient._id.slice(-8).toUpperCase()}`, 130, 78);

      // Findings Section
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('TEST RESULTS & OBSERVATIONS', 20, 105);
      doc.line(20, 108, 190, 108);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const findingsLines = doc.splitTextToSize(digitalReportForm.findings, 170);
      doc.text(findingsLines, 20, 118);

      // Pathologist Notes Section
      const startNotesY = 118 + (findingsLines.length * 7) + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text('CLINICAL NOTES & INTERPRETATION', 20, startNotesY);
      doc.line(20, startNotesY + 3, 190, startNotesY + 3);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const notesLines = doc.splitTextToSize(digitalReportForm.notes, 170);
      doc.text(notesLines, 20, startNotesY + 12);

      // Sign-off Section
      const startSignY = startNotesY + 12 + (notesLines.length * 7) + 25;
      doc.line(130, startSignY, 190, startSignY);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text('AUTHORIZED SIGNATORY', 130, startSignY + 8);
      doc.setFont("helvetica", "normal");
      doc.text(digitalReportForm.doctorName, 130, startSignY + 14);

      // Dynamic Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('This is a digitally generated secure report verified by SwasthyaMitra health network.', 20, 280);

      // Convert jsPDF output to Blob
      const pdfBlob = doc.output('blob');

      // Create a File object from the blob
      const pdfFile = new File([pdfBlob], `digital_report_${activeDigitalPatient.patientName.replace(/\s+/g, '_')}.pdf`, {
        type: 'application/pdf'
      });

      // Call our robust handleFileUpload method to sync it to Cloudinary & Locker!
      await handleFileUpload(activeDigitalPatient.patientPhone, activeDigitalPatient._id, pdfFile);

      // Close the modal
      setShowDigitalReportModal(false);

      // Reset form
      setDigitalReportForm({
        title: 'Diagnostic Lab Report',
        findings: '',
        notes: 'Results are within reference intervals. Clinically correlate if needed.',
        doctorName: 'Dr. Swasthya Mitra, MBBS, MD'
      });

    } catch (err) {
      console.error("Failed to generate digital report:", err);
      Swal.fire('Error', 'Failed to generate digital report PDF.', 'error');
    }
  };

  const handleOpenUploadModal = (request) => {
    setUploadModalPatient({
      patientPhone: request.patientPhone,
      queueId: request._id || request.queueId,
      patientName: request.patientName || 'Valued Patient',
      requiredTest: request.requiredTest || 'Routine Diagnosis'
    });
    setSelectedUploadFiles([]);
    setShowUploadModal(true);
  };

  const handleUploadModalFileSelect = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    // Validate file sizes
    for (const file of filesArray) {
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        Swal.fire('File Too Large', `Please upload files smaller than 5MB. "${file.name}" exceeds this limit.`, 'warning');
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
      return Swal.fire('No Files Added', 'Please add at least one report file or photo to upload.', 'warning');
    }

    const files = selectedUploadFiles.map(f => f.file);
    setShowUploadModal(false);
    await handleFileUpload(uploadModalPatient.patientPhone, uploadModalPatient.queueId, files);
    setSelectedUploadFiles([]);
    setUploadModalPatient(null);
  };

  const handleFileUpload = async (patientPhone, queueId, files) => {
    if (!files) {
      const request = (labQueue || []).find(p => p._id === queueId || p.patientPhone === patientPhone) || {};
      handleOpenUploadModal({
        patientPhone: patientPhone,
        _id: queueId,
        patientName: request.patientName || 'Valued Patient',
        requiredTest: request.requiredTest || 'Routine Diagnosis'
      });
      return;
    }

    // Convert Single File or FileList into an Array of Files
    const filesArray = files.length !== undefined ? Array.from(files) : [files];

    // 🔍 Pre-upload validation
    for (const file of filesArray) {
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        return Swal.fire('File Too Large', `Please upload files smaller than 5MB. "${file.name}" exceeds this limit.`, 'warning');
      }
    }

    const cleanPhone = patientPhone.replace(/\D/g, '').slice(-10);

    const formData = new FormData();
    // Append all selected files to the same key 'file' as expected by multer.array('file')
    filesArray.forEach((file) => {
      formData.append('file', file);
    });
    formData.append('title', 'Diagnostic Report');

    Swal.fire({
      title: 'Syncing to Locker...',
      html: `<p style="font-size: 12px; color: #14B8A6;">Encrypting and publishing ${filesArray.length} report(s)...</p>`,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#EEF6FA'
    });

    try {
      console.log(`📤 Sending upload request for ${filesArray.length} files to ${cleanPhone}...`);
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
          text: `${filesArray.length} reports successfully published to patient locker.`,
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
        text: err.response?.data?.message || 'Check your connection or file formats.',
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

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto">
        {/* Top Navigation */}
        <nav className="bg-white border-b border-gray-200 px-3 md:px-5 py-3 flex justify-between items-center gap-4 shadow-sm sticky top-0 z-30">
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
        <main className="p-3 md:p-5 flex-grow max-w-7xl mx-auto w-full overflow-y-auto">
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-gray-900">LabDashboard</h1>
                  <p className="hidden md:flex text-xs text-gray-400 items-center gap-2">
                    <Activity size={14} className="text-teal-500" />
                    Diagnostic Laboratory Management
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-[10px] text-gray-400">Last update: {lastUpdate.toLocaleTimeString()}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-pulse' : socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-600">
                      {isSyncing ? 'Syncing...' : socketConnected ? 'Live' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Metrics Cards */}
              <div className="flex md:grid overflow-x-auto hide-scrollbar gap-2 md:gap-4 mb-4 md:mb-6 pb-2 md:pb-0 snap-x snap-mandatory md:grid-cols-2 lg:grid-cols-5">
                <div className="snap-start shrink-0 min-w-[21%] md:w-auto">
                  <LabMetricCard title="Total Requests" value={stats.total} change="+12%" icon={<Activity size={16} className="md:w-5 md:h-5" />} color="teal" />
                </div>
                <div className="snap-start shrink-0 min-w-[21%] md:w-auto">
                  <LabMetricCard title="Samples Collected" value={stats.samplesCollected} change="+8%" icon={<TestTubes size={16} className="md:w-5 md:h-5" />} color="blue" />
                </div>
                <div className="snap-start shrink-0 min-w-[21%] md:w-auto">
                  <LabMetricCard title="In Process" value={stats.inProcess} change="-5%" icon={<Clock size={16} className="md:w-5 md:h-5" />} color="orange" />
                </div>
                <div className="snap-start shrink-0 min-w-[21%] md:w-auto">
                  <LabMetricCard title="Completed" value={stats.completed} change="+15%" icon={<FileCheck size={16} className="md:w-5 md:h-5" />} color="green" />
                </div>
                <div className="snap-start shrink-0 min-w-[21%] md:w-auto pr-4 md:pr-0">
                  <LabMetricCard title="Pending Reports" value={stats.pending} change="-30%" icon={<Beaker size={16} className="md:w-5 md:h-5" />} color="red" />
                </div>
              </div>

              {/* Main Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-2 space-y-8">

                  {/* Test Requests Table */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-gray-100 bg-white">
                      <div>
                        <h2 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                          <Activity size={14} className="text-teal-600" />
                          Test Requests Queue
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">Manage patient diagnostics, collections and digital reports</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-64 hidden sm:block">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          <input
                            type="text"
                            placeholder="Search patient, phone, test..."
                            className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:bg-white text-xs w-full transition-all font-semibold shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <button
                          onClick={() => fetchLabDashboardStats(true)}
                          className="p-1.5 hover:bg-teal-50 rounded-lg text-teal-600 hover:text-teal-700 transition-all active:scale-90 border border-teal-100"
                          title="Refresh Queue"
                        >
                          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={() => navigate('/lab/requests')} className="text-teal-600 text-xs font-bold hover:underline">View All</button>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 bg-gray-50/50">
                      <div className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory -mb-px">
                        {['All', 'In Process', 'Pending', 'Completed', 'Cancelled'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors shrink-0 snap-start ${activeTab === tab
                              ? 'text-teal-600 border-teal-600'
                              : 'text-gray-600 border-transparent hover:text-gray-900'
                              }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                      <button className="hidden sm:flex items-center gap-2 text-gray-600 text-sm font-semibold hover:text-teal-600 transition-colors">
                        <Filter size={16} /> Filters
                      </button>
                    </div>

                    {/* Table (Desktop View Only) */}
                    <div className="hidden md:block overflow-x-auto bg-white border border-gray-200/80 rounded-2xl shadow-xl shadow-teal-900/[0.02]">
                      <table className="w-full text-sm border-collapse min-w-[720px]">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/75 backdrop-blur-sm">
                            <th className="w-[8%] px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Request ID</th>
                            <th className="w-[24%] px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
                            <th className="w-[15%] px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Referred Tests</th>
                            <th className="w-[12%] px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="w-[12%] px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="w-[13%] px-3 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Requested On</th>
                            <th className="w-[16%] px-3 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/80">
                          {loading ? (
                            <tr>
                              <td colSpan="7" className="px-3 py-12 text-center text-gray-500">
                                <Beaker className="mx-auto mb-3 text-teal-500 animate-spin" size={32} />
                                <p className="font-semibold text-gray-700">Loading requests...</p>
                              </td>
                            </tr>
                          ) : paginatedQueue.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="px-3 py-12 text-center text-gray-500">
                                <FileCheck className="mx-auto mb-3 text-gray-300" size={36} />
                                <p className="font-semibold text-gray-700">No test requests found</p>
                                <p className="text-xs text-gray-400 mt-1">All samples have been processed and published!</p>
                              </td>
                            </tr>
                          ) : (
                            paginatedQueue.map((request) => {
                              const initials = request.patientName
                                ? request.patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                : 'PT';
                              return (
                                <tr key={request._id} className="hover:bg-gradient-to-r hover:from-teal-50/[0.04] hover:to-indigo-50/[0.04] transition-all duration-300 group">
                                  <td className="px-3 py-6.5 align-middle">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100/50">
                                      TRF-{request.tokenNumber || '00'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-6.5 align-middle">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-white font-extrabold text-[11px] shadow-md border-2 border-white ring-2 ring-teal-100 group-hover:scale-105 transition-transform shrink-0">
                                        {initials}
                                      </div>
                                      <div>
                                        <p className="text-gray-900 font-extrabold text-[13px] group-hover:text-teal-700 transition-colors leading-tight">{request.patientName}</p>
                                        <p className="text-[11px] text-gray-400 font-medium flex items-center gap-0.5 mt-0.5">
                                          <Smartphone size={10} className="text-gray-300 animate-pulse" />
                                          {request.patientPhone}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-6.5 align-middle">
                                    <div className="flex items-center gap-1 bg-teal-50/30 border border-teal-100/50 text-teal-800 px-2 py-1 rounded-lg w-fit shadow-sm">
                                      <Beaker size={11} className="text-teal-600" />
                                      <span className="font-bold text-[11px]">{request.requiredTest || 'Routine Diagnosis'}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-6.5 align-middle">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${request.currentStage === 'Lab-Completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      request.currentStage === 'Lab-Processing' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                                        'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}>
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${request.currentStage === 'Lab-Completed' ? 'bg-emerald-400' :
                                          request.currentStage === 'Lab-Processing' ? 'bg-sky-400' :
                                            'bg-amber-400'
                                          }`}></span>
                                        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${request.currentStage === 'Lab-Completed' ? 'bg-emerald-500' :
                                          request.currentStage === 'Lab-Processing' ? 'bg-sky-500' :
                                            'bg-amber-500'
                                          }`}></span>
                                      </span>
                                      {request.currentStage === 'Lab-Completed' ? 'Completed' :
                                        request.currentStage === 'Lab-Processing' ? 'In Process' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-6.5 align-middle">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm ${request.isEmergency ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' : 'bg-slate-50 text-slate-600 border border-gray-200'
                                      }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${request.isEmergency ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                                      {request.isEmergency ? 'Emergency' : 'Standard'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-6.5 align-middle">
                                    <div className="flex flex-col">
                                      <span className="text-gray-900 font-bold text-xs">{new Date(request.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5 mt-0.5">
                                        <Clock size={10} className="text-gray-300" />
                                        {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-6.5 align-middle text-center">
                                    {request.currentStage === 'Lab-Completed' ? (
                                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-gray-400 py-1">
                                        <FileCheck size={14} className="text-gray-400" /> Published
                                      </span>
                                    ) : (
                                      <div className="flex flex-col items-center justify-center gap-1.5 w-full max-w-[125px] mx-auto">
                                        <button
                                          className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-600 rounded-lg text-[11px] font-bold transition-all active:scale-95 shadow-sm border border-teal-200/50 hover:shadow-md"
                                          onClick={() => handleFileUpload(request.patientPhone, request._id)}
                                          title="Upload Clinical Files"
                                        >
                                          <Upload size={12} />
                                          <span>Upload Report</span>
                                        </button>
                                        <button
                                          className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-lg text-[11px] font-bold transition-all active:scale-95 shadow-sm border border-indigo-200/50 hover:shadow-md"
                                          onClick={() => handleOpenDigitalReportModal(request)}
                                          title="Enter report details digitally"
                                        >
                                          <FileCheck size={12} />
                                          <span>Fill Digital</span>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Card List View */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {loading ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <Beaker className="mx-auto mb-2 text-gray-400 animate-pulse" size={28} />
                          <p className="text-sm">Loading requests...</p>
                        </div>
                      ) : paginatedQueue.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <FileCheck className="mx-auto mb-2 text-gray-400" size={28} />
                          <p className="text-sm">No test requests found</p>
                        </div>
                      ) : (
                        paginatedQueue.map((request) => (
                          <div key={request._id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">TRF-2025-{request.tokenNumber}</span>
                                <h4 className="text-sm font-bold text-gray-900 mt-0.5">{request.patientName}</h4>
                                <span className="text-[10px] text-gray-400 font-mono">#{request._id.slice(-6).toUpperCase()}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${request.currentStage === 'Lab-Completed' ? 'bg-green-50 text-green-600' :
                                request.currentStage === 'Lab-Processing' ? 'bg-blue-50 text-blue-600' :
                                  'bg-orange-50 text-orange-600'
                                }`}>
                                {request.currentStage === 'Lab-Completed' ? 'Completed' :
                                  request.currentStage === 'Lab-Processing' ? 'In Process' : 'Pending'}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-600">
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Tests</span>
                                <span className="font-semibold text-gray-800">{request.requiredTest || 'CBC, RBS, Lipid Profile'}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Priority</span>
                                <span className={`inline-flex items-center gap-1 font-bold ${request.isEmergency ? 'text-red-500' : 'text-green-500'}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${request.isEmergency ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                  {request.isEmergency ? 'High' : 'Low'}
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                              <span className="text-[10px] text-gray-400">
                                {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {request.currentStage === 'Lab-Completed' ? (
                                <span className="text-[10px] font-bold text-gray-400">Published</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleFileUpload(request.patientPhone, request._id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-lg text-xs font-bold transition-all active:scale-95"
                                  >
                                    <Upload size={12} />
                                    <span>Upload</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveDigitalPatient(request);
                                      setShowDigitalReportModal(true);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold transition-all active:scale-95 border border-indigo-100"
                                  >
                                    <FileCheck size={12} />
                                    <span>Fill Digital</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
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
                    <div className="flex md:grid overflow-x-auto hide-scrollbar gap-4 pb-2 md:pb-0 snap-x snap-mandatory md:grid-cols-4">
                      {/* Sample Cards */}
                      {labQueue.slice(0, 4).map((patient, idx) => (
                        <div key={patient._id || idx} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-teal-300 transition-colors shrink-0 snap-start w-[240px] md:w-auto">
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
                        <div className="col-span-full py-6 text-center text-gray-500 text-sm w-full">No recent samples available</div>
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
                          <p className="font-bold text-gray-900">{stats.completed}</p>
                          <span className="text-xs font-bold text-green-600 w-10 text-right">
                            {stats.completed > 0 ? `↑ ${Math.min(100, Math.round((stats.completed / (stats.total || 1)) * 100))}%` : '0%'}
                          </span>
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
                          <p className="font-bold text-gray-900">{getAvgTurnaroundTime()}</p>
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
                          <p className="font-bold text-gray-900">{getDynamicAccuracy()}</p>
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
                          <p className="font-bold text-gray-900">{getDynamicRepeatTests()}</p>
                          <span className="text-xs font-bold text-red-600 w-10 text-right">0%</span>
                        </div>
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
                    onChange={(e) => setNewTestForm({ ...newTestForm, patientName: e.target.value })}
                    placeholder="Enter patient name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newTestForm.patientPhone}
                    onChange={(e) => setNewTestForm({ ...newTestForm, patientPhone: e.target.value })}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Test Type</label>
                  <select
                    value={newTestForm.testType}
                    onChange={(e) => setNewTestForm({ ...newTestForm, testType: e.target.value })}
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
                  onClick={() => { setShowNewTestModal(false); setNewTestForm({ patientName: '', patientPhone: '', testType: '' }); }}
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
                    onChange={(e) => setAddSampleForm({ ...addSampleForm, patientId: e.target.value })}
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
                    onChange={(e) => setAddSampleForm({ ...addSampleForm, sampleType: e.target.value })}
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
                  onClick={() => { setShowAddSampleModal(false); setAddSampleForm({ patientId: '', sampleType: '', collectionTime: '' }); }}
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                <TestTubes size={20} className="text-teal-600" />
                Lab Settings & Report Customization
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lab Name</label>
                  <input
                    type="text"
                    value={reportConfig.labName}
                    onChange={(e) => setReportConfig({ ...reportConfig, labName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Default Pathologist (Doctor Signatory)</label>
                  <input
                    type="text"
                    value={reportConfig.defaultDoctorName || ''}
                    onChange={(e) => setReportConfig({ ...reportConfig, defaultDoctorName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 text-sm font-semibold"
                    placeholder="e.g. Dr. Swasthya Mitra, MBBS, MD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Default Clinical Interpretation (Notes)</label>
                  <textarea
                    value={reportConfig.defaultNotes || ''}
                    onChange={(e) => setReportConfig({ ...reportConfig, defaultNotes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 text-sm"
                    rows={2}
                    placeholder="Default notes that will prepopulate digital reports..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Primary Theme Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={reportConfig.primaryColor}
                        onChange={(e) => setReportConfig({ ...reportConfig, primaryColor: e.target.value })}
                        className="h-10 w-12 border border-gray-300 rounded-lg cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={reportConfig.primaryColor}
                        onChange={(e) => setReportConfig({ ...reportConfig, primaryColor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">Header Size</label>
                      <input
                        type="number"
                        value={reportConfig.headerFontSize}
                        onChange={(e) => setReportConfig({ ...reportConfig, headerFontSize: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">Body Size</label>
                      <input
                        type="number"
                        value={reportConfig.bodyFontSize}
                        onChange={(e) => setReportConfig({ ...reportConfig, bodyFontSize: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-8">
                <button
                  onClick={handleSaveReportConfig}
                  className="w-full py-2.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/10 flex items-center justify-center gap-2"
                >
                  Save Settings & Defaults
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReportConfigModal(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    className="flex-1 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100 transition-colors text-xs flex items-center justify-center gap-1"
                  >
                    Generate Daily PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Digital Report Builder Modal */}
        {showDigitalReportModal && activeDigitalPatient && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 bg-teal-600 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <FileCheck size={22} />
                    Fill Digital Lab Report
                  </h3>
                  <p className="text-xs text-teal-100 mt-0.5">Digitally type test values and observations</p>
                </div>
                <button
                  onClick={() => setShowDigitalReportModal(false)}
                  className="p-1 rounded-full hover:bg-teal-700 transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                {/* Patient Summary Card */}
                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100/50 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">PATIENT NAME</span>
                    <span className="font-bold text-gray-800">{activeDigitalPatient.patientName}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-semibold block">PHONE NUMBER</span>
                    <span className="font-bold text-gray-800">{activeDigitalPatient.patientPhone}</span>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-xs text-gray-500 font-semibold block">REFERRED TESTS</span>
                    <span className="font-bold text-teal-700">{activeDigitalPatient.requiredTest || 'CBC, RBS, Urinalysis'}</span>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Report Title / Heading</label>
                    <input
                      type="text"
                      value={digitalReportForm.title}
                      onChange={(e) => setDigitalReportForm({ ...digitalReportForm, title: e.target.value })}
                      placeholder="e.g. Complete Blood Count (CBC) Report"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">
                      Test Results & Observations (Findings)
                    </label>
                    <textarea
                      value={digitalReportForm.findings}
                      onChange={(e) => setDigitalReportForm({ ...digitalReportForm, findings: e.target.value })}
                      rows={6}
                      placeholder={`Type detailed observations, values or parameters. Example:
- Hemoglobin (Hb): 14.5 g/dL (Ref: 13.0 - 17.0)
- Total WBC Count: 7,500 /cumm (Ref: 4,000 - 11,000)
- Platelet Count: 2.8 Lakhs /cumm (Ref: 1.5 - 4.5)`}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition-all text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Clinical Notes / Pathologist Interpretation</label>
                    <input
                      type="text"
                      value={digitalReportForm.notes}
                      onChange={(e) => setDigitalReportForm({ ...digitalReportForm, notes: e.target.value })}
                      placeholder="e.g. Parameters are within healthy limits."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Authorized Pathologist / Signatory</label>
                    <input
                      type="text"
                      value={digitalReportForm.doctorName}
                      onChange={(e) => setDigitalReportForm({ ...digitalReportForm, doctorName: e.target.value })}
                      placeholder="Name and Qualifications"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-4">
                <button
                  onClick={() => setShowDigitalReportModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePublishDigitalReport}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 text-sm flex items-center justify-center gap-2"
                >
                  <FileCheck size={16} />
                  <span>Publish & Sync Locker</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Multi-Image Upload Panel Modal */}
        {showUploadModal && uploadModalPatient && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in animate-duration-200">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 py-4 bg-teal-600 text-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Upload size={22} className="animate-pulse" />
                    Upload Diagnostic Reports
                  </h3>
                  <p className="text-xs text-teal-100 mt-0.5">Select multiple report photos or PDF files to publish</p>
                </div>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedUploadFiles([]);
                  }}
                  className="p-1.5 rounded-full hover:bg-teal-700 transition-colors text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                {/* Patient Summary Card */}
                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100/50 grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Patient Name</span>
                    <span className="font-extrabold text-sm text-gray-800">{uploadModalPatient.patientName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Phone / Locker Link</span>
                    <span className="font-extrabold text-sm text-gray-800">{uploadModalPatient.patientPhone}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Referred Tests</span>
                    <span className="font-extrabold text-sm text-teal-700">{uploadModalPatient.requiredTest}</span>
                  </div>
                </div>

                {/* Interactive Drag & Drop Area */}
                <div
                  className="border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/[0.04] hover:bg-teal-50/[0.12] transition-all rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center gap-2 group"
                  onClick={() => document.getElementById('modal-file-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleUploadModalFileSelect({ target: { files } });
                    }
                  }}
                >
                  <input
                    id="modal-file-input"
                    type="file"
                    multiple
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={handleUploadModalFileSelect}
                  />
                  <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                    <Upload size={22} className="group-hover:animate-bounce" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Drag & drop files here, or <span className="text-teal-600 underline">browse</span></p>
                  <p className="text-[10px] text-gray-400 font-semibold">Supports Multiple Images (PNG, JPG) or PDFs (Up to 5MB each)</p>
                </div>

                {/* Selected Files Preview Grid */}
                <div>
                  <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">
                    Selected Pages / Files ({selectedUploadFiles.length})
                  </h4>

                  {selectedUploadFiles.length === 0 ? (
                    <div className="border border-gray-150 rounded-2xl p-8 text-center text-gray-400 bg-gray-50/50">
                      <FileCheck size={28} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-semibold">No files added yet.</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Add test result photos or prescription files to preview here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedUploadFiles.map((fileItem) => (
                        <div key={fileItem.id} className="relative rounded-xl border border-gray-200/80 overflow-hidden bg-gray-50 flex flex-col items-center justify-center p-3 shadow-sm hover:shadow hover:border-teal-200 transition-all group h-32">

                          {/* Remove X Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSelectedFile(fileItem.id);
                            }}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-all active:scale-90 scale-95 z-10"
                            title="Remove file"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>

                          {/* Preview Content */}
                          {fileItem.isPdf ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-rose-500">
                              <span className="text-[9px] font-extrabold uppercase bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.5 rounded mb-1 font-mono">PDF</span>
                              <FileCheck size={24} className="text-rose-500 shrink-0" />
                            </div>
                          ) : (
                            <div className="flex-grow flex items-center justify-center overflow-hidden rounded-lg w-full h-16 bg-white border border-gray-100">
                              <img src={fileItem.previewUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                          )}

                          {/* File Details */}
                          <p className="text-[10px] font-bold text-gray-700 mt-2 truncate w-full text-center" title={fileItem.name}>
                            {fileItem.name}
                          </p>
                          <p className="text-[9px] font-medium text-gray-400">
                            {fileItem.size}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-4 shrink-0">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedUploadFiles([]);
                  }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={selectedUploadFiles.length === 0}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm flex items-center justify-center gap-2 ${selectedUploadFiles.length === 0
                    ? 'bg-gray-250 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                    }`}
                >
                  <FileCheck size={16} />
                  <span>Publish to Locker</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button (PC & Mobile) */}
        <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 z-50 flex flex-col items-end gap-3">
          <div className={`transition-all duration-300 transform origin-bottom-right ${showQuickActions ? 'scale-100 opacity-100 animate-fade-in' : 'scale-0 opacity-0 pointer-events-none'}`}>
            <div className="bg-white/95 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-gray-150 grid grid-cols-2 gap-4 mb-2 w-[calc(100vw-2rem)] max-w-sm">
              <div className="col-span-2 border-b pb-2 mb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quick Actions</span>
                <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full">Interactive Panel</span>
              </div>
              <QuickActionTile icon={<Plus size={20} />} label="New Test" color="bg-teal-50 text-teal-600 hover:bg-teal-100" onClick={() => { setShowNewTestModal(true); setShowQuickActions(false); }} />
              <QuickActionTile icon={<TestTubes size={20} />} label="Add Sample" color="bg-blue-50 text-blue-600 hover:bg-blue-100" onClick={() => { setShowAddSampleModal(true); setShowQuickActions(false); }} />
              <QuickActionTile icon={<BarChart3 size={20} />} label="PDF Customizer" color="bg-orange-50 text-orange-600 hover:bg-orange-100" onClick={() => { setReportConfig({ ...reportConfig, reportType: 'Daily' }); setShowReportConfigModal(true); setShowQuickActions(false); }} />
              <QuickActionTile icon={<Upload size={20} />} label="Upload File" color="bg-purple-50 text-purple-600 hover:bg-purple-100" onClick={() => { setShowSampleCollectionModal(true); setShowQuickActions(false); }} />
              <QuickActionTile icon={<TrendingUp size={20} />} label="Daily Summary" color="bg-emerald-50 text-emerald-600 hover:bg-emerald-100" onClick={() => { handleDailySummary(); setShowQuickActions(false); }} />
              <QuickActionTile icon={<RefreshCw size={20} />} label="Sync Stats" color="bg-indigo-50 text-indigo-600 hover:bg-indigo-100" onClick={() => { fetchLabDashboardStats(false); setShowQuickActions(false); }} />
            </div>
          </div>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="w-16 h-16 bg-teal-600 hover:bg-teal-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all z-50 border-4 border-white group"
            title="Open Quick Actions panel"
          >
            {showQuickActions ? <X size={28} className="transform rotate-0 transition-transform duration-300" /> : <Plus size={28} className="transform rotate-90 transition-transform duration-300 group-hover:rotate-180" />}
          </button>
        </div>

        <Footer />
      </div>

      <MobileNav role="lab" />
    </div>
  );
};

export default LabDashboard;