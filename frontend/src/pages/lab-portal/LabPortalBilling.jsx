import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  User, Phone, Search, RefreshCw, Receipt, Plus, Trash2, Printer, CheckCircle2,
  ShieldCheck, CreditCard, DollarSign, Sparkles, FileText, AlertTriangle,
  Beaker, Check, Clock, Eye, ChevronRight, X, TrendingUp, CalendarCheck, Settings,
  FlaskConical, ArrowLeft, Share2, Tag, Percent, ChevronLeft, Download, Calendar
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const DEFAULT_PRESET_TESTS = [
  { description: 'Complete Blood Count (CBC)', amount: 350, category: 'Hematology' },
  { description: 'Lipid Profile (Cholesterol & Triglycerides)', amount: 650, category: 'Biochemistry' },
  { description: 'Thyroid Profile (T3, T4, TSH)', amount: 550, category: 'Endocrinology' },
  { description: 'Diabetes Screen (HbA1c & Fasting Glucose)', amount: 450, category: 'Diabetes' },
  { description: 'Liver Function Test (LFT)', amount: 750, category: 'Biochemistry' },
  { description: 'Kidney Function Test (KFT / Renal Profile)', amount: 700, category: 'Renal' },
  { description: 'Vitamin D3 & B12 Panel', amount: 1200, category: 'Vitamins' },
  { description: 'Urine Routine & Microscopic Examination', amount: 200, category: 'Clinical Pathology' },
  { description: 'Serum Electrolytes (Na+, K+, Cl-)', amount: 400, category: 'Biochemistry' },
  { description: 'Home Sample Collection Charge', amount: 150, category: 'Sample Collection' },
  { description: 'Express / Urgent Processing Charge', amount: 250, category: 'Processing Fee' }
];

