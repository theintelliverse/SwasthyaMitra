import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { SOCKET_URL, API_URL } from '../../config/runtime';
import ReportViewer from '../../components/ReportViewer';
import {
  User, FileText, Activity, History, Download, Calendar, Eye,
  ShieldCheck, TrendingUp, ArrowLeft, RefreshCcw, Smartphone, Hash,
  Droplet, Heart, Weight, Pill, Zap, Thermometer, Droplets, ArrowUpRight, Search, Database,
  Upload, X, Plus, Trash2, Loader2, FileUp, CheckCircle, AlertCircle,
  Receipt, DollarSign, Printer, ChevronLeft, ChevronRight, CheckCircle2, Beaker, Stethoscope, Clock, FileDown,
  Sunrise, Sun, Moon, Utensils, Timer, Share2, Check, Sparkles, Filter
} from 'lucide-react';
import SEO from '../../components/SEO';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  categorizePrescriptions,
  getPrescriptionSchedule,
  getDosageTimingSlots
} from '../../utils/medicationTracker';

const socket = SOCKET_URL ? io(SOCKET_URL) : { on: () => { }, off: () => { }, emit: () => { } };

const HealthLocker = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const queryTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab');
  }, [location.search]);

  const isUploadRequested = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('action') === 'upload' || Boolean(location.state?.openUpload);
  }, [location.search, location.state]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (queryTab === 'bills') return 'bills';
    if (queryTab === 'medicine' || queryTab === 'prescriptions') return 'medicine';
    if (isUploadRequested) return 'reports';
    return 'vitals';
  });
  const [selectedReportIndex, setSelectedReportIndex] = useState(null);

  // Medication / Prescription Tab State
  const [prescriptionFilter, setPrescriptionFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [prescriptionSearch, setPrescriptionSearch] = useState('');

  const prescriptionData = useMemo(() => {
    return categorizePrescriptions(data?.medicalHistory || []);
  }, [data?.medicalHistory]);

  const displayPrescriptions = useMemo(() => {
    let list = [];
    if (prescriptionFilter === 'active') {
      list = prescriptionData.activePrescriptions;
    } else if (prescriptionFilter === 'completed') {
      list = prescriptionData.completedPrescriptions;
    } else {
      list = [
        ...prescriptionData.activePrescriptions,
        ...prescriptionData.completedPrescriptions,
        ...prescriptionData.upcomingPrescriptions
      ];
    }

    if (prescriptionSearch.trim()) {
      const q = prescriptionSearch.toLowerCase().trim();
      list = list.filter(r =>
        (r.doctorName || '').toLowerCase().includes(q) ||
        (r.clinicName || '').toLowerCase().includes(q) ||
        (r.diagnosis || '').toLowerCase().includes(q) ||
        (r.medicines || []).some(m => (m.name || '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [prescriptionData, prescriptionFilter, prescriptionSearch]);

  // Billing Tab State
  const [billSearch, setBillSearch] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState('all'); // 'all' | 'clinic' | 'lab' | 'due'
  const [billPage, setBillPage] = useState(1);
  const BILL_PAGE_SIZE = 10;
  const [selectedBillInvoice, setSelectedBillInvoice] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(() => isUploadRequested);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFileType, setUploadFileType] = useState('Lab Report');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHealthData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsSyncing(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/auth/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Locker fetch error", err);
      if (err.response?.status === 401) navigate('/patient/login');
      setLoading(false);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchHealthData();
    });
    const userPhone = localStorage.getItem('userPhone')?.replace(/\D/g, '').slice(-10);
    if (userPhone) {
      socket.emit('joinClinic', userPhone);
      socket.on('queueUpdate', () => fetchHealthData(true));
    }
    return () => {
      active = false;
      socket.off('queueUpdate');
    };
  }, [fetchHealthData]);

  useEffect(() => {
    if (queryTab === 'bills') {
      setActiveTab('bills');
    } else if (queryTab === 'medicine' || queryTab === 'prescriptions') {
      setActiveTab('medicine');
    } else if (isUploadRequested) {
      Promise.resolve().then(() => {
        setShowUploadModal(true);
        setActiveTab('reports');
      });
    }
  }, [queryTab, isUploadRequested]);

  const handleDownloadInvoicePdf = (inv) => {
    try {
      const doc = new jsPDF();
      const isLab = inv.billingType === 'lab';
      const entityName = inv.clinicId?.name || inv.clinicName || 'SwasthyaMitra Healthcare';
      const entityAddress = inv.clinicId?.address || 'Digital Health Facility';
      const entityPhone = inv.clinicId?.phone || '';

      // Primary Brand Header
      doc.setFillColor(isLab ? 49 : 15, isLab ? 46 : 118, isLab ? 129 : 110);
      doc.rect(0, 0, 210, 36, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(entityName.toUpperCase(), 14, 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(entityAddress, 14, 23);
      if (entityPhone) doc.text(`Contact: ${entityPhone}`, 14, 29);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(isLab ? 'LAB DIAGNOSTIC RECEIPT' : 'CLINICAL INVOICE', 196, 16, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt #: ${inv.invoiceNumber}`, 196, 23, { align: 'right' });
      doc.text(`Date: ${new Date(inv.billingDate || inv.createdAt).toLocaleDateString('en-IN')}`, 196, 29, { align: 'right' });

      // Patient Details
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PATIENT BILLING DETAILS', 14, 46);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 48, 196, 48);

      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Patient Name: ${inv.patientName || 'N/A'}`, 14, 55);
      doc.text(`Phone Number: ${inv.patientPhone || 'N/A'}`, 14, 61);
      doc.text(`Consultant / Ref: ${inv.doctorName || 'General Practitioner'}`, 14, 67);

      doc.text(`Payment Mode: ${inv.paymentMode || 'Cash'}`, 130, 55);
      doc.text(`Payment Status: ${inv.paymentStatus || 'Paid'}`, 130, 61);

      // Line items
      const tableRows = (inv.items || []).map((item, idx) => [
        idx + 1,
        item.description || 'Medical Service',
        item.category || (isLab ? 'Lab Investigation' : 'Consultation'),
        `INR ${(item.amount || 0).toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: 74,
        head: [['#', 'Item / Service Description', 'Department', 'Amount']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: isLab ? [67, 56, 202] : [13, 148, 136],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      const finalY = doc.lastAutoTable?.finalY || 130;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(`Subtotal: INR ${(inv.subtotal || 0).toLocaleString('en-IN')}`, 130, finalY + 10);
      if (inv.discount > 0) doc.text(`Discount: - INR ${(inv.discount || 0).toLocaleString('en-IN')}`, 130, finalY + 16);
      if (inv.taxAmount > 0) doc.text(`Tax: + INR ${(inv.taxAmount || 0).toLocaleString('en-IN')}`, 130, finalY + 22);

      doc.setFontSize(11);
      doc.text(`Total Amount: INR ${(inv.totalAmount || 0).toLocaleString('en-IN')}`, 130, finalY + 28);
      doc.setTextColor(16, 185, 129);
      doc.text(`Amount Paid: INR ${(inv.paidAmount || 0).toLocaleString('en-IN')}`, 130, finalY + 34);

      if (inv.remainingDue > 0) {
        doc.setTextColor(225, 29, 72);
        doc.text(`Balance Due: INR ${(inv.remainingDue || 0).toLocaleString('en-IN')}`, 130, finalY + 40);
      }

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This is a verified digital medical receipt stored in your SwasthyaMitra Health Vault.', 14, 280);

      doc.save(`Receipt_${inv.invoiceNumber}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };

  const handleDownloadPrescriptionPdf = (record, schedule) => {
    try {
      const doc = new jsPDF();
      const clinicName = record.clinicName || 'SwasthyaMitra Healthcare';
      const doctorName = record.doctorName ? `Dr. ${record.doctorName}` : 'Consultant Specialist';
      const patientName = data?.name || 'Valued Patient';
      const dateStr = new Date(record.date || record.visitDate || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });

      // Header Banner
      doc.setFillColor(15, 118, 110);
      doc.rect(0, 0, 210, 36, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(clinicName.toUpperCase(), 14, 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${doctorName} ${record.doctorSpecialization ? `· ${record.doctorSpecialization}` : ''}`, 14, 23);
      doc.text(record.clinicAddress || 'Healthcare Consultation Center', 14, 29);

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('RX PRESCRIPTION', 196, 16, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${dateStr}`, 196, 23, { align: 'right' });
      if (schedule?.totalDays) {
        doc.text(`Course: ${schedule.totalDays} Days (${schedule.isActive ? 'Active Course' : 'Concluded'})`, 196, 29, { align: 'right' });
      }

      // Patient Details
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PATIENT RECORD', 14, 46);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Patient Name: ${patientName}`, 14, 53);
      doc.text(`Mobile: ${data?.phone || 'N/A'}`, 14, 59);
      doc.text(`Age/Gender: ${data?.age ? `${data.age} Yrs` : 'N/A'} / ${data?.gender || 'N/A'}`, 110, 53);
      doc.text(`Diagnosis: ${record.diagnosis || 'Clinical Consultation'}`, 110, 59);

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 65, 196, 65);

      // Medicines Table
      const medsList = schedule?.medicinesSchedule || record.medicines || [];
      const tableRows = medsList.map((m, idx) => [
        idx + 1,
        `${m.name || 'Medicine'} ${m.strength ? `(${m.strength})` : ''}`,
        m.whenToTake || m.time || 'As Directed',
        m.beforeAfter || 'After Meals',
        m.duration || (m.parsedDays ? `${m.parsedDays} Days` : '-'),
        m.instructions || '-'
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['#', 'Medicine Name & Strength', 'Frequency', 'Meal Relation', 'Duration', 'Instructions']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : 130;

      if (record.notes || record.symptoms) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text('DOCTOR ADVICE & INSTRUCTIONS:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`"${record.notes || record.symptoms}"`, 14, finalY + 6);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('This is a verified digital prescription from SwasthyaMitra Healthcare Portal.', 14, 280);
      doc.text(`Printed: ${new Date().toLocaleString('en-IN')}`, 196, 280, { align: 'right' });

      doc.save(`Prescription_${patientName.replace(/\s+/g, '_')}_${dateStr.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Prescription PDF error:", err);
    }
  };

  const handleSharePrescriptionWhatsApp = (record, schedule) => {
    const doctor = record.doctorName ? `Dr. ${record.doctorName}` : 'Doctor';
    const clinic = record.clinicName || 'Clinic';
    const dateStr = new Date(record.date || record.visitDate || Date.now()).toLocaleDateString('en-IN');
    
    let medsText = '';
    const medsList = schedule?.medicinesSchedule || record.medicines || [];
    medsList.forEach((m, idx) => {
      medsText += `\n${idx + 1}. *${m.name}* ${m.strength ? `(${m.strength})` : ''}\n   ⏰ Timing: ${m.whenToTake || m.time || 'Daily'} | 🍽️ ${m.beforeAfter || 'After Meals'} | ⏱️ ${m.duration || `${m.parsedDays || 3} Days`}`;
      if (m.instructions) medsText += `\n   📝 _${m.instructions}_`;
    });

    const statusBadge = schedule?.isActive
      ? `🟢 Active Course (Day ${schedule.currentDay} of ${schedule.totalDays})`
      : `✓ Course Concluded (${schedule.totalDays} Days)`;

    const msg = `*Prescription from ${doctor}*\n🏥 *${clinic}*\n📅 Date: ${dateStr}\n📋 Diagnosis: ${record.diagnosis || 'Clinical Consultation'}\nStatus: ${statusBadge}\n\n*Prescribed Medications:*${medsText}\n\n_View digital records on SwasthyaMitra Portal_`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('title', uploadTitle.trim() || selectedFile.name);
      formData.append('fileType', uploadFileType);

      await axios.post(`${API_URL}/api/auth/patient/upload-document`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setUploadSuccess(true);
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploadTitle('');
        setUploadSuccess(false);
        fetchHealthData(true);
      }, 1200);
    } catch (err) {
      console.error("Upload error", err);
      setUploadError(err.response?.data?.message || "Failed to upload document. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!docId) return;
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    setDeletingId(docId);
    try {
      const token = localStorage.getItem('token');
      const userPhone = localStorage.getItem('userPhone') || data?.phone;
      await axios.post(`${API_URL}/api/auth/patient/remove-document/${docId}`, { phone: userPhone }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchHealthData(true);
    } catch (err) {
      console.error("Delete document error", err);
      alert(err.response?.data?.message || "Failed to delete document.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <RefreshCcw size={40} className="text-teal-600 animate-spin" />
      <p className="font-bold text-slate-900 text-lg tracking-tight">Unlocking Digital Vault...</p>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-10">
      <Database size={48} className="text-slate-200 mb-6" />
      <p className="text-xl font-bold text-slate-900 tracking-tight mb-6">No records found for this account.</p>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-teal-600/20">Go Back</button>
    </div>
  );

  const latestVitals = data.vitals?.[0];

  return (
    <div className="px-3 py-3 md:p-4 lg:p-6 max-w-7xl mx-auto w-full">
      <SEO title="Health Locker" noindex={true} />
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold uppercase tracking-wider border border-teal-100">
                Health Locker
              </span>
              {isSyncing && <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></div>}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              Medical Vault <span className="text-teal-600">.</span>
            </h1>
            <p className="text-slate-400 font-medium text-xs mt-0.5 hidden sm:block">Authenticated clinical records &amp; wellness logs.</p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 active:scale-95 transition-all"
            >
              <Upload size={14} /> Upload Report
            </button>
            <button
              onClick={() => fetchHealthData(true)}
              className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm active:scale-95"
              title="Refresh"
            >
              <RefreshCcw size={14} className={isSyncing ? 'animate-spin text-teal-500' : ''} />
            </button>
          </div>
        </header>

        {/* --- Identity Summary Card --- */}
        <div className="bg-slate-900 rounded-2xl p-4 mb-4 relative overflow-hidden text-white shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldCheck size={80} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-teal-600/30">
              {data.name?.charAt(0) || 'P'}
            </div>

            <div className="text-center md:text-left flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-300 mb-0.5">Verified Identity</p>
              <h2 className="text-xl font-bold tracking-tight mb-2">{data.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs">
                  <Smartphone size={13} className="text-teal-400" /> {data.phone}
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs">
                  <Hash size={13} className="text-teal-400" /> {data.medicalHistory?.length || 0} Consultations
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 font-medium text-xs">
                  <FileText size={13} className="text-teal-400" /> {data.documents?.length || 0} Reports
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-1.5 rounded-2xl shadow-sm mb-4 md:mb-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2">
            <TabBtn 
              active={activeTab === 'vitals'} 
              onClick={() => setActiveTab('vitals')} 
              icon={<Heart size={15} />} 
              label="Vitals" 
            />
            <TabBtn 
              active={activeTab === 'medicine'} 
              onClick={() => setActiveTab('medicine')} 
              icon={<Pill size={15} />} 
              label="Prescriptions" 
              count={prescriptionData.activeCount > 0 ? `${prescriptionData.activeCount} Active` : (prescriptionData.totalCount || undefined)}
            />
            <TabBtn 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')} 
              icon={<FileText size={15} />} 
              label="Records" 
              count={data.documents?.length || 0}
            />
            <TabBtn 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')} 
              icon={<History size={15} />} 
              label="Timeline" 
            />
            <TabBtn 
              active={activeTab === 'bills'} 
              onClick={() => setActiveTab('bills')} 
              icon={<Receipt size={15} />} 
              label="Bills & Receipts" 
              count={data.invoices?.length || 0}
            />
          </div>
        </div>

        {/* --- Dynamic Content --- */}
        <div className="animate-in fade-in duration-500">
          {activeTab === 'vitals' && (
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <VitalCard icon={<Droplets size={12} />} label="BP" val={latestVitals?.bloodPressure || '--'} unit="mmHg" color="rose" />
                <VitalCard icon={<Zap size={12} />} label="Pulse" val={latestVitals?.pulseRate || '--'} unit="bpm" color="teal" />
                <VitalCard icon={<Weight size={12} />} label="Weight" val={latestVitals?.weight || '--'} unit="kg" color="blue" />
                <VitalCard icon={<TrendingUp size={12} />} label="BMI" val={latestVitals?.bmi ? latestVitals.bmi.toFixed(1) : '--'} unit="Score" color="indigo" />
              </div>

              <div className="bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm overflow-hidden">
                <div className="p-3 md:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-sm md:text-base text-slate-900 tracking-tight">Vitals Historical Logs</h3>
                  <div className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 shadow-sm"><Activity size={13} /></div>
                </div>
                <div className="p-3 md:p-4">
                  {data.vitals?.length > 0 ? (
                    <>
                      {/* Desktop View Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-2">
                          <thead>
                            <tr className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              <th className="px-3 py-2">Captured Date</th>
                              <th className="px-3 py-2">Blood Pressure</th>
                              <th className="px-3 py-2">Pulse Rate</th>
                              <th className="px-3 py-2">Temperature</th>
                              <th className="px-3 py-2 text-right">Weight / BMI</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.vitals.map((vital, i) => (
                              <tr key={i} className="group hover:scale-[1.002] transition-all duration-300">
                                <td className="px-3 py-3 bg-slate-50/50 rounded-l-xl border-y border-l border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                  <span className="text-sm font-semibold text-slate-900">{new Date(vital.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </td>
                                <td className="px-3 py-3 bg-slate-50/50 border-y border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                  <span className="text-sm font-medium text-slate-700">{vital.bloodPressure || '--'}</span>
                                </td>
                                <td className="px-3 py-3 bg-slate-50/50 border-y border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                  <span className="text-sm font-medium text-slate-700">{vital.pulseRate || '--'} bpm</span>
                                </td>
                                <td className="px-3 py-3 bg-slate-50/50 border-y border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                  <span className="text-sm font-medium text-slate-700">{vital.temperature || '--'} °C</span>
                                </td>
                                <td className="px-3 py-3 bg-slate-50/50 rounded-r-xl border-y border-r border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30 text-right">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-teal-600">{vital.weight ? `${vital.weight} kg` : '--'}</span>
                                    <span className="text-xs font-semibold text-slate-400 uppercase">BMI: {vital.bmi ? vital.bmi.toFixed(1) : '--'}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile View Stacked List */}
                      <div className="block md:hidden space-y-3">
                        {data.vitals.map((vital, i) => (
                          <div key={i} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="text-sm font-semibold text-slate-950">
                                {new Date(vital.recordedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-xs font-semibold text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                BMI: {vital.bmi ? vital.bmi.toFixed(1) : '--'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-white p-2 rounded-lg border border-slate-100/30">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">BP</p>
                                <p className="text-sm font-semibold text-slate-800 mt-0.5">{vital.bloodPressure || '--'}</p>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-100/30">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pulse</p>
                                <p className="text-sm font-semibold text-slate-800 mt-0.5">{vital.pulseRate ? `${vital.pulseRate} bpm` : '--'}</p>
                              </div>
                              <div className="bg-white p-2 rounded-lg border border-slate-100/30">
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Weight</p>
                                <p className="text-sm font-semibold text-slate-800 mt-0.5">{vital.weight ? `${vital.weight} kg` : '--'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <EmptyState message="No vitals records found." />}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medicine' && (
            <div className="space-y-4 md:space-y-6">
              {/* Prescriptions Header & Course Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight flex items-center gap-2">
                    <Pill className="text-teal-600" size={18} />
                    <span>Prescriptions &amp; Daily Medication Courses</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    Live day-wise course progress. Active medications expire automatically once their duration ends.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={prescriptionSearch}
                      onChange={(e) => setPrescriptionSearch(e.target.value)}
                      placeholder="Search medicine or doctor..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-teal-500 focus:bg-white transition-all"
                    />
                    {prescriptionSearch && (
                      <button
                        onClick={() => setPrescriptionSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setPrescriptionFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    prescriptionFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>All Prescriptions</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${prescriptionFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {prescriptionData.totalCount}
                  </span>
                </button>

                <button
                  onClick={() => setPrescriptionFilter('active')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    prescriptionFilter === 'active'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>🟢 Active Courses Today</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${prescriptionFilter === 'active' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                    {prescriptionData.activeCount}
                  </span>
                </button>

                <button
                  onClick={() => setPrescriptionFilter('completed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    prescriptionFilter === 'completed'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Check size={13} className={prescriptionFilter === 'completed' ? 'text-teal-300' : 'text-slate-400'} />
                  <span>📁 Completed / Expired History</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${prescriptionFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {prescriptionData.completedCount}
                  </span>
                </button>
              </div>

              {/* Prescription Cards List */}
              {displayPrescriptions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                  {displayPrescriptions.map((record, i) => {
                    const schedule = record.schedule || getPrescriptionSchedule(record);
                    const isActive = schedule.isActive;

                    return (
                      <div
                        key={record.uniqueKey || i}
                        className={`rounded-2xl transition-all flex flex-col justify-between overflow-hidden ${
                          isActive
                            ? 'bg-white border-2 border-teal-500/40 shadow-md hover:border-teal-500 hover:shadow-xl'
                            : 'bg-white/90 border border-slate-200/90 shadow-sm opacity-95 hover:opacity-100'
                        }`}
                      >
                        {/* Top Course Status Ribbon */}
                        <div
                          className={`px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b ${
                            isActive
                              ? 'bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50/50 border-teal-100'
                              : 'bg-slate-100/70 border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {isActive ? (
                              <>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold tracking-wide shadow-xs">
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                  <span>Active · Day {schedule.currentDay} of {schedule.totalDays}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 text-teal-800 border border-teal-200 rounded-full text-xs font-semibold">
                                  <Timer size={12} className="text-teal-600" />
                                  <span>{schedule.remainingDays} Day{schedule.remainingDays > 1 ? 's' : ''} Remaining</span>
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold tracking-wide">
                                  <Check size={12} className="text-emerald-600 stroke-[3]" />
                                  <span>Course Concluded ({schedule.totalDays} Days Completed)</span>
                                </span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  Ended on {new Date(schedule.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
                            <Calendar size={13} className="text-teal-600" />
                            <span>{new Date(record.date || record.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-4 sm:p-5 space-y-4 flex-grow">
                          {/* Doctor & Clinic Details */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Prescribing Physician</p>
                              <h4 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                                Dr. {record.doctorName}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium">
                                {record.clinicName} {record.clinicAddress ? `· ${record.clinicAddress}` : ''}
                              </p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center shrink-0 shadow-2xs">
                              <Stethoscope size={18} />
                            </div>
                          </div>

                          {/* Dynamic Course Day Progress Bar (Only for active courses) */}
                          {isActive && (
                            <div className="p-3.5 bg-gradient-to-r from-teal-50/70 to-emerald-50/70 rounded-xl border border-teal-100/80 space-y-2">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-teal-900 flex items-center gap-1.5">
                                  <Sparkles size={13} className="text-teal-600" />
                                  Course Progress: {schedule.progressPercent}%
                                </span>
                                <span className="font-semibold text-teal-800">
                                  Day {schedule.currentDay} of {schedule.totalDays} Days
                                </span>
                              </div>
                              <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-teal-200/50 shadow-inner">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-700 shadow-sm"
                                  style={{ width: `${Math.max(5, schedule.progressPercent)}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5">
                                <span>Started: {new Date(schedule.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                <span>Ends: {new Date(schedule.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                              </div>
                            </div>
                          )}

                          {/* Prescribed Medicines Course List */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Pill size={14} className="text-teal-600" />
                                <span>Prescribed Medicines ({record.medicines?.length || 0})</span>
                              </p>
                              {isActive && (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  Take Doses Today
                                </span>
                              )}
                            </div>

                            <div className="space-y-2">
                              {(schedule.medicinesSchedule || record.medicines || []).map((med, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-teal-200 transition-all space-y-2"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-teal-100/70 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                                        {mIdx + 1}
                                      </div>
                                      <div>
                                        <h5 className="font-bold text-slate-900 text-sm">
                                          {med.name}
                                          {med.strength && (
                                            <span className="ml-1.5 font-semibold text-teal-700 text-xs bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                              {med.strength}
                                            </span>
                                          )}
                                        </h5>
                                      </div>
                                    </div>

                                    {/* Per Medicine Day Badge */}
                                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                                      {med.isSos ? (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                          SOS / As Needed
                                        </span>
                                      ) : med.isCompleted ? (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                                          ✓ Course Done
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                          Day {med.currentDay} of {med.parsedDays || schedule.totalDays}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Timing Slots & Meal Instruction Chips */}
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    {/* Timing slots */}
                                    {(med.timingSlots || getDosageTimingSlots(med.whenToTake, med.time)).map((slot, sIdx) => (
                                      <span
                                        key={sIdx}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.8 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs"
                                      >
                                        {slot.id === 'morning' ? (
                                          <Sunrise size={12} className="text-amber-500" />
                                        ) : slot.id === 'afternoon' ? (
                                          <Sun size={12} className="text-orange-500" />
                                        ) : slot.id === 'night' ? (
                                          <Moon size={12} className="text-indigo-500" />
                                        ) : (
                                          <Clock size={12} className="text-teal-600" />
                                        )}
                                        <span>{slot.label}</span>
                                        {slot.timeSlot && <span className="text-slate-400 font-normal">({slot.timeSlot})</span>}
                                      </span>
                                    ))}

                                    {/* Food relation */}
                                    {med.beforeAfter && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.8 bg-teal-50 border border-teal-100 text-teal-800 rounded-lg">
                                        <Utensils size={11} className="text-teal-600" />
                                        <span>{med.beforeAfter}</span>
                                      </span>
                                    )}

                                    {/* Duration Tag */}
                                    {med.duration && (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.8 bg-slate-100 text-slate-600 rounded-lg">
                                        <Timer size={11} />
                                        <span>{med.duration}</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Medicine instructions note */}
                                  {med.instructions && (
                                    <p className="text-xs text-slate-600 italic font-medium bg-white/80 p-2 rounded-lg border border-slate-100">
                                      "{med.instructions}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Diagnosis & Instructions */}
                          <div className="space-y-2 pt-1">
                            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                              <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-0.5">Clinical Diagnosis</p>
                              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                                {record.diagnosis || 'Clinical Consultation'}
                              </p>
                            </div>

                            {record.notes && (
                              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Doctor's Clinical Notes</p>
                                <p className="text-xs font-medium text-slate-700 italic leading-relaxed">
                                  "{record.notes}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="p-3 sm:px-5 sm:py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadPrescriptionPdf(record, schedule)}
                            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                          >
                            <FileDown size={14} />
                            <span>Download PDF Slip</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSharePrescriptionWhatsApp(record, schedule)}
                            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95"
                            title="Share on WhatsApp"
                          >
                            <Share2 size={14} />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-teal-50 border border-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Pill size={24} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 tracking-tight">
                    {prescriptionFilter === 'active'
                      ? 'No Active Medication Courses Today'
                      : prescriptionFilter === 'completed'
                      ? 'No Completed Prescriptions Archived'
                      : 'No Prescriptions Found'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {prescriptionFilter === 'active'
                      ? "All your prescribed medicine courses have reached their full duration and ended. If you need a renewal, please consult your doctor."
                      : prescriptionFilter === 'completed'
                      ? "Prescriptions whose duration has ended will automatically move into this archive."
                      : "When your doctor prescribes day-wise medication during clinic visits, it will be monitored here automatically."}
                  </p>
                  {prescriptionFilter === 'active' && prescriptionData.completedCount > 0 && (
                    <button
                      onClick={() => setPrescriptionFilter('completed')}
                      className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-all inline-flex items-center gap-1.5"
                    >
                      <span>View Past Completed History ({prescriptionData.completedCount})</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4 md:space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">Lab Reports &amp; Scans</h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">Store &amp; view all your medical files securely</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="self-start sm:self-auto shrink-0 whitespace-nowrap px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all active:scale-95"
                >
                  <Plus size={15} /> Add Document
                </button>
              </div>

              {data.documents?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {data.documents.map((doc, i) => (
                    <div key={i} className="bg-white border border-slate-100 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm hover:border-teal-500/50 hover:shadow-lg transition-all group flex flex-col relative">
                      <div className="flex justify-between items-start mb-3 md:mb-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-teal-50 rounded-lg md:rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                          <FileText size={14} className="md:hidden" />
                          <FileText size={18} className="hidden md:block" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                            {doc.fileType || 'Report'}
                          </span>
                          {doc._id && (
                            <button
                              onClick={() => handleDeleteDoc(doc._id)}
                              disabled={deletingId === doc._id}
                              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete document"
                            >
                              {deletingId === doc._id ? <Loader2 size={13} className="animate-spin text-rose-600" /> : <Trash2 size={13} />}
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm md:text-base font-bold text-slate-900 tracking-tight mb-0.5 md:mb-1 group-hover:text-teal-600 transition-colors line-clamp-1">{doc.title}</h4>
                      <p className="text-xs font-medium text-slate-400 mb-3 md:mb-4">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Uploaded'}
                      </p>

                      {doc.fileUrl && (
                        <div className="mb-3 md:mb-4 rounded-xl overflow-hidden border border-slate-100 h-24 md:h-32 bg-slate-50 flex items-center justify-center relative group/img">
                          <img
                            src={doc.fileUrl}
                            alt={doc.title}
                            className="w-full h-full object-cover opacity-60 group-hover/img:opacity-100 transition-opacity"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={18} className="text-white" />
                          </div>
                        </div>
                      )}

                      <div className="mt-auto flex gap-2">
                        <button
                          onClick={() => setSelectedReportIndex(i)}
                          className="flex-1 py-2 md:py-2.5 bg-slate-900 text-white rounded-lg md:rounded-xl font-semibold text-xs hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Eye size={11} /> Open
                        </button>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 md:p-2.5 bg-teal-50 text-teal-600 rounded-lg md:rounded-xl border border-teal-100 hover:bg-teal-600 hover:text-white transition-all active:scale-95"
                          title="Download / Open Fullscreen"
                        >
                          <Download size={11} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="No clinical reports found."
                  onAction={() => setShowUploadModal(true)}
                  actionLabel="Upload First Report"
                />
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 md:space-y-5">
              {data.medicalHistory?.length > 0 ? (
                <div className="relative space-y-4 md:space-y-5">
                  <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-100 hidden md:block" />
                  {data.medicalHistory.map((record, i) => (
                    <div key={i} className="group relative flex gap-3 md:gap-5 items-start">
                      <div className="hidden md:flex flex-col items-center">
                        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex flex-col items-center justify-center shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                          <span className="text-xs font-semibold uppercase opacity-60">{new Date(record.date || record.visitDate).toLocaleDateString('en-IN', { month: 'short' })}</span>
                          <span className="text-lg font-bold leading-none">{new Date(record.date || record.visitDate).getDate()}</span>
                        </div>
                      </div>

                      <div className="flex-grow bg-white p-3 md:p-5 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-teal-100 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-2.5 md:mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs font-semibold uppercase tracking-wider border border-teal-100">Consultation Session</span>
                              <span className="md:hidden px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-xs font-medium">
                                {new Date(record.date || record.visitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            </div>
                            <h4 className="text-sm md:text-base font-bold text-slate-900 tracking-tight">Dr. {record.doctorName}</h4>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">{record.clinicName}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg border border-teal-100">
                            <Activity size={11} />
                            <span className="text-xs font-semibold uppercase tracking-wider">Verified</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                          <div className="p-2.5 md:p-3 bg-slate-50/50 rounded-lg md:rounded-xl border border-slate-100">
                            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">Diagnostic Analysis</p>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed">{record.diagnosis || 'General follow-up consultation'}</p>
                          </div>
                          <div className="p-2.5 md:p-3 bg-slate-50/50 rounded-lg md:rounded-xl border border-slate-100">
                            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider mb-1">Reported Symptoms</p>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{record.symptoms || 'None reported'}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <EmptyState message="No consultation history found." />}
            </div>
          )}

          {activeTab === 'bills' && (
            <div className="space-y-4 md:space-y-5">
              {(() => {
                const allInvoices = data.invoices || [];
                const totalBilled = allInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
                const totalPaid = allInvoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
                const totalDue = allInvoices.reduce((acc, i) => acc + (i.remainingDue || 0), 0);

                const filteredInvoices = allInvoices.filter(inv => {
                  const matchesSearch = !billSearch ||
                    inv.invoiceNumber?.toLowerCase().includes(billSearch.toLowerCase()) ||
                    inv.doctorName?.toLowerCase().includes(billSearch.toLowerCase()) ||
                    inv.clinicName?.toLowerCase().includes(billSearch.toLowerCase()) ||
                    (inv.clinicId?.name && inv.clinicId.name.toLowerCase().includes(billSearch.toLowerCase())) ||
                    (inv.items || []).some(it => it.description?.toLowerCase().includes(billSearch.toLowerCase()));

                  if (!matchesSearch) return false;
                  if (billTypeFilter === 'clinic' && inv.billingType !== 'clinic') return false;
                  if (billTypeFilter === 'lab' && inv.billingType !== 'lab') return false;
                  if (billTypeFilter === 'due' && (inv.remainingDue || 0) <= 0) return false;
                  return true;
                });

                const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / BILL_PAGE_SIZE));
                const paginatedInvoices = filteredInvoices.slice((billPage - 1) * BILL_PAGE_SIZE, billPage * BILL_PAGE_SIZE);

                return (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                      <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          <Receipt size={12} className="text-teal-600" /> Total Invoices
                        </span>
                        <div className="text-lg md:text-xl font-bold text-slate-900">{allInvoices.length}</div>
                        <p className="text-[10px] text-slate-400">All medical receipts</p>
                      </div>

                      <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          <DollarSign size={12} className="text-slate-600" /> Total Billed
                        </span>
                        <div className="text-lg md:text-xl font-bold text-slate-900">₹{totalBilled.toLocaleString('en-IN')}</div>
                        <p className="text-[10px] text-slate-400">Consultations &amp; tests</p>
                      </div>

                      <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={12} /> Total Paid
                        </span>
                        <div className="text-lg md:text-xl font-bold text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</div>
                        <p className="text-[10px] text-emerald-600/70 font-semibold">Cleared payments</p>
                      </div>

                      <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm space-y-1">
                        <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider flex items-center gap-1">
                          <AlertCircle size={12} /> Balance Due
                        </span>
                        <div className="text-lg md:text-xl font-bold text-rose-600">₹{totalDue.toLocaleString('en-IN')}</div>
                        <p className="text-[10px] text-rose-500/70 font-semibold">Outstanding balance</p>
                      </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => { setBillTypeFilter('all'); setBillPage(1); }}
                          className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                            billTypeFilter === 'all'
                              ? 'bg-white text-slate-900 shadow-xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All ({allInvoices.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => { setBillTypeFilter('clinic'); setBillPage(1); }}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                            billTypeFilter === 'clinic'
                              ? 'bg-teal-700 text-white shadow-xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Stethoscope size={12} /> Clinic
                        </button>
                        <button
                          type="button"
                          onClick={() => { setBillTypeFilter('lab'); setBillPage(1); }}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                            billTypeFilter === 'lab'
                              ? 'bg-indigo-600 text-white shadow-xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Beaker size={12} /> Lab
                        </button>
                        <button
                          type="button"
                          onClick={() => { setBillTypeFilter('due'); setBillPage(1); }}
                          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 whitespace-nowrap ${
                            billTypeFilter === 'due'
                              ? 'bg-rose-600 text-white shadow-xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <AlertCircle size={12} /> Pending Dues
                        </button>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                        <input
                          type="text"
                          placeholder="Search receipt #, doctor, clinic..."
                          value={billSearch}
                          onChange={(e) => { setBillSearch(e.target.value); setBillPage(1); }}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Bills List */}
                    {filteredInvoices.length === 0 ? (
                      <EmptyState message="No medical bills or invoices found matching your search." />
                    ) : (
                      <div className="space-y-3">
                        {paginatedInvoices.map((inv) => {
                          const isLab = inv.billingType === 'lab';
                          const clinicTitle = inv.clinicId?.name || inv.clinicName || 'Clinic Facility';
                          const billDate = new Date(inv.billingDate || inv.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          });

                          return (
                            <div
                              key={inv._id || inv.invoiceNumber}
                              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-teal-200 hover:shadow-md transition-all space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 border-b border-slate-100">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                      #{inv.invoiceNumber}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                      isLab
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                        : 'bg-teal-50 text-teal-700 border border-teal-100'
                                    }`}>
                                      {isLab ? <Beaker size={10} /> : <Stethoscope size={10} />}
                                      {isLab ? 'Lab Diagnostic' : 'Clinic Consultation'}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      inv.paymentStatus === 'Paid'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : inv.paymentStatus === 'Partially Paid'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                      {inv.paymentStatus || 'Paid'}
                                    </span>
                                  </div>
                                  <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                    {clinicTitle}
                                  </h4>
                                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                                    <span>👨‍⚕️ Dr. {inv.doctorName || 'Consultant Specialist'}</span>
                                    <span>·</span>
                                    <span>📅 {billDate}</span>
                                  </p>
                                </div>

                                <div className="text-left sm:text-right space-y-0.5">
                                  <div className="text-lg font-black text-slate-900">
                                    ₹{(inv.totalAmount || 0).toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-xs text-slate-500 flex sm:justify-end items-center gap-2 font-medium">
                                    <span className="text-emerald-700 font-bold">Paid: ₹{(inv.paidAmount || 0).toLocaleString('en-IN')}</span>
                                    {inv.remainingDue > 0 && (
                                      <span className="text-rose-600 font-bold">Due: ₹{inv.remainingDue.toLocaleString('en-IN')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Items Breakdown Preview */}
                              <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Billed Services &amp; Tests
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(inv.items || []).map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium"
                                    >
                                      <span>{item.description}</span>
                                      <strong className="text-slate-900 font-bold">₹{item.amount}</strong>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <span className="text-[11px] text-slate-400 font-medium">
                                  Mode: <strong className="text-slate-600">{inv.paymentMode || 'Cash'}</strong>
                                </span>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBillInvoice(inv);
                                      setShowBillModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-teal-100"
                                  >
                                    <Eye size={13} /> View Receipt
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadInvoicePdf(inv)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-slate-200"
                                    title="Download Digital PDF Receipt"
                                  >
                                    <Download size={13} className="text-teal-700" />
                                    <span>Download PDF</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* 10-per-page Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                          <span className="text-slate-500 font-medium">
                            Showing <strong className="text-slate-800">{filteredInvoices.length > 0 ? (billPage - 1) * BILL_PAGE_SIZE + 1 : 0}</strong> to <strong className="text-slate-800">{Math.min(billPage * BILL_PAGE_SIZE, filteredInvoices.length)}</strong> of <strong className="text-slate-800">{filteredInvoices.length}</strong> records
                          </span>

                          {totalPages > 1 && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setBillPage(p => Math.max(1, p - 1))}
                                disabled={billPage === 1}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center gap-1"
                              >
                                <ChevronLeft size={14} /> Prev
                              </button>

                              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                                let pageNum = idx + 1;
                                if (totalPages > 5 && billPage > 3) {
                                  pageNum = billPage - 3 + idx;
                                  if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                                }
                                return (
                                  <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setBillPage(pageNum)}
                                    className={`w-8 h-8 rounded-xl font-black text-xs transition-all ${
                                      billPage === pageNum
                                        ? 'bg-teal-700 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}

                              <button
                                type="button"
                                onClick={() => setBillPage(p => Math.min(totalPages, p + 1))}
                                disabled={billPage === totalPages}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center gap-1"
                              >
                                Next <ChevronRight size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

      {/* --- Upload Document Modal --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileUp className="text-teal-400" size={20} />
                <h3 className="font-bold text-base tracking-tight">Upload Health Document</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="p-5 space-y-4 overflow-y-auto">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>Document uploaded successfully!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Blood Test, Chest X-Ray, Prescription"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Document Category</label>
                <select
                  value={uploadFileType}
                  onChange={(e) => setUploadFileType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                >
                  <option value="Lab Report">Lab Report</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Imaging / X-Ray">Imaging / X-Ray</option>
                  <option value="Scan Report">Scan Report</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Select File (PDF or Image)</label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${selectedFile ? 'border-teal-500 bg-teal-50/30' : 'border-slate-200 hover:border-teal-400 bg-slate-50/50'}`}
                  onClick={() => document.getElementById('locker-file-input').click()}
                >
                  <input
                    id="locker-file-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0]);
                        if (!uploadTitle) setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                      }
                    }}
                  />
                  {selectedFile ? (
                    <div className="space-y-1">
                      <FileText size={32} className="mx-auto text-teal-600" />
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{selectedFile.name}</p>
                      <p className="text-xs font-medium text-teal-600">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                        className="text-xs text-rose-600 font-semibold hover:underline pt-1 inline-block"
                      >
                        Choose different file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload size={32} className="mx-auto text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">Click to browse or drag & drop</p>
                      <p className="text-xs text-slate-400 font-normal">Supports PNG, JPG, JPEG, PDF (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} /> Upload Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Digital Receipt Modal --- */}
      {showBillModal && selectedBillInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                {selectedBillInvoice.billingType === 'lab' ? (
                  <><Beaker size={16} className="text-indigo-400" /> Lab Diagnostic Receipt</>
                ) : (
                  <><Receipt size={16} className="text-teal-400" /> Clinical Consultation Receipt</>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Receipt Printable Card Body */}
            <div id="patient-print-receipt" className="p-6 space-y-4 text-xs">
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-lg font-black text-slate-900">
                  {selectedBillInvoice.clinicId?.name || selectedBillInvoice.clinicName || 'SwasthyaMitra Healthcare Facility'}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {selectedBillInvoice.clinicId?.address || 'Digital Healthcare Partner Network'}
                </p>
                {selectedBillInvoice.clinicId?.phone && (
                  <p className="text-[10px] text-slate-400">Tel: {selectedBillInvoice.clinicId.phone}</p>
                )}
                <div className="inline-block mt-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                  Verified Payment Receipt
                </div>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Invoice Number</span>
                  <span className="font-bold text-slate-900">{selectedBillInvoice.invoiceNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Billing Date</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedBillInvoice.billingDate || selectedBillInvoice.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient Name</span>
                  <span className="font-bold text-slate-900">{selectedBillInvoice.patientName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Phone</span>
                  <span className="font-bold text-slate-900">{selectedBillInvoice.patientPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Consultant / Ref</span>
                  <span className="font-bold text-slate-900">{selectedBillInvoice.doctorName || 'General Staff'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Payment Mode</span>
                  <span className="font-bold text-slate-900">{selectedBillInvoice.paymentMode || 'Cash'}</span>
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Service / Test</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(selectedBillInvoice.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{it.description}</td>
                        <td className="p-2.5 text-slate-500 text-[11px]">{it.category || 'Clinical Care'}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">₹{(it.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal</span>
                  <span>₹{(selectedBillInvoice.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedBillInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount</span>
                    <span>- ₹{(selectedBillInvoice.discount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedBillInvoice.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Applicable Tax</span>
                    <span>+ ₹{(selectedBillInvoice.taxAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span>₹{(selectedBillInvoice.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold text-xs pt-0.5">
                  <span>Amount Paid</span>
                  <span>₹{(selectedBillInvoice.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedBillInvoice.remainingDue > 0 && (
                  <div className="flex justify-between text-rose-600 font-black text-xs pt-0.5">
                    <span>Remaining Balance</span>
                    <span>₹{(selectedBillInvoice.remainingDue || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400">
                This is a secure electronic receipt from SwasthyaMitra Health Vault.
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => handleDownloadInvoicePdf(selectedBillInvoice)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Viewer Overlay */}
      {selectedReportIndex !== null && (
        <ReportViewer
          documents={data.documents}
          initialIndex={selectedReportIndex}
          onClose={() => setSelectedReportIndex(null)}
        />
      )}
    </div>
  );
};

// UI Components
const TabBtn = ({ active, onClick, icon, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl transition-all duration-200 text-center select-none active:scale-95 ${
      active
        ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/25 ring-1 ring-teal-500'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
    }`}
  >
    <span className={`shrink-0 transition-transform ${active ? 'scale-105 text-white' : 'text-slate-400'}`}>
      {icon}
    </span>
    <span className="text-[10px] xs:text-[11px] sm:text-xs md:text-sm font-semibold tracking-tight leading-tight flex items-center justify-center gap-1 truncate max-w-full">
      <span>{label}</span>
      {typeof count === 'number' && count > 0 && (
        <span
          className={`px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold leading-none ${
            active
              ? 'bg-white/25 text-white border border-white/30'
              : 'bg-teal-50 text-teal-700 border border-teal-100'
          }`}
        >
          {count}
        </span>
      )}
    </span>
  </button>
);

const VitalCard = ({ icon, label, val, unit, color }) => {
  const colors = {
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl border ${colors[color]} shadow-sm transition-all hover:scale-[1.03] duration-300`}>
      <div className="flex items-center gap-1.5 mb-1.5 md:mb-2">
        <div className={`p-1.5 rounded-md md:rounded-lg bg-white/50 shadow-sm`}>{icon}</div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-lg md:text-xl font-bold tracking-tight">{val}</span>
        <span className="text-xs font-semibold opacity-60 uppercase">{unit}</span>
      </div>
    </div>
  );
};

const EmptyState = ({ message, onAction, actionLabel }) => (
  <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm">
    <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
      <Database size={28} className="text-slate-200" />
    </div>
    <p className="text-sm font-semibold text-slate-900 tracking-tight mb-1">{message}</p>
    <p className="text-xs text-slate-400 mb-4">No active records in this section</p>
    {onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 active:scale-95 transition-all"
      >
        {actionLabel || 'Action'}
      </button>
    )}
  </div>
);

export default HealthLocker;