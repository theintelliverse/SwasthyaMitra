import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  User, Phone, Search, RefreshCw, ArrowLeft, Stethoscope, 
  Receipt, Plus, Trash2, Printer, CheckCircle2, ShieldCheck, 
  CreditCard, DollarSign, Sparkles, FileText, AlertTriangle, 
  Beaker, Check, Clock, Eye, Share2, ChevronRight, X, TrendingUp, CalendarCheck, Settings, QrCode,
  Tag, Percent, MessageCircle, FileDown, FlaskConical, Download, Ticket
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import QrScannerModal from '../../components/receptionist/QrScannerModal';
import { API_URL } from '../../config/runtime';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReceptionistBilling = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role') || 'receptionist';

  // State Management
  const [billingType, setBillingType] = useState(() => {
    const paramType = searchParams.get('type');
    if (paramType === 'lab') return 'lab';
    if (userRole === 'lab') return 'lab';
    return 'clinic';
  }); // 'clinic' | 'lab'

  const [searchPhone, setSearchPhone] = useState('');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoFetched, setAutoFetched] = useState(false);
  const [fetchedQueue, setFetchedQueue] = useState(null);
  const [doctors, setDoctors] = useState([]);
  
  // Doctor Appointment Booking Option (Optional, defaults to false)
  const [bookAppointment, setBookAppointment] = useState(false);

  // Doctor Prescribed Lab Investigations Detected from Queue / Doctor Requests
  const [doctorPrescriptions, setDoctorPrescriptions] = useState([]);

  // Discount Type: Flat (₹) vs Percent (%)
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [discountValue, setDiscountValue] = useState(0);

  // History & Stats State
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'clinic' | 'lab' | 'due'
  const [revenueStats, setRevenueStats] = useState({
    todayRevenue: 0,
    todayBillsCount: 0,
    pendingDuesCollectedToday: 0
  });

  // Modal Print state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Billing & Tax Settings State
  const [billingSettings, setBillingSettings] = useState({
    taxEnabled: true,
    taxRate: 18,
    feeConsult: 500,
    feeFollowupConsult: 300,
    feeLab: 450,
    feeEmergency: 300,
    feeMedicine: 120
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [customTaxAmount, setCustomTaxAmount] = useState(null);

  // Bill Form State
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    doctorId: '',
    doctorName: '',
    onlinePendingDues: 0,
    discount: 0,
    paymentMode: 'Cash',
    paidAmount: 0,
    queueId: null
  });

  const [items, setItems] = useState([
    { description: 'Doctor Consultation Fee', amount: 500, category: 'Consultation' }
  ]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/billing/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.settings) {
        setBillingSettings(res.data.settings);
      }
    } catch (err) {
      console.error("Failed to load billing settings:", err);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) fetchSettings();
    });
    return () => { active = false; };
  }, [fetchSettings]);

  // Synchronize billingType if URL parameter changes
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'lab') {
      setBillingType('lab');
      setItems([
        { description: 'Complete Blood Count (CBC)', amount: 350, category: 'Lab Test' }
      ]);
    } else if (typeParam === 'clinic') {
      setBillingType('clinic');
      setItems([
        { description: 'Doctor Consultation Fee', amount: 500, category: 'Consultation' }
      ]);
    }
  }, [searchParams]);

  useEffect(() => {
    const phoneFromUrl = searchParams.get('phone');
    if (phoneFromUrl) {
      const clean = phoneFromUrl.replace(/\D/g, '').slice(-10);
      const timer = setTimeout(() => {
        setSearchPhone(clean);
        const fetchBtn = document.querySelector('button[type="submit"]');
        fetchBtn?.click();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const res = await axios.get(`${API_URL}/api/billing/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setInvoices(res.data.invoices || []);
        if (res.data.revenueStats) {
          setRevenueStats(res.data.revenueStats);
        }
      }
    } catch (err) {
      console.error("Failed to load invoices history:", err);
    } finally {
      setLoadingInvoices(false);
    }
  }, [token]);

  // Load Initial Data (Doctors & Invoice History)
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchInvoices();
    });
  }, [fetchInvoices]);

  // 🔍 AUTO-FETCH PATIENT & APPOINTMENT BY PHONE
  const handleAutoFetch = async (e) => {
    if (e) e.preventDefault();
    const phoneToSearch = searchPhone.trim();
    if (!phoneToSearch || phoneToSearch.length < 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Enter Mobile Number',
        text: 'Please enter a valid 10-digit mobile phone number.',
        confirmButtonColor: '#0F766E',
        background: '#EEF6FA'
      });
      return;
    }

    setFetching(true);
    setAutoFetched(false);
    try {
      const res = await axios.get(`${API_URL}/api/billing/patient-fetch/${phoneToSearch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const data = res.data;
        setDoctors(data.doctors || []);
        
        // 1. Fill Patient Basic Info
        const pName = data.patient?.name || (data.queue?.patientName || '');
        const pPhone = data.patient?.phone || phoneToSearch;
        const qId = data.queue?.id || null;
        const docId = data.queue?.doctorId || (data.doctors?.[0]?._id || '');
        const docName = data.queue?.doctorName || (data.doctors?.[0]?.name || '');
        const dues = data.onlinePendingDues || 0;

        setFetchedQueue(data.queue || null);

        // 2. Detect Doctor Prescriptions (Queue requiredTest & labRequests)
        const detectedPrescriptions = [];
        if (data.queue?.requiredTest) {
          const parts = data.queue.requiredTest.split(',').map(p => p.trim()).filter(Boolean);
          parts.forEach(name => {
            detectedPrescriptions.push({
              testName: name,
              doctorName: data.queue.doctorName,
              source: 'Queue / Consultation Prescription',
              fee: data.clinicFees?.feeLab || billingSettings.feeLab || 450
            });
          });
        }
        if (data.labRequests && Array.isArray(data.labRequests)) {
          data.labRequests.forEach(req => {
            if (!detectedPrescriptions.some(d => d.testName.toLowerCase() === (req.testName || '').toLowerCase())) {
              detectedPrescriptions.push({
                testName: req.testName,
                doctorName: req.doctorName || data.queue?.doctorName || '',
                source: 'Doctor Lab Request Order',
                fee: req.fee || data.clinicFees?.feeLab || 450
              });
            }
          });
        }
        setDoctorPrescriptions(detectedPrescriptions);

        // 3. Setup Default Line Items based on Billing Type
        let defaultItems = [];
        if (billingType === 'clinic') {
          const isFollowup = data.queue?.visitType === 'Follow-up';
          const consultFee = isFollowup 
            ? (data.clinicFees?.feeFollowupConsult || billingSettings.feeFollowupConsult || 300) 
            : (data.clinicFees?.feeConsult || billingSettings.feeConsult || 500);
          defaultItems = [
            { 
              description: data.queue 
                ? `${isFollowup ? 'Follow-up Consultation' : 'Doctor Consultation'} (${data.queue.doctorName})` 
                : 'Doctor Consultation Fee', 
              amount: consultFee, 
              category: 'Consultation' 
            }
          ];
          if (data.queue?.visitType === 'Appointment') {
            defaultItems.push({
              description: 'Appointment Booking Charge',
              amount: 100,
              category: 'Registration'
            });
          }
        } else {
          // Lab mode: if doctor ordered tests, load them!
          if (detectedPrescriptions.length > 0) {
            defaultItems = detectedPrescriptions.map(req => ({
              description: req.testName,
              amount: req.fee || data.clinicFees?.feeLab || 450,
              category: 'Lab Test'
            }));
          } else {
            defaultItems = [
              { description: 'Complete Blood Count (CBC)', amount: 350, category: 'Lab Test' }
            ];
          }
        }

        // Calculate Subtotal for default paid amount
        const defaultSubtotal = defaultItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const defaultTotal = defaultSubtotal + dues;

        setFormData(prev => ({
          ...prev,
          patientName: pName,
          patientPhone: pPhone,
          doctorId: docId,
          doctorName: docName,
          onlinePendingDues: dues,
          paidAmount: defaultTotal,
          queueId: qId
        }));

        setItems(defaultItems);
        setAutoFetched(true);

        Swal.fire({
          icon: 'success',
          title: 'Details Auto-Fetched!',
          text: `Fetched info for ${pName || pPhone}.${detectedPrescriptions.length > 0 ? ` Found ${detectedPrescriptions.length} prescribed lab test(s)!` : ''}`,
          timer: 2000,
          showConfirmButton: false,
          background: '#EEF6FA'
        });
      }
    } catch (err) {
      console.warn("Auto-fetch error, switching to manual mode:", err);
      setFormData(prev => ({
        ...prev,
        patientPhone: phoneToSearch,
        patientName: prev.patientName || '',
        paidAmount: items.reduce((s, i) => s + Number(i.amount || 0), 0)
      }));
      setAutoFetched(false);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'New Patient: Enter details manually.',
        showConfirmButton: false,
        timer: 2500
      });
    } finally {
      setFetching(false);
    }
  };

  // Switch Billing Type (Clinic vs Lab)
  const handleBillingTypeSwitch = (type) => {
    setBillingType(type);
    if (type === 'lab') {
      if (doctorPrescriptions.length > 0) {
        setItems(doctorPrescriptions.map(p => ({
          description: p.testName,
          amount: p.fee || billingSettings.feeLab || 450,
          category: 'Lab Test'
        })));
      } else {
        setItems([
          { description: 'Complete Blood Count (CBC)', amount: 350, category: 'Lab Test' }
        ]);
      }
    } else {
      const isFollowup = fetchedQueue?.visitType === 'Follow-up';
      const fee = isFollowup 
        ? (billingSettings.feeFollowupConsult || 300) 
        : (billingSettings.feeConsult || 500);
      setItems([
        { 
          description: fetchedQueue 
            ? `${isFollowup ? 'Follow-up Consultation' : 'Doctor Consultation'} (${formData.doctorName || fetchedQueue.doctorName})` 
            : 'Doctor Consultation Fee', 
          amount: fee, 
          category: 'Consultation' 
        }
      ]);
    }
  };

  // 1-Click Load Doctor Prescriptions into Lab Bill
  const handleLoadDoctorPrescriptions = () => {
    if (!doctorPrescriptions || doctorPrescriptions.length === 0) return;
    setBillingType('lab');
    const newItems = doctorPrescriptions.map(p => ({
      description: p.testName,
      amount: p.fee || billingSettings.feeLab || 450,
      category: 'Lab Test'
    }));
    setItems(newItems);
    const newSub = newItems.reduce((s, i) => s + Number(i.amount || 0), 0);
    const newGrand = newSub + Number(formData.onlinePendingDues || 0);
    setFormData(prev => ({ ...prev, paidAmount: newGrand }));
    Swal.fire({
      icon: 'success',
      title: 'Lab Investigations Loaded!',
      text: `${newItems.length} test(s) prescribed by ${formData.doctorName || 'Doctor'} loaded into bill items.`,
      timer: 1600,
      showConfirmButton: false,
      background: '#EEF6FA'
    });
  };

  const handleAddSinglePrescription = (presc) => {
    const exists = items.some(i => i.description.toLowerCase() === presc.testName.toLowerCase());
    if (exists) {
      Swal.fire({ toast: true, icon: 'info', title: 'Test already in bill items', showConfirmButton: false, timer: 1500 });
      return;
    }
    const newItem = {
      description: presc.testName,
      amount: presc.fee || billingSettings.feeLab || 450,
      category: 'Lab Test'
    };
    setItems(prev => [...prev, newItem]);
    if (billingType !== 'lab') setBillingType('lab');
  };

  // Item Operations
  const handleAddItem = (preset) => {
    if (preset) {
      setItems([...items, preset]);
    } else {
      setItems([...items, { description: '', amount: 0, category: billingType === 'lab' ? 'Lab Test' : 'Consultation' }]);
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = field === 'amount' ? Number(value) : value;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      Swal.fire({ toast: true, icon: 'warning', title: 'At least one item is required', showConfirmButton: false, timer: 2000 });
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculate Financial Metrics
  const subtotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const duesAmount = Number(formData.onlinePendingDues || 0);
  
  // Calculate discount based on Flat (₹) vs Percent (%)
  const discountAmount = discountType === 'percent'
    ? Math.round((subtotal * (Number(discountValue) || 0)) / 100)
    : (Number(discountValue) || 0);

  const taxAmount = customTaxAmount !== null 
    ? Number(customTaxAmount) 
    : (billingSettings.taxEnabled ? Math.max(0, Math.round((subtotal - discountAmount) * (billingSettings.taxRate / 100))) : 0);

  const totalAmount = Math.max(0, subtotal + duesAmount - discountAmount + taxAmount);
  const paidAmount = Number(formData.paidAmount || 0);
  const remainingDue = Math.max(0, totalAmount - paidAmount);

  const getPaymentStatus = () => {
    if (paidAmount >= totalAmount && totalAmount > 0) return 'Paid';
    if (paidAmount > 0 && paidAmount < totalAmount) return 'Partially Paid';
    return 'Pending';
  };

  // Submit Invoice & Auto-Book Appointment
  const handleSubmitInvoice = async (e) => {
    e.preventDefault();
    if (!formData.patientName || !formData.patientPhone) {
      Swal.fire('Required', 'Patient Name and Mobile Phone are required.', 'warning');
      return;
    }

    if (items.some(i => !i.description || i.amount <= 0)) {
      Swal.fire('Invalid Line Items', 'Please ensure all items have valid descriptions and amounts.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        doctorId: formData.doctorId || null,
        doctorName: formData.doctorName || '',
        billingType,
        items,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        onlinePendingDues: duesAmount,
        totalAmount,
        paidAmount,
        remainingDue,
        paymentMode: formData.paymentMode,
        paymentStatus: getPaymentStatus(),
        queueId: formData.queueId,
        notes: formData.notes,
        bookAppointment: bookAppointment
      };

      const res = await axios.post(`${API_URL}/api/billing/create`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const createdInv = res.data.invoice;
        const tokenNum = res.data.tokenNumber;

        if (res.data.revenueStats) {
          setRevenueStats(res.data.revenueStats);
        }

        // Reset Form
        setFormData({
          patientName: '',
          patientPhone: '',
          doctorId: '',
          doctorName: '',
          onlinePendingDues: 0,
          discount: 0,
          paidAmount: 0,
          paymentMode: 'Cash',
          notes: '',
          queueId: null
        });
        setItems(
          billingType === 'lab'
            ? [{ description: 'Complete Blood Count (CBC)', amount: 350, category: 'Hematology' }]
            : [{ description: 'Doctor Consultation Fee', amount: billingSettings.feeConsult || 500, category: 'Consultation' }]
        );
        setBookAppointment(false);
        setDiscountValue(0);
        setCustomTaxAmount(null);
        setSearchPhone('');
        setAutoFetched(false);
        setFetchedQueue(null);
        setDoctorPrescriptions([]);
        fetchInvoices();

        if (tokenNum) {
          // Token booked during creation (or already in queue)
          setSelectedInvoice(createdInv);
          setShowPrintModal(true);

          Swal.fire({
            icon: 'success',
            title: `🎫 Token ${tokenNum} Booked & Invoice Issued!`,
            html: `<p class="font-bold text-lg text-teal-700">Receipt No: ${createdInv.invoiceNumber}</p>` +
                  `<p class="font-black text-emerald-800 my-2 bg-emerald-100 p-2 rounded-xl border border-emerald-300">🎫 Queue Token #${tokenNum} created & active in live queue!</p>` +
                  `<p class="text-xs text-slate-500 mt-1">Total: ₹${createdInv.totalAmount} | Paid: ₹${createdInv.paidAmount}</p>`,
            confirmButtonColor: '#0F766E',
            background: '#EEF6FA'
          });
        } else if (createdInv.billingType === 'clinic') {
          // Bill issued without queue token -> Give Receptionist the option to book token or just receipt
          const askBook = await Swal.fire({
            title: 'Invoice Issued Successfully!',
            html: `
              <div class="space-y-3 text-center">
                <p class="font-bold text-lg text-teal-700">Receipt No: ${createdInv.invoiceNumber}</p>
                <p class="text-xs text-slate-500 mb-3">Total: ₹${createdInv.totalAmount} | Paid: ₹${createdInv.paidAmount}</p>
                <div class="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-left">
                  <p class="text-sm font-bold text-teal-900 flex items-center gap-1.5">
                    ❓ Book Appointment Token for Patient?
                  </p>
                  <p class="text-xs text-teal-700 mt-1">
                    Would you like to book a doctor appointment token in today's live queue for <strong>${createdInv.patientName}</strong>?
                  </p>
                </div>
              </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '🎫 Yes, Book Token Now',
            cancelButtonText: '📄 Just Receipt / Done',
            confirmButtonColor: '#0F766E',
            cancelButtonColor: '#64748B',
            reverseButtons: true
          });

          if (askBook.isConfirmed) {
            await handleBookTokenForInvoice(createdInv);
          } else {
            setSelectedInvoice(createdInv);
            setShowPrintModal(true);
          }
        } else {
          // Lab Invoice
          setSelectedInvoice(createdInv);
          setShowPrintModal(true);

          Swal.fire({
            icon: 'success',
            title: 'Lab Invoice Issued Successfully!',
            html: `<p class="font-bold text-lg text-teal-700">Receipt No: ${createdInv.invoiceNumber}</p>` +
                  `<p class="text-xs text-slate-500 mt-1">Total: ₹${createdInv.totalAmount} | Paid: ₹${createdInv.paidAmount}</p>`,
            confirmButtonColor: '#0F766E',
            background: '#EEF6FA'
          });
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Billing Error', err.response?.data?.message || 'Failed to generate invoice.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Preset Items
  const clinicPresets = [
    { description: 'New Doctor Consultation Fee', amount: billingSettings.feeConsult || 500, category: 'Consultation' },
    { description: 'Follow-up Consultation Fee', amount: billingSettings.feeFollowupConsult || 300, category: 'Consultation' },
    { description: 'Appointment Booking Charge', amount: 100, category: 'Registration' },
    { description: 'Clinic Registration Fee', amount: 50, category: 'Registration' },
    { description: 'Medicines & Prescription', amount: 150, category: 'Medicine' },
    { description: 'Dressing & Procedure Charge', amount: 250, category: 'Procedure' },
    { description: 'Emergency Surcharge', amount: billingSettings.feeEmergency || 300, category: 'Emergency' },
  ];

  const labPresets = [
    { description: 'Complete Blood Count (CBC)', amount: 350, category: 'Hematology' },
    { description: 'Lipid Profile (Cholesterol & Triglycerides)', amount: 650, category: 'Biochemistry' },
    { description: 'Thyroid Profile (T3, T4, TSH)', amount: 550, category: 'Endocrinology' },
    { description: 'Diabetes Screen (HbA1c & Fasting Glucose)', amount: 450, category: 'Diabetes' },
    { description: 'Liver Function Test (LFT)', amount: 750, category: 'Biochemistry' },
    { description: 'Kidney Function Test (KFT / Renal Profile)', amount: 700, category: 'Renal' },
    { description: 'Vitamin D3 & B12 Panel', amount: 1200, category: 'Vitamins' },
    { description: 'Urine Routine & Microscopic Examination', amount: 200, category: 'Clinical Pathology' },
    { description: 'Blood Sugar Fasting / PP', amount: 150, category: 'Biochemistry' },
    { description: 'Chest X-Ray Digital', amount: 400, category: 'Imaging' },
    { description: 'Sample Collection Fee', amount: 50, category: 'Service' },
  ];

  // Settle Outstanding Due on Invoice
  const handleSettleDue = async (inv) => {
    const { value: formValues } = await Swal.fire({
      title: `Collect Balance Due: ₹${(inv.remainingDue || 0).toLocaleString('en-IN')}`,
      html: `
        <div style="text-align:left; font-size:13px; margin-top:10px;">
          <p style="margin-bottom:6px;"><strong>Patient:</strong> ${inv.patientName} (${inv.patientPhone})</p>
          <p style="margin-bottom:12px;"><strong>Invoice:</strong> #${inv.invoiceNumber} (${inv.billingType === 'lab' ? '🔬 Lab' : '🏥 Clinic'})</p>
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
      confirmButtonColor: '#0F766E',
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
          `${API_URL}/api/billing/invoices/${inv._id}/settle-due`,
          formValues,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Payment Recorded!',
            text: res.data.message || 'Balance settled successfully.',
            timer: 1600,
            showConfirmButton: false,
            background: '#EEF6FA'
          });
          fetchInvoices();
        }
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to settle due.', 'error');
      }
    }
  };

  // Book Appointment Token for an Existing Clinic Invoice
  const handleBookTokenForInvoice = async (inv) => {
    const doctorOptions = doctors.map(d => 
      `<option value="${d._id}" ${d._id === inv.doctorId ? 'selected' : ''}>${d.name} (${d.specialization || 'General'})</option>`
    ).join('');

    const { value: selectedDocId } = await Swal.fire({
      title: '🎫 Book Appointment Token',
      html: `
        <div style="text-align:left; font-size:13px; margin-top:10px;">
          <p style="margin-bottom:6px;"><strong>Patient:</strong> ${inv.patientName} (${inv.patientPhone})</p>
          <p style="margin-bottom:12px;"><strong>Receipt:</strong> #${inv.invoiceNumber}</p>
          <label style="display:block; margin-bottom:4px; font-weight:bold; font-size:12px;">Select Doctor for Today's Queue:</label>
          <select id="swal-book-doc-id" class="swal2-select" style="margin:0; width:100%;">
            ${doctorOptions || '<option value="">-- No Doctors Available --</option>'}
          </select>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '🎫 Confirm & Generate Token',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0F766E',
      cancelButtonColor: '#64748B',
      preConfirm: () => {
        const docId = document.getElementById('swal-book-doc-id')?.value;
        if (!docId) {
          Swal.showValidationMessage('Please select a doctor.');
          return false;
        }
        return docId;
      }
    });

    if (selectedDocId) {
      try {
        const res = await axios.post(
          `${API_URL}/api/billing/invoices/${inv._id}/book-appointment`,
          { doctorId: selectedDocId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data.success) {
          const updatedInv = res.data.invoice;
          const tokenNum = res.data.tokenNumber;

          Swal.fire({
            icon: 'success',
            title: `🎫 Token #${tokenNum} Booked!`,
            html: `
              <p class="font-bold text-base text-teal-800">Patient: ${inv.patientName}</p>
              <p class="font-black text-emerald-800 my-2 bg-emerald-100 p-2.5 rounded-xl border border-emerald-300">
                Token #${tokenNum} has been added to live queue!
              </p>
              <p class="text-xs text-slate-500">Invoice #${inv.invoiceNumber} linked to appointment queue.</p>
            `,
            confirmButtonColor: '#0F766E'
          });

          if (updatedInv) {
            setSelectedInvoice(updatedInv);
            setShowPrintModal(true);
          }
          fetchInvoices();
        }
      } catch (err) {
        console.error("Failed to book appointment for invoice:", err);
        Swal.fire({
          icon: 'error',
          title: 'Booking Failed',
          text: err.response?.data?.message || 'Could not generate appointment token.',
          confirmButtonColor: '#0F766E'
        });
      }
    }
  };

  // Generate & Download PDF Invoice
  const handleDownloadInvoicePdf = (inv) => {
    try {
      const doc = new jsPDF({ margin: 15 });
      const isLab = inv.billingType === 'lab';
      const clinicTitle = inv.clinicName || localStorage.getItem('clinicName') || 'SANJIVANI HEALTHCARE';

      // Header Banner
      if (isLab) {
        doc.setFillColor(15, 76, 117); // Lab Navy Blue
      } else {
        doc.setFillColor(15, 118, 110); // Clinic Teal
      }
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(clinicTitle.toUpperCase(), 15, 15);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        isLab 
          ? 'DEPARTMENT OF CLINICAL PATHOLOGY & DIAGNOSTICS' 
          : 'MULTI-SPECIALTY HEALTHCARE & CLINICAL CONSULTATION', 
        15, 23
      );
      doc.text('Valid Electronic Healthcare Receipt • Appointory Network', 15, 29);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(isLab ? 'LABORATORY INVOICE' : 'CONSULTATION RECEIPT', 140, 16);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt #: ${inv.invoiceNumber}`, 140, 23);
      doc.text(`Date: ${new Date(inv.billingDate || inv.createdAt).toLocaleDateString('en-IN')}`, 140, 29);

      // Metadata section
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT DETAILS', 15, 45);
      doc.text('PRACTITIONER / DETAILS', 115, 45);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${inv.patientName}`, 15, 52);
      doc.text(`Phone: ${inv.patientPhone}`, 15, 58);
      if (isLab) {
        doc.text(`Sample ID: LAB-${inv.invoiceNumber}`, 15, 64);
      }

      doc.text(`Doctor: Dr. ${inv.doctorName || 'General Consultant'}`, 115, 52);
      doc.text(`Payment: ${inv.paymentMode} (${inv.paymentStatus})`, 115, 58);
      doc.text(`Billing Type: ${isLab ? 'Laboratory / Diagnostic' : 'Clinical Consultation'}`, 115, 64);

      // Line items table
      const tableRows = (inv.items || []).map((it, idx) => [
        idx + 1,
        it.description,
        it.category || (isLab ? 'Lab Test' : 'Consultation'),
        `₹${(it.amount || 0).toLocaleString('en-IN')}`
      ]);

      autoTable(doc, {
        startY: 70,
        head: [['#', isLab ? 'Investigation / Diagnostic Test' : 'Clinical Service / Description', 'Category', 'Amount (₹)']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: isLab ? [15, 76, 117] : [15, 118, 110] },
        styles: { fontSize: 8.5 }
      });

      const finalY = (doc.lastAutoTable?.finalY || 100) + 8;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`Subtotal: ₹${(inv.subtotal || 0).toLocaleString('en-IN')}`, 130, finalY);

      let offset = 5;
      if (inv.onlinePendingDues > 0) {
        doc.text(`Online Pending Dues: +₹${inv.onlinePendingDues.toLocaleString('en-IN')}`, 130, finalY + offset);
        offset += 5;
      }
      if (inv.discount > 0) {
        doc.text(`Discount: -₹${inv.discount.toLocaleString('en-IN')}`, 130, finalY + offset);
        offset += 5;
      }
      if (inv.tax > 0) {
        doc.text(`Tax / GST: +₹${inv.tax.toLocaleString('en-IN')}`, 130, finalY + offset);
        offset += 5;
      }

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Grand Total: ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}`, 130, finalY + offset + 2);
      doc.setTextColor(16, 185, 129);
      doc.text(`Paid: ₹${(inv.paidAmount || 0).toLocaleString('en-IN')}`, 130, finalY + offset + 8);

      if (inv.remainingDue > 0) {
        doc.setTextColor(239, 68, 68);
        doc.text(`Balance Due: ₹${inv.remainingDue.toLocaleString('en-IN')}`, 130, finalY + offset + 14);
      }

      // Footer
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(8);
      doc.text('Computer-generated healthcare invoice • Valid without physical stamp • Appointory', 15, 280);

      doc.save(`${isLab ? 'Lab' : 'Clinic'}_Invoice_${inv.invoiceNumber}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      Swal.fire('Error', 'Failed to generate PDF invoice.', 'error');
    }
  };

  // WhatsApp Share Receipt
  const handleShareWhatsApp = (inv) => {
    const cleanPhone = (inv.patientPhone || '').replace(/\D/g, '').slice(-10);
    const isLab = inv.billingType === 'lab';
    const clinicTitle = inv.clinicName || localStorage.getItem('clinicName') || 'SANJIVANI HEALTHCARE';
    const header = isLab 
      ? `🔬 *${clinicTitle.toUpperCase()} — PATHOLOGY LAB RECEIPT*` 
      : `🏥 *${clinicTitle.toUpperCase()} — CONSULTATION RECEIPT*`;
    const itemsText = (inv.items || []).map(i => `• ${i.description}: ₹${i.amount}`).join('\n');
    const msg = `${header}\n` +
      `Receipt No: #${inv.invoiceNumber}\n` +
      `Patient: ${inv.patientName} (${inv.patientPhone})\n` +
      `Doctor: Dr. ${inv.doctorName || 'Consultant'}\n` +
      `Date: ${new Date(inv.billingDate || inv.createdAt).toLocaleDateString('en-IN')}\n\n` +
      `*${isLab ? 'Investigations / Diagnostic Tests' : 'Consultation & Services'}:*\n${itemsText}\n\n` +
      `Total: ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}\n` +
      `Paid: ₹${(inv.paidAmount || 0).toLocaleString('en-IN')} (${inv.paymentMode})\n` +
      (inv.remainingDue > 0 ? `*⚠️ Balance Due: ₹${inv.remainingDue.toLocaleString('en-IN')}*\n` : `Status: FULLY PAID ✅\n`) +
      (isLab ? `\nLab sample recorded. Reports will be provided upon completion.` : `\nThank you for visiting! Wish you good health.`);

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Print Invoice Function
  const handlePrint = () => {
    window.print();
  };

  // Copy Receipt Text for Share
  const handleShareReceipt = () => {
    if (!selectedInvoice) return;
    const shareText = `🏥 *HEALTHCARE RECEIPT*\n` +
      `Invoice No: ${selectedInvoice.invoiceNumber}\n` +
      `Patient: ${selectedInvoice.patientName} (${selectedInvoice.patientPhone})\n` +
      `Date: ${new Date(selectedInvoice.billingDate).toLocaleDateString()}\n` +
      `-------------------------\n` +
      selectedInvoice.items.map(i => `• ${i.description}: ₹${i.amount}`).join('\n') + '\n' +
      `-------------------------\n` +
      `Total Amount: ₹${selectedInvoice.totalAmount}\n` +
      `Paid Amount: ₹${selectedInvoice.paidAmount} (${selectedInvoice.paymentMode})\n` +
      `Status: ${selectedInvoice.paymentStatus}\n` +
      (selectedInvoice.remainingDue > 0 ? `Remaining Due: ₹${selectedInvoice.remainingDue}\n` : '') +
      `Thank you! - Appointory Hub`;

    navigator.clipboard.writeText(shareText);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Receipt text copied for SMS/Digital share!',
      showConfirmButton: false,
      timer: 2500
    });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    try {
      const res = await axios.put(`${API_URL}/api/billing/settings`, billingSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBillingSettings(res.data.settings);
        setCustomTaxAmount(null);
        setShowSettingsModal(false);
        Swal.fire({
          icon: 'success',
          title: 'Settings Saved!',
          text: 'Billing tax rates and consultation fees updated.',
          timer: 1800,
          showConfirmButton: false,
          background: '#EEF6FA'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Failed to save settings.', 'error');
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Counts for tabs
  const clinicCount = invoices.filter(i => i.billingType === 'clinic').length;
  const labCount = invoices.filter(i => i.billingType === 'lab').length;
  const dueCount = invoices.filter(i => (i.remainingDue || 0) > 0).length;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !historySearch || 
      inv.patientName?.toLowerCase().includes(historySearch.toLowerCase()) ||
      inv.patientPhone?.includes(historySearch) ||
      inv.invoiceNumber?.toLowerCase().includes(historySearch.toLowerCase());

    if (!matchesSearch) return false;

    if (historyFilter === 'clinic') return inv.billingType === 'clinic';
    if (historyFilter === 'lab') return inv.billingType === 'lab';
    if (historyFilter === 'due') return (inv.remainingDue || 0) > 0;
    return true;
  });

  return (
    <div className="flex min-h-screen bg-slate-50 font-body text-slate-800 flex-col md:flex-row">
      {/* Sidebar Navigation - Dynamic for Receptionist, Admin, or Lab Staff */}
      <Sidebar role={userRole} />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-32 lg:pb-8">
        <main className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Header Bar */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <button 
                onClick={() => navigate('/receptionist/dashboard')}
                className="flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors mb-2 uppercase tracking-wider"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </button>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
                <Receipt className="text-teal-600" size={26} /> Receptionist Billing & Receipts
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Generate invoices, auto-book appointments & track live revenue & pending balance.
              </p>
            </div>

            {/* Billing Actions & Type Switcher */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 border border-slate-200"
                title="Configure Tax Rates & Consultation Fees"
              >
                <Settings size={15} className="text-teal-700" /> Settings
              </button>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 flex-grow sm:flex-initial">
                <button
                  type="button"
                  onClick={() => handleBillingTypeSwitch('clinic')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    billingType === 'clinic' 
                      ? 'bg-teal-700 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope size={15} /> Clinic Billing
                </button>
                <button
                  type="button"
                  onClick={() => handleBillingTypeSwitch('lab')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    billingType === 'lab' 
                      ? 'bg-indigo-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Beaker size={15} /> Lab Billing
                </button>
              </div>
            </div>
          </header>

          {/* 📊 LIVE REVENUE DASHBOARD METRICS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-600" /> Today's Revenue
              </span>
              <p className="text-lg sm:text-2xl font-black text-emerald-700">₹{(revenueStats.todayRevenue || 0).toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-semibold">{revenueStats.invoicesTodayCount || 0} Receipts Billed Today</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <CreditCard size={12} className="text-teal-600" /> Total Collection
              </span>
              <p className="text-lg sm:text-2xl font-black text-teal-700">₹{(revenueStats.totalRevenue || 0).toLocaleString()}</p>
              <span className="text-[10px] text-slate-500 font-semibold">{revenueStats.totalInvoicesCount || 0} Lifetime Receipts</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <AlertTriangle size={12} className="text-rose-500" /> Pending Dues
              </span>
              <p className="text-lg sm:text-2xl font-black text-rose-600">₹{(revenueStats.totalPendingDues || 0).toLocaleString()}</p>
              <span className="text-[10px] text-rose-500 font-semibold">Uncollected Balance</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <CalendarCheck size={12} className="text-indigo-600" /> Revenue Breakdown
              </span>
              <p className="text-xs font-bold text-slate-800">🏥 Clinic: ₹{(revenueStats.clinicRevenue || 0).toLocaleString()}</p>
              <p className="text-xs font-bold text-indigo-700">🔬 Lab: ₹{(revenueStats.labRevenue || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* 🔍 PHONE AUTO-FETCH SEARCH BAR */}
          <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-200 bg-teal-600/40 px-2.5 py-1 rounded-full border border-teal-400/20 inline-flex items-center gap-1">
                  <Sparkles size={10} className="animate-pulse" /> Auto-Fetch & Booking Engine
                </span>
                <h2 className="text-base sm:text-lg font-bold mt-1">Search Patient by Phone Number</h2>
                <p className="text-xs text-teal-100/80">Enter 10-digit mobile number to auto-fill patient profile, appointment doctor, and pending balance.</p>
              </div>
              <span className="text-xs font-semibold text-teal-200/90 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                Mode: <strong className="text-white uppercase">{billingType === 'clinic' ? '🏥 Clinic Receipt' : '🔬 Lab Test Receipt'}</strong>
              </span>
            </div>

            <form onSubmit={handleAutoFetch} className="flex flex-col sm:flex-row gap-3 pt-1">
              <div className="relative flex-grow">
                <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="tel"
                  placeholder="Enter 10-digit Mobile Number (e.g., 9876543210)"
                  value={searchPhone}
                  onChange={(e) => {
                    setSearchPhone(e.target.value);
                    if (e.target.value.length === 10) {
                      setTimeout(() => handleAutoFetch(), 300);
                    }
                  }}
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 shadow-inner"
                  maxLength={10}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowQrScanner(true)}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-teal-200 border border-white/20 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
              >
                <QrCode size={16} /> Scan Patient QR
              </button>

              <button
                type="submit"
                disabled={fetching}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {fetching ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                {fetching ? 'Fetching...' : 'Fetch Data'}
              </button>
            </form>

            {/* Auto-Fetch Status Indicator */}
            {autoFetched && (
              <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl p-3 flex items-start gap-3 text-emerald-100 text-xs animate-fadeIn">
                <CheckCircle2 size={18} className="text-emerald-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-200 text-sm">Data Auto-Fetched Successfully!</p>
                  <p className="text-emerald-100/90 mt-0.5">
                    Synced details for <strong>{formData.patientName}</strong>. 
                    {fetchedQueue ? (
                      <span> Assigned Doctor: <strong>{formData.doctorName}</strong> (Token: {fetchedQueue.tokenNumber}).</span>
                    ) : (
                      <span className="text-teal-200"> (No active appointment token found for today)</span>
                    )}
                    {formData.onlinePendingDues > 0 && (
                      <span className="text-amber-300 font-bold"> ⚠️ Pending Dues: ₹{formData.onlinePendingDues}</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* MAIN BILLING FORM & SUMMARY GRID */}
          <form onSubmit={handleSubmitInvoice} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT 2 COLUMNS: Patient Details & Line Items */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. Patient & Doctor Info Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User size={18} className="text-teal-600" /> Patient & Practitioner Details
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {autoFetched ? 'Auto-Filled' : 'Manual Entry'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Patient Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Patient Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>

                  {/* Patient Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit phone number"
                      value={formData.patientPhone}
                      onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>

                  {/* Doctor Assignment (For Clinic Billing) */}
                  {billingType === 'clinic' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">Assigned Doctor / Practitioner</label>
                      <select
                        value={formData.doctorId}
                        onChange={(e) => {
                          const doc = doctors.find(d => d._id === e.target.value);
                          setFormData({
                            ...formData,
                            doctorId: e.target.value,
                            doctorName: doc ? doc.name : ''
                          });
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-none"
                      >
                        <option value="">-- Select Doctor --</option>
                        {doctors.map(d => (
                          <option key={d._id} value={d._id}>
                            {d.name} ({d.specialization || 'General'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Queue Context Badge / Booking Option */}
                {fetchedQueue ? (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 flex items-center justify-between text-xs text-teal-900">
                    <span className="font-bold flex items-center gap-1.5">
                      <Clock size={14} className="text-teal-600" /> Active Token: <strong>{fetchedQueue.tokenNumber}</strong> ({fetchedQueue.visitType})
                    </span>
                    <span className="px-2.5 py-0.5 bg-teal-700 text-white font-black rounded-md text-[10px] uppercase">
                      {fetchedQueue.status}
                    </span>
                  </div>
                ) : billingType === 'clinic' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${bookAppointment ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          Book Doctor Appointment Token Now?
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {bookAppointment ? 'An active token (T-x) will be booked in live queue upon billing.' : 'Only generate bill/receipt now. Token can be booked after billing or anytime later.'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookAppointment}
                        onChange={(e) => setBookAppointment(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                ) : null}
              </div>

              {/* 🔬 DOCTOR PRESCRIBED LAB INVESTIGATIONS BANNER */}
              {doctorPrescriptions.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-teal-50 border-2 border-indigo-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                        <FlaskConical size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md tracking-wider">
                            Doctor Prescribed Investigations
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {doctorPrescriptions.length} test{doctorPrescriptions.length > 1 ? 's' : ''} recommended
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">
                          Prescribed by Dr. {formData.doctorName || fetchedQueue?.doctorName || 'Consultant'}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLoadDoctorPrescriptions}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <Plus size={15} /> Load All to Lab Bill
                    </button>
                  </div>

                  {/* Individual test chips */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-indigo-100/80">
                    {doctorPrescriptions.map((presc, pIdx) => (
                      <div 
                        key={pIdx}
                        className="bg-white/95 border border-indigo-200/90 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-2xs"
                      >
                        <Beaker size={13} className="text-indigo-600" />
                        <span className="text-xs font-bold text-slate-800">{presc.testName}</span>
                        <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          ₹{presc.fee}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddSinglePrescription(presc)}
                          className="text-[10px] font-black text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded transition-colors"
                          title="Add this test to bill"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Billing Line Items Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText size={18} className="text-teal-600" /> Line Items ({billingType === 'clinic' ? 'Consultation & Services' : 'Lab Tests'})
                    </h3>
                    <p className="text-xs text-slate-500">Add, remove, or edit custom prices for each line item.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddItem(null)}
                    className="self-start sm:self-auto px-3.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 border border-teal-200"
                  >
                    <Plus size={14} /> Add Custom Item
                  </button>
                </div>

                {/* Preset Quick Add Chips */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quick Add Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(billingType === 'clinic' ? clinicPresets : labPresets).map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddItem(preset)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80 transition-all flex items-center gap-1"
                      >
                        <Plus size={11} /> {preset.description} (₹{preset.amount})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Line Items Input Table */}
                <div className="space-y-3 pt-2">
                  {items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                      {/* Item Description */}
                      <div className="w-full sm:flex-grow">
                        <label className="block text-[10px] font-bold text-slate-400 sm:hidden mb-0.5">Description</label>
                        <input
                          type="text"
                          required
                          placeholder="Item description (e.g. Doctor Consultation)"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      {/* Category */}
                      <div className="w-full sm:w-36">
                        <label className="block text-[10px] font-bold text-slate-400 sm:hidden mb-0.5">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(index, 'category', e.target.value)}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                        >
                          <option value="Consultation">Consultation</option>
                          <option value="Registration">Registration</option>
                          <option value="Lab Test">Lab Test</option>
                          <option value="Medicine">Medicine</option>
                          <option value="Procedure">Procedure</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Service">Service</option>
                        </select>
                      </div>

                      {/* Amount */}
                      <div className="w-full sm:w-32 relative">
                        <label className="block text-[10px] font-bold text-slate-400 sm:hidden mb-0.5">Amount (₹)</label>
                        <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold sm:block hidden">₹</span>
                        <input
                          type="number"
                          required
                          min="0"
                          placeholder="0"
                          value={item.amount}
                          onChange={(e) => handleUpdateItem(index, 'amount', e.target.value)}
                          className="w-full sm:pl-7 pl-3 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors self-end sm:self-auto"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Summary & Payment Tracker ("Paisa Bakki") */}
            <div className="space-y-6">
              
              {/* Financial Calculation & Payment Card */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                  <CreditCard size={18} className="text-teal-600" /> Billing Summary & Payment
                </h3>

                {/* 🔴 ONLINE BOOKING & PENDING DUES ("PAISA BAKKI") NOTIFICATION */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle size={15} className="text-amber-600" /> Online Pending Dues:
                    </label>
                    <span className="text-xs font-black text-amber-700">₹{duesAmount}</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter pending dues amount if any"
                    value={formData.onlinePendingDues}
                    onChange={(e) => setFormData({ ...formData, onlinePendingDues: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-amber-700 font-medium">
                    Auto-added for online bookings with pending payment balance.
                  </p>
                </div>

                {/* Financial Breakdown List */}
                <div className="space-y-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span className="font-bold text-slate-900">₹{subtotal}</span>
                  </div>

                  {duesAmount > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Online Pending Dues:</span>
                      <span className="font-bold">+ ₹{duesAmount}</span>
                    </div>
                  )}

                  {/* Discount Input with Flat vs % Toggle */}
                  <div className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-1.5">
                      <span>Discount:</span>
                      <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('flat')}
                          className={`px-1.5 py-0.5 rounded transition-all ${discountType === 'flat' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-500'}`}
                        >
                          ₹ Flat
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percent')}
                          className={`px-1.5 py-0.5 rounded transition-all ${discountType === 'percent' ? 'bg-white text-emerald-700 shadow-2xs font-black' : 'text-slate-500'}`}
                        >
                          % Off
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percent' ? 100 : undefined}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-md text-right text-xs font-bold text-emerald-700 focus:outline-none"
                      />
                      <span className="text-[11px] font-bold text-slate-500">{discountType === 'flat' ? '₹' : '%'}</span>
                      {discountType === 'percent' && discountAmount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 ml-1">(-₹{discountAmount})</span>
                      )}
                    </div>
                  </div>

                  {/* Tax Input */}
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5">
                      Tax / GST (₹):
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${billingSettings.taxEnabled ? 'bg-teal-100 text-teal-800' : 'bg-slate-200 text-slate-500'}`}>
                        {billingSettings.taxEnabled ? `Auto ${billingSettings.taxRate}%` : 'Off'}
                      </span>
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={customTaxAmount !== null ? customTaxAmount : taxAmount}
                      onChange={(e) => setCustomTaxAmount(Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-md text-right text-xs font-bold text-slate-800 focus:outline-none focus:border-teal-600"
                    />
                  </div>

                  <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-black text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-teal-700 text-base">₹{totalAmount}</span>
                  </div>
                </div>

                {/* Payment Received Input */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Received Now (₹) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-emerald-50/60 border border-emerald-300 rounded-xl text-base font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Payment Mode Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Cash', 'UPI', 'Card', 'Net Banking'].map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMode: mode })}
                          className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                            formData.paymentMode === mode
                              ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Remaining Due ("Bakki Balance") Badge */}
                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                    remainingDue > 0 
                      ? 'bg-rose-50 border-rose-200 text-rose-800' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}>
                    <span>Status: <strong>{getPaymentStatus()}</strong></span>
                    <span>
                      {remainingDue > 0 ? `Remaining Balance: ₹${remainingDue}` : '✓ Fully Paid'}
                    </span>
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Billing Notes / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Optional remarks (e.g. Paid via PhonePe UPI)..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                {/* Submit / Issue Receipt Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="animate-spin" size={16} /> : <Printer size={16} />}
                  {submitting ? 'Generating Invoice...' : (bookAppointment ? 'Generate Invoice & Book Appointment' : 'Generate Invoice')}
                </button>
              </div>
            </div>
          </form>

          {/* RECENT INVOICES HISTORY SECTION */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock size={18} className="text-teal-600" /> Recent Billing Records
                </h3>
                <p className="text-xs text-slate-500">History of generated receipts for clinic consultations and diagnostic lab tests.</p>
              </div>

              {/* Tabs & Search Filter */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      historyFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({invoices.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('clinic')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      historyFilter === 'clinic'
                        ? 'bg-teal-700 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Stethoscope size={12} /> Clinic ({clinicCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('lab')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      historyFilter === 'lab'
                        ? 'bg-indigo-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Beaker size={12} /> Lab ({labCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryFilter('due')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                      historyFilter === 'due'
                        ? 'bg-rose-600 text-white shadow-2xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <AlertTriangle size={12} /> Dues ({dueCount})
                  </button>
                </div>

                {/* Search History */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search patient, phone, inv #"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {loadingInvoices ? (
              <div className="py-8 text-center text-xs text-slate-400 font-bold animate-pulse">
                Loading recent invoices...
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                No billing invoices found matching the selected filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Invoice #</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Patient</th>
                      <th className="p-3">Doctor</th>
                      <th className="p-3">Total (₹)</th>
                      <th className="p-3">Paid (₹)</th>
                      <th className="p-3">Balance (₹)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {filteredInvoices.slice(0, 20).map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-teal-700">{inv.invoiceNumber}</td>
                        <td className="p-3 text-slate-500">{new Date(inv.billingDate).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            inv.billingType === 'lab'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}>
                            {inv.billingType === 'lab' ? <Beaker size={10} /> : <Stethoscope size={10} />}
                            {inv.billingType === 'lab' ? 'Lab' : 'Clinic'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {inv.patientName}
                          <span className="block text-[10px] font-normal text-slate-400">{inv.patientPhone}</span>
                        </td>
                        <td className="p-3 text-slate-600">
                          <div>{inv.doctorName || 'N/A'}</div>
                          {inv.billingType === 'clinic' && (
                            inv.queueId ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5">
                                <Ticket size={10} /> In Queue
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5">
                                Bill Only
                              </span>
                            )
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">₹{(inv.totalAmount || 0).toLocaleString()}</td>
                        <td className="p-3 font-bold text-emerald-700">₹{(inv.paidAmount || 0).toLocaleString()}</td>
                        <td className="p-3 font-bold">
                          {inv.remainingDue > 0 ? (
                            <span className="text-rose-600 font-black">₹{(inv.remainingDue).toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-400 font-normal">₹0</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            inv.paymentStatus === 'Paid' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : inv.paymentStatus === 'Partially Paid' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.billingType === 'clinic' && !inv.queueId && (
                              <button
                                type="button"
                                onClick={() => handleBookTokenForInvoice(inv)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-lg text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1 shadow-2xs"
                                title="Book Doctor Appointment Token"
                              >
                                <Ticket size={11} /> Book Token
                              </button>
                            )}
                            {inv.remainingDue > 0 && (
                              <button
                                type="button"
                                onClick={() => handleSettleDue(inv)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1 shadow-2xs"
                                title="Collect Outstanding Dues"
                              >
                                <DollarSign size={11} /> Collect Due
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowPrintModal(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1 border border-slate-200"
                              title="View & Print Receipt"
                            >
                              <Eye size={12} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoicePdf(inv)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors inline-flex items-center border border-slate-200"
                              title="Download PDF"
                            >
                              <FileDown size={14} className="text-teal-700" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 📄 PRINTABLE / DIGITAL RECEIPT MODAL */}
      {showPrintModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 space-y-4 my-8 animate-scaleIn">
            
            {/* Modal Action Header (Hidden during window.print) */}
            <div className={`p-4 flex flex-wrap justify-between items-center gap-2 print:hidden ${
              selectedInvoice.billingType === 'lab' ? 'bg-slate-900 text-white' : 'bg-slate-900 text-white'
            }`}>
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                {selectedInvoice.billingType === 'lab' ? (
                  <><Beaker size={16} className="text-indigo-400" /> Lab Diagnostic Invoice</>
                ) : (
                  <><Receipt size={16} className="text-teal-400" /> Clinical Receipt</>
                )}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShareReceipt}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                  title="Copy receipt text to clipboard"
                >
                  <Share2 size={13} /> Copy
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedInvoice)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                  title="Share invoice on WhatsApp"
                >
                  <MessageCircle size={13} /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoicePdf(selectedInvoice)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                  title="Download standard PDF receipt"
                >
                  <FileDown size={13} /> PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                  title="Print paper receipt"
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* PRINTABLE RECEIPT BODY - Full Page Professional Layout */}
            <div id="printable-receipt-area" className="p-6 md:p-8 space-y-6 text-slate-800 text-xs font-body bg-white">
              
              {/* Header Info with Clinic / Lab Personalization */}
              <div className={`border-b-2 pb-5 flex justify-between items-start gap-4 ${
                selectedInvoice.billingType === 'lab' ? 'border-indigo-900' : 'border-slate-900'
              }`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center font-black text-sm print:border ${
                      selectedInvoice.billingType === 'lab' ? 'bg-indigo-800' : 'bg-slate-900'
                    }`}>
                      {selectedInvoice.billingType === 'lab' ? '🔬' : '🏥'}
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                      {selectedInvoice.clinicName || localStorage.getItem('clinicName') || 'SANJIVANI HEALTHCARE'}
                    </h2>
                  </div>
                  <p className="text-[11px] font-bold text-slate-600">
                    {selectedInvoice.billingType === 'lab'
                      ? 'Clinical Pathology & Diagnostic Testing Center'
                      : (selectedInvoice.clinicAddress || 'Multi-Specialty Medical & Diagnostic Center')}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Contact: +91 98765 43210 | GSTIN / Reg: 24AAACS9081F1Z8
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-1.5 border ${
                    selectedInvoice.paymentStatus === 'Paid' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}>
                    {selectedInvoice.paymentStatus === 'Paid' ? '✓ PAID RECEIPT' : '⚠️ BALANCE DUE'}
                  </span>
                  <h3 className={`text-sm font-black tracking-wider uppercase block ${
                    selectedInvoice.billingType === 'lab' ? 'text-indigo-900' : 'text-slate-900'
                  }`}>
                    {selectedInvoice.billingType === 'lab' ? 'PATHOLOGY INVOICE' : 'TAX INVOICE'}
                  </h3>
                  <p className="text-xs font-bold text-slate-700">
                    No: <span className="font-black text-slate-900">{selectedInvoice.invoiceNumber}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Date: {new Date(selectedInvoice.billingDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Patient & Practitioner Details Grid */}
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl border text-xs ${
                selectedInvoice.billingType === 'lab' ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50/80 border-slate-200'
              }`}>
                <div className="space-y-1">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Billed To (Patient)</span>
                  <strong className="text-slate-900 block text-sm font-black">{selectedInvoice.patientName}</strong>
                  <p className="text-slate-600 font-medium">Mobile: {selectedInvoice.patientPhone}</p>
                  {selectedInvoice.billingType === 'lab' && (
                    <p className="text-indigo-700 font-black text-[10px] uppercase">
                      Sample ID: LAB-{selectedInvoice.invoiceNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {selectedInvoice.billingType === 'lab' ? 'Referred By / Mode' : 'Consultant / Service Mode'}
                  </span>
                  <strong className="text-slate-900 block text-sm font-black">Dr. {selectedInvoice.doctorName || 'General Practitioner'}</strong>
                  <p className={`font-bold uppercase tracking-wider text-[11px] ${
                    selectedInvoice.billingType === 'lab' ? 'text-indigo-700' : 'text-teal-700'
                  }`}>
                    {selectedInvoice.billingType === 'lab' ? '🔬 Diagnostic Lab Testing' : '🏥 Clinical Consultation'}
                  </p>
                </div>
              </div>

              {/* Itemized Charges Table */}
              <div className="space-y-2">
                <table className="w-full border-collapse text-left border border-slate-200">
                  <thead>
                    <tr className={`text-white text-[10px] uppercase font-black tracking-wider ${
                      selectedInvoice.billingType === 'lab' ? 'bg-indigo-900' : 'bg-slate-900'
                    }`}>
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      <th className="py-2.5 px-3">
                        {selectedInvoice.billingType === 'lab' ? 'Investigation / Diagnostic Test' : 'Service / Item Description'}
                      </th>
                      <th className="py-2.5 px-3 w-28">Category</th>
                      <th className="py-2.5 px-3 text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs font-medium">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                        <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-slate-900 font-bold">{item.description}</td>
                        <td className="py-2.5 px-3 text-slate-500 uppercase text-[10px] font-bold">
                          {item.category || (selectedInvoice.billingType === 'lab' ? 'Lab Test' : 'General')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">₹{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary & Totals */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
                <div className="text-[11px] text-slate-500 space-y-1 max-w-xs">
                  <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Payment Information:</p>
                  <p>• Payment Mode: <strong className="text-slate-900">{selectedInvoice.paymentMode}</strong></p>
                  <p>• Status: <strong className="text-slate-900">{selectedInvoice.paymentStatus}</strong></p>
                  <p className="italic text-[10px] text-slate-400 pt-1">Computer generated electronic bill. Valid without physical stamp.</p>
                </div>

                <div className="w-full sm:w-64 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-semibold">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-900">₹{selectedInvoice.subtotal}</span>
                  </div>

                  {selectedInvoice.onlinePendingDues > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>Online Pending Dues:</span>
                      <span className="font-bold">+ ₹{selectedInvoice.onlinePendingDues}</span>
                    </div>
                  )}

                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discount:</span>
                      <span className="font-bold">- ₹{selectedInvoice.discount}</span>
                    </div>
                  )}

                  {selectedInvoice.tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax / GST:</span>
                      <span className="font-bold">+ ₹{selectedInvoice.tax}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2">
                    <span>Grand Total:</span>
                    <span className="text-slate-900">₹{selectedInvoice.totalAmount}</span>
                  </div>

                  <div className="flex justify-between text-xs font-bold text-emerald-800 pt-1">
                    <span>Amount Paid ({selectedInvoice.paymentMode}):</span>
                    <span className="font-black">₹{selectedInvoice.paidAmount}</span>
                  </div>

                  {selectedInvoice.remainingDue > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold border-t border-rose-200 pt-1">
                      <span>Balance Dues:</span>
                      <span className="font-black">₹{selectedInvoice.remainingDue}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatory & Footer */}
              <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-[10px]">
                <div className="space-y-1">
                  <p className="font-black text-slate-700 uppercase tracking-wider">Thank you for visiting!</p>
                  <p className="text-slate-500">
                    {selectedInvoice.billingType === 'lab'
                      ? 'Sample verified. Accurate lab reports will be prepared promptly.'
                      : 'Wishing you good health and a speedy recovery.'}
                  </p>
                </div>

                <div className="text-center space-y-8">
                  <div className="border-b border-slate-400 w-36 mx-auto" />
                  <p className="font-black text-slate-800 uppercase tracking-wider">
                    {selectedInvoice.billingType === 'lab' ? 'Chief Pathologist / Lab In-Charge' : 'Authorized Signatory'}
                  </p>
                </div>
              </div>

              {/* Appointory Powered Footer Credit */}
              <div className="pt-3 border-t border-slate-100 text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Bill Generated via Appointory Healthcare Platform • www.appointory.in
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ⚙️ BILLING & TAX SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings className="text-teal-600" size={20} /> Billing & Tax Settings
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Tax Auto Calculation Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">Automatic Tax / GST Calculation</label>
                  <p className="text-[11px] text-slate-500">Enable automatic tax addition on bill subtotal.</p>
                </div>
                <input
                  type="checkbox"
                  checked={billingSettings.taxEnabled}
                  onChange={(e) => setBillingSettings({ ...billingSettings, taxEnabled: e.target.checked })}
                  className="w-5 h-5 accent-teal-700 rounded cursor-pointer"
                />
              </div>

              {/* Tax Rate % Input */}
              {billingSettings.taxEnabled && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Default Tax / GST Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={billingSettings.taxRate}
                      onChange={(e) => setBillingSettings({ ...billingSettings, taxRate: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                  </div>
                </div>
              )}

              {/* Consultation Fees Configuration */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Fixed Consultation Fee Rates</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Consultation (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={billingSettings.feeConsult}
                      onChange={(e) => setBillingSettings({ ...billingSettings, feeConsult: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Follow-up Visit (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={billingSettings.feeFollowupConsult}
                      onChange={(e) => setBillingSettings({ ...billingSettings, feeFollowupConsult: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingSettings}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  {updatingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📷 QR SCANNER MODAL */}
      <QrScannerModal
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScanSuccess={(scannedPatient) => {
          setSearchPhone(scannedPatient.phone);
          setShowQrScanner(false);
          // auto trigger fetch
          setTimeout(() => {
            const fetchBtn = document.querySelector('button[type="submit"]');
            fetchBtn?.click();
          }, 150);
        }}
        navigate={navigate}
      />
    </div>
  );
};

export default ReceptionistBilling;