const LabPortalBilling = () => {
  const navigate = useNavigate();
  // Ensure token works with independent lab auth
  const token = localStorage.getItem('labToken') || localStorage.getItem('token');
  const labName = localStorage.getItem('labName') || localStorage.getItem('userName') || 'Diagnostic Laboratory';
  const labCode = localStorage.getItem('labCode') || 'LAB-NETWORK';

  // Helper for lab auth headers
  const getAuthHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // State Management
  const [searchPhone, setSearchPhone] = useState('');
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');
  const [dateFilterPeriod, setDateFilterPeriod] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Lab Catalog Tests & Incoming Requests
  const [availableTests, setAvailableTests] = useState(DEFAULT_PRESET_TESTS);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Revenue Stats
  const [revenueStats, setRevenueStats] = useState({
    todayRevenue: 0,
    todayBillsCount: 0,
    totalPendingDues: 0
  });

  // Modal Print/View state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Discount Type: 'flat' (₹) | 'percent' (%)
  const [discountType, setDiscountType] = useState('flat');
  const [discountValue, setDiscountValue] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorName: '',
    taxRate: 18,
    enableTax: true,
    paymentMode: 'Cash',
    paidAmount: 0,
    notes: '',
    sampleType: 'Blood'
  });

  // Billed Line Items
  const [items, setItems] = useState([
    { description: 'Complete Blood Count (CBC)', amount: 350, category: 'Hematology', qty: 1 }
  ]);

  // Preset quick add state
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customItemDesc, setCustomItemDesc] = useState('');
  const customItemCategory = 'Diagnostic Test';
  const [customItemAmount, setCustomItemAmount] = useState('');

  // Fetch Lab's Configured Test Catalog & Incoming Test Requests
  useEffect(() => {
    const fetchLabCatalogAndRequests = async () => {
      if (!token) return;
      try {
        setLoadingRequests(true);
        const [profileRes, requestsRes] = await Promise.all([
          axios.get(`${API_URL}/api/auth/lab/me`, getAuthHeaders()).catch(() => ({ data: { success: false } })),
          axios.get(`${API_URL}/api/lab-connect/test-requests/lab`, getAuthHeaders()).catch(() => ({ data: { success: false } }))
        ]);

        if (profileRes?.data?.success && profileRes.data.data?.availableTests?.length) {
          const customCatalog = profileRes.data.data.availableTests.map(t => ({
            description: t.testName,
            amount: t.price || 450,
            category: t.category || 'Diagnostic Test'
          }));
          setAvailableTests([...customCatalog, ...DEFAULT_PRESET_TESTS]);
        }

        if (requestsRes?.data?.success) {
          const reqs = requestsRes.data.data || [];
          const unbilled = reqs.filter(r => r.status === 'Pending' || r.status === 'Accepted' || r.status === 'Processing');
          setPendingRequests(unbilled);
        }
      } catch (err) {
        console.error('Error fetching lab catalog / requests:', err);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchLabCatalogAndRequests();
  }, [token, getAuthHeaders]);

  // Fetch Billing Stats & Invoices
  const fetchBillingData = useCallback(async () => {
    if (!token) return;
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
    fetchBillingData();
  }, [fetchBillingData]);

  // Handle Quick Billing a Pending Test Request
  const handleQuickBillRequest = (req) => {
    setFormData(prev => ({
      ...prev,
      patientName: req.patientName || '',
      patientPhone: req.patientPhone || '',
      doctorName: req.notes || '',
      notes: `Referred by connected clinic for ${req.testName}`
    }));

    // Find price in catalog or fallback
    const matched = availableTests.find(t => t.description.toLowerCase() === (req.testName || '').toLowerCase());
    const fee = matched ? matched.amount : 450;

    setItems([
      { description: req.testName || 'Diagnostic Investigation', amount: fee, category: 'Diagnostic Test', qty: 1 }
    ]);

    Swal.fire({
      icon: 'success',
      title: 'Request Loaded for Billing',
      text: `Patient ${req.patientName} and test "${req.testName}" prefilled.`,
      timer: 1600,
      showConfirmButton: false
    });
  };

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
      const match = pendingRequests.find(r => (r.patientPhone || '').includes(cleanPhone));

      if (match) {
        handleQuickBillRequest(match);
      } else {
        // Also check recent invoices
        const priorBill = invoices.find(inv => (inv.patientPhone || '').includes(cleanPhone));
        if (priorBill) {
          setFormData(prev => ({
            ...prev,
            patientName: priorBill.patientName,
            patientPhone: cleanPhone
          }));
          Swal.fire({
            icon: 'success',
            title: 'Patient Found in Billing History',
            text: `Loaded ${priorBill.patientName}`,
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          setFormData(prev => ({ ...prev, patientPhone: cleanPhone }));
          Swal.fire({
            icon: 'info',
            title: 'New Patient',
            text: 'Enter patient name below to proceed.',
            timer: 1800,
            showConfirmButton: false
          });
        }
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
  
  // Calculate discount
  const calculatedDiscount = discountType === 'percent'
    ? Math.round((subtotal * (Number(discountValue) || 0)) / 100)
    : (Number(discountValue) || 0);

  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const taxAmount = formData.enableTax ? Math.round((taxableAmount * (Number(formData.taxRate) || 0)) / 100) : 0;
  const grandTotal = Math.max(0, taxableAmount + taxAmount);
  const remainingDue = Math.max(0, grandTotal - (Number(formData.paidAmount) || 0));

  // Add Preset Test
  const handleAddPreset = (e) => {
    const selectedDesc = e.target.value;
    setSelectedPreset(selectedDesc);
    if (!selectedDesc) return;

    const preset = availableTests.find(p => p.description === selectedDesc);
    if (preset) {
      setItems(prev => [...prev, { ...preset, qty: 1 }]);
      setSelectedPreset('');
    }
  };

  // Add Custom Item
  const handleAddCustomItem = () => {
    if (!customItemDesc.trim()) {
      Swal.fire('Required', 'Please enter test or item description.', 'warning');
      return;
    }
    const amt = Number(customItemAmount) || 0;
    if (amt <= 0) {
      Swal.fire('Required', 'Please enter a valid price.', 'warning');
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

  // Update item quantity or amount
  const handleUpdateItem = (index, field, value) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Auto-fill Full Payment
  const handlePayFullAmount = () => {
    setFormData(prev => ({ ...prev, paidAmount: grandTotal }));
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
        doctorName: formData.doctorName.trim(),
        items,
        subtotal,
        discount: calculatedDiscount,
        tax: taxAmount,
        totalAmount: grandTotal,
        paidAmount: Number(formData.paidAmount) || 0,
        paymentMode: formData.paymentMode,
        notes: formData.notes
      };

      const res = await axios.post(`${API_URL}/api/lab-connect/billing/create`, payload, getAuthHeaders());
      if (res.data.success) {
        const createdInvoice = res.data.invoice;
        setSelectedInvoice(createdInvoice);
        setShowReceiptModal(true);

        // Reset form
        setFormData({
          patientName: '',
          patientPhone: '',
          doctorName: '',
          taxRate: 18,
          enableTax: true,
          paymentMode: 'Cash',
          paidAmount: 0,
          notes: '',
          sampleType: 'Blood'
        });
        setDiscountValue(0);
        setItems([{ description: 'Complete Blood Count (CBC)', amount: 350, category: 'Hematology', qty: 1 }]);
        fetchBillingData();
      }
    } catch (err) {
      console.error('Invoice creation error:', err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to create invoice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Settle Balance Due
  const handleSettleDue = async (inv) => {
    const { value: formValues } = await Swal.fire({
      title: `Collect Balance Due: ₹${inv.remainingDue.toLocaleString('en-IN')}`,
      html: `
        <div style="text-align:left; font-size:13px; margin-top:10px;">
          <p style="margin-bottom:8px;"><strong>Patient:</strong> ${inv.patientName} (${inv.patientPhone})</p>
          <p style="margin-bottom:12px;"><strong>Invoice:</strong> #${inv.invoiceNumber}</p>
          <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:12px;">Amount to Collect (₹)</label>
          <input id="swal-settle-amount" type="number" class="swal2-input" value="${inv.remainingDue}" style="margin:0 0 12px 0; width:100%;" />
          <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:12px;">Payment Mode</label>
          <select id="swal-settle-mode" class="swal2-select" style="margin:0; width:100%;">
            <option value="Cash">Cash</option>
            <option value="UPI">UPI / QR</option>
            <option value="Card">Card</option>
            <option value="Net Banking">Net Banking</option>
          </select>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Collect & Settle',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#64748B',
      preConfirm: () => {
        const amt = document.getElementById('swal-settle-amount').value;
        const mode = document.getElementById('swal-settle-mode').value;
        if (!amt || Number(amt) <= 0) {
          Swal.showValidationMessage('Please enter a valid amount.');
          return false;
        }
        return { amount: Number(amt), paymentMode: mode };
      }
    });

    if (formValues) {
      try {
        const res = await axios.patch(
          `${API_URL}/api/lab-connect/billing/invoices/${inv._id}/settle-due`,
          formValues,
          getAuthHeaders()
        );
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Payment Recorded',
            text: res.data.message || 'Balance settled successfully.',
            timer: 1600,
            showConfirmButton: false
          });
          fetchBillingData();
        }
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to settle due.', 'error');
      }
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
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(labName.toUpperCase(), 15, 16);
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Lab Code: ${labCode} | Official Diagnostic & Pathology Bill`, 15, 24);
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('DIAGNOSTIC INVOICE', 142, 16);
      doc.setFontSize(8.5);
      doc.text(`#${inv.invoiceNumber}`, 142, 24);

      // Metadata section
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT DETAILS', 15, 46);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${inv.patientName}`, 15, 53);
      doc.text(`Mobile: ${inv.patientPhone}`, 15, 59);

      doc.setFont('helvetica', 'bold');
      doc.text('BILL DETAILS', 130, 46);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(inv.createdAt || inv.billingDate).toLocaleDateString('en-IN')}`, 130, 53);
      doc.text(`Mode: ${inv.paymentMode} (${inv.paymentStatus})`, 130, 59);
      if (inv.doctorName) {
        doc.text(`Ref. Doctor: ${inv.doctorName}`, 130, 65);
      }

      // Items table
      const tableRows = (inv.items || []).map((it, idx) => [
        idx + 1,
        it.description,
        it.category || 'Diagnostic Test',
        it.qty || 1,
        `₹${(it.amount || 0).toLocaleString('en-IN')}`,
        `₹${((it.amount || 0) * (it.qty || 1)).toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: inv.doctorName ? 72 : 67,
        head: [['#', 'Diagnostic Test / Service', 'Category', 'Qty', 'Unit Fee', 'Total (₹)']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [27, 108, 168] },
        styles: { fontSize: 8.5 }
      });

      const finalY = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Subtotal: ₹${(inv.subtotal || 0).toLocaleString('en-IN')}`, 130, finalY);
      if (inv.discount > 0) {
        doc.text(`Discount: -₹${(inv.discount || 0).toLocaleString('en-IN')}`, 130, finalY + 5);
      }
      if (inv.tax > 0) {
        doc.text(`GST / Tax: ₹${(inv.tax || 0).toLocaleString('en-IN')}`, 130, finalY + 10);
      }
      
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Grand Total: ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}`, 130, finalY + 18);
      doc.setTextColor(16, 185, 129);
      doc.text(`Amount Paid: ₹${(inv.paidAmount || 0).toLocaleString('en-IN')}`, 130, finalY + 24);
      
      if (inv.remainingDue > 0) {
        doc.setTextColor(239, 68, 68);
        doc.text(`Balance Due: ₹${inv.remainingDue.toLocaleString('en-IN')}`, 130, finalY + 30);
      }

      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text('This is a verified diagnostic test invoice generated on Appointory Network.', 15, 280);

      doc.save(`Lab_Invoice_${inv.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
      Swal.fire('Error', 'Failed to generate PDF document.', 'error');
    }
  };

  // WhatsApp Share Receipt
  const handleShareWhatsApp = (inv) => {
    const cleanPhone = (inv.patientPhone || '').replace(/\D/g, '').slice(-10);
    const testList = (inv.items || []).map(i => `• ${i.description} (₹${i.amount})`).join('\n');
    const msg = `*${labName.toUpperCase()} — DIAGNOSTIC RECEIPT*\n` +
      `Receipt No: #${inv.invoiceNumber}\n` +
      `Patient: ${inv.patientName}\n` +
      `Date: ${new Date(inv.createdAt || inv.billingDate).toLocaleDateString('en-IN')}\n\n` +
      `*Tests Billed:*\n${testList}\n\n` +
      `Total: ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}\n` +
      `Paid: ₹${(inv.paidAmount || 0).toLocaleString('en-IN')} (${inv.paymentMode})\n` +
      (inv.remainingDue > 0 ? `*Balance Due: ₹${inv.remainingDue.toLocaleString('en-IN')}*\n` : `Status: FULLY PAID ✅\n`) +
      `\nThank you for choosing ${labName}. Reports will be processed shortly.`;

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const isDateInFilter = (dateStr, period, start, end) => {
    if (period === 'all') return true;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    if (period === 'today') {
      return d >= todayStart && d <= todayEnd;
    }
    if (period === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return d >= startOfDay(yest) && d <= endOfDay(yest);
    }
    if (period === 'week') {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return d >= startOfDay(sevenDaysAgo) && d <= todayEnd;
    }
    if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return d >= monthStart && d <= todayEnd;
    }
    if (period === 'custom') {
      if (start && d < startOfDay(new Date(start))) return false;
      if (end && d > endOfDay(new Date(end))) return false;
      return true;
    }
    return true;
  };

  const filteredInvoices = invoices.filter(inv => {
    return isDateInFilter(inv.billingDate || inv.createdAt, dateFilterPeriod, customStartDate, customEndDate);
  });

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE));
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleExportCSV = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Invoices to Export',
        text: 'No diagnostic billing records found for the selected time period.',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    const headers = [
      'Invoice #',
      'Date',
      'Patient Name',
      'Patient Phone',
      'Doctor / Referral',
      'Tests / Investigations',
      'Sample Type',
      'Subtotal (INR)',
      'Discount (INR)',
      'Tax (INR)',
      'Total Amount (INR)',
      'Paid Amount (INR)',
      'Remaining Due (INR)',
      'Payment Mode',
      'Payment Status'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredInvoices.map(inv => {
      const itemsStr = (inv.items || [])
        .map(it => `${it.description || 'Test'} (₹${it.amount || 0})`)
        .join('; ');
      const dateFormatted = inv.billingDate || inv.createdAt
        ? new Date(inv.billingDate || inv.createdAt).toLocaleDateString('en-IN')
        : '';

      return [
        escapeCsv(inv.invoiceNumber || ''),
        escapeCsv(dateFormatted),
        escapeCsv(inv.patientName || ''),
        escapeCsv(inv.patientPhone || ''),
        escapeCsv(inv.doctorName || 'Self / Direct Walk-in'),
        escapeCsv(itemsStr),
        escapeCsv(inv.sampleType || 'Blood'),
        escapeCsv(inv.subtotal || 0),
        escapeCsv(inv.discount || 0),
        escapeCsv(inv.taxAmount || 0),
        escapeCsv(inv.totalAmount || 0),
        escapeCsv(inv.paidAmount || 0),
        escapeCsv(inv.remainingDue || 0),
        escapeCsv(inv.paymentMode || 'Cash'),
        escapeCsv(inv.paymentStatus || 'Paid')
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Lab_Invoices_${historyStatusFilter}_${dateFilterPeriod}_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen font-body text-slate-800">
      <SEO 
        title={`Diagnostic Billing & Invoicing | ${labName}`}
        description="Issue professional diagnostic lab invoices, collect payments, and manage test billing records."
      />
      <Sidebar role="independent_lab" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                  <FlaskConical size={14} /> Diagnostic Lab Billing
                </span>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  ID: {labCode}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
                {labName} — Billing Center
              </h1>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Generate diagnostic test invoices, record sample collection charges, and track revenue
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/lab/portal/dashboard')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back to Dashboard
              </button>
              <button
                onClick={fetchBillingData}
                disabled={loadingInvoices}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-2xl transition-all shadow-sm active:scale-95"
                title="Refresh Records"
              >
                <RefreshCw size={18} className={loadingInvoices ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Today's Lab Collection</p>
                <p className="text-2xl font-black text-emerald-700 mt-0.5">
                  ₹{(revenueStats.todayRevenue || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                  {revenueStats.todayBillsCount || 0} Bills Issued Today
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Receipt size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Billed Records</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">
                  {invoices.length}
                </p>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                  Verified Diagnostic Invoices
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Outstanding Balance Dues</p>
                <p className="text-2xl font-black text-rose-600 mt-0.5">
                  ₹{(revenueStats.totalPendingDues || 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                  Uncollected Patient Balances
                </p>
              </div>
            </div>
          </div>

          {/* Quick-Bill Strip for Pending Clinic Requests */}
          {loadingRequests ? (
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-3xl text-xs font-bold text-blue-700 flex items-center gap-2">
              <RefreshCw size={15} className="animate-spin text-blue-600" />
              Loading incoming clinic test requests...
            </div>
          ) : pendingRequests.length > 0 ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                  <Beaker size={16} className="text-blue-600 animate-pulse" />
                  Incoming Clinic Referrals Waiting for Billing ({pendingRequests.length})
                </h3>
                <span className="text-[11px] font-bold text-blue-700">Click to auto-fill patient & test</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
                {pendingRequests.map(req => (
                  <button
                    key={req._id}
                    onClick={() => handleQuickBillRequest(req)}
                    className="p-3 bg-white hover:bg-blue-600 hover:text-white border border-blue-200 rounded-2xl transition-all shadow-sm text-left shrink-0 group active:scale-95"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 group-hover:text-white">{req.patientName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 group-hover:bg-white/20 text-blue-700 group-hover:text-white rounded font-bold">
                        {req.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-blue-600 group-hover:text-blue-100 mt-0.5 truncate max-w-[200px]">
                      🔬 {req.testName}
                    </p>
                    <p className="text-[10px] text-slate-400 group-hover:text-blue-200">
                      📞 {req.patientPhone}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Main 2-Column Grid: Left (Invoice Generator) | Right (Billing History) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Invoice Generator Form (Left 7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Receipt size={18} className="text-blue-600" />
                    New Diagnostic Test Invoice
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Enter patient info and tests to generate a printed receipt</p>
                </div>
              </div>

              {/* Patient Phone Search Box */}
              <form onSubmit={handleSearchPatient} className="flex gap-2">
                <div className="relative flex-1">
                  <Phone size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="Search by patient mobile number (10 digits)..."
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={fetchingPatient}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                >
                  <Search size={14} />
                  {fetchingPatient ? 'Searching...' : 'Lookup'}
                </button>
              </form>

              {/* Patient Details Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile..."
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Referring Doctor / Clinic (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. A. Sharma / Self Referral"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Sample Type
                  </label>
                  <select
                    value={formData.sampleType}
                    onChange={(e) => setFormData({ ...formData, sampleType: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all"
                  >
                    <option value="Blood">Blood (Serum / Plasma)</option>
                    <option value="Urine">Urine Sample</option>
                    <option value="Stool">Stool Sample</option>
                    <option value="Swab">Swab / Culture</option>
                    <option value="Imaging">X-Ray / Sonography</option>
                    <option value="Other">Other Sample</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <FlaskConical size={14} className="text-teal-600" />
                    Diagnostic Tests & Line Items
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400">{items.length} Tests in Bill</span>
                </div>

                {/* Preset Dropdown */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    ⚡ Quick Add From Lab Test Catalog
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={handleAddPreset}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 transition-all"
                  >
                    <option value="">-- Choose Test from Catalog / Presets --</option>
                    {availableTests.map((t, idx) => (
                      <option key={idx} value={t.description}>
                        {t.description} ({t.category || 'Diagnostic'}) — ₹{t.amount}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items List */}
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-blue-600 transition-colors"
                          placeholder="Test description..."
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">{it.category || 'Diagnostic Test'}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={it.qty || 1}
                            onChange={(e) => handleUpdateItem(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-center outline-none"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            value={it.amount}
                            onChange={(e) => handleUpdateItem(idx, 'amount', Number(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-right outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Custom Row */}
                <div className="p-3 bg-slate-50/60 rounded-2xl border border-dashed border-slate-300 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      placeholder="Add custom test / extra investigation..."
                      value={customItemDesc}
                      onChange={(e) => setCustomItemDesc(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={customItemAmount}
                      onChange={(e) => setCustomItemAmount(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleAddCustomItem}
                      className="w-full py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={14} /> Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Tax & Discount Options */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Discount */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-black uppercase text-slate-500">Discount</label>
                      <div className="flex gap-1 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('flat')}
                          className={`px-2 py-0.5 rounded ${discountType === 'flat' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}
                        >
                          ₹ Flat
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percent')}
                          className={`px-2 py-0.5 rounded ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}
                        >
                          % Percent
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* GST / Tax */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-black uppercase text-slate-500">GST / Tax</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, enableTax: !formData.enableTax })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${formData.enableTax ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}
                      >
                        {formData.enableTax ? 'GST Enabled' : 'No Tax'}
                      </button>
                    </div>
                    <select
                      disabled={!formData.enableTax}
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none disabled:opacity-50"
                    >
                      <option value="0">0% (Exempt)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST (Standard)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Mode & Amount Paid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Pending">Pending Later Payment</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Amount Paid Now (₹) *
                    </label>
                    <button
                      type="button"
                      onClick={handlePayFullAmount}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Pay Full (₹{grandTotal.toLocaleString('en-IN')})
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  Billing Remarks / Clinical Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fasting sample drawn. Reports available by 6 PM."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-blue-600"
                />
              </div>

              {/* Total Summary Breakdown */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400">
                    <span>Discount ({discountType === 'percent' ? `${discountValue}%` : 'Flat'}):</span>
                    <span className="font-bold">-₹{calculatedDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>GST ({formData.taxRate}%):</span>
                    <span className="font-bold">+₹{taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between text-base font-black">
                  <span>Grand Total:</span>
                  <span className="text-teal-400">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Paid Now:</span>
                  <span className="font-bold text-emerald-400">₹{(Number(formData.paidAmount) || 0).toLocaleString('en-IN')}</span>
                </div>
                {remainingDue > 0 && (
                  <div className="flex justify-between text-xs text-rose-400 font-bold">
                    <span>Balance Due (બાકી):</span>
                    <span>₹{remainingDue.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitInvoice}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Printer size={16} />
                {submitting ? 'Generating Invoice...' : 'Generate & Print Diagnostic Bill'}
              </button>
            </div>

            {/* Invoices History & Archive Column (Right 5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" />
                    Billing Archive
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Search receipts and settle balance dues</p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {filteredInvoices.length} Bills
                </span>
              </div>

              {/* Filters & Export */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by invoice #, patient, phone..."
                      value={historySearch}
                      onChange={(e) => { setHistorySearch(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-600"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
                    title="Export Lab Invoices to CSV"
                  >
                    <Download size={13} />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Period Filter Dropdown */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 flex-1 min-w-[130px]">
                    <Calendar size={13} className="text-blue-600 shrink-0" />
                    <select
                      value={dateFilterPeriod}
                      onChange={(e) => { setDateFilterPeriod(e.target.value); setCurrentPage(1); }}
                      className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="week">Past 7 Days</option>
                      <option value="month">This Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {/* Status Pills */}
                  <div className="flex gap-1 overflow-x-auto pb-0.5 hide-scrollbar">
                    {['all', 'Paid', 'Partially Paid', 'Pending'].map(st => (
                      <button
                        key={st}
                        onClick={() => { setHistoryStatusFilter(st); setCurrentPage(1); }}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
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

                {dateFilterPeriod === 'custom' && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none flex-1"
                    />
                    <span className="text-xs text-slate-400 font-bold">to</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none flex-1"
                    />
                  </div>
                )}
              </div>

              {/* Invoices List */}
              <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
                {loadingInvoices ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400 flex flex-col items-center gap-2">
                    <RefreshCw size={24} className="animate-spin text-blue-600" />
                    Fetching lab invoices archive...
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    No diagnostic billing records match your search filter.
                  </div>
                ) : (
                  paginatedInvoices.map(inv => (
                    <div
                      key={inv._id}
                      className="p-4 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200/80 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
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
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{inv.patientName}</p>
                          <p className="text-[10px] font-medium text-slate-400">
                            📞 {inv.patientPhone} · 📅 {new Date(inv.createdAt || inv.billingDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-slate-900">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</p>
                          {inv.remainingDue > 0 && (
                            <p className="text-[11px] font-bold text-rose-600">Due: ₹{inv.remainingDue.toLocaleString('en-IN')}</p>
                          )}
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="text-[11px] text-slate-600 truncate border-t border-slate-200/60 pt-1.5">
                        {(inv.items || []).map(i => i.description).join(', ')}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowReceiptModal(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors flex items-center gap-1"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => handleDownloadInvoicePdf(inv)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                          >
                            <Printer size={12} /> PDF
                          </button>
                          <button
                            onClick={() => handleShareWhatsApp(inv)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                            title="Share via WhatsApp"
                          >
                            <Share2 size={12} /> WhatsApp
                          </button>
                        </div>

                        {inv.remainingDue > 0 && (
                          <button
                            onClick={() => handleSettleDue(inv)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1"
                          >
                            <DollarSign size={12} /> Settle Due
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 10-per-page Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px] font-medium">
                  Showing <strong className="text-slate-800">{filteredInvoices.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> to <strong className="text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, filteredInvoices.length)}</strong> of <strong className="text-slate-800">{filteredInvoices.length}</strong>
                </span>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                      let pageNum = idx + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNum = currentPage - 3 + idx;
                        if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
                      }
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg font-black text-[11px] transition-all ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 font-bold flex items-center gap-1 text-[11px]"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </main>
        <Footer />
      </div>

      {/* --- 🖨️ INTERACTIVE RECEIPT MODAL --- */}
      {showReceiptModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[170] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="text-blue-600" size={20} />
                <h3 className="text-base font-black text-slate-900">Diagnostic Bill Receipt</h3>
              </div>
              <button 
                onClick={() => setShowReceiptModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 print:p-0" id="printable-receipt">
              <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{labName}</h2>
                <p className="text-xs font-semibold text-slate-500">Diagnostic & Pathology Investigation Center</p>
                <p className="text-[11px] text-slate-400">Lab Code: {labCode} · Verified Appointory Network</p>
              </div>

              <div className="grid grid-cols-2 text-xs gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Patient Details</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedInvoice.patientName}</p>
                  <p className="text-slate-600">📞 {selectedInvoice.patientPhone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Receipt Info</span>
                  <p className="font-bold text-slate-900">#{selectedInvoice.invoiceNumber}</p>
                  <p className="text-slate-600">{new Date(selectedInvoice.createdAt || selectedInvoice.billingDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {selectedInvoice.doctorName && (
                <div className="text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Referring Specialist / Clinic:</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.doctorName}</span>
                </div>
              )}

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Test Description</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedInvoice.items || []).map((it, i) => (
                      <tr key={i}>
                        <td className="p-2.5 font-semibold text-slate-800">
                          {it.description}
                          <span className="block text-[10px] text-slate-400">{it.category || 'Diagnostic'}</span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-600">{it.qty || 1}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">
                          ₹{((it.amount || 0) * (it.qty || 1)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="space-y-1 text-xs border-t border-dashed border-slate-300 pt-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>₹{(selectedInvoice.subtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{(selectedInvoice.discount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedInvoice.tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST:</span>
                    <span>+₹{(selectedInvoice.tax || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>₹{(selectedInvoice.totalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>Paid ({selectedInvoice.paymentMode}):</span>
                  <span>₹{(selectedInvoice.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.remainingDue > 0 && (
                  <div className="flex justify-between text-xs font-black text-rose-600">
                    <span>Balance Due:</span>
                    <span>₹{selectedInvoice.remainingDue.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 text-center border-t border-slate-100">
                <p className="text-[11px] text-slate-400 italic">
                  Results will be validated clinically. Correlate with symptoms.
                </p>
                <p className="text-[10px] text-slate-400 mt-1">Authorized Pathologist / Lab Signatory</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50">
              <button
                onClick={() => handleShareWhatsApp(selectedInvoice)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Share2 size={14} /> Send WhatsApp
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadInvoicePdf(selectedInvoice)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Printer size={14} /> Download PDF
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabPortalBilling;
