import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  User, Phone, Search, RefreshCw, Receipt, Plus, Trash2, Printer, CheckCircle2,
  ShieldCheck, CreditCard, DollarSign, Sparkles, FileText, AlertTriangle,
  Beaker, Check, Clock, Eye, ChevronRight, X, TrendingUp, CalendarCheck, Settings,
  FlaskConical, ArrowLeft
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PRESET_LAB_TESTS = [
  { description: 'Complete Blood Count (CBC)', amount: 350, category: 'Diagnostic Test' },
  { description: 'Lipid Profile (Cholesterol & Triglycerides)', amount: 650, category: 'Diagnostic Test' },
  { description: 'Thyroid Profile (T3, T4, TSH)', amount: 550, category: 'Diagnostic Test' },
  { description: 'Diabetes Screen (HbA1c & Fasting Glucose)', amount: 450, category: 'Diagnostic Test' },
  { description: 'Liver Function Test (LFT)', amount: 750, category: 'Diagnostic Test' },
  { description: 'Kidney Function Test (KFT / Renal Profile)', amount: 700, category: 'Diagnostic Test' },
  { description: 'Vitamin D3 & B12 Panel', amount: 1200, category: 'Diagnostic Test' },
  { description: 'Urine Routine & Microscopic Examination', amount: 200, category: 'Diagnostic Test' },
  { description: 'Home Sample Collection Charge', amount: 150, category: 'Sample Collection' },
  { description: 'Express / Urgent Processing Charge', amount: 250, category: 'Processing Fee' }
];

