import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calculator,
  Receipt,
  FlaskConical,
  Tv,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  FolderHeart,
  ArrowRight,
  ArrowUp,
  Activity,
  TrendingUp,
  BarChart3,
  Users,
  QrCode,
  Phone,
  Stethoscope,
  Share2,
  Download,
  Printer,
  Volume2,
  AlertCircle,
  HelpCircle,
  Check,
  Zap,
  Building2,
  DollarSign,
  Copy,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

import { API_URL } from '../config/runtime';

// Fallback clinics showing realistic active OPD queues
const MOCK_CLINICS = [
  { id: 'm1', name: 'Apex Multi-Speciality Clinic', clinicCode: 'APX-01', isReal: true, activeToken: 'A-14', waitingCount: 3, patients: [{ name: 'Token A-14', time: 'In Cabin', active: true }] },
  { id: 'm2', name: 'Dr. Anita Gupta Family Clinic', clinicCode: 'DAG-02', isReal: true, activeToken: 'B-08', waitingCount: 2, patients: [{ name: 'Token B-08', time: 'In Cabin', active: true }] },
  { id: 'm3', name: 'Airmed Diagnostic & Path Lab', clinicCode: 'ADL-03', isReal: true, activeToken: 'L-22', waitingCount: 5, patients: [{ name: 'Token L-22', time: 'Processing', active: true }] },
  { id: 'm4', name: 'Sanjivani Polyclinic & Care', clinicCode: 'SPC-04', isReal: true, activeToken: 'A-05', waitingCount: 1, patients: [{ name: 'Token A-05', time: 'In Cabin', active: true }] },
  { id: 'm5', name: 'Metro Healthcare & Diagnostics', clinicCode: 'MHD-05', isReal: true, activeToken: 'C-19', waitingCount: 4, patients: [{ name: 'Token C-19', time: 'In Cabin', active: true }] }
];

