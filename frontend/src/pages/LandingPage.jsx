import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';

import { API_URL } from '../config/runtime';

// Minimal fallback mock clinics used when backend data is unavailable
const MOCK_CLINICS = [
  { id: 'm1', name: 'City Care Clinic', clinicCode: 'CCC01', isReal: false, activeToken: '#00', patients: [{ name: 'Walk-ins Welcome', time: 'Ready', active: false }] },
  { id: 'm2', name: 'Green Valley Health', clinicCode: 'GVH02', isReal: false, activeToken: '#00', patients: [{ name: 'Walk-ins Welcome', time: 'Ready', active: false }] },
  { id: 'm3', name: 'Sunrise Clinic', clinicCode: 'SC03', isReal: false, activeToken: '#00', patients: [{ name: 'Walk-ins Welcome', time: 'Ready', active: false }] },
  { id: 'm4', name: 'City Diagnostics', clinicCode: 'CD04', isReal: false, activeToken: '#00', patients: [{ name: 'Walk-ins Welcome', time: 'Ready', active: false }] },
  { id: 'm5', name: 'Community Health', clinicCode: 'CH05', isReal: false, activeToken: '#00', patients: [{ name: 'Walk-ins Welcome', time: 'Ready', active: false }] }
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
        if (res.data.success && res.data.data && res.data.data.length > 0) {
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

          // Merge DB clinics with mocks to ensure at least 5 clinics for sliding
          if (processedDbClinics.length < 5) {
            const neededMockCount = 5 - processedDbClinics.length;
            const dbNames = new Set(processedDbClinics.map(c => c.name.toLowerCase()));
            const filteredMocks = MOCK_CLINICS.filter(m => !dbNames.has(m.name.toLowerCase()));
            setClinicsQueues([...processedDbClinics, ...filteredMocks.slice(0, neededMockCount)]);
          } else {
            setClinicsQueues(processedDbClinics);
          }
        }
      } catch (error) {
        console.warn("⚠️ Failed to fetch live queues, using fallback mocks:", error.message);
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

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    "name": "Appointory",
    "description": "Automated queues, WhatsApp status alerts, and your own Secure Health Locker. Digital healthcare that respects your time.",
    "url": "https://appointory.in",
    "logo": "https://appointory.in/og-image.svg"
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Appointory",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web Browser, Android, iOS",
    "url": "https://appointory.in/",
    "image": "https://appointory.in/og-image.svg",
    "description": "A comprehensive MERN-stack clinic management system with real-time queueing, lab referrals, and secure patient health records.",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "INR",
      "price": "0",
      "pricingModel": "FreemiumPricing"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "500"
    },
    "featureList": [
      "Real-time queue management with Socket.io",
      "Role-based dashboards for clinic staff",
      "OTP-secured patient digital health locker",
      "Instant lab referral and result synchronization",
      "Unified timeline for visits and reports",
      "WhatsApp notifications",
      "AI wait-time prediction",
      "Multi-role staff management"
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
        "name": "About",
        "item": "https://appointory.in/#about"
      }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Appointory?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Appointory is a real-time clinical management and digital health locker platform that helps clinics streamline operations and patients securely access their medical records. It features live queue tracking, lab referrals, OTP-secured access, and role-based dashboards for staff."
        }
      },
      {
        "@type": "Question",
        "name": "Who can use Appointory?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Appointory is designed for clinic administrators, doctors, receptionists, lab technicians, and patients. Each role has a customized interface tailored to their specific workflow and responsibilities."
        }
      },
      {
        "@type": "Question",
        "name": "How are patient records secured in Appointory?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Patient records in Appointory are protected through OTP authentication for access to the digital health locker. Sensitive medical information is encrypted and patients have full control over their records with secure view and share capabilities."
        }
      },
      {
        "@type": "Question",
        "name": "Does Appointory support WhatsApp notifications?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Appointory supports WhatsApp notifications to keep patients and staff informed about queue status, lab results, and appointments in real-time."
        }
      },
      {
        "@type": "Question",
        "name": "Can Appointory predict wait times?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Appointory includes AI-powered wait-time prediction that helps manage patient expectations and optimize clinic scheduling."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-parchment font-body text-teak">
      <SEO
        title="Care without the Waiting Room"
        description="Automated queues, WhatsApp status alerts, and your own Secure Health Locker. Digital healthcare that respects your time."
        url="/"
        schemaMarkup={[organizationSchema, softwareAppSchema, breadcrumbSchema, faqSchema]}
      />
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 max-w-7xl mx-auto border-b border-sandstone/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-md shadow-marigold/20 overflow-hidden">
            <img src="/Appointory_logo.jpg" alt="Appointory Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-heading text-base sm:text-xl tracking-tight font-black text-teak">
            Appointory
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="#features"
            aria-label="Learn how Appointory works"
            className="text-[9.5px] font-black uppercase tracking-widest hover:text-marigold transition-colors hidden md:block"
          >
            How it works
          </a>
          <button
            onClick={() => navigate('/lab/login')}
            aria-label="Lab Portal Login"
            className="px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50 rounded-full text-[9.5px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95 cursor-pointer hidden sm:block"
          >
            🔬 Lab Portal
          </button>
          <button
            onClick={() => navigate('/login')}
            aria-label="Staff Portal Login"
            className="px-5 py-2 bg-teak text-parchment rounded-full text-[9.5px] font-black uppercase tracking-widest hover:bg-marigold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Staff Portal
          </button>
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
            Automated queues, WhatsApp status alerts, and your own
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
                  Sign up to track live wait times, receive WhatsApp alerts, and store medical history.
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
            <span className="font-heading text-[14px] sm:text-[11.5px]">Twilio</span>
            <span className="font-heading text-[14px] sm:text-[11.5px]">MERN Stack</span>
            <span className="font-heading text-[14px] sm:text-[11.5px]">Appointory</span>
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
                {extendedClinics.map((clinic, index) => {
                  const hasActiveToken = clinic.activeToken !== '#00' && clinic.activeToken !== 'T-00';

                  return (
                    <div
                      key={`${clinic.id}-${index}`}
                      style={{
                        height: `calc(${100 / 3}% - 7px)`
                      }}
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${hasActiveToken
                        ? 'bg-parchment border-marigold'
                        : 'bg-white border-sandstone opacity-60'
                        } flex justify-between items-center flex-shrink-0`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${hasActiveToken ? 'bg-marigold animate-pulse' : 'bg-sandstone'
                            }`}
                        ></div>
                        <div className="min-w-0">
                          <p className={`text-[11.5px] sm:text-[11.5px] font-bold truncate ${hasActiveToken ? 'text-teak' : 'text-khaki'
                            }`}>
                            {clinic.name}
                          </p>
                          <p className="text-[11.5px] sm:text-[11.5px] text-khaki font-medium">
                            Code: {clinic.clinicCode}
                          </p>
                        </div>
                      </div>

                      <span className="text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-widest bg-sandstone/20 px-1.5 sm:px-2 py-0.5 rounded flex-shrink-0">
                        {hasActiveToken ? `Token ${clinic.activeToken}` : 'Ready'}
                      </span>
                    </div>
                  );
                })}
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
                desc: "Receive an encrypted live token link and automated WhatsApp reminders. Our dynamic polling engine computes consultation velocity, showing your real-time position in line, estimated wait times, and active token callouts.",
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
                            className="absolute top-1 left-1 right-1 z-35 bg-[#075e54] text-white rounded-lg p-2 shadow-lg flex items-start gap-2 text-[11.5px] border-l-4 border-[#25d366]"
                          >
                            <span className="text-[8.5px]">💬</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="font-bold text-[#25d366]">Appointory WhatsApp</span>
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
                                <div className="flex justify-between"><span className="font-bold text-indigo-700">WhatsApp Engine:</span> <span className="text-khaki">Twilio Programmable Messaging APIs</span></div>
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

      <Footer />
    </div>
  );
};

export default LandingPage;