const LabPortalBilling = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const labName = localStorage.getItem('labName') || localStorage.getItem('userName') || 'Diagnostic Laboratory';
  const labCode = localStorage.getItem('labCode') || 'LAB-NETWORK';

  // Helper for lab auth headers
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  });

  // State Management
  const [searchPhone, setSearchPhone] = useState('');
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  // Revenue Stats
  const [revenueStats, setRevenueStats] = useState({
    todayRevenue: 0,
    todayBillsCount: 0,
    totalPendingDues: 0
  });

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    discount: 0,
    taxRate: 18,
    enableTax: true,
    paymentMode: 'Cash',
    paidAmount: 0,
    notes: ''
  });

  // Billed Line Items
  const [items, setItems] = useState([
    { description: 'Complete Blood Count (CBC)', amount: 350, category: 'Diagnostic Test', qty: 1 }
  ]);

  // Preset quick add state
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState('Diagnostic Test');
  const [customItemAmount, setCustomItemAmount] = useState('');

  // Fetch Billing Stats & Invoices
  const fetchBillingData = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [invRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/api/lab-connect/billing/invoices?search=${encodeURIComponent(historySearch)}&status=${historyStatusFilter}`, { headers }),
        axios.get(`${API_URL}/api/lab-connect/billing/stats`, { headers })
      ]);

      if (invRes.data.success) {
        setInvoices(invRes.data.invoices || []);
      }
      if (statsRes.data.success && statsRes.data.stats) {
        setRevenueStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch lab billing data:', err);
    } finally {
      setLoadingInvoices(false);
    }
  }, [token, historySearch, historyStatusFilter]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchBillingData();
    });
  }, [fetchBillingData]);

  // Handle Patient Search
  const handleSearchPatient = async (e) => {
    e?.preventDefault();
    const cleanPhone = searchPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 5) {
      Swal.fire('Warning', 'Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }

    setFetchingPatient(true);
    try {
      const res = await axios.get(`${API_URL}/api/lab-connect/test-requests/lab`, getAuthHeaders());
      const requests = res.data.data || [];
      const match = requests.find(r => (r.patientPhone || '').includes(cleanPhone));

      if (match) {
        setFormData(prev => ({
          ...prev,
          patientName: match.patientName || prev.patientName,
          patientPhone: cleanPhone
        }));
        if (match.testName) {
          setItems([{ description: match.testName, amount: 450, category: 'Diagnostic Test', qty: 1 }]);
        }
        Swal.fire({
          icon: 'success',
          title: 'Patient Found',
          text: `Loaded details for ${match.patientName}`,
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        setFormData(prev => ({ ...prev, patientPhone: cleanPhone }));
        Swal.fire({
          icon: 'info',
          title: 'New Patient',
          text: 'No prior test request found for this number. Enter patient name below.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Patient search error:', err);
      setFormData(prev => ({ ...prev, patientPhone: cleanPhone }));
    } finally {
      setFetchingPatient(false);
    }
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + ((Number(item.amount) || 0) * (Number(item.qty) || 1)), 0);
  const taxAmount = formData.enableTax ? Math.round((subtotal * (Number(formData.taxRate) || 0)) / 100) : 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - (Number(formData.discount) || 0));
  const remainingDue = Math.max(0, grandTotal - (Number(formData.paidAmount) || 0));

  // Add Preset Test
  const handleAddPreset = (e) => {
    const selectedDesc = e.target.value;
    setSelectedPreset(selectedDesc);
    if (!selectedDesc) return;

    const preset = PRESET_LAB_TESTS.find(p => p.description === selectedDesc);
    if (preset) {
      setItems(prev => [...prev, { ...preset, qty: 1 }]);
      setSelectedPreset('');
    }
  };

  // Add Custom Item
  const handleAddCustomItem = () => {
    if (!customItemDesc.trim()) {
      Swal.fire('Required', 'Please enter item description.', 'warning');
      return;
    }
    const amt = Number(customItemAmount) || 0;
    if (amt <= 0) {
      Swal.fire('Required', 'Please enter a valid item price.', 'warning');
      return;
    }

    setItems(prev => [
      ...prev,
      { description: customItemDesc.trim(), amount: amt, category: customItemCategory, qty: 1 }
    ]);
    setCustomItemDesc('');
    setCustomItemAmount('');
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      Swal.fire('Notice', 'At least one line item is required in the bill.', 'info');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Invoice
  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!formData.patientName.trim() || !formData.patientPhone.trim()) {
      Swal.fire('Error', 'Patient Name and Mobile Number are required.', 'error');
      return;
    }
    if (items.length === 0) {
      Swal.fire('Error', 'Please add at least one test or item to the bill.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientName: formData.patientName.trim(),
        patientPhone: formData.patientPhone.trim(),
        items,
        subtotal,
        discount: Number(formData.discount) || 0,
        tax: taxAmount,
        totalAmount: grandTotal,
        paidAmount: Number(formData.paidAmount) || 0,
        paymentMode: formData.paymentMode,
        notes: formData.notes
      };

      const res = await axios.post(`${API_URL}/api/lab-connect/billing/create`, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const createdInvoice = res.data.invoice;
        Swal.fire({
          icon: 'success',
          title: 'Invoice Issued!',
          text: `Lab Invoice ${createdInvoice.invoiceNumber} created successfully.`,
          showCancelButton: true,
          confirmButtonText: '🖨️ Print Invoice',
          cancelButtonText: 'Close'
        }).then((result) => {
          if (result.isConfirmed) {
            handleDownloadInvoicePdf(createdInvoice);
          }
        });

        // Reset form
        setFormData({
          patientName: '',
          patientPhone: '',
          discount: 0,
          taxRate: 18,
          enableTax: true,
          paymentMode: 'Cash',
          paidAmount: 0,
          notes: ''
        });
        setItems([{ description: 'Complete Blood Count (CBC)', amount: 350, category: 'Diagnostic Test', qty: 1 }]);
        fetchBillingData();
      }
    } catch (err) {
      console.error('Invoice creation error:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to create invoice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate & Download PDF Invoice
  const handleDownloadInvoicePdf = (inv) => {
    try {
      const doc = new jsPDF({ margin: 15 });
      
      // Header
      doc.setFillColor(15, 76, 117);
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(labName.toUpperCase(), 15, 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Lab Code: ${labCode} | Official Diagnostic Bill Receipt`, 15, 26);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE / RECEIPT', 150, 18);
      doc.setFontSize(9);
      doc.text(`#${inv.invoiceNumber}`, 150, 26);

      // Metadata section
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT DETAILS', 15, 47);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${inv.patientName}`, 15, 54);
      doc.text(`Mobile: ${inv.patientPhone}`, 15, 60);

      doc.setFont('helvetica', 'bold');
      doc.text('BILL DETAILS', 130, 47);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(inv.createdAt || inv.billingDate).toLocaleDateString('en-IN')}`, 130, 54);
      doc.text(`Payment Mode: ${inv.paymentMode}`, 130, 60);

      // Items table
      const tableRows = (inv.items || []).map((it, idx) => [
        idx + 1,
        it.description,
        it.category || 'Diagnostic Test',
        `₹${(it.amount || 0).toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: 68,
        head: [['#', 'Test / Service Description', 'Category', 'Amount (₹)']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [27, 108, 168] },
        styles: { fontSize: 9 }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Subtotal: ₹${(inv.subtotal || 0).toLocaleString('en-IN')}`, 130, finalY);
      doc.text(`GST / Tax: ₹${(inv.tax || 0).toLocaleString('en-IN')}`, 130, finalY + 6);
      doc.text(`Discount: -₹${(inv.discount || 0).toLocaleString('en-IN')}`, 130, finalY + 12);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Grand Total: ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}`, 130, finalY + 20);
      doc.setTextColor(16, 185, 129);
      doc.text(`Amount Paid: ₹${(inv.paidAmount || 0).toLocaleString('en-IN')}`, 130, finalY + 27);
      
      if (inv.remainingDue > 0) {
        doc.setTextColor(239, 68, 68);
        doc.text(`Balance Due: ₹${inv.remainingDue.toLocaleString('en-IN')}`, 130, finalY + 34);
      }

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text('This is a computer-generated diagnostic invoice verified by Appointory Network.', 15, 280);

      doc.save(`Invoice_${inv.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('Failed to export invoice PDF:', err);
      Swal.fire('Error', 'Failed to generate PDF file.', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="lab" />

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-32 lg:pb-0">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-6">
          <SEO
            title="Lab Billing & Invoicing System"
            description="Manage diagnostic lab billing, patient invoices, line items, GST receipts, and payment tracking."
            url="/lab/portal/billing"
          />

          {/* Header Bar */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-[11px] font-black uppercase tracking-wider border border-teal-100 flex items-center gap-1.5">
                  <Receipt size={13} />
                  Independent Lab Billing & Invoicing
                </span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Diagnostic Billing & Receipts
              </h1>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Generate itemized lab receipts, manage test charges, track GST & collect pending dues.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => fetchBillingData()}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl transition-all border border-slate-200 active:scale-95"
                title="Refresh Billing Data"
              >
                <RefreshCw size={18} className={loadingInvoices ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => navigate('/lab/portal/dashboard')}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95"
              >
                <ArrowLeft size={16} />
                Back to Lab Hub
              </button>
            </div>
          </header>

          {/* Revenue Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/15 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-emerald-100">Today's Lab Revenue</p>
                <h3 className="text-3xl font-black mt-1">₹{revenueStats.todayRevenue.toLocaleString('en-IN')}</h3>
                <p className="text-xs text-emerald-100/90 font-medium mt-1">Collected across verified receipts</p>
              </div>
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <DollarSign size={28} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Today's Bills Issued</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{revenueStats.todayBillsCount}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Total invoices generated today</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                <Receipt size={28} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total Pending Dues</p>
                <h3 className="text-3xl font-black text-rose-600 mt-1">₹{revenueStats.totalPendingDues.toLocaleString('en-IN')}</h3>
                <p className="text-xs text-rose-500/90 font-medium mt-1">Outstanding patient balances</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                <AlertTriangle size={28} />
              </div>
            </div>
          </div>

          {/* Main Grid: Create Invoice (Left 7 cols) & Invoices History (Right 5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Create Invoice Column */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Plus size={18} className="text-teal-600" />
                  New Lab Test Invoice & Receipt
                </h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Itemized Billing
                </span>
              </div>

              {/* Patient Search & Basic Details */}
              <form onSubmit={handleSearchPatient} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                    Search Patient by Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Phone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input
                        type="tel"
                        placeholder="Enter 10-digit mobile number"
                        value={searchPhone}
                        onChange={(e) => setSearchPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={fetchingPatient}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      {fetchingPatient ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                      Fetch Details
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                      Patient Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.patientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                      Patient Mobile Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile"
                      value={formData.patientPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
              </form>

              {/* Bill Line Items Management ("Vastu itemization") */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical size={16} className="text-teal-600" />
                    Lab Line Items & Diagnostic Tests
                  </h3>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full">
                    {items.length} Item(s)
                  </span>
                </div>

                {/* Quick Add Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Quick Add Popular Test
                    </label>
                    <select
                      value={selectedPreset}
                      onChange={handleAddPreset}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-teal-500"
                    >
                      <option value="">Select popular test...</option>
                      {PRESET_LAB_TESTS.map(p => (
                        <option key={p.description} value={p.description}>
                          {p.description} — ₹{p.amount}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Add Custom Item / Fee
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Item name (e.g. ECG)"
                        value={customItemDesc}
                        onChange={(e) => setCustomItemDesc(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={customItemAmount}
                        onChange={(e) => setCustomItemAmount(e.target.value)}
                        className="w-20 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm"
                        title="Add Custom Item"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-right">Price (₹)</th>
                        <th className="py-2.5 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                      {items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={it.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItems(prev => prev.map((item, i) => i === idx ? { ...item, description: val } : item));
                              }}
                              className="w-full bg-transparent outline-none font-bold text-slate-800"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-black uppercase tracking-wider">
                              {it.category || 'Diagnostic Test'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              value={it.amount}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setItems(prev => prev.map((item, i) => i === idx ? { ...item, amount: val } : item));
                              }}
                              className="w-20 text-right bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none font-black text-slate-900"
                            />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation & Payment Setup */}
              <div className="space-y-4 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column: Tax & Discounts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={formData.enableTax}
                          onChange={(e) => setFormData(prev => ({ ...prev, enableTax: e.target.checked }))}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300"
                        />
                        Enable GST (18%)
                      </span>
                      <span className="text-xs font-black text-slate-800">₹{taxAmount}</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Discount Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount: Number(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={formData.paymentMode}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Card">Credit / Debit Card</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Pending">Pending / Credit</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Amount Received & Grand Total */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                        <span>Subtotal:</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                        <span>Tax (GST):</span>
                        <span>+₹{taxAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                        <span>Discount:</span>
                        <span>-₹{formData.discount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-100 pt-2">
                        <span>Grand Total:</span>
                        <span className="text-teal-600 text-lg">₹{grandTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1">
                        Amount Paid Received (₹)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={formData.paidAmount}
                          onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-600 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, paidAmount: grandTotal }))}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-extrabold text-xs rounded-xl transition-all"
                        >
                          Full
                        </button>
                      </div>

                      {remainingDue > 0 && (
                        <p className="text-[11px] font-extrabold text-rose-600 mt-1 flex items-center justify-between">
                          <span>Balance Due:</span>
                          <span>₹{remainingDue.toLocaleString('en-IN')}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSubmitInvoice}
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-teal-600/25 transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <Receipt size={18} />
                      Generate & Issue Lab Receipt
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Invoices History & Archive Column (Right 5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  Billing History Archive
                </h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {invoices.length} Bills
                </span>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoice number, patient name..."
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 hide-scrollbar">
                  {['all', 'Paid', 'Partially Paid', 'Pending'].map(st => (
                    <button
                      key={st}
                      onClick={() => setHistoryStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                        historyStatusFilter === st
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {loadingInvoices ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400 flex flex-col items-center gap-2">
                    <RefreshCw size={24} className="animate-spin text-teal-600" />
                    Fetching lab invoices archive...
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    No billing receipts match your search filter.
                  </div>
                ) : (
                  invoices.map(inv => (
                    <div
                      key={inv._id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition-all flex justify-between items-center gap-3 group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{inv.invoiceNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            inv.paymentStatus === 'Paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : inv.paymentStatus === 'Partially Paid'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 mt-1">{inv.patientName}</p>
                        <p className="text-[10px] font-medium text-slate-400">
                          {inv.patientPhone} · {new Date(inv.createdAt || inv.billingDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</p>
                        <button
                          onClick={() => handleDownloadInvoicePdf(inv)}
                          className="mt-1 flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-800 transition-colors"
                        >
                          <Printer size={13} />
                          Print PDF
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LabPortalBilling;