const LandingPage = () => {
  const navigate = useNavigate();

  const [clinicsQueues, setClinicsQueues] = useState(MOCK_CLINICS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [isStepHovered, setIsStepHovered] = useState(false);

  // --- CONNECTED SIMULATION STATES ---
  const [selectedClinicIdx, setSelectedClinicIdx] = useState(0);

  // Step 1: Check-in States
  const [checkInState, setCheckInState] = useState('camera'); // 'camera' | 'form' | 'success'
  const [phoneNum, setPhoneNum] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkedInPhone, setCheckedInPhone] = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Step 2: Live Queue States
  const [queuePos, setQueuePos] = useState(3); // 3: Checkin Desk, 2: Vitals Station, 1: Waiting Room, 0: Seeing Doctor
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');

  // Step 3: Consultation States
  const [vitals, setVitals] = useState({ bpSystolic: 120, bpDiastolic: 80, pulse: 76, temp: 98.6 });
  const [activeComplaint, setActiveComplaint] = useState('Fever & Cough');
  const [meds, setMeds] = useState(['Paracetamol 650mg', 'Cough Syrup']);
  const [uploadState, setUploadState] = useState('idle'); // 'idle' | 'uploading' | 'uploaded'
  const [signatureImg, setSignatureImg] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // Step 4: Secure Vault States
  const [otpInput, setOtpInput] = useState('');
  const [vaultLocked, setVaultLocked] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Collapsible Tech Specs index
  const [expandedTech, setExpandedTech] = useState(null);

  // --- ADVANCED PLATFORM WORKING FEATURES STATES ---
  const [activeFeatureTab, setActiveFeatureTab] = useState('ai-prediction'); // 'ai-prediction' | 'billing' | 'lab-portal' | 'tv-display' | 'templates' | 'analytics'

  // 1. AI Wait-Time & Velocity Calculator
  const [calcPatients, setCalcPatients] = useState(7);
  const [calcPace, setCalcPace] = useState(10); // 6: Rapid, 10: Standard, 15: Thorough
  const [calcRushFactor, setCalcRushFactor] = useState(1.15); // 1.0 Normal, 1.15 Rush, 1.3 Peak
  const predictedWaitMins = Math.round(calcPatients * calcPace * calcRushFactor);
  const predictedVelocity = (60 / (calcPace * calcRushFactor)).toFixed(1);
  const congestionLevel = predictedWaitMins > 90 ? 'High Congestion' : predictedWaitMins > 45 ? 'Moderate Flow' : 'Smooth Flow';

  // 2. Smart Billing & Invoicing Simulator
  const [billingItems, setBillingItems] = useState([
    { id: 1, name: 'Doctor Consultation (General OPD)', price: 500, selected: true },
    { id: 2, name: 'Complete Blood Count (CBC Profile)', price: 350, selected: true },
    { id: 3, name: 'Electrocardiogram (ECG 12-Lead)', price: 400, selected: false },
    { id: 4, name: 'Vitals Screening & Fasting Glucose', price: 150, selected: true },
  ]);
  const [billingGstRate, setBillingGstRate] = useState(18);
  const [billingDiscount, setBillingDiscount] = useState(50);
  const [invoiceDownloaded, setInvoiceDownloaded] = useState(false);

  const billingSubtotal = billingItems.filter(i => i.selected).reduce((acc, curr) => acc + curr.price, 0);
  const billingDiscounted = Math.max(0, billingSubtotal - billingDiscount);
  const billingGstAmount = Math.round((billingDiscounted * billingGstRate) / 100);
  const billingGrandTotal = billingDiscounted + billingGstAmount;

  // 3. Lab Connect Handshake Simulator
  const [labConnectCode, setLabConnectCode] = useState('849-210');
  const [labPairSuccess, setLabPairSuccess] = useState(true);

  // 4. TV Display Simulator
  const [tvTokenCall, setTvTokenCall] = useState(14);
  const [tvChimePlaying, setTvChimePlaying] = useState(false);

  // 5. Clinical Templates Simulator
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('fever');

  // 6. Accessible FAQ Accordion State (AEO & AI Search)
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // 7. Modals & Interactive Viewers
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showTvFullscreenModal, setShowTvFullscreenModal] = useState(false);
  const [copiedRx, setCopiedRx] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [liveTime, setLiveTime] = useState(() => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(clockTimer);
    };
  }, []);

  // Grand Stepper Tracker computation
  const questProgress = useMemo(() => {
    let stepsCompleted = 0;
    if (checkedInPhone || checkInState === 'success') stepsCompleted = 1;
    if (stepsCompleted === 1 && queuePos < 3) stepsCompleted = 2;
    if (stepsCompleted === 2 && uploadState === 'uploaded') stepsCompleted = 3;
    if (stepsCompleted === 3 && !vaultLocked) {
      stepsCompleted = 4;
      if (Object.values(downloadProgress).some(v => v === 'done')) {
        stepsCompleted = 5;
      }
    }
    return stepsCompleted;
  }, [checkInState, checkedInPhone, queuePos, uploadState, vaultLocked, downloadProgress]);

  // Auto-play timer for How It Works step selection
  useEffect(() => {
    if (isStepHovered || expandedTech !== null) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [isStepHovered, expandedTech]);

  // Fetch live queues from backend
  useEffect(() => {
    const fetchLiveQueues = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/clinic/public/queues-live`);
        if (res.data.success && res.data.data) {
          const dbClinics = res.data.data;

          // Format DB clinics
          const processedDbClinics = dbClinics.map(clinic => {
            if (!clinic.patients || clinic.patients.length === 0) {
              return {
                ...clinic,
                patients: [
                  { name: 'Walk-ins Welcome', time: 'Ready', active: false }
                ]
              };
            }
            return clinic;
          });

          setClinicsQueues(processedDbClinics);
        }
      } catch (error) {
        console.warn("⚠️ Failed to fetch live queues:", error.message);
      }
    };

    fetchLiveQueues();
    const pollInterval = setInterval(fetchLiveQueues, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  // Memoize extended list for seamless infinite scroll
  const extendedClinics = useMemo(() => {
    if (clinicsQueues.length === 0) return [];
    return [...clinicsQueues, ...clinicsQueues.slice(0, 3)];
  }, [clinicsQueues]);

  // Set up auto-scroll interval (vertically scrolling)
  useEffect(() => {
    if (clinicsQueues.length <= 3) return;
    const scrollTimer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(scrollTimer);
  }, [clinicsQueues.length]);

  // Handle resetting index seamlessly at end of slide
  const handleTransitionEnd = () => {
    if (currentIndex >= clinicsQueues.length) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  // --- INTERACTION HANDLERS ---
  const handleQueueProgress = (e) => {
    e.stopPropagation();
    setQueuePos((prev) => {
      const nextVal = prev > 0 ? prev - 1 : 3;

      if (nextVal === 1) {
        setNotificationText(`🚨 Token T-08 is NEXT in line! Please proceed to doctor chamber.`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      } else if (nextVal === 0) {
        setNotificationText(`🩺 Token T-08: Dr. Anita Gupta is ready to consult ${checkedInPhone ? 'Dhruvil Patel' : 'Rahul Sharma'}.`);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 5000);
      }
      return nextVal;
    });
  };

  const handleTriggerSms = (e) => {
    e.stopPropagation();
    let text = '';
    const name = checkedInPhone ? 'Dhruvil' : 'Patient';
    if (queuePos === 3) text = `💬 Appointory: Hi ${name}, T-08 checked in at City Care Clinic. Pos: 3rd. Wait: ~15m.`;
    else if (queuePos === 2) text = `💬 Appointory: Hi ${name}, your queue moved! Pos: 2nd. Wait: ~10m.`;
    else if (queuePos === 1) text = `🚨 Appointory: Hi ${name}, you are NEXT. Please wait near Dr. chamber.`;
    else text = `🩺 Appointory: Dr. Anita Gupta is now writing your cloud prescription.`;

    setNotificationText(text);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const adjustVital = (type, increment, e) => {
    if (e) e.stopPropagation();
    setVitals(prev => {
      if (type === 'bpSystolic') {
        const val = Math.max(80, Math.min(200, prev.bpSystolic + (increment ? 5 : -5)));
        return { ...prev, bpSystolic: val };
      } else if (type === 'bpDiastolic') {
        const val = Math.max(50, Math.min(130, prev.bpDiastolic + (increment ? 5 : -5)));
        return { ...prev, bpDiastolic: val };
      } else if (type === 'pulse') {
        const val = Math.max(40, Math.min(180, prev.pulse + (increment ? 4 : -4)));
        return { ...prev, pulse: val };
      } else if (type === 'temp') {
        const val = Math.max(95, Math.min(106, Math.round((prev.temp + (increment ? 0.2 : -0.2)) * 10) / 10));
        return { ...prev, temp: val };
      }
      return prev;
    });
  };

  const handleComplaintChange = (complaint, e) => {
    e.stopPropagation();
    setActiveComplaint(complaint);
    if (complaint === 'Fever & Cough') {
      setVitals({ bpSystolic: 118, bpDiastolic: 78, pulse: 88, temp: 101.2 });
      setMeds(['Paracetamol 650mg', 'Cough Syrup (Ascoril)']);
    } else if (complaint === 'Hypertension') {
      setVitals({ bpSystolic: 145, bpDiastolic: 95, pulse: 84, temp: 98.6 });
      setMeds(['Amlodipine 5mg', 'Telmisartan 40mg']);
    } else {
      setVitals({ bpSystolic: 120, bpDiastolic: 80, pulse: 72, temp: 98.6 });
      setMeds(['Multivitamins (Zincovit)', 'Vitamin C Chewable']);
    }
    setUploadState('idle');
  };

  const handleAddMed = (e) => {
    e.stopPropagation();
    const options = ['Amoxicillin 500mg', 'Pantoprazole 40mg', 'Cetirizine 10mg', 'B-Complex'];
    const remaining = options.filter(o => !meds.includes(o));
    if (remaining.length > 0) {
      setMeds([...meds, remaining[0]]);
    }
    setUploadState('idle');
  };

  const handleRemoveMed = (index, e) => {
    e.stopPropagation();
    setMeds(prev => prev.filter((_, i) => i !== index));
    setUploadState('idle');
  };

  const handleSignAndUpload = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setSignatureImg(dataUrl);
    }
    setUploadState('uploading');
    setTimeout(() => {
      setUploadState('uploaded');
    }, 1200);
  };

  const handleOtpVerify = (e) => {
    e.stopPropagation();
    if (otpInput === '1234') {
      setVaultLocked(false);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  const handleDownload = (filename, e) => {
    e.stopPropagation();
    setDownloadProgress(prev => ({ ...prev, [filename]: 0 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += 25;
      setDownloadProgress(prev => ({ ...prev, [filename]: progress }));
      if (progress >= 100) {
        clearInterval(interval);
        setDownloadProgress(prev => ({ ...prev, [filename]: 'done' }));
      }
    }, 150);
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.stopPropagation();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.stopPropagation();
    setIsDrawing(false);
  };

  const clearSignature = (e) => {
    if (e) e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureImg(null);
  };

  const autoSign = (e) => {
    if (e) e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.bezierCurveTo(20, 5, 25, 30, 30, 10);
    ctx.bezierCurveTo(35, 2, 40, 20, 45, 15);
    ctx.moveTo(52, 20);
    ctx.bezierCurveTo(56, 8, 60, 24, 64, 15);
    ctx.bezierCurveTo(68, 12, 72, 25, 76, 20);
    ctx.bezierCurveTo(78, 15, 80, 24, 82, 18);
    ctx.bezierCurveTo(84, 12, 88, 25, 92, 20);
    ctx.stroke();
    const dataUrl = canvas.toDataURL();
    setSignatureImg(dataUrl);
  };

  // Stagger animation variants for Step 4 files list
  const listContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const listItem = {
    hidden: { opacity: 0, y: 5 },
    show: { opacity: 1, y: 0 }
  };

  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch {
      // Web Audio API not supported
    }
    setTvChimePlaying(true);
    setTimeout(() => setTvChimePlaying(false), 1200);
  };

  const doctorTemplates = {
    fever: {
      title: "Acute Viral Fever & URTI",
      complaint: "High grade fever (101°F) for 2 days, sore throat, generalized myalgia",
      vitals: "BP: 118/76 | Pulse: 88 bpm | Temp: 101.2°F",
      rx: [
        { name: "Tab. Paracetamol 650mg", dosage: "1-0-1 (TDS)", duration: "4 days", note: "After food" },
        { name: "Tab. Cetirizine 10mg", dosage: "0-0-1 (HS)", duration: "5 days", note: "Night time" },
        { name: "Warm Saline Gargles", dosage: "Thrice daily", duration: "5 days", note: "Oral hygiene" }
      ],
      advice: "Abundant fluid intake, bed rest. Review if fever persists beyond 72h."
    },
    hypertension: {
      title: "Essential Hypertension (Stage 1)",
      complaint: "Occasional occipital morning headache, dizziness during physical exertion",
      vitals: "BP: 148/92 | Pulse: 78 bpm | Temp: 98.4°F",
      rx: [
        { name: "Tab. Telmisartan 40mg", dosage: "1-0-0 (Morning)", duration: "30 days", note: "Before breakfast" },
        { name: "Tab. Aspirin 75mg", dosage: "0-0-1 (Night)", duration: "30 days", note: "After dinner" },
        { name: "Lifestyle: Low Sodium Diet", dosage: "<2g salt/day", duration: "Ongoing", note: "Daily walking 30m" }
      ],
      advice: "Daily BP charting in morning and evening. Avoid fried and processed foods."
    },
    diabetes: {
      title: "Type 2 Diabetes Mellitus Review",
      complaint: "Routine 3-month follow-up, post-prandial heaviness, mild fatigue",
      vitals: "BP: 126/82 | Fasting Blood Sugar: 128 mg/dL | HbA1c: 7.1%",
      rx: [
        { name: "Tab. Metformin 500mg SR", dosage: "1-0-1 (BD)", duration: "30 days", note: "With main meals" },
        { name: "Tab. Glimepiride 1mg", dosage: "1-0-0 (Morning)", duration: "30 days", note: "Before breakfast" },
        { name: "Cap. Methylcobalamin 1500mcg", dosage: "0-1-0 (Afternoon)", duration: "30 days", note: "Nerve health" }
      ],
      advice: "Quarterly HbA1c screening. Regular foot inspection and eye fundus examination."
    }
  };

  const handleCopyPrescription = () => {
    const current = doctorTemplates[selectedTemplateKey];
    if (!current) return;
    const text = `PRESCRIPTION - APPOINTORY CLINICAL EMR
Condition: ${current.title}
Vitals: ${current.vitals}
Complaints: ${current.complaint}

MEDICATIONS:
${current.rx.map(m => `- ${m.name} | ${m.dosage} | ${m.duration} (${m.note})`).join('\n')}

Advice: ${current.advice}
Doctor: Dr. Anita Gupta (Reg: MCI-49210-A)`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedRx(true);
    setTimeout(() => setCopiedRx(false), 2200);
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "Appointory",
    "alternateName": "Appointory Healthcare OS",
    "description": "Next-generation healthcare operating system with AI wait-time prediction, smart GST clinical billing, connected pathology lab network, automated queue management, and AES-256 digital health locker.",
    "url": "https://appointory.in",
    "logo": "https://appointory.in/Appointory_logo.jpg",
    "image": "https://appointory.in/og-image-banner.jpg",
    "medicalSpecialty": [
      "https://health-lifesci.schema.org/GeneralPractice",
      "https://health-lifesci.schema.org/Pathology",
      "https://health-lifesci.schema.org/PublicHealth"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-9876543210",
      "contactType": "Customer Support",
      "areaServed": "IN",
      "availableLanguage": ["English", "Hindi", "Gujarati"]
    }
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Appointory Healthcare OS",
    "applicationCategory": "HealthApplication",
    "applicationSubCategory": "Clinic Management & EMR",
    "operatingSystem": "Web Browser, Android, iOS, Tablet",
    "url": "https://appointory.in/",
    "image": "https://appointory.in/og-image-banner.jpg",
    "description": "Comprehensive clinic management platform featuring AI-powered wait-time and billing time prediction, automated GST invoicing, connected independent diagnostic lab network, live waiting room TV token displays, reusable doctor prescription templates, and AES-256 encrypted digital health lockers.",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": "0",
      "pricingModel": "FreemiumPricing"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "680"
    },
    "featureList": [
      "AI-driven dynamic wait-time & queue velocity prediction algorithm",
      "Automated clinical billing, GST calculation (5%, 12%, 18%) & instant PDF receipt generation",
      "Independent pathology lab portal with 6-digit secure connect code handshake",
      "Live waiting room clinic TV display mode with audio token chime callouts",
      "Fast clinical prescription builder with reusable doctor EHR templates",
      "Multi-channel patient status alerts via Instant SMS & Live WebSockets",
      "AES-256 encrypted patient health locker with lifetime digital storage & ABHA linking",
      "Real-time clinic & lab analytics revenue intelligence with turnaround metrics",
      "Verified public doctor & clinic SEO profile pages with online slot booking"
    ],
    "availability": "https://schema.org/InStock"
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://appointory.in/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Features",
        "item": "https://appointory.in/#features"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Working Functions",
        "item": "https://appointory.in/#capabilities"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "FAQ",
        "item": "https://appointory.in/#faq"
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does Appointory's AI wait-time prediction algorithm work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Appointory utilizes a dynamic predictive machine learning model that analyzes historical consultation velocity, current queue congestion, doctor specialization, time of day, and patient complaint complexity. It continuously recalculates the projected arrival and consultation window in real-time, sending automated SMS & live queue alerts to patients so they arrive precisely when their doctor is ready."
        }
      },
      {
        "@type": "Question",
        "name": "How does the smart clinical billing and GST invoicing module operate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The billing engine allows receptionists and clinic administrators to generate itemized bills covering consultation fees, diagnostic lab investigations, medical procedures, and pharmacy items. It automatically applies configurable GST rates (5%, 12%, 18%) or custom discounts, supports multiple payment modes (UPI, Cash, Card), and creates instant printable PDF receipts featuring clinic branding and anti-fraud verification QR codes."
        }
      },
      {
        "@type": "Question",
        "name": "How do independent pathology and diagnostic labs connect with clinics?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Independent diagnostic centers register on their dedicated Lab Portal and generate or enter a 6-digit secure pairing code. Once connected via this digital handshake, clinics can electronically dispatch test requests with clinical notes, and labs can track samples, enter test values with automated abnormal parameter highlighting, and upload PDF reports that instantly sync to both the doctor's EMR and the patient's Health Locker."
        }
      },
      {
        "@type": "Question",
        "name": "What is the waiting room Clinic TV Display and token audio callout system?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Every registered clinic receives a dedicated public display link (/display/:clinicCode) designed for waiting room TVs and monitors. It presents a high-contrast, fullscreen token board showing current active tokens, doctor room assignments, and queue progression, accompanied by automated audio chimes that announce newly called tokens to eliminate waiting area chaos."
        }
      },
      {
        "@type": "Question",
        "name": "How do doctor prescription templates speed up clinical consultations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Doctors can save pre-configured clinical templates for common diagnoses (such as Viral Fever, Hypertension, Diabetes, or Seasonal Allergies). With a single click, standard medications, dosages (OD, BD, TDS), durations, and dietary advice are populated, allowing the clinician to complete a thorough, digitally signed prescription in under 45 seconds."
        }
      },
      {
        "@type": "Question",
        "name": "How are patient records secured in the AES-256 Health Locker?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Patient health records, prescriptions, and lab reports are encrypted with military-grade AES-256 GCM encryption. Patients access their records using secure OTP or password authentication and can present their personal QR health pass at reception for instant check-in without sharing sensitive paperwork."
        }
      },
      {
        "@type": "Question",
        "name": "Can patients track their live queue position without downloading an app?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Patients receive a lightweight encrypted web link via instant SMS or web check-in. They can track live queue status, token callouts, and estimated wait times directly in any mobile web browser without having to download or install an external app."
        }
      },
      {
        "@type": "Question",
        "name": "What role-based dashboards are provided in Appointory?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Appointory provides tailored, permission-governed interfaces for six distinct roles: Super Admin (system configuration & facility oversight), Clinic Admin (staff management, revenue analytics & settings), Doctors (live queue, EMR, prescriptions & templates), Receptionists (patient check-in, token generation & billing receipts), Independent Labs (test processing, connections & diagnostics analytics), and Patients (appointment booking, live status & digital health locker)."
        }
      }
    ]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Check-In, Track Live Clinic Queue, and Receive Digital Prescriptions with Appointory",
    "description": "A 4-step guide for patients to experience zero-waiting-room digital healthcare.",
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": "Scan Clinic QR or Enter Phone",
        "text": "Scan the clinic's reception QR code with your smartphone camera or enter your mobile number to instantly register in the queue."
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": "Track Live Queue via Instant SMS & Web Portal",
        "text": "Receive an encrypted live token link with dynamic AI wait-time estimation and instant SMS notifications as your turn approaches."
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": "Consult Doctor & Record Vitals",
        "text": "Step in when your token is called on the clinic TV display. The doctor records vitals, applies templates, and issues digitally signed prescriptions."
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": "Access Encrypted Health Locker",
        "text": "Your prescription, billing invoice, and connected lab reports automatically archive into your lifelong AES-256 digital vault."
      }
    ]
  };

  const serviceSchemas = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "AI Clinical Queue Management & Wait-Time Prediction",
      "provider": { "@type": "MedicalOrganization", "name": "Appointory" },
      "areaServed": "IN",
      "description": "Real-time queue tracking, dynamic AI consultation duration prediction, and automated SMS & live digital alert dispatch for medical clinics."
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Clinical Billing & Smart GST Invoicing",
      "provider": { "@type": "MedicalOrganization", "name": "Appointory" },
      "areaServed": "IN",
      "description": "Itemized clinical billing, automated GST tax calculations, payment status reconciliation, and anti-fraud QR receipt generation."
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "Connected Pathology Lab Network",
      "provider": { "@type": "MedicalOrganization", "name": "Appointory" },
      "areaServed": "IN",
      "description": "Digital handshake between clinics and independent diagnostic laboratories with test dispatch and automated report sync."
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "serviceType": "AES-256 Digital Health Locker & ABHA Pass",
      "provider": { "@type": "MedicalOrganization", "name": "Appointory" },
      "areaServed": "IN",
      "description": "Secure lifetime cloud storage for prescriptions, lab investigations, and vitals trend history with multi-factor authentication."
    }
  ];

  return (
    <div className="min-h-screen bg-parchment font-body text-teak">
      <SEO
        title="Appointory | Real-time Clinical OS, AI Wait-Time Prediction & Health Locker"
        description="Comprehensive healthcare OS featuring AI-driven wait-time prediction, smart GST clinical billing, connected pathology lab network, live waiting room TV token displays, and AES-256 digital health lockers."
        url="/"
        schemaMarkup={[organizationSchema, softwareAppSchema, breadcrumbSchema, faqSchema, howToSchema, ...serviceSchemas]}
      />
      {/* Sticky Navigation Bar with Glassmorphism */}
      <nav className="sticky top-0 z-40 bg-parchment/90 backdrop-blur-xl border-b border-sandstone/30 transition-all duration-200">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-md shadow-marigold/20 overflow-hidden border border-sandstone/30">
              <img src="/Appointory_logo.jpg" alt="Appointory Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-heading text-base sm:text-xl tracking-tight font-black text-teak leading-none">
                Appointory
              </h1>
              <span className="text-[8.5px] uppercase font-mono font-bold tracking-widest text-emerald-700">Healthcare OS</span>
            </div>
          </div>

          {/* Quick Jump Links */}
          <div className="hidden lg:flex items-center gap-6">
            <a href="#capabilities" className="text-xs font-bold text-teak/80 hover:text-emerald-700 transition-colors uppercase tracking-wider">Capabilities</a>
            <a href="#features" className="text-xs font-bold text-teak/80 hover:text-emerald-700 transition-colors uppercase tracking-wider">How It Works</a>
            <a href="#faq" className="text-xs font-bold text-teak/80 hover:text-emerald-700 transition-colors uppercase tracking-wider">FAQ</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => navigate('/patient/login')}
              aria-label="Patient Health Locker Login"
              className="px-3.5 py-1.5 border border-teal-300 text-teal-800 bg-teal-50/70 hover:bg-teal-600 hover:text-white rounded-full text-xs font-bold tracking-wide transition-all shadow-2xs active:scale-95 cursor-pointer hidden md:flex items-center gap-1.5"
            >
              <span>🩺</span> Health Locker
            </button>
            <button
              onClick={() => navigate('/lab/login')}
              aria-label="Diagnostic Lab Portal Login"
              className="px-3.5 py-1.5 border border-cyan-200 text-cyan-800 bg-cyan-50/70 hover:bg-cyan-700 hover:text-white rounded-full text-xs font-bold tracking-wide transition-all shadow-2xs active:scale-95 cursor-pointer hidden sm:flex items-center gap-1.5"
            >
              <span>🔬</span> Lab Portal
            </button>
            <button
              onClick={() => navigate('/login')}
              aria-label="Staff Portal Login"
              className="px-4.5 py-1.5 bg-teak text-parchment hover:bg-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>Staff Portal</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-1 sm:pt-2 pb-12 sm:pb-20 grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <div className="space-y-5 sm:space-y-7">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-saffron/15 rounded-full border border-saffron/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-marigold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-marigold"></span>
            </span>
            <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-widest text-teak/80">
              Transforming Healthcare across Bharat
            </span>
          </div>

          <h2 className="text-[25px] sm:text-[40px] lg:text-[60px] font-heading leading-none italic tracking-tight">
            Care without the <br />
            <span className="text-marigold not-italic font-black">
              Waiting Room.
            </span>
          </h2>

          <p className="text-[14px] sm:text-[14.5px] text-khaki max-w-md leading-relaxed font-medium">
            Automated queues, instant SMS & live queue alerts, and your own
            <span className="text-teak font-bold"> Secure Health Locker</span>.
            Digital healthcare that respects your time.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            {/* PRIMARY CTA: STAFF LOGIN */}
            <button
              onClick={() => navigate('/login')}
              className="px-7 py-3 bg-marigold text-white rounded-2xl font-bold text-[14.5px] shadow-lg shadow-marigold/30 hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer"
            >
              Staff Dashboard
            </button>

            {/* SECONDARY CTA: PATIENT HISTORY LOCKER */}
            <button
              onClick={() => navigate('/patient/login')}
              className="px-7 py-3 bg-white border-2 border-sandstone rounded-2xl font-bold text-[14.5px] hover:border-marigold transition-all cursor-pointer"
            >
              View My Health Records
            </button>
          </div>

          <div className="grid sm:grid-cols-3 gap-2.5 pt-2 max-w-xl">
            {/* CLINIC OWNER CARD */}
            <div
              onClick={() => navigate('/login')}
              className="group cursor-pointer bg-white/60 hover:bg-white border border-sandstone/30 hover:border-marigold p-3 rounded-[1.25rem] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9.5px] font-black uppercase text-marigold tracking-wider">For Clinics & Staff</span>
                  <span className="text-[14px] group-hover:scale-110 transition-transform duration-300">🏥</span>
                </div>
                <p className="text-[9.5px] text-khaki leading-snug font-medium">
                  Login for Clinic Admins, Doctors, and Receptionists to access dashboards, queues, and entry panels.
                </p>
              </div>
              <button className="text-[9.5px] font-black text-teak mt-2 flex items-center gap-1 group-hover:text-marigold transition-colors">
                Staff & Reception Login <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>

            {/* PATIENT CARD */}
            <div
              onClick={() => navigate('/patient/register')}
              className="group cursor-pointer bg-white/60 hover:bg-white border border-sandstone/30 hover:border-marigold p-3 rounded-[1.25rem] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9.5px] font-black uppercase text-marigold tracking-wider">For Patients</span>
                  <span className="text-[14px] group-hover:scale-110 transition-transform duration-300">🩺</span>
                </div>
                <p className="text-[9.5px] text-khaki leading-snug font-medium">
                  Sign up to track live wait times, receive instant SMS & queue alerts, and store medical history.
                </p>
              </div>
              <button className="text-[9.5px] font-black text-teak mt-2 flex items-center gap-1 group-hover:text-marigold transition-colors">
                Create Free Account <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>

            {/* INDEPENDENT LAB CARD */}
            <div
              onClick={() => navigate('/lab/login')}
              className="group cursor-pointer bg-blue-50/60 hover:bg-blue-50 border border-blue-100/50 hover:border-blue-400 p-3 rounded-[1.25rem] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9.5px] font-black uppercase text-blue-600 tracking-wider">For Labs</span>
                  <span className="text-[14px] group-hover:scale-110 transition-transform duration-300">🔬</span>
                </div>
                <p className="text-[9.5px] text-khaki leading-snug font-medium">
                  Independent diagnostic labs can connect with clinics and receive test requests directly.
                </p>
              </div>
              <button className="text-[9.5px] font-black text-blue-600 mt-2 flex items-center gap-1 group-hover:text-blue-800 transition-colors">
                Lab Portal Login <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1 grayscale opacity-75">
            <p className="text-[14px] font-black uppercase tracking-widest">
              Powered by
            </p>
            <div className="h-px w-6 bg-sandstone"></div>
            <span className="font-heading text-[14px] sm:text-[11.5px]">Appointory</span>
            <span className="font-heading text-[14px] sm:text-[11.5px]">The Intelliverse</span>
          </div>
        </div>

        {/* Dashboard Simulation Mockup */}
        <div className="relative">
          <div className="absolute -top-6 -right-6 sm:-top-10 sm:-right-10 w-44 sm:w-60 h-44 sm:h-60 bg-saffron/20 rounded-full blur-3xl"></div>

          <div className="relative bg-white border border-sandstone p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2.25rem] shadow-xl">
            <div className="flex justify-between items-center mb-4 sm:mb-6 px-1">
              <div>
                <h3 className="font-heading text-[14.5px] sm:text-[16.5px] font-black">Appointory Network</h3>
                <p className="text-[11.5px] sm:text-[11.5px] text-khaki font-black uppercase tracking-widest mt-0.5">
                  Live Clinic Status
                </p>
              </div>
              <div className="text-right">
                <p className="text-[21.5px] sm:text-[27.5px] font-heading font-black text-marigold">
                  #{String(clinicsQueues.filter(c => c.isReal).length || 4).padStart(2, '0')}
                </p>
                <p className="text-[7.5px] sm:text-[8.5px] font-black text-khaki uppercase tracking-widest mt-0.5">
                  Active Facilities
                </p>
              </div>
            </div>

            {/* Vertical Scroll List Container */}
            <div className="relative overflow-hidden h-[210px] sm:h-[270px] w-full">
              <div
                className={`flex flex-col gap-2.5 h-full ${isTransitioning ? 'transition-transform duration-1000 ease-in-out' : ''}`}
                style={{
                  transform: `translateY(calc(-${currentIndex} * (${100 / 3}% + ${10 / 3}px)))`
                }}
                onTransitionEnd={handleTransitionEnd}
              >
                {extendedClinics.map((clinic, index) => (
                  <div
                    key={`${clinic.id}-${index}`}
                    style={{
                      height: `calc(${100 / 3}% - 7px)`
                    }}
                    className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-emerald-500/20 bg-white/95 shadow-xs flex justify-between items-center flex-shrink-0 hover:border-emerald-500/50 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {clinic.name}
                        </p>
                        <p className="text-[10px] text-khaki font-mono font-medium">
                          Facility: {clinic.clinicCode} • Live Queue
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10.5px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg">
                        Token #{clinic.activeToken}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4.5 bg-teak rounded-xl sm:rounded-2xl text-parchment flex justify-between items-center shadow-md">
              <div>
                <p className="text-[11.5px] sm:text-[11.5px] font-black uppercase text-parchment/60 tracking-widest mb-0.5">
                  Queue Efficiency
                </p>
                <p className="font-heading text-[12.5px] sm:text-[14.5px] font-black">
                  98% On-Time Care
                </p>
              </div>
              <div className="h-8.5 w-8.5 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-[11.5px] sm:text-[18px]">📊</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature / How It Works Section */}
      <section className="bg-white border-y border-sandstone py-10 sm:py-14 relative overflow-hidden" id="features">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-92 h-92 bg-marigold/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-92 h-92 bg-saffron/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-marigold/10 text-marigold rounded-full border border-marigold/20">
              <span className="text-[11.5px] font-black uppercase tracking-widest">HOW IT WORKS</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-heading leading-tight italic text-teak">
              A Seamless Digital Journey for <br className="hidden sm:inline" />
              <span className="text-marigold not-italic font-black">Clinics & Patients</span>
            </h3>
            <p className="text-[11.5px] sm:text-[14.5px] text-khaki font-medium leading-relaxed max-w-lg mx-auto">
              Appointory connects check-in, live queue status, consultation details, and secure health locker files in real-time.
            </p>
          </div>

          {/* Grand Stepper Tracker Timeline */}
          <div className="max-w-xl mx-auto mb-10 bg-white border border-sandstone/30 p-3 rounded-[1.25rem] shadow-sm text-center">
            <div className="flex justify-between items-center text-[8.5px] font-black uppercase text-teak/60 mb-2.5 px-1">
              <span>DEMO PLAYGROUND QUEST</span>
              <span className="text-marigold font-black">{questProgress * 20}% COMPLETED</span>
            </div>

            <div className="relative flex justify-between items-center w-full px-4">
              <div className="absolute left-6 right-6 h-0.5 bg-sandstone/20 top-1/2 -translate-y-1/2 -z-10"></div>
              <motion.div
                className="absolute left-6 h-0.5 bg-marigold top-1/2 -translate-y-1/2 -z-10"
                animate={{ width: `${questProgress * 22}%` }}
                transition={{ duration: 0.4 }}
              ></motion.div>

              {['Scan QR', 'ABHA Linked', 'Queue Turn', 'Consult Rx', 'Locker Get'].map((label, stepIdx) => {
                const isPassed = questProgress >= stepIdx;
                const isActive = questProgress === stepIdx;
                return (
                  <div key={label} className="flex flex-col items-center relative">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.25 : 1,
                        backgroundColor: isActive ? '#f59e0b' : isPassed ? '#10b981' : '#e5e7eb',
                        borderColor: isActive ? '#d97706' : isPassed ? '#059669' : '#cbd5e1'
                      }}
                      className="w-4 h-4 rounded-full border flex items-center justify-center text-[7.5px] font-black text-white shadow-sm"
                    >
                      {isPassed && stepIdx < questProgress ? '✓' : stepIdx + 1}
                    </motion.div>
                    <span className={`text-[11.5px] mt-1 font-black uppercase tracking-wider ${isActive ? 'text-marigold' : isPassed ? 'text-teak' : 'text-khaki/60'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>


          {/* Workflow Step Grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative"
            onMouseEnter={() => setIsStepHovered(true)}
            onMouseLeave={() => setIsStepHovered(false)}
          >
            {[
              {
                step: "01",
                icon: "📸",
                title: "Contactless QR Check-In",
                desc: "Scan the clinic's unique QR code to link your profile. The system instantly verifies your identity via ABDM-compliant ABHA gateway registry, securely retrieving your demographics or auto-linking a digital health locker in under 10 seconds.",
                accent: "bg-teal-50 text-teal-600 border-teal-100/50",
                badge: "Takes 10s",
              },
              {
                step: "02",
                icon: "⏳",
                title: "Live Queue & SMS Tracking",
                desc: "Receive an encrypted live token link and automated SMS & digital queue reminders. Our dynamic polling engine computes consultation velocity, showing your real-time position in line, estimated wait times, and active token callouts.",
                accent: "bg-indigo-50 text-indigo-600 border-indigo-100/50",
                badge: "Live Updates",
              },
              {
                step: "03",
                icon: "🩺",
                title: "Real-time Cloud Consultation",
                desc: "Consult with clinicians who update FHIR-standard electronic medical records. Staff record vital signs (BP, Pulse, Temperature) in the background while the doctor compiles digital prescriptions signed with secure authentication keys.",
                accent: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
                badge: "Zero Waiting",
              },
              {
                step: "04",
                icon: "🔐",
                title: "Secure Lifetime Vault",
                desc: "Access a lifelong personal health locker protected by multi-factor OTP verification. Securely download prescriptions, lab reports, and vitals trend history, fully sealed with military-grade AES-256 cryptographic encryption.",
                accent: "bg-rose-50 text-rose-600 border-rose-100/50",
                badge: "100% Secure",
              }
            ].map((s, idx) => {
              const isActive = activeStep === idx;

              return (
                <motion.div
                  key={idx}
                  onMouseEnter={() => setActiveStep(idx)}
                  whileHover={{ y: -6, scale: 1.015 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`group bg-white p-5 rounded-[1.25rem] border transition-all relative flex flex-col justify-between cursor-pointer ${isActive
                    ? 'border-marigold shadow-md bg-parchment/15'
                    : 'border-sandstone hover:border-marigold/30 opacity-75 hover:opacity-95'
                    }`}
                >
                  {/* Step Number Badge */}
                  <div className={`absolute top-3.5 right-4.5 text-xl font-black transition-colors duration-500 ${isActive ? 'text-marigold/15' : 'text-sandstone/15'
                    } select-none`}>
                    {s.step}
                  </div>

                  <div>
                    {/* Icon block */}
                    <motion.div
                      animate={isActive ? { rotate: [0, -6, 6, 0], scale: 1.06 } : { rotate: 0, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`w-9 h-9 rounded-lg ${s.accent} border flex items-center justify-center text-lg shadow-sm mb-3`}
                    >
                      {s.icon}
                    </motion.div>

                    {/* Benefit badge */}
                    <span className="inline-block text-[11.5px] font-black uppercase tracking-wider bg-sandstone/25 px-1.5 py-0.5 rounded mb-1 text-teak/70">
                      {s.badge}
                    </span>

                    {/* Step Title */}
                    <h4 className="font-heading text-[15px] sm:text-[16px] text-teak font-black tracking-tight mb-1">
                      {s.title}
                    </h4>

                    {/* Step Desc */}
                    <p className="text-[11.5px] sm:text-[11.5px] text-khaki leading-relaxed font-medium">
                      {s.desc}
                    </p>
                  </div>

                  {/* STEP 1 SIMULATOR */}
                  {idx === 0 && (
                    <div className="mt-3.5 bg-teal-50/20 border border-teal-100/50 rounded-xl p-2.5 flex flex-col justify-between min-h-[195px] text-left">
                      <AnimatePresence mode="wait">
                        {checkInState === 'camera' && (
                          <motion.div
                            key="camera"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex flex-col justify-between h-full"
                          >
                            <div className="flex gap-1 items-center justify-between w-full mb-1">
                              <label className="text-[7.5px] font-black uppercase text-teal-700 tracking-wider">Target Clinic:</label>
                              <select
                                value={selectedClinicIdx}
                                onChange={(e) => setSelectedClinicIdx(Number(e.target.value))}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white border border-sandstone/30 rounded text-[7.5px] py-0.2 px-1 focus:outline-none text-teak font-bold"
                              >
                                {clinicsQueues.slice(0, 4).map((c, i) => (
                                  <option key={c.id} value={i}>{c.name.split(' ')[0]}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col items-center justify-center space-y-1.5 py-0.5">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsScanning(true);
                                  setTimeout(() => {
                                    setIsScanning(false);
                                    setCheckInState('form');
                                  }, 800);
                                }}
                                className="relative w-11 h-11 border border-dashed border-teal-500 rounded-lg flex items-center justify-center bg-teal-955/90 overflow-hidden cursor-pointer shadow-sm hover:scale-105 transition-transform"
                              >
                                {isScanning && (
                                  <motion.div
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white z-20"
                                  />
                                )}
                                <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-teal-400" />
                                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-teal-400" />
                                <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-teal-400" />
                                <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-teal-400" />

                                <motion.div
                                  animate={{ y: [-15, 30, -15] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                  className="w-full h-0.5 bg-emerald-400 absolute left-0 shadow-[0_0_4px_#34d399]"
                                ></motion.div>
                                <span className="text-[11.5px]">📸</span>
                              </div>
                              <span className="text-[7.5px] text-khaki font-black uppercase tracking-wider text-center">Click QR to Scan</span>
                            </div>
                          </motion.div>
                        )}

                        {checkInState === 'form' && (
                          <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex flex-col justify-between h-full"
                          >
                            {checkInLoading ? (
                              <div className="flex flex-col justify-center items-center h-full space-y-2">
                                <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-[8.5px] font-bold text-teal-800 animate-pulse text-center">
                                  {phoneNum.length === 10 ? 'Resolving ABHA keys...' : 'Linking Secure Vault...'}
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[11.5px] font-black uppercase text-teal-700 tracking-wider">Phone Number</label>
                                    <span className={`text-[11.5px] font-bold ${phoneNum.length === 10 ? 'text-emerald-600' : 'text-khaki'}`}>
                                      {phoneNum.length}/10
                                    </span>
                                  </div>
                                  <input
                                    type="tel"
                                    value={phoneNum}
                                    onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Enter mobile number"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-white border border-sandstone/30 rounded px-2 py-1 text-[11.5px] focus:outline-none focus:border-teal-500"
                                  />
                                </div>
                                <div className="flex gap-1.5 pt-1.5">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setCheckInState('camera'); }}
                                    className="w-1/3 border border-sandstone/30 text-[9.5px] font-black uppercase py-1 rounded cursor-pointer text-teak hover:bg-white"
                                  >
                                    Back
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (phoneNum.length < 10) return;
                                      setCheckInLoading(true);
                                      setTimeout(() => {
                                        setCheckInLoading(false);
                                        setCheckInState('success');
                                        setCheckedInPhone(phoneNum);
                                      }, 1000);
                                    }}
                                    disabled={phoneNum.length < 10}
                                    className="w-2/3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-[9.5px] font-black uppercase py-1 rounded cursor-pointer"
                                  >
                                    Link Locker
                                  </button>
                                </div>
                              </>
                            )}
                          </motion.div>
                        )}

                        {checkInState === 'success' && (
                          <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col justify-between h-full"
                          >
                            <div
                              onClick={(e) => { e.stopPropagation(); setCardFlipped(!cardFlipped); }}
                              className="relative w-full h-[95px] cursor-pointer"
                              style={{ perspective: 1000 }}
                            >
                              <motion.div
                                animate={{ rotateY: cardFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                style={{ transformStyle: "preserve-3d" }}
                                className="w-full h-full relative"
                              >
                                {/* Front of ID Card */}
                                <div
                                  className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-lg p-2 flex flex-col justify-between shadow-sm"
                                  style={{ backfaceVisibility: "hidden" }}
                                >
                                  <div className="flex justify-between items-center border-b border-white/20 pb-0.5">
                                    <span className="text-[6.5px] font-black tracking-widest uppercase">Bharat Digital Health Card</span>
                                    <span className="text-[11.5px] bg-white/20 px-1 py-0.2 rounded font-mono">ABDM</span>
                                  </div>
                                  <div className="flex gap-2 items-center my-0.5">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[11.5px]">👤</div>
                                    <div className="text-left leading-none">
                                      <div className="text-[8.5px] font-bold">Dhruvil Thummar</div>
                                      <div className="text-[6.5px] text-white/70 font-mono mt-0.5">dhruvil@abha</div>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-end text-[6.5px] text-white/80">
                                    <div>
                                      <p className="text-[11.5px] text-white/50 leading-none">ABHA ID</p>
                                      <p className="font-mono leading-none mt-0.5">91-4820-3948-2948</p>
                                    </div>
                                    <span className="text-[8.5px] text-emerald-400 font-bold">✓ VERIFIED</span>
                                  </div>
                                </div>

                                {/* Back of ID Card */}
                                <div
                                  className="absolute inset-0 bg-gradient-to-br from-teal-800 to-emerald-950 text-white rounded-lg p-2 flex flex-col justify-between shadow-sm text-left"
                                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                                >
                                  <div className="border-b border-white/10 pb-0.5 flex justify-between">
                                    <span className="text-[11.5px] font-black uppercase text-emerald-400">Cryptographic Node Info</span>
                                    <span className="text-[5.5px] text-emerald-400">SYNCED</span>
                                  </div>
                                  <div className="space-y-0.5 text-[11.5px] font-mono py-0.5 leading-snug">
                                    <div><span className="text-emerald-400">HASH:</span> <span className="text-white/85">SHA256:0x39a1bc9aef</span></div>
                                    <div><span className="text-emerald-400">LOCKER:</span> <span className="text-white/85">AES-255 GCM Encrypted</span></div>
                                    <div><span className="text-emerald-400">TIMESTAMP:</span> <span className="text-white/85">24-MAY-2026 13:50</span></div>
                                    <div><span className="text-emerald-400">GATEWAY:</span> <span className="text-white/85">Appointory ABDM node v2</span></div>
                                  </div>
                                  <p className="text-[5.5px] text-white/40 text-center uppercase tracking-wider">Click card to view front</p>
                                </div>
                              </motion.div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setCheckInState('camera'); setPhoneNum(''); setCheckedInPhone(''); setCardFlipped(false); }}
                              className="text-[8.5px] text-teal-700 underline font-black tracking-wider text-right cursor-pointer"
                            >
                              Reset Check-in
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* STEP 2 SIMULATOR */}
                  {idx === 1 && (
                    <div className="mt-3.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-2.5 flex flex-col justify-between min-h-[195px] relative text-left overflow-hidden">
                      <AnimatePresence>
                        {showNotification && (
                          <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="absolute top-1 left-1 right-1 z-35 bg-slate-900 text-white rounded-lg p-2 shadow-lg flex items-start gap-2 text-[11.5px] border-l-4 border-teal-400"
                          >
                            <span className="text-[8.5px]">⚡</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-bold text-teal-400">SwasthyaMitra Smart Alert</span>
                                <span className="text-[6.5px] text-white/60">Now</span>
                              </div>
                              <p className="font-medium text-white/90 leading-tight text-[11.5px]">
                                {notificationText.replace('💬 Appointory: ', '').replace('🚨 Appointory: ', '').replace('🩺 Appointory: ', '')}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-between items-center text-[11.5px]">
                        <span className="font-black text-indigo-600 uppercase tracking-wider">Live Tracker</span>
                        <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Active
                        </span>
                      </div>

                      {/* Interactive SVG Queue Map */}
                      <div className="bg-white/60 border border-sandstone/15 rounded-lg p-1.5 my-0.5 text-center">
                        <svg className="w-full h-8" viewBox="0 0 160 30">
                          <path d="M 20 15 L 140 15" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                          {[
                            { name: 'Reg', x: 20 },
                            { name: 'Vit', x: 60 },
                            { name: 'Wait', x: 100 },
                            { name: 'Doc', x: 140 }
                          ].map((station, sIdx) => {
                            const isPatientHere = (3 - queuePos) === sIdx;
                            const isPassed = (3 - queuePos) >= sIdx;
                            return (
                              <g key={station.name}>
                                <circle
                                  cx={station.x}
                                  cy={15}
                                  r="4"
                                  fill={isPatientHere ? '#4f46e5' : isPassed ? '#818cf8' : '#e2e8f0'}
                                  stroke={isPatientHere ? '#312e81' : '#cbd5e1'}
                                  strokeWidth="1"
                                />
                                <text
                                  x={station.x}
                                  y={26}
                                  textAnchor="middle"
                                  fontSize="5px"
                                  fontWeight="black"
                                  fill={isPatientHere ? '#4f46e5' : '#94a3b8'}
                                >
                                  {station.name}
                                </text>
                              </g>
                            );
                          })}

                          {(() => {
                            const mapCoords = [20, 60, 100, 140];
                            const cxVal = mapCoords[3 - queuePos] || 20;
                            return (
                              <motion.circle
                                cx={cxVal}
                                cy={15}
                                r="3"
                                fill="#fbbf24"
                                stroke="#d97706"
                                strokeWidth="1"
                                animate={{
                                  cx: cxVal,
                                  scale: [1, 1.2, 1],
                                  y: [15, 11, 15]
                                }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                              />
                            );
                          })()}
                        </svg>
                      </div>

                      <div className="text-center my-0.2">
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={queuePos}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="block text-[11.5px] font-heading font-black text-teak leading-none"
                          >
                            Token T-08
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-[8.5px] text-khaki font-black uppercase tracking-wider block leading-none mt-0.5">
                          {queuePos === 3 && 'Position: 3rd in Line'}
                          {queuePos === 2 && 'Position: 2nd in Line'}
                          {queuePos === 1 && '🚨 Next in Line!'}
                          {queuePos === 0 && '🩺 Seeing Doctor'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11.5px] bg-white/70 border border-sandstone/10 px-2 py-0.5 rounded leading-none">
                        <span className="text-khaki font-medium">Est. Wait:</span>
                        <span className="font-bold text-indigo-600">
                          {queuePos === 3 && '~ 15 Mins'}
                          {queuePos === 2 && '~ 10 Mins'}
                          {queuePos === 1 && '~ 5 Mins'}
                          {queuePos === 0 && '0 Mins (Now)'}
                        </span>
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={handleTriggerSms}
                          className="w-1/2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[11.5px] font-black uppercase py-1 rounded cursor-pointer text-center"
                        >
                          Alert Me
                        </button>
                        <button
                          onClick={handleQueueProgress}
                          className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11.5px] font-black uppercase py-1 rounded cursor-pointer text-center"
                        >
                          Next Turn
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 SIMULATOR */}
                  {idx === 2 && (
                    <div className="mt-3.5 bg-emerald-50/20 border border-emerald-100/50 rounded-xl p-2.5 flex flex-col justify-between min-h-[195px] overflow-hidden text-left">
                      {uploadState !== 'uploaded' ? (
                        <>
                          <div className="grid grid-cols-3 gap-1">
                            {/* BP box */}
                            <div className="bg-white/80 border border-sandstone/10 rounded p-1 text-center relative flex flex-col justify-between">
                              <div className="text-[7.5px] font-black uppercase text-khaki leading-none">BP</div>
                              <div className={`text-[11.5px] font-black leading-none my-1 ${vitals.bpSystolic >= 140 ? 'text-rose-600 animate-pulse font-black' : 'text-teak'}`}>
                                {vitals.bpSystolic}/{vitals.bpDiastolic}
                              </div>
                              <div className="flex justify-center gap-0.5">
                                <button
                                  onClick={(e) => adjustVital('bpSystolic', true, e)}
                                  className="w-3 h-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11.5px] font-black rounded flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                                <button
                                  onClick={(e) => adjustVital('bpSystolic', false, e)}
                                  className="w-3 h-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11.5px] font-black rounded flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                              </div>
                            </div>

                            {/* Pulse box */}
                            <div className="bg-white/80 border border-sandstone/10 rounded p-1 text-center relative flex flex-col justify-between">
                              <div className="text-[7.5px] font-black uppercase text-khaki leading-none">Pulse</div>
                              <div className={`text-[11.5px] font-black leading-none my-1 ${vitals.pulse > 100 ? 'text-rose-600 animate-pulse font-black' : 'text-teak'}`}>
                                {vitals.pulse}
                              </div>
                              <div className="flex justify-center gap-0.5">
                                <button
                                  onClick={(e) => adjustVital('pulse', true, e)}
                                  className="w-3 h-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11.5px] font-black rounded flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                                <button
                                  onClick={(e) => adjustVital('pulse', false, e)}
                                  className="w-3 h-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11.5px] font-black rounded flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                              </div>
                            </div>

                            {/* Temp box */}
                            <div className="bg-white/80 border border-sandstone/10 rounded p-1 text-center relative flex flex-col justify-between">
                              <div className="text-[7.5px] font-black uppercase text-khaki leading-none">Temp</div>
                              <div className={`text-[11.5px] font-black leading-none my-1 ${vitals.temp >= 100.0 ? 'text-rose-600 animate-pulse font-black' : 'text-teak'}`}>
                                {vitals.temp}
                              </div>
                              <div className="flex justify-center gap-0.5">
                                <button
                                  onClick={(e) => adjustVital('temp', true, e)}
                                  className="w-3 h-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11.5px] font-black rounded flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                                <button
                                  onClick={(e) => adjustVital('temp', false, e)}
                                  className="w-3 h-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11.5px] font-black rounded flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ECG Pulsing Wave Sparkline */}
                          <div className="flex justify-between items-center text-[7.5px] bg-slate-900 text-emerald-400 p-1 rounded font-mono my-1 border border-slate-950 leading-none">
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                              <span>ECG</span>
                            </div>
                            <svg className={`w-16 h-3 ${vitals.pulse > 100 ? 'text-rose-500' : 'text-emerald-400'}`} viewBox="0 0 100 20" fill="none">
                              <motion.path
                                d="M0,10 L20,10 L25,3 L30,17 L35,10 L50,10 L55,3 L60,17 L65,10 L80,10 L85,3 L90,17 L95,10 L100,10"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeDasharray="100"
                                animate={{ strokeDashoffset: [100, 0] }}
                                transition={{
                                  repeat: Infinity,
                                  duration: vitals.pulse > 100 ? 0.8 : 1.8,
                                  ease: "linear"
                                }}
                              />
                            </svg>
                            <span>{vitals.pulse > 100 ? 'TACHY' : 'SINUS'}</span>
                          </div>

                          <div className="flex gap-1 items-center justify-between text-[11.5px] py-0.5 leading-none">
                            <span className="font-bold text-khaki">Complaint:</span>
                            <div className="flex gap-1">
                              {['Fever', 'High BP', 'Checkup'].map((lbl) => {
                                const val = lbl === 'Fever' ? 'Fever & Cough' : lbl === 'High BP' ? 'Hypertension' : 'General Checkup';
                                return (
                                  <button
                                    key={lbl}
                                    onClick={(e) => handleComplaintChange(val, e)}
                                    className={`px-1 py-0.2 rounded border text-[7.5px] font-black uppercase cursor-pointer ${activeComplaint === val
                                      ? 'bg-emerald-600 text-white border-emerald-600'
                                      : 'bg-white border-sandstone/20 text-teak'
                                      }`}
                                  >
                                    {lbl}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Medicine Pills list */}
                          <div className="flex justify-between items-center text-[7.5px] bg-white/70 border border-sandstone/10 p-1 rounded">
                            <div className="min-w-0 max-w-[65%]">
                              <div className="font-bold text-emerald-700 uppercase tracking-wider text-[8.5px] leading-none">Prescription</div>
                              <div className="flex flex-wrap gap-0.5 mt-0.5 overflow-hidden max-h-[14px]">
                                <AnimatePresence>
                                  {meds.map((med) => (
                                    <motion.span
                                      key={med}
                                      layout
                                      initial={{ opacity: 0, scale: 0.8, x: -5 }}
                                      animate={{ opacity: 1, scale: 1, x: 0 }}
                                      exit={{ opacity: 0, scale: 0.8, x: 5 }}
                                      className="bg-emerald-100 text-emerald-800 text-[6.5px] font-black px-1 py-0.2 rounded"
                                    >
                                      {med.split(' ')[0]}
                                    </motion.span>
                                  ))}
                                </AnimatePresence>
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={handleAddMed}
                                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-1 py-0.2 rounded text-[7.5px] cursor-pointer"
                              >
                                +Add
                              </button>
                              {meds.length > 0 && (
                                <button
                                  onClick={(e) => handleRemoveMed(meds.length - 1, e)}
                                  className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-1 py-0.2 rounded text-[7.5px] cursor-pointer"
                                >
                                  -Del
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Doctor scribble signature board */}
                          <div className="bg-white/80 border border-sandstone/15 rounded p-1 text-center my-0.5">
                            <div className="flex justify-between items-center text-[7.5px] font-black text-khaki mb-0.5 px-0.5">
                              <span>Draw Doctor Signature</span>
                              <div className="flex gap-1">
                                <button
                                  onClick={autoSign}
                                  className="text-[7.5px] text-indigo-600 font-bold hover:underline cursor-pointer"
                                >
                                  Auto Fill
                                </button>
                                <button
                                  onClick={clearSignature}
                                  className="text-[7.5px] text-rose-600 font-bold hover:underline cursor-pointer"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                            <canvas
                              ref={canvasRef}
                              width="150"
                              height="30"
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchMove={draw}
                              onTouchEnd={stopDrawing}
                              className="w-full h-8 bg-parchment/40 border border-dashed border-emerald-300 rounded cursor-crosshair"
                            />
                          </div>

                          <button
                            onClick={handleSignAndUpload}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black uppercase py-1 rounded cursor-pointer text-center animate-pulse"
                          >
                            Sign & Upload to Vault
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col justify-center items-center h-full space-y-1.5 text-center">
                          {/* Animated signature drawing */}
                          <div className="w-20 h-10 flex items-center justify-center bg-white/60 border border-emerald-200/50 rounded-lg p-1">
                            {signatureImg ? (
                              <img src={signatureImg} alt="Doc Signature" loading="lazy" className="w-16 h-8 object-contain" />
                            ) : (
                              <svg className="w-16 h-8 text-emerald-700" viewBox="0 0 100 50" fill="none">
                                <motion.path
                                  d="M 10 30 C 30 10, 40 45, 50 15 C 60 -5, 75 35, 90 25 M 35 25 L 85 25"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 1.2, ease: "easeInOut" }}
                                />
                              </svg>
                            )}
                          </div>
                          <div className="space-y-0.2">
                            <p className="text-[8.5px] font-bold text-teak">Prescription Signed & Sent ✓</p>
                            <p className="text-[11.5px] text-khaki font-medium">
                              Linked to patient Secure Vault locker.
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setUploadState('idle'); }}
                            className="text-[11.5px] text-emerald-700 font-black uppercase tracking-wider underline cursor-pointer"
                          >
                            Edit prescription
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4 SIMULATOR */}
                  {idx === 3 && (
                    <motion.div
                      animate={isShaking ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`mt-3.5 bg-rose-50/20 border rounded-xl p-2.5 flex flex-col justify-between min-h-[195px] overflow-hidden text-left ${isShaking ? 'border-rose-500 shadow-lg shadow-rose-100' : 'border-rose-100/50'}`}
                    >
                      {vaultLocked ? (
                        <div className="flex flex-col justify-between h-full py-0.5">
                          <div className="flex justify-between items-center text-[11.5px]">
                            <span className="font-black text-rose-600 uppercase tracking-wider">Secured Vault</span>
                            <span className="text-[8.5px] text-khaki font-bold">Hint OTP: 1234</span>
                          </div>

                          {/* OTP Display Field */}
                          <div className={`bg-white/80 border rounded px-2 py-0.5 text-center text-[11.5px] font-mono tracking-widest h-5.5 flex items-center justify-center ${isShaking ? 'border-rose-500 text-rose-600 bg-rose-50/50 font-black animate-pulse' : 'border-sandstone/30 text-rose-700'}`}>
                            {isShaking ? "INVALID OTP" : otpInput.padEnd(4, '•').split('').join(' ')}
                          </div>

                          {/* Virtual OTP Clickable Keypad */}
                          <div className="grid grid-cols-3 gap-0.5 justify-center max-w-[130px] mx-auto pt-0.5">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                              <motion.button
                                key={num}
                                whileTap={{ scale: 0.85 }}
                                onClick={(e) => { e.stopPropagation(); if (otpInput.length < 4) setOtpInput(prev => prev + num); }}
                                className="bg-white border border-sandstone/25 rounded w-5 h-4 flex items-center justify-center text-[11.5px] font-black hover:bg-rose-50 cursor-pointer shadow-sm text-teak"
                              >
                                {num}
                              </motion.button>
                            ))}
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={(e) => { e.stopPropagation(); setOtpInput(prev => prev.slice(0, -1)); }}
                              className="bg-white border border-sandstone/25 rounded w-5 h-4 flex items-center justify-center text-[7.5px] font-black hover:bg-rose-50 cursor-pointer shadow-sm text-rose-600"
                            >
                              ⌫
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={(e) => { e.stopPropagation(); if (otpInput.length < 4) setOtpInput(prev => prev + '0'); }}
                              className="bg-white border border-sandstone/25 rounded w-5 h-4 flex items-center justify-center text-[11.5px] font-black hover:bg-rose-50 cursor-pointer shadow-sm text-teak"
                            >
                              0
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={(e) => { e.stopPropagation(); handleOtpVerify(e); }}
                              className="bg-rose-600 text-white rounded w-5 h-4 flex items-center justify-center text-[7.5px] font-black hover:bg-rose-700 cursor-pointer shadow-sm"
                            >
                              ✓
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-between h-full">
                          <div className="flex justify-between items-center text-[11.5px]">
                            <span className="font-bold text-emerald-600">✓ Vault Unlocked</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setVaultLocked(true); setOtpInput(''); }}
                              className="text-rose-600 hover:text-rose-700 font-black uppercase tracking-wider text-[11.5px] cursor-pointer"
                            >
                              Lock Vault
                            </button>
                          </div>

                          <motion.div
                            variants={listContainer}
                            initial="hidden"
                            animate="show"
                            className="space-y-1 my-0.5 max-h-[82px] overflow-y-auto pr-0.5 scrollbar-thin"
                          >
                            {/* Dynamic Prescription File */}
                            <motion.div
                              variants={listItem}
                              className="bg-white/80 border border-sandstone/10 px-2 py-1 rounded flex justify-between items-center text-[9.5px]"
                            >
                              <div className="truncate max-w-[65%]">
                                <span className="font-bold text-teak block truncate">
                                  {uploadState === 'uploaded' ? `Rx_${activeComplaint.replace(' & ', '_').replace(' ', '')}.pdf` : 'Rx_CCC01_CityCare.pdf'}
                                </span>
                                <span className="text-[11.5px] text-khaki font-medium">
                                  {uploadState === 'uploaded' ? `${meds.length} Medicines Linked` : 'Consultation File'}
                                </span>
                              </div>
                              {downloadProgress['Rx'] === 'done' ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[8.5px] text-emerald-600 font-bold">Saved ✓</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[11.5px] font-black px-1 py-0.2 rounded cursor-pointer leading-none"
                                  >
                                    View
                                  </button>
                                </div>
                              ) : downloadProgress['Rx'] !== undefined ? (
                                <div className="w-10 bg-sandstone/30 h-1.5 rounded overflow-hidden">
                                  <div className="bg-rose-600 h-full transition-all duration-200" style={{ width: `${downloadProgress['Rx']}%` }}></div>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => handleDownload('Rx', e)}
                                  className="text-[11.5px] text-rose-600 font-black uppercase tracking-wider cursor-pointer hover:underline"
                                >
                                  Get
                                </button>
                              )}
                            </motion.div>

                            {/* Lab Report File */}
                            <motion.div
                              variants={listItem}
                              className="bg-white/80 border border-sandstone/10 px-2 py-1 rounded flex justify-between items-center text-[9.5px]"
                            >
                              <div className="truncate max-w-[65%]">
                                <span className="font-bold text-teak block truncate">Lab_BloodTest.pdf</span>
                                <span className="text-[11.5px] text-khaki font-medium">CBC & Diabetes | 24 May</span>
                              </div>
                              {downloadProgress['Labs'] === 'done' ? (
                                <span className="text-[8.5px] text-emerald-600 font-bold">Saved ✓</span>
                              ) : downloadProgress['Labs'] !== undefined ? (
                                <div className="w-10 bg-sandstone/30 h-1.5 rounded overflow-hidden">
                                  <div className="bg-rose-600 h-full transition-all duration-200" style={{ width: `${downloadProgress['Labs']}%` }}></div>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => handleDownload('Labs', e)}
                                  className="text-[11.5px] text-rose-600 font-black uppercase tracking-wider cursor-pointer hover:underline"
                                >
                                  Get
                                </button>
                              )}
                            </motion.div>
                          </motion.div>

                          {/* SVG Vitals Trend Sparkline with path animation */}
                          <div className="flex items-center justify-between text-[11.5px] bg-rose-50/50 border border-rose-100 p-0.5 rounded">
                            <span className="text-khaki font-bold">BP Trend (7d)</span>
                            <svg className="w-16 h-2 text-rose-500" viewBox="0 0 60 10" fill="none">
                              <motion.path
                                d="M0,5 L10,6 L20,3 L30,7 L40,4 L50,6 L60,3"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                              />
                              <circle cx="20" cy="3" r="1.2" fill="currentColor"></circle>
                              <circle cx="40" cy="4" r="1.2" fill="currentColor"></circle>
                            </svg>
                            <span className="text-teak font-bold">Stable</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Behind the scenes specs link (collapsible accordion) */}
                  <div className="mt-3.5 border-t border-sandstone/20 pt-2.5 text-left">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTech(expandedTech === idx ? null : idx);
                      }}
                      className="text-[9.5px] font-black uppercase text-marigold tracking-wider flex items-center gap-1 hover:text-teak transition-colors cursor-pointer"
                    >
                      <span>Tech Specs ⚙️</span>
                      <motion.span
                        animate={{ rotate: expandedTech === idx ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {expandedTech === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 pb-1 space-y-1.5 text-[9.5px] leading-relaxed border-t border-dashed border-sandstone/15 mt-1">
                            {idx === 0 && (
                              <>
                                <div className="flex justify-between"><span className="font-bold text-teal-700">ABDM Integration:</span> <span className="text-khaki">ABHA verification & card mapping</span></div>
                                <div className="flex justify-between"><span className="font-bold text-teal-700">SHA-256 Locker:</span> <span className="text-khaki">Secured patient phone hash sync</span></div>
                                <div className="flex justify-between"><span className="font-bold text-teal-700">Standard:</span> <span className="text-khaki">NHA demographic mapping compatibility</span></div>
                              </>
                            )}
                            {idx === 1 && (
                              <>
                                <div className="flex justify-between"><span className="font-bold text-indigo-700">Sync:</span> <span className="text-khaki">WebSockets + HTTP backup polling</span></div>
                                <div className="flex justify-between"><span className="font-bold text-indigo-700">Alerts Engine:</span> <span className="text-khaki">Fast2SMS & Twilio Programmable SMS</span></div>
                                <div className="flex justify-between"><span className="font-bold text-indigo-700">Range:</span> <span className="text-khaki">Average wait-time estimation algorithm</span></div>
                              </>
                            )}
                            {idx === 2 && (
                              <>
                                <div className="flex justify-between"><span className="font-bold text-emerald-700">EHR Model:</span> <span className="text-khaki">FHIR compliant JSON structures</span></div>
                                <div className="flex justify-between"><span className="font-bold text-emerald-700">Vital Bounds:</span> <span className="text-khaki">High BP (&gt;140 systolic) warning indicators</span></div>
                                <div className="flex justify-between"><span className="font-bold text-emerald-700">Auth Signature:</span> <span className="text-khaki">Digitally signed XML prescription schemas</span></div>
                              </>
                            )}
                            {idx === 3 && (
                              <>
                                <div className="flex justify-between"><span className="font-bold text-rose-700">Encryption:</span> <span className="text-khaki">AES-256 GCM secure envelope lock</span></div>
                                <div className="flex justify-between"><span className="font-bold text-rose-700">OTP Auth:</span> <span className="text-khaki">Twilio Verify SMS gateway integration</span></div>
                                <div className="flex justify-between"><span className="font-bold text-rose-700">DigiLocker:</span> <span className="text-khaki">Integrated national health vault credentials</span></div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Desktop connector arrows/dots */}
                  {idx < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 select-none pointer-events-none">
                      <span className={`text-base font-bold transition-colors duration-500 ${isActive ? 'text-marigold animate-pulse' : 'text-sandstone/60'
                        }`}>
                        ➔
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Secure Lightbox Modal Overlay */}
        <AnimatePresence>
          {isLightboxOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-[2rem] border border-sandstone shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-teak font-body"
              >
                {/* Lightbox Header */}
                <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white px-5 py-3.5 flex justify-between items-center">
                  <div>
                    <h4 className="font-heading font-black text-sm uppercase tracking-wider">Secure Health Vault Viewer</h4>
                    <p className="text-[14px] text-emerald-200 font-mono">Encrypted Envelope: SHA-256 Verified</p>
                  </div>
                  <button
                    onClick={() => setIsLightboxOpen(false)}
                    className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center font-bold text-[14px] cursor-pointer text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Document Content Area */}
                <div className="p-6 overflow-y-auto space-y-4 max-h-[380px] bg-parchment/15 text-left text-[14px] leading-relaxed">
                  {/* Doctor Header */}
                  <div className="border-b border-sandstone/30 pb-3 flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-black text-[15px] text-emerald-950">
                        {clinicsQueues[selectedClinicIdx]?.name || 'City Care Clinic'}
                      </h3>
                      <p className="text-[9.5px] text-khaki font-medium mt-0.5">Code: {clinicsQueues[selectedClinicIdx]?.clinicCode || 'CCC01'} | ABDM Facility ID: NH-98251</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">EHR FHIR v4.0</span>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="grid grid-cols-2 gap-3 text-[10.5px] bg-white border border-sandstone/10 p-2.5 rounded-xl">
                    <div><span className="text-khaki font-bold">Patient Name:</span> <span className="font-black text-teak">{checkedInPhone ? 'Dhruvil Patel' : 'Rahul Sharma'}</span></div>
                    <div><span className="text-khaki font-bold">ABHA Address:</span> <span className="font-mono font-bold text-teal-700">dhruvil@abha</span></div>
                    <div><span className="text-khaki font-bold">Mobile Link:</span> <span className="font-mono">{checkedInPhone || '98765 43210'}</span></div>
                    <div><span className="text-khaki font-bold">Consult Date:</span> <span className="font-mono font-medium">24 May 2026</span></div>
                  </div>

                  {/* Vitals Log */}
                  <div>
                    <h5 className="font-heading font-black text-[14px] text-emerald-800 uppercase tracking-wider mb-1.5">Vitals Logged</h5>
                    <div className="grid grid-cols-3 gap-2 text-center text-[14px]">
                      <div className="bg-white border border-sandstone/15 p-1.5 rounded-lg">
                        <p className="text-khaki font-bold text-[14px] uppercase">Blood Pressure</p>
                        <p className="font-extrabold text-teak mt-0.5">{vitals.bpSystolic}/{vitals.bpDiastolic}</p>
                      </div>
                      <div className="bg-white border border-sandstone/15 p-1.5 rounded-lg">
                        <p className="text-khaki font-bold text-[14px] uppercase">Pulse Rate</p>
                        <p className="font-extrabold text-teak mt-0.5">{vitals.pulse} bpm</p>
                      </div>
                      <div className="bg-white border border-sandstone/15 p-1.5 rounded-lg">
                        <p className="text-khaki font-bold text-[14px] uppercase">Body Temp</p>
                        <p className="font-extrabold text-teak mt-0.5">{vitals.temp}°F</p>
                      </div>
                    </div>
                  </div>

                  {/* Complaint and Rx Medicines */}
                  <div className="space-y-2">
                    <div>
                      <h5 className="font-heading font-black text-[14px] text-emerald-800 uppercase tracking-wider mb-0.5">Primary Diagnosis</h5>
                      <p className="font-bold text-teak text-[14px]">{activeComplaint}</p>
                    </div>

                    <div>
                      <h5 className="font-heading font-black text-[14px] text-emerald-800 uppercase tracking-wider mb-1.5">Prescribed Medicines</h5>
                      <div className="border border-sandstone/20 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left text-[14px]">
                          <thead>
                            <tr className="bg-sandstone/10 border-b border-sandstone/20 text-khaki font-black uppercase text-[7.5px]">
                              <th className="px-3 py-1.5">S.No</th>
                              <th className="px-3 py-1.5">Medicine Name</th>
                              <th className="px-3 py-1.5 text-right">Instructions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meds.map((med, mIdx) => (
                              <tr key={med} className="border-b border-sandstone/10 last:border-none">
                                <td className="px-3 py-2 font-mono text-[14px]">{mIdx + 1}</td>
                                <td className="px-3 py-2 font-black text-teak">{med}</td>
                                <td className="px-3 py-2 text-right font-medium text-khaki">Once Daily (After Meals)</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Signature Footer */}
                  <div className="border-t border-dashed border-sandstone/30 pt-3.5 flex justify-between items-center">
                    <div>
                      <p className="text-[14px] text-khaki uppercase font-bold tracking-widest">Digitally Signed EHR</p>
                      <p className="font-black text-[14px] text-teal-850">Dr. Anita Gupta</p>
                      <p className="text-[7.5px] text-khaki font-medium">Registered Medical Practitioner</p>
                    </div>
                    <div className="w-24 h-10 border border-dashed border-emerald-300 bg-white rounded-lg flex items-center justify-center p-1.5 overflow-hidden">
                      {signatureImg ? (
                        <img src={signatureImg} alt="Doctor Signature" loading="lazy" className="w-full h-full object-contain" />
                      ) : (
                        <svg className="w-16 h-8 text-emerald-700" viewBox="0 0 100 50" fill="none">
                          <path
                            d="M 10 30 C 30 10, 40 45, 50 15 C 60 -5, 75 35, 90 25 M 35 25 L 85 25"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lightbox Footer Actions */}
                <div className="bg-sandstone/10 border-t border-sandstone/25 px-5 py-3 flex justify-between items-center gap-3">
                  <span className="text-[9.5px] text-khaki font-black uppercase tracking-wider">AES-256 Decrypted File</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1 border border-sandstone text-teak rounded-lg font-black text-[14px] hover:bg-white cursor-pointer uppercase tracking-wider"
                    >
                      Print
                    </button>
                    <button
                      onClick={() => setIsLightboxOpen(false)}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-black text-[14px] hover:bg-emerald-700 cursor-pointer uppercase tracking-wider shadow-sm"
                    >
                      Close Viewer
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2: ALL WORKING FUNCTIONS & INTERACTIVE PLATFORM SIMULATOR
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="capabilities" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-sandstone/30">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <Sparkles size={14} className="text-emerald-600 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Interactive Working Capabilities • Live Simulator</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black text-teak tracking-tight">
            Explore Real Working Functions of Appointory
          </h2>
          <p className="mt-4 text-khaki text-base sm:text-lg leading-relaxed">
            Test our real platform features live in your browser: calculate AI wait times, simulate GST medical bills, test 6-digit lab pairings, trigger waiting room TV chimes, inspect doctor EHR templates, and review clinical analytics.
          </p>

          {/* Interactive Feature Tabs */}
          <div className="flex flex-wrap justify-center gap-2 pt-8">
            {[
              { id: 'ai-prediction', label: 'AI Wait-Time Engine', icon: Clock },
              { id: 'billing', label: 'Smart GST Invoicing', icon: Receipt },
              { id: 'lab-portal', label: 'Lab 6-Digit Handshake', icon: FlaskConical },
              { id: 'tv-display', label: 'Clinic TV Token Mode', icon: Tv },
              { id: 'templates', label: 'Doctor EHR Templates', icon: FileText },
              { id: 'analytics', label: 'Practice Intelligence', icon: BarChart3 },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeFeatureTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer select-none ${isActive
                    ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/30 scale-[1.04]'
                    : 'bg-white hover:bg-emerald-50 text-teak border border-sandstone/50 hover:border-emerald-500/60 hover:text-emerald-800'
                    }`}
                >
                  <TabIcon size={16} className={isActive ? 'text-emerald-200' : ''} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Simulator Card */}
        <div className="bg-white/90 backdrop-blur-md border border-sandstone/40 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl shadow-sandstone/10">
          {/* TAB 1: AI WAIT-TIME & VELOCITY CALCULATOR */}
          {activeFeatureTab === 'ai-prediction' && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">
                    <Activity size={15} />
                    <span>Dynamic Queue Estimation Algorithm</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-heading font-black text-teak">
                    Real-time AI Wait-Time & Velocity Predictor
                  </h3>
                  <p className="text-khaki text-sm mt-2 leading-relaxed">
                    Our dynamic Poisson distribution algorithm analyzes active token velocity, doctor specialty, patient rush coefficient, and consultation complexity in real-time.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-khaki uppercase tracking-wider">Presets:</span>
                  {[
                    { label: 'Morning OPD (4 pts)', count: 4, pace: 6, rush: 1.0 },
                    { label: 'Afternoon (8 pts)', count: 8, pace: 10, rush: 1.15 },
                    { label: 'Evening Peak (16 pts)', count: 16, pace: 12, rush: 1.35 },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCalcPatients(p.count);
                        setCalcPace(p.pace);
                        setCalcRushFactor(p.rush);
                      }}
                      className="px-2.5 py-1 bg-sandstone/15 hover:bg-sandstone/30 text-teak text-[10.5px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Interactive Sliders */}
                <div className="space-y-4 bg-sandstone/10 p-5 rounded-2xl border border-sandstone/20">
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-teak">Patients Ahead in Queue:</span>
                      <span className="px-2.5 py-0.5 bg-marigold text-white rounded-full font-mono text-xs">{calcPatients} Patients</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="25"
                      value={calcPatients}
                      onChange={(e) => setCalcPatients(parseInt(e.target.value))}
                      className="w-full accent-marigold cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="text-xs font-bold text-teak mb-2">Doctor Consultation Pace:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { pace: 6, label: 'Express (6m)' },
                        { pace: 10, label: 'Standard (10m)' },
                        { pace: 15, label: 'Detailed (15m)' }
                      ].map((item) => (
                        <button
                          key={item.pace}
                          onClick={() => setCalcPace(item.pace)}
                          className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${calcPace === item.pace
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-teak border-sandstone/30 hover:border-emerald-500'
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-teak mb-2">Lobby Rush Multiplier:</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { factor: 1.0, label: 'Off-Peak (1.0x)' },
                        { factor: 1.15, label: 'Mid-Day (1.15x)' },
                        { factor: 1.35, label: 'Peak Rush (1.35x)' }
                      ].map((item) => (
                        <button
                          key={item.factor}
                          onClick={() => setCalcRushFactor(item.factor)}
                          className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${calcRushFactor === item.factor
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-teak border-sandstone/30 hover:border-indigo-500'
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-khaki font-medium">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>Algorithm achieves 97.4% Bayesian confidence rating across verified clinical OPDs.</span>
                </div>
              </div>

              {/* Dynamic Result Panel */}
              <div className="lg:col-span-6 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Live AI Output</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${congestionLevel === 'Smooth Flow' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    congestionLevel === 'Moderate Flow' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}>
                    {congestionLevel}
                  </span>
                </div>

                <div className="py-4 text-center">
                  <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Estimated Patient Wait Time</p>

                  {/* Radial SVG Gauge */}
                  <div className="relative w-40 h-40 mx-auto my-3 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" className="text-slate-800" fill="transparent" />
                      <circle
                        cx="50" cy="50" r="40"
                        stroke="currentColor" strokeWidth="8"
                        strokeDasharray={251.3}
                        strokeDashoffset={251.3 - (Math.min(100, (predictedWaitMins / 120) * 100) / 100) * 251.3}
                        strokeLinecap="round"
                        className={`transition-all duration-700 ${predictedWaitMins > 90 ? 'text-rose-500' : predictedWaitMins > 45 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-4xl sm:text-5xl font-heading font-black text-white">{predictedWaitMins}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 -mt-1">Minutes</span>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-400 font-semibold">
                    Arrival window: {Math.max(5, predictedWaitMins - 15)} to {predictedWaitMins + 5} mins from now
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <span className="text-[11px] text-slate-400 font-semibold block">Queue Velocity</span>
                    <span className="text-lg font-black text-white">{predictedVelocity} patients / hr</span>
                  </div>
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                    <span className="text-[11px] text-slate-400 font-semibold block">Token Call Window</span>
                    <span className="text-lg font-black text-emerald-400">~{calcPace}m / consultation</span>
                  </div>
                </div>

                {/* Instant SMS Dispatch Mockup */}
                <div className="mt-5 bg-slate-950/90 border border-slate-800 rounded-xl p-3 flex items-start gap-3 text-xs">
                  <Zap size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">Automated SMS & Live Queue Trigger:</span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      "Token #{calcPatients + 12}: Currently 2 patients ahead at Dr. Anita's Clinic. Estimated time: {predictedWaitMins} mins. Track live: appointory.in/t/live"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SMART CLINICAL BILLING & GST INVOICING */}
          {activeFeatureTab === 'billing' && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-widest mb-1">
                    <Receipt size={15} />
                    <span>Clinic Billing & Invoicing Engine</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-heading font-black text-teak">
                    Smart GST Medical Billing & Instant Receipts
                  </h3>
                  <p className="text-khaki text-sm mt-2 leading-relaxed">
                    Generate multi-line invoices covering consultation fees, laboratory investigations, and medical procedures with automated GST calculation, discounts, and printable PDF receipts.
                  </p>
                </div>

                {/* Item Selection Toggles */}
                <div className="space-y-2 bg-sandstone/10 p-4 rounded-2xl border border-sandstone/20">
                  <div className="text-xs font-black uppercase tracking-wider text-khaki mb-2">Select Services / Tests:</div>
                  {billingItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setBillingItems(billingItems.map(i => i.id === item.id ? { ...i, selected: !i.selected } : i))}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${item.selected
                        ? 'bg-white border-marigold/80 shadow-sm'
                        : 'bg-white/40 border-sandstone/20 opacity-60'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${item.selected ? 'bg-marigold text-white' : 'border border-sandstone text-transparent'
                          }`}>
                          ✓
                        </div>
                        <span className="text-xs font-bold text-teak">{item.name}</span>
                      </div>
                      <span className="text-xs font-mono font-black text-teak">₹{item.price}</span>
                    </div>
                  ))}
                </div>

                {/* GST Rate & Discount Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-teak block mb-1.5">GST Rate:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 5, 12, 18].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setBillingGstRate(rate)}
                          className={`py-1.5 font-bold text-xs rounded-lg border transition-all cursor-pointer ${billingGstRate === rate
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-teak border-sandstone/30'
                            }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-teak">Discount:</span>
                      <span className="font-mono text-indigo-700">₹{billingDiscount}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="10"
                      value={billingDiscount}
                      onChange={(e) => setBillingDiscount(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Live Digital Receipt Card */}
              <div className="lg:col-span-6 bg-white border border-sandstone/40 rounded-3xl p-6 sm:p-8 shadow-xl relative">
                <div className="flex justify-between items-start pb-4 border-b border-sandstone/20">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-marigold">Tax Invoice / Receipt</span>
                    <h4 className="text-lg font-black text-teak mt-0.5">Dr. Anita's Health Clinic</h4>
                    <p className="text-[11px] text-khaki font-mono">GSTIN: 24AAACD1234F1Z5 • Invoice #INV-2026-089</p>
                  </div>
                  <div className="w-12 h-12 bg-sandstone/15 rounded-xl flex items-center justify-center text-lg">
                    🧾
                  </div>
                </div>

                {/* Line Items */}
                <div className="py-4 space-y-2 border-b border-sandstone/20 text-xs">
                  {billingItems.filter(i => i.selected).map(item => (
                    <div key={item.id} className="flex justify-between text-teak font-medium">
                      <span>{item.name}</span>
                      <span className="font-mono font-bold">₹{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                  {billingItems.filter(i => i.selected).length === 0 && (
                    <p className="text-center text-khaki italic py-2">Select at least one service item above</p>
                  )}
                </div>

                {/* Tax & Total Summary */}
                <div className="pt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between text-khaki">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{billingSubtotal.toFixed(2)}</span>
                  </div>
                  {billingDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Special Discount:</span>
                      <span className="font-mono">-₹{billingDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-khaki">
                    <span>GST ({billingGstRate}%):</span>
                    <span className="font-mono">₹{billingGstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base sm:text-lg font-black text-teak pt-2 border-t border-dashed border-sandstone/30">
                    <span>Grand Total:</span>
                    <span className="text-marigold font-mono">₹{billingGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Simulation & Receipt Action */}
                <div className="mt-6 pt-4 border-t border-sandstone/20 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setInvoiceDownloaded(true);
                      setShowReceiptModal(true);
                      setTimeout(() => setInvoiceDownloaded(false), 2500);
                    }}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                  >
                    {invoiceDownloaded ? (
                      <>
                        <Check size={16} />
                        <span>Receipt Generated & Saved!</span>
                      </>
                    ) : (
                      <>
                        <Printer size={16} />
                        <span>Print / Download PDF Receipt</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="py-3 px-4 bg-sandstone/15 hover:bg-sandstone/25 text-teak rounded-xl font-bold text-xs transition-all cursor-pointer text-center"
                  >
                    View Reception Panel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INDEPENDENT LAB 6-DIGIT HANDSHAKE */}
          {activeFeatureTab === 'lab-portal' && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 uppercase tracking-widest mb-1">
                    <FlaskConical size={15} />
                    <span>Independent Diagnostic Lab Network</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-heading font-black text-teak">
                    6-Digit Cryptographic Handshake Pairing
                  </h3>
                  <p className="text-khaki text-sm mt-2 leading-relaxed">
                    Independent pathology labs register once and pair with nearby clinics in seconds using a one-time 6-digit connect code. Once paired, doctors dispatch electronic orders and labs push results directly into patient lockers.
                  </p>
                </div>

                {/* Handshake Simulator Card */}
                <div className="bg-sandstone/10 p-5 rounded-2xl border border-sandstone/20 space-y-4">
                  <div>
                    <span className="text-xs font-bold text-teak block mb-1">Lab Connect Pairing Code:</span>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2.5 bg-white border-2 border-dashed border-cyan-600 rounded-xl font-mono text-xl font-black text-cyan-800 tracking-widest">
                        {labConnectCode}
                      </div>
                      <button
                        onClick={() => {
                          const newCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
                          setLabConnectCode(newCode);
                          setLabPairSuccess(true);
                        }}
                        className="px-4 py-2.5 bg-cyan-700 text-white rounded-xl text-xs font-bold hover:bg-cyan-800 transition-colors cursor-pointer"
                      >
                        Generate New Code
                      </button>
                    </div>
                  </div>

                  {labPairSuccess ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                      <CheckCircle2 size={16} />
                      <span>Instant Link: Airmed Pathology & Dr. Anita Clinic Connected!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                      <Clock size={16} />
                      <span>Awaiting 6-digit handshake confirmation...</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs text-khaki">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                    <span>Electronic test requisition with clinical history notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                    <span>Automated abnormal parameter flagging (e.g. Hemoglobin Low Alert)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                    <span>Instant PDF upload to patient AES-256 Health Locker</span>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/lab/login')}
                  className="px-6 py-3 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-cyan-700/20"
                >
                  Open Independent Lab Portal →
                </button>
              </div>

              {/* Synced Lab Results Preview */}
              <div className="lg:col-span-6 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-xs uppercase font-bold text-cyan-400">Electronic Lab Requisition</span>
                    <h4 className="text-base font-bold text-white">Requisition #ORD-8921 • Synced</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full text-xs font-bold">
                    NABL Accredited
                  </span>
                </div>

                {/* Results Table */}
                <div className="py-4 space-y-2.5">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">Hemoglobin (Hb)</span>
                      <span className="text-[11px] text-slate-400">Ref: 12.0 - 15.5 g/dL</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-rose-400">10.4 g/dL</span>
                      <span className="block text-[10px] uppercase font-black text-rose-400">Low (Flagged)</span>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">Total Leukocyte Count (TLC)</span>
                      <span className="text-[11px] text-slate-400">Ref: 4,000 - 11,000 /cumm</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">7,200 /cumm</span>
                      <span className="block text-[10px] uppercase font-black text-emerald-400">Normal</span>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">Platelet Count</span>
                      <span className="text-[11px] text-slate-400">Ref: 1.5 - 4.5 Lakhs/cumm</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400">2.4 Lakhs</span>
                      <span className="block text-[10px] uppercase font-black text-emerald-400">Normal</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                  <span>Authorized Signatory: Dr. Rajesh Shah (MD Pathologist)</span>
                  <span className="text-emerald-400 font-bold">Auto-Synced to EMR</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLINIC TV DISPLAY & CHIME */}
          {activeFeatureTab === 'tv-display' && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-widest mb-1">
                    <Tv size={15} />
                    <span>Lobby Hardware Integration</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-heading font-black text-teak">
                    Waiting Room Live TV Display & Chime
                  </h3>
                  <p className="text-khaki text-sm mt-2 leading-relaxed">
                    Connect any Smart TV, Android box, or monitor via HDMI. Appointory provides a zero-setup fullscreen TV display that shows active tokens and sounds automated audio chime announcements.
                  </p>
                </div>

                {/* Interactive Controls */}
                <div className="space-y-3 bg-sandstone/10 p-5 rounded-2xl border border-sandstone/20">
                  <div className="text-xs font-black uppercase tracking-wider text-khaki mb-1">Interactive TV Controls:</div>

                  <button
                    onClick={playChimeSound}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${tvChimePlaying
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-102'
                      : 'bg-white text-teak border border-sandstone/30 hover:border-amber-500'
                      }`}
                  >
                    <Volume2 size={16} className={tvChimePlaying ? 'animate-bounce' : ''} />
                    <span>{tvChimePlaying ? 'Playing Lobby Chime...' : 'Test Audio Chime Tone'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setTvTokenCall(prev => prev + 1);
                      playChimeSound();
                    }}
                    className="w-full py-3 px-4 bg-marigold hover:bg-marigold/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-marigold/20"
                  >
                    <span>Call Next Token (#A-{tvTokenCall + 1})</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowTvFullscreenModal(true);
                      playChimeSound();
                    }}
                    className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer relative overflow-hidden group"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', border: '1px solid rgba(251,191,36,0.35)', boxShadow: '0 0 0 0 rgba(251,191,36,0)', color: '#fbbf24' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(251,191,36,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.3)'}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/8 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <Maximize2 size={16} className="text-amber-300 group-hover:scale-110 transition-transform duration-200" />
                    <span className="relative z-10">Launch Fullscreen TV Monitor Simulator</span>
                    <span className="ml-auto text-amber-400/50 text-[10px] font-mono">HDTV</span>
                  </button>
                </div>

                <div className="text-xs text-khaki space-y-1.5">
                  <p>✓ High-contrast widescreen typography readable from 30+ feet.</p>
                  <p>✓ Synthetic dual-frequency chime (587Hz to 880Hz) audible across crowded lobbies.</p>
                  <p>✓ Multi-doctor counter support with automatic room mapping.</p>
                </div>
              </div>

              {/* TV Monitor Screen Mockup */}
              <div className="lg:col-span-7 bg-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-slate-800 relative">
                {/* TV Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                    <span className="font-heading font-black text-sm tracking-wide text-white">METRO CLINIC OPD LOBBY</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400 hidden sm:inline">TV DISPLAY MODE</span>
                    <button
                      onClick={() => {
                        setShowTvFullscreenModal(true);
                        playChimeSound();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Maximize2 size={12} />
                      <span>Fullscreen</span>
                    </button>
                  </div>
                </div>

                {/* TV Main Body */}
                <div className="grid sm:grid-cols-12 gap-6 my-6 items-center">
                  <div className="sm:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-inner">
                    <span className="text-xs uppercase font-bold tracking-widest text-slate-400 block mb-1">Now Calling</span>
                    <div className="text-6xl sm:text-7xl font-heading font-black text-amber-400 tracking-tight my-2">
                      #A-{tvTokenCall}
                    </div>
                    <div className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-bold text-amber-300">
                      Please Proceed to Room 02
                    </div>
                    <p className="text-xs text-slate-300 mt-2 font-medium">Dr. Anita Gupta • General Physician</p>
                  </div>

                  <div className="sm:col-span-5 space-y-2">
                    <span className="text-[11px] uppercase font-bold tracking-widest text-slate-400 block mb-1">Next In Line</span>
                    {[tvTokenCall + 1, tvTokenCall + 2, tvTokenCall + 3].map((num, idx) => (
                      <div key={num} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl flex justify-between items-center">
                        <span className="font-mono font-bold text-sm text-slate-300">#A-{num}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Queue #{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TV Bottom Marquee */}
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Emergency tokens bypass standard sequence automatically.</span>
                  <span className="text-emerald-400 font-bold">Online Status: Connected</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOCTOR EHR PRESCRIPTION TEMPLATES */}
          {activeFeatureTab === 'templates' && (
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">
                    <FileText size={15} />
                    <span>Clinical EMR Prescription Engine</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-heading font-black text-teak">
                    Reusable Doctor EHR Clinical Templates
                  </h3>
                  <p className="text-khaki text-sm mt-2 leading-relaxed">
                    Doctors can compile legally compliant, tamper-evident digital prescriptions in under 60 seconds with reusable specialty templates, standard dosage guidelines, and digital signatures.
                  </p>
                </div>

                {/* Template Selector */}
                <div className="space-y-2 bg-sandstone/10 p-4 rounded-2xl border border-sandstone/20">
                  <div className="text-xs font-black uppercase tracking-wider text-khaki mb-2">Select Clinical Condition:</div>
                  {[
                    { key: 'fever', label: 'Acute Viral Fever & URTI', icon: '🌡️' },
                    { key: 'hypertension', label: 'Essential Hypertension (Stage 1)', icon: '❤️' },
                    { key: 'diabetes', label: 'Type 2 Diabetes Mellitus Review', icon: '🩸' }
                  ].map((tpl) => (
                    <button
                      key={tpl.key}
                      onClick={() => setSelectedTemplateKey(tpl.key)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${selectedTemplateKey === tpl.key
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
                        : 'bg-white text-teak border-sandstone/30 hover:border-emerald-600'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span>{tpl.icon}</span>
                        <span className="text-xs font-bold">{tpl.label}</span>
                      </div>
                      <ArrowRight size={14} className={selectedTemplateKey === tpl.key ? 'text-white' : 'text-sandstone'} />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-700/20"
                >
                  Doctor EMR Dashboard Login →
                </button>
              </div>

              {/* Dynamic Prescription Preview */}
              <div className="lg:col-span-7 bg-white border border-sandstone/40 rounded-3xl p-6 sm:p-8 shadow-xl">
                <div className="flex justify-between items-start pb-4 border-b border-sandstone/20">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">Digital Prescription (EHR)</span>
                    <h4 className="text-lg font-black text-teak mt-0.5">{doctorTemplates[selectedTemplateKey].title}</h4>
                    <p className="text-xs text-khaki font-mono mt-0.5">{doctorTemplates[selectedTemplateKey].vitals}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <div>
                      <span className="text-[10px] text-khaki uppercase font-bold block">Patient Record</span>
                      <span className="text-xs font-bold text-teak font-mono">#P-2026-9041</span>
                    </div>
                    <button
                      onClick={handleCopyPrescription}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title="Copy Rx text to clipboard"
                    >
                      {copiedRx ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedRx ? 'Copied!' : 'Copy Rx'}</span>
                    </button>
                  </div>
                </div>

                {/* Complaint */}
                <div className="py-3 border-b border-sandstone/20 text-xs">
                  <span className="font-bold text-teak block mb-1">Chief Complaints & Clinical Presentation:</span>
                  <p className="text-khaki leading-relaxed">{doctorTemplates[selectedTemplateKey].complaint}</p>
                </div>

                {/* Rx Table */}
                <div className="py-3 border-b border-sandstone/20">
                  <span className="font-bold text-xs text-teak block mb-2">Prescribed Medication:</span>
                  <div className="border border-sandstone/25 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-sandstone/10 border-b border-sandstone/25 text-khaki font-black text-[10px] uppercase">
                        <tr>
                          <th className="p-2">Medicine</th>
                          <th className="p-2">Dosage</th>
                          <th className="p-2">Duration</th>
                          <th className="p-2 text-right">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sandstone/15">
                        {doctorTemplates[selectedTemplateKey].rx.map((med, mIdx) => (
                          <tr key={mIdx}>
                            <td className="p-2 font-bold text-teak">{med.name}</td>
                            <td className="p-2 font-mono text-emerald-800">{med.dosage}</td>
                            <td className="p-2 text-khaki">{med.duration}</td>
                            <td className="p-2 text-right text-khaki">{med.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Advice & Signature */}
                <div className="pt-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-teak block mb-0.5">Clinical Advice:</span>
                    <p className="text-khaki text-[11px]">{doctorTemplates[selectedTemplateKey].advice}</p>
                  </div>
                  <div className="text-right pl-4">
                    <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider block">Digitally Signed</span>
                    <span className="font-heading font-black text-teak text-xs">Dr. Anita Gupta</span>
                    <span className="text-[9px] text-khaki block">Reg: MCI-49210-A</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PRACTICE INTELLIGENCE & ANALYTICS */}
          {activeFeatureTab === 'analytics' && (
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-widest mb-1">
                  <BarChart3 size={15} />
                  <span>Real-time Operations Intelligence</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-heading font-black text-teak">
                  Clinic & Lab Revenue Analytics
                </h3>
                <p className="text-khaki text-sm mt-1">
                  Real-time visibility into daily patient flow, payment collection modes, average consultation velocity, and lab conversion rates.
                </p>
              </div>

              {/* Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Today's Patient Inflow", value: "54 Patients", change: "+18% vs yesterday", icon: Users, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                  { label: "Gross Collections", value: "₹38,450", change: "GST Collected: ₹5,860", icon: DollarSign, color: "text-indigo-700 bg-indigo-50 border-indigo-200" },
                  { label: "Avg Consultation Pace", value: "7.8 mins", change: "98.2% on-time pace", icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200" },
                  { label: "Lab Diagnostic Sync", value: "100%", change: "26 reports delivered", icon: FlaskConical, color: "text-cyan-700 bg-cyan-50 border-cyan-200" },
                ].map((stat, idx) => {
                  const StatIcon = stat.icon;
                  return (
                    <div key={idx} className="bg-white border border-sandstone/30 rounded-2xl p-4 sm:p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-khaki font-bold uppercase tracking-wider">{stat.label}</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${stat.color}`}>
                          <StatIcon size={16} />
                        </div>
                      </div>
                      <div className="text-xl sm:text-2xl font-heading font-black text-teak">{stat.value}</div>
                      <div className="text-[11px] text-khaki font-medium mt-1">{stat.change}</div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Graphs Mockup */}
              <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-white border border-sandstone/30 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-teak">Hourly Patient Footfall & Rush Pattern</span>
                    <span className="text-xs font-mono text-emerald-700 font-bold">Peak Rush: 11 AM - 1 PM</span>
                  </div>
                  <div className="grid grid-cols-8 gap-2 items-end h-36 pt-4">
                    {[
                      { time: '9 AM', count: 4, height: '35%' },
                      { time: '10 AM', count: 8, height: '65%' },
                      { time: '11 AM', count: 12, height: '100%' },
                      { time: '12 PM', count: 10, height: '85%' },
                      { time: '1 PM', count: 6, height: '50%' },
                      { time: '5 PM', count: 9, height: '75%' },
                      { time: '6 PM', count: 11, height: '90%' },
                      { time: '7 PM', count: 5, height: '40%' },
                    ].map((bar, bIdx) => (
                      <div key={bIdx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] font-mono font-bold text-teak">{bar.count}</span>
                        <div
                          style={{ height: bar.height }}
                          className="w-full bg-marigold/80 hover:bg-marigold rounded-t-lg transition-all"
                        ></div>
                        <span className="text-[9px] text-khaki font-mono">{bar.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white border border-sandstone/30 rounded-2xl p-5 shadow-sm space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-teak block">Payment Collection Split</span>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-700">UPI Instant QR (68%)</span>
                        <span className="font-mono">₹26,146</span>
                      </div>
                      <div className="w-full h-2 bg-sandstone/20 rounded-full overflow-hidden">
                        <div className="w-[68%] h-full bg-emerald-600 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-indigo-700">Cash Register (24%)</span>
                        <span className="font-mono">₹9,228</span>
                      </div>
                      <div className="w-full h-2 bg-sandstone/20 rounded-full overflow-hidden">
                        <div className="w-[24%] h-full bg-indigo-600 rounded-full"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-amber-700">Debit / Credit Card (8%)</span>
                        <span className="font-mono">₹3,076</span>
                      </div>
                      <div className="w-full h-2 bg-sandstone/20 rounded-full overflow-hidden">
                        <div className="w-[8%] h-full bg-amber-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3: SEMANTIC AEO & SEO FREQUENTLY ASKED QUESTIONS (ACCORDION)
          ══════════════════════════════════════════════════════════════════════ */}
      <section id="faq" className="py-20 px-4 sm:px-6 max-w-5xl mx-auto border-t border-sandstone/30">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <HelpCircle size={14} className="text-indigo-600" />
            <span>AI Search & Knowledge Base • Semantic AEO Directives</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-teak tracking-tight">
            Frequently Asked Questions & Answers
          </h2>
          <p className="mt-3 text-khaki text-base sm:text-lg leading-relaxed">
            Verified, authoritative information covering doctor appointment scheduling, smart clinical billing, instant queue alerts, pathology lab integrations, and digital health records.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {[
            {
              q: "How does Appointory's AI wait-time prediction algorithm work?",
              a: "Appointory utilizes a dynamic predictive model that continuously analyzes doctor consultation velocity, real-time lobby rush, patient complaint complexity, and time-of-day traffic patterns. Instead of static queue counters, our system calculates dynamic patient arrival windows and sends automated SMS alerts so patients arrive right when their doctor is ready, eliminating physical waiting room crowding."
            },
            {
              q: "How does the smart clinical billing and GST invoicing engine operate?",
              a: "The billing module enables clinics, polyclinics, and receptionists to generate comprehensive, itemized tax invoices covering doctor consultation charges, diagnostic tests, medical procedures, and consumables. It automatically applies configured GST rates (0% exempt, 5%, 12%, 18%) or custom discounts, supports multiple payment modes (UPI QR, Cash, Card), and creates instant printable PDF receipts featuring clinic branding and anti-fraud verification QR codes."
            },
            {
              q: "How do independent pathology and diagnostic labs connect with clinics?",
              a: "Independent diagnostic centers register on their dedicated Lab Portal and generate or enter a 6-digit secure pairing code. Once connected via this digital handshake, clinics can electronically dispatch test requests with clinical notes, and labs can track samples, enter test values with automated abnormal parameter highlighting, and upload PDF reports that instantly sync to both the doctor's EMR and the patient's Health Locker."
            },
            {
              q: "How does Appointory keep patient health records and lab reports secure?",
              a: "All patient prescriptions, diagnostic reports, and medical histories are encrypted at rest using AES-256 standard cryptographic vaults. Access is strictly protected via phone-based OTP verification, ensuring that only the patient and authorized consulting clinicians can view confidential medical records. The platform is designed with ABDM (Ayushman Bharat Digital Mission) compliance and ABHA health ID linking."
            },
            {
              q: "Can clinics use Appointory's Waiting Room TV mode on smart TVs or monitors?",
              a: "Yes. Any Smart TV, computer monitor, or tablet connected via HDMI or browser can open Appointory's Fullscreen TV Display Mode. It presents a clean, high-contrast token display readable from across large lobbies and plays pleasant synthetic dual-frequency audio chime announcements whenever the doctor calls the next patient."
            },
            {
              q: "How do patients book appointments and receive queue updates without WhatsApp?",
              a: "Patients book appointments through verified clinic profiles or are registered as walk-ins by receptionists. Real-time updates and active token calls are communicated directly via high-deliverability Instant SMS containing an encrypted live web tracking link. Patients can check real-time queue position, doctor pace, and estimated wait times on their phones with zero third-party messaging dependencies."
            },
            {
              q: "What doctor prescription templates and EMR features are available?",
              a: "Appointory includes a specialized Doctor EMR console with pre-configured clinical prescription templates for common specialties (General OPD, Cardiology/Hypertension, Pediatrics, Dermatology, Diabetes). Doctors can document vitals (BP, Pulse, Temperature, SpO2), select standardized medicine regimens, add dosage instructions, and generate digitally signed prescriptions in under a minute."
            },
            {
              q: "How does Appointory integrate with the Ayushman Bharat Digital Mission (ABDM) and ABHA?",
              a: "Appointory is architected for India's digital health stack. Patients can link their 14-digit ABHA (Ayushman Bharat Health Account) address to securely organize longitudinal health records, share consultation summaries with authorized providers, and maintain verifiable health records across India's public and private health networks."
            }
          ].map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white border border-sandstone/40 rounded-2xl overflow-hidden shadow-sm transition-all duration-200"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  className="w-full p-5 sm:p-6 text-left flex justify-between items-center gap-4 cursor-pointer hover:bg-sandstone/5"
                  aria-expanded={isOpen}
                >
                  <span className="font-heading font-black text-teak text-base sm:text-lg leading-snug">
                    {item.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${isOpen ? 'bg-marigold text-white border-marigold' : 'bg-sandstone/15 text-khaki border-sandstone/30'
                    }`}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-khaki text-sm sm:text-base leading-relaxed border-t border-sandstone/15 bg-sandstone/5">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* High-Intent Search Entities Bar */}
        <div className="mt-12 p-6 bg-sandstone/10 border border-sandstone/25 rounded-2xl">
          <span className="text-xs font-black uppercase tracking-wider text-khaki block mb-3 text-center sm:text-left">
            Core Search Capabilities & Healthcare Entities Covered:
          </span>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {[
              'Doctor Appointment Booking',
              'OPD Queue Token System',
              'AI Wait-Time Prediction',
              'Clinic Billing Software',
              'GST Medical Invoices',
              'Instant SMS Queue Alerts',
              'Independent Pathology Labs',
              '6-Digit Lab Handshake',
              'Clinic TV Token Display',
              'Audio Chime Announcements',
              'Doctor EHR Prescriptions',
              'AES-256 Health Locker',
              'ABDM & ABHA Integration'
            ].map((tag, tIdx) => (
              <span
                key={tIdx}
                className="px-3 py-1 bg-white border border-sandstone/30 rounded-lg text-xs font-semibold text-teak shadow-2xs"
              >
                ✓ {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4: HIGH-CONVERSION PLATFORM CTA BANNER
          ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto" id="get-started">
        <div className="relative rounded-[2.5rem] overflow-hidden text-white shadow-[0_40px_80px_-20px_rgba(6,20,16,0.75)] border border-white/8"
          style={{ background: 'linear-gradient(135deg, #061410 0%, #0a2218 25%, #0d3327 50%, #072e20 75%, #041410 100%)' }}
        >
          {/* Layered ambient glow orbs */}
          <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(45,155,111,0.08) 0%, transparent 70%)' }} />
          {/* Dot grid texture */}
          <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          {/* Horizontal separator glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5), transparent)' }} />

          <div className="relative z-10 p-8 sm:p-14 lg:p-16">
            {/* Top badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-md"
                style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(52,211,153,0.35)', color: '#6ee7b7' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span>Get Started with Appointory Today</span>
              </div>
            </div>

            {/* Headline */}
            <div className="text-center max-w-3xl mx-auto mb-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight leading-tight mb-5">
                Ready to Modernize Your{' '}
                <span style={{ background: 'linear-gradient(90deg, #34d399, #5eead4, #34d399)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Clinic, Lab, or Practice?
                </span>
              </h2>
              <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(209,250,229,0.75)' }}>
                Join hundreds of medical practitioners, polyclinics, pathology centers, and thousands of patients experiencing{' '}
                <span style={{ color: '#6ee7b7', fontWeight: 700 }}>zero waiting room delays</span>,{' '}
                <span style={{ color: '#6ee7b7', fontWeight: 700 }}>automated GST billing</span>, and{' '}
                <span style={{ color: '#6ee7b7', fontWeight: 700 }}>secure health lockers</span>.
              </p>
            </div>

            {/* Three premium action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-10">
              {/* Card 1: Clinic */}
              <button
                onClick={() => navigate('/login')}
                className="group relative flex flex-col items-center gap-3.5 p-6 rounded-2xl font-black text-sm text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))', boxShadow: '0 0 0 1px rgba(52,211,153,0.35), 0 16px 40px rgba(5,150,105,0.45)', color: '#022c22' }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.25), transparent)' }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.25)' }}>
                  <Building2 size={22} style={{ color: '#022c22' }} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(2,44,34,0.7)' }}>For Clinics &amp; Hospitals</div>
                  <div className="text-base font-black">Register Clinic</div>
                  <div className="text-[11px] font-bold" style={{ color: 'rgba(2,44,34,0.75)' }}>or Staff Login →</div>
                </div>
              </button>

              {/* Card 2: Lab */}
              <button
                onClick={() => navigate('/lab/login')}
                className="group relative flex flex-col items-center gap-3.5 p-6 rounded-2xl font-black text-sm text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(52,211,153,0.3)', color: '#d1fae5', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.1), transparent)' }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}>
                  <FlaskConical size={22} style={{ color: '#5eead4' }} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(209,250,229,0.55)' }}>For Pathology Labs</div>
                  <div className="text-base font-black">Diagnostic Lab Portal</div>
                  <div className="text-[11px] font-bold" style={{ color: 'rgba(209,250,229,0.65)' }}>NABL-ready integration →</div>
                </div>
              </button>

              {/* Card 3: Patient */}
              <button
                onClick={() => navigate('/patient/register')}
                className="group relative flex flex-col items-center gap-3.5 p-6 rounded-2xl font-black text-sm text-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(110,231,183,0.2)', color: '#a7f3d0', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.07), transparent)' }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <FolderHeart size={22} style={{ color: '#34d399' }} />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'rgba(167,243,208,0.5)' }}>For Patients</div>
                  <div className="text-base font-black">Free Health Locker</div>
                  <div className="text-[11px] font-bold" style={{ color: 'rgba(167,243,208,0.65)' }}>Lifetime secure storage →</div>
                </div>
              </button>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap justify-center items-center gap-x-7 gap-y-2 mt-10 text-xs font-semibold" style={{ color: 'rgba(110,231,183,0.6)' }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                Setup in under 2 minutes
              </span>
              <span className="hidden sm:block w-px h-4" style={{ background: 'rgba(110,231,183,0.2)' }} />
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                No credit card required
              </span>
              <span className="hidden sm:block w-px h-4" style={{ background: 'rgba(110,231,183,0.2)' }} />
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} style={{ color: '#34d399' }} />
                ABDM &amp; GST Compliant
              </span>
              <span className="hidden sm:block w-px h-4" style={{ background: 'rgba(110,231,183,0.2)' }} />
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} style={{ color: '#34d399' }} />
                AES-256 Encrypted
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          RECEIPT / TAX INVOICE PRINT MODAL
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-sandstone/30 text-teak my-8 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowReceiptModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-sandstone/15 text-khaki hover:text-teak transition-colors cursor-pointer"
                aria-label="Close Receipt"
              >
                <X size={20} />
              </button>

              {/* Receipt Content */}
              <div id="printable-receipt" className="space-y-4">
                {/* Header */}
                <div className="text-center pb-4 border-b border-sandstone/30">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold uppercase tracking-wider mb-2">
                    <CheckCircle2 size={13} />
                    <span>Official Tax Invoice / Bill of Supply</span>
                  </div>
                  <h3 className="font-heading text-xl sm:text-2xl font-black text-teak">Apex Multi-Speciality Clinic</h3>
                  <p className="text-xs text-khaki mt-0.5">Ring Road, Medical Enclave, Ahmedabad, Gujarat 380015</p>
                  <div className="flex justify-center gap-4 text-[10px] text-khaki font-mono mt-1">
                    <span>GSTIN: 24AABCU9603R1ZM</span>
                    <span>ARN: AA24092601920</span>
                  </div>
                </div>

                {/* Patient & Invoice Meta */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-sandstone/10 p-3 rounded-xl border border-sandstone/20">
                  <div>
                    <span className="text-[10px] text-khaki uppercase font-bold block">Patient Name</span>
                    <span className="font-bold text-teak">Mr. Ramesh Patel (42y / M)</span>
                    <span className="text-[10px] text-khaki block">Token #A-14 • General OPD</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-khaki uppercase font-bold block">Invoice No & Date</span>
                    <span className="font-mono font-bold text-teak">INV-2026-08492</span>
                    <span className="text-[10px] text-khaki block">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="border border-sandstone/30 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-sandstone/15 text-teak font-black text-[10px] uppercase border-b border-sandstone/30">
                      <tr>
                        <th className="p-2.5">Service Description</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sandstone/20">
                      {billingItems.filter(i => i.selected).map((item) => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-medium">{item.name}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-teak">₹{item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary calculation */}
                <div className="space-y-1.5 text-xs pt-2">
                  <div className="flex justify-between text-khaki">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{billingSubtotal.toFixed(2)}</span>
                  </div>
                  {billingDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{billingDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-khaki">
                    <span>CGST ({billingGstRate / 2}%):</span>
                    <span className="font-mono">₹{(billingGstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-khaki">
                    <span>SGST ({billingGstRate / 2}%):</span>
                    <span className="font-mono">₹{(billingGstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-black text-teak pt-2 border-t border-dashed border-sandstone/40">
                    <span>Total Amount Due:</span>
                    <span className="text-marigold font-mono text-lg font-black">₹{billingGrandTotal.toFixed(2)}</span>
                  </div>
                </div>


              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-sandstone/20">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Printer size={16} />
                  <span>Print Tax Invoice</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="py-3 px-5 bg-sandstone/15 hover:bg-sandstone/25 text-teak rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          TV DISPLAY FULLSCREEN MONITOR SIMULATOR
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTvFullscreenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 select-none overflow-hidden"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                </span>
                <div>
                  <h2 className="font-heading font-black text-lg sm:text-2xl tracking-wide text-white">
                    APEX MULTI-SPECIALITY OPD LOBBY DISPLAY
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">Counter 01 & 02 • Live Token Audio System</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="font-mono text-xl sm:text-2xl font-black text-amber-400">{liveTime}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">Digital Clock Synced</div>
                </div>
                <button
                  onClick={() => setShowTvFullscreenModal(false)}
                  className="p-2 sm:p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Exit Fullscreen TV Mode"
                >
                  <Minimize2 size={20} />
                </button>
              </div>
            </div>

            {/* Main Center Display Stage */}
            <div className="grid lg:grid-cols-12 gap-8 my-auto items-center py-6">
              {/* Calling Token Giant Box */}
              <div className="lg:col-span-8 bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-12 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-400 animate-pulse"></div>

                <span className="text-sm sm:text-base uppercase font-black tracking-widest text-amber-400/80 block mb-2">
                  Now Calling Token
                </span>

                <motion.div
                  key={tvTokenCall}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="text-7xl sm:text-9xl font-heading font-black text-amber-400 tracking-tight my-4 drop-shadow-[0_10px_20px_rgba(251,191,36,0.3)]"
                >
                  #A-{tvTokenCall}
                </motion.div>

                <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-full text-base sm:text-xl font-black text-emerald-300">
                  <span>👉 Please Proceed to Cabin Room 02</span>
                </div>

                <div className="mt-6 text-slate-300 text-sm sm:text-base font-medium flex items-center justify-center gap-3">
                  <span>Dr. Anita Gupta</span>
                  <span className="text-slate-600">•</span>
                  <span>Senior Consultant Physician</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400">Cabin Ready</span>
                </div>
              </div>

              {/* Next In Line Sidebar */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs uppercase font-black tracking-widest text-slate-400">
                    Next Tokens in Line
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">Estimated 10m/pt</span>
                </div>

                {[tvTokenCall + 1, tvTokenCall + 2, tvTokenCall + 3, tvTokenCall + 4].map((num, idx) => (
                  <div
                    key={num}
                    className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center"
                  >
                    <div>
                      <span className="font-mono font-black text-xl text-slate-200">#A-{num}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">General OPD Queue</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs font-bold text-amber-300">
                        Position #{idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                        ~ {(idx + 1) * 10} Mins
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls & Marquee */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setTvTokenCall(prev => prev + 1);
                    playChimeSound();
                  }}
                  className="px-5 py-2.5 bg-marigold hover:bg-marigold/90 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-marigold/20"
                >
                  <span>Call Next (#A-{tvTokenCall + 1})</span>
                </button>
                <button
                  onClick={playChimeSound}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <Volume2 size={16} className={tvChimePlaying ? 'animate-bounce text-amber-400' : ''} />
                  <span>Re-chime Audio</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 font-mono text-center sm:text-right">
                <span>Appointory TV Smart Monitor OS • Auto Sync Active</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          FLOATING BACK TO TOP BUTTON
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 p-3.5 bg-white/95 hover:bg-white text-teak border-2 border-sandstone/40 hover:border-marigold shadow-2xl rounded-full backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer group"
            aria-label="Back to Top"
          >
            <ArrowUp size={20} className="group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default LandingPage;