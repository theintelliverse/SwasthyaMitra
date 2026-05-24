import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const MOCK_CLINICS = [
  {
    id: 'mock-1',
    name: 'City Care Clinic',
    clinicCode: 'CCC01',
    activeToken: 'T-08',
    efficiency: '98% On-Time Care',
    patients: [
      { name: 'Rahul Sharma', time: 'Seeing Doctor', active: true },
      { name: 'Anita Gupta', time: 'Next in line', active: false },
      { name: 'Mohit Kumar', time: '~ 15m wait', active: false },
    ]
  },
  {
    id: 'mock-2',
    name: 'Metro Wellness Center',
    clinicCode: 'MWC02',
    activeToken: 'T-04',
    efficiency: '96% On-Time Care',
    patients: [
      { name: 'Priya Patel', time: 'Seeing Doctor', active: true },
      { name: 'Aarav Mehta', time: 'Next in line', active: false },
      { name: 'Sneha Reddy', time: '~ 12m wait', active: false },
    ]
  },
  {
    id: 'mock-3',
    name: 'Apex Pediatrics',
    clinicCode: 'APX03',
    activeToken: 'T-11',
    efficiency: '99% On-Time Care',
    patients: [
      { name: 'Kabir Singh', time: 'Seeing Doctor', active: true },
      { name: 'Vihaan Sharma', time: 'Next in line', active: false },
      { name: 'Ananya Rao', time: '~ 10m wait', active: false },
    ]
  },
  {
    id: 'mock-4',
    name: 'LifeLine Cardiology',
    clinicCode: 'LLC04',
    activeToken: 'T-02',
    efficiency: '95% On-Time Care',
    patients: [
      { name: 'Ramesh Patel', time: 'Seeing Doctor', active: true },
      { name: 'Savita Devi', time: 'Next in line', active: false },
      { name: 'Karan Malhotra', time: '~ 20m wait', active: false },
    ]
  },
  {
    id: 'mock-5',
    name: 'Narmada Family Clinic',
    clinicCode: 'NFC05',
    activeToken: 'T-06',
    efficiency: '97% On-Time Care',
    patients: [
      { name: 'Amit Kumar', time: 'Seeing Doctor', active: true },
      { name: 'Ritu Verma', time: 'Next in line', active: false },
      { name: 'Deepak Sen', time: '~ 14m wait', active: false },
    ]
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [clinicsQueues, setClinicsQueues] = useState(MOCK_CLINICS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [isStepHovered, setIsStepHovered] = useState(false);

  // --- CONNECTED SIMULATION STATES ---
  // Step 1: Check-in States
  const [checkInState, setCheckInState] = useState('camera'); // 'camera' | 'form' | 'success'
  const [phoneNum, setPhoneNum] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkedInPhone, setCheckedInPhone] = useState('');

  // Step 2: Live Queue States
  const [queuePos, setQueuePos] = useState(3); // 3: 3rd, 2: 2nd, 1: Next, 0: Seeing Doctor
  const [showNotification, setShowNotification] = useState(false);
  const [notificationText, setNotificationText] = useState('');

  // Step 3: Consultation States
  const [vitals, setVitals] = useState({ bp: '120/80', pulse: '76', temp: '98.6' });
  const [activeComplaint, setActiveComplaint] = useState('Fever & Cough');
  const [meds, setMeds] = useState(['Paracetamol 650mg', 'Cough Syrup']);
  const [uploadState, setUploadState] = useState('idle'); // 'idle' | 'uploading' | 'uploaded'

  // Step 4: Secure Vault States
  const [otpInput, setOtpInput] = useState('');
  const [vaultLocked, setVaultLocked] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState({});

  // Collapsible Tech Specs index
  const [expandedTech, setExpandedTech] = useState(null);

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

  const handleVitalClick = (type, e) => {
    e.stopPropagation();
    setVitals(prev => {
      if (type === 'bp') {
        const bplist = ['120/80', '125/82', '145/95', '118/78'];
        const curIndex = bplist.indexOf(prev.bp);
        const nextBP = bplist[(curIndex + 1) % bplist.length];
        return { ...prev, bp: nextBP };
      } else if (type === 'pulse') {
        const pulselist = ['76', '82', '108', '72'];
        const curIndex = pulselist.indexOf(prev.pulse);
        const nextPulse = pulselist[(curIndex + 1) % pulselist.length];
        return { ...prev, pulse: nextPulse };
      } else {
        const templist = ['98.6', '99.4', '101.5', '98.2'];
        const curIndex = templist.indexOf(prev.temp);
        const nextTemp = templist[(curIndex + 1) % templist.length];
        return { ...prev, temp: nextTemp };
      }
    });
  };

  const handleComplaintChange = (complaint, e) => {
    e.stopPropagation();
    setActiveComplaint(complaint);
    if (complaint === 'Fever & Cough') {
      setVitals({ bp: '118/78', pulse: '88', temp: '101.2' });
      setMeds(['Paracetamol 650mg', 'Cough Syrup (Ascoril)']);
    } else if (complaint === 'Hypertension') {
      setVitals({ bp: '145/95', pulse: '84', temp: '98.6' });
      setMeds(['Amlodipine 5mg', 'Telmisartan 40mg']);
    } else {
      setVitals({ bp: '120/80', pulse: '72', temp: '98.6' });
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
    setUploadState('uploading');
    setTimeout(() => {
      setUploadState('uploaded');
    }, 1000);
  };

  const handleOtpVerify = (e) => {
    e.stopPropagation();
    if (otpInput === '1234') {
      setVaultLocked(false);
    } else {
      alert('Incorrect OTP code. Enter 1234 to simulate access.');
      setOtpInput('');
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

  return (
    <div className="min-h-screen bg-parchment font-body text-teak">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 max-w-7xl mx-auto border-b border-sandstone/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8.5 h-8.5 bg-marigold rounded-xl flex items-center justify-center shadow-md shadow-marigold/20">
            <span className="text-white font-heading text-xl">A</span>
          </div>
          <h1 className="font-heading text-base sm:text-xl tracking-tight font-black text-teak">
            Appointory
          </h1>
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          <a
            href="#features"
            className="text-[9.5px] font-black uppercase tracking-widest hover:text-marigold transition-colors hidden md:block"
          >
            How it works
          </a>
          <button
            onClick={() => navigate('/login')}
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

          <p className="text-[13px] sm:text-[14.5px] text-khaki max-w-md leading-relaxed font-medium">
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

          <div className="grid sm:grid-cols-2 gap-2.5 pt-2 max-w-md">
            {/* CLINIC OWNER CARD */}
            <div 
              onClick={() => navigate('/register-clinic')}
              className="group cursor-pointer bg-white/60 hover:bg-white border border-sandstone/30 hover:border-marigold p-3 rounded-[1.25rem] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[9.5px] font-black uppercase text-marigold tracking-wider">For Clinics</span>
                  <span className="text-xs group-hover:scale-110 transition-transform duration-300">🏥</span>
                </div>
                <p className="text-[9.5px] text-khaki leading-snug font-medium">
                  Register your facility to manage patient queues, bookings, and digital records.
                </p>
              </div>
              <button className="text-[9.5px] font-black text-teak mt-2 flex items-center gap-1 group-hover:text-marigold transition-colors">
                Setup Clinic Account <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
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
                  <span className="text-xs group-hover:scale-110 transition-transform duration-300">🩺</span>
                </div>
                <p className="text-[9.5px] text-khaki leading-snug font-medium">
                  Sign up to track live wait times, receive WhatsApp alerts, and store medical history.
                </p>
              </div>
              <button className="text-[9.5px] font-black text-teak mt-2 flex items-center gap-1 group-hover:text-marigold transition-colors">
                Create Free Account <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1 grayscale opacity-75">
            <p className="text-[8px] font-black uppercase tracking-widest">
              Powered by
            </p>
            <div className="h-px w-6 bg-sandstone"></div>
            <span className="font-heading text-[10px] sm:text-[11.5px]">Twilio</span>
            <span className="font-heading text-[10px] sm:text-[11.5px]">MERN Stack</span>
            <span className="font-heading text-[10px] sm:text-[11.5px]">Appointory</span>
          </div>
        </div>

        {/* Dashboard Simulation Mockup */}
        <div className="relative">
          <div className="absolute -top-6 -right-6 sm:-top-10 sm:-right-10 w-44 sm:w-60 h-44 sm:h-60 bg-saffron/20 rounded-full blur-3xl"></div>

          <div className="relative bg-white border border-sandstone p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2.25rem] shadow-xl">
            <div className="flex justify-between items-center mb-4 sm:mb-6 px-1">
              <div>
                <h3 className="font-heading text-[14.5px] sm:text-[16.5px] font-black">Appointory Network</h3>
                <p className="text-[8px] sm:text-[9px] text-khaki font-black uppercase tracking-widest mt-0.5">
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
                      className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all ${
                        hasActiveToken
                          ? 'bg-parchment border-marigold'
                          : 'bg-white border-sandstone opacity-60'
                      } flex justify-between items-center flex-shrink-0`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            hasActiveToken ? 'bg-marigold animate-pulse' : 'bg-sandstone'
                          }`}
                        ></div>
                        <div className="min-w-0">
                          <p className={`text-[11.5px] sm:text-[13px] font-bold truncate ${
                            hasActiveToken ? 'text-teak' : 'text-khaki'
                          }`}>
                            {clinic.name}
                          </p>
                          <p className="text-[7px] sm:text-[8px] text-khaki font-medium">
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
                <p className="text-[7px] sm:text-[8px] font-black uppercase text-parchment/60 tracking-widest mb-0.5">
                  Queue Efficiency
                </p>
                <p className="font-heading text-[12.5px] sm:text-[14.5px] font-black">
                  98% On-Time Care
                </p>
              </div>
              <div className="h-8.5 w-8.5 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <span className="text-[14px] sm:text-[18px]">📊</span>
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
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-marigold/10 text-marigold rounded-full border border-marigold/20">
              <span className="text-[10px] font-black uppercase tracking-widest">HOW IT WORKS</span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-heading leading-tight italic text-teak">
              A Seamless Digital Journey for <br className="hidden sm:inline" />
              <span className="text-marigold not-italic font-black">Clinics & Patients</span>
            </h3>
            <p className="text-[13px] sm:text-[14.5px] text-khaki font-medium leading-relaxed max-w-lg mx-auto">
              Appointory connects check-in, live queue status, consultation details, and secure health locker files in real-time.
            </p>
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
                title: "Scan & Check-In",
                desc: "Scan the clinic QR code. Enter your mobile number to link your health files instantly.",
                accent: "bg-teal-50 text-teal-600 border-teal-100/50",
                badge: "Takes 10s",
              },
              {
                step: "02",
                icon: "⏳",
                title: "Track Live Queue",
                desc: "Receive instant text alerts and a live tracking link. Monitor your token turn on your phone.",
                accent: "bg-indigo-50 text-indigo-600 border-indigo-100/50",
                badge: "Live Updates",
              },
              {
                step: "03",
                icon: "🩺",
                title: "Smart Consultation",
                desc: "Consult with your doctor who writes cloud prescriptions, while vitals are logged by staff.",
                accent: "bg-emerald-50 text-emerald-600 border-emerald-100/50",
                badge: "Zero Waiting",
              },
              {
                step: "04",
                icon: "🔐",
                title: "Secure Health Vault",
                desc: "Access your lifelong prescriptions and reports securely via OTP vault anywhere, anytime.",
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
                  className={`group bg-white p-5 rounded-[1.25rem] border transition-all relative flex flex-col justify-between cursor-pointer ${
                    isActive 
                      ? 'border-marigold shadow-md bg-parchment/15' 
                      : 'border-sandstone hover:border-marigold/30 opacity-75 hover:opacity-95'
                  }`}
                >
                  {/* Step Number Badge */}
                  <div className={`absolute top-3.5 right-4.5 text-xl font-black transition-colors duration-500 ${
                    isActive ? 'text-marigold/15' : 'text-sandstone/15'
                  } select-none`}>
                    {s.step}
                  </div>

                  <div>
                    {/* Icon block */}
                    <motion.div 
                      animate={isActive ? { rotate: [0, -3, 3, 0], scale: 1.05 } : { rotate: 0, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`w-9 h-9 rounded-lg ${s.accent} border flex items-center justify-center text-lg shadow-sm mb-3`}
                    >
                      {s.icon}
                    </motion.div>

                    {/* Benefit badge */}
                    <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-sandstone/25 px-1.5 py-0.5 rounded mb-1 text-teak/70">
                      {s.badge}
                    </span>

                    {/* Step Title */}
                    <h4 className="font-heading text-[15px] sm:text-[16px] text-teak font-black tracking-tight mb-1">
                      {s.title}
                    </h4>

                    {/* Step Desc */}
                    <p className="text-[11.5px] sm:text-[12px] text-khaki leading-relaxed font-medium">
                      {s.desc}
                    </p>
                  </div>

                  {/* STEP 1 SIMULATOR */}
                  {idx === 0 && (
                    <div className="mt-3.5 bg-teal-50/20 border border-teal-100/50 rounded-xl p-2.5 flex flex-col justify-between h-[155px] text-left">
                      <AnimatePresence mode="wait">
                        {checkInState === 'camera' && (
                          <motion.div 
                            key="camera"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex flex-col items-center justify-center space-y-2 h-full"
                          >
                            <div className="relative w-11 h-11 border border-dashed border-teal-500 rounded-lg flex items-center justify-center bg-white/80 overflow-hidden">
                              <div className="absolute inset-0 bg-teal-500/5 flex flex-col items-center justify-center">
                                <motion.div 
                                  animate={{ y: [-20, 20] }}
                                  transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
                                  className="w-full h-0.5 bg-teal-500 absolute left-0"
                                ></motion.div>
                                <span className="text-[14px]">📸</span>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setCheckInState('form'); }}
                              className="px-2.5 py-1 bg-teal-600 text-white text-[9.5px] font-black uppercase tracking-wider rounded shadow-sm hover:bg-teal-700 transition-all cursor-pointer"
                            >
                              Scan Clinic QR
                            </button>
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
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-teal-700 tracking-wider">Phone Number</label>
                              <input 
                                type="tel" 
                                value={phoneNum}
                                onChange={(e) => setPhoneNum(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="Enter mobile number" 
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-white border border-sandstone/30 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-teal-500"
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
                                  }, 800);
                                }}
                                disabled={phoneNum.length < 10}
                                className="w-2/3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-[9.5px] font-black uppercase py-1 rounded cursor-pointer"
                              >
                                {checkInLoading ? 'Linking...' : 'Link Locker'}
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {checkInState === 'success' && (
                          <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col justify-between h-full"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-[10px] text-white">✓</div>
                              <div>
                                <p className="text-[11px] font-bold text-teak">Locker Linked!</p>
                                <p className="text-[9px] text-khaki font-black uppercase tracking-wider">Patient: Dhruvil Patel</p>
                              </div>
                            </div>
                            <div className="bg-white/60 border border-teal-100/50 px-2 py-1 rounded text-[9.5px] space-y-0.5">
                              <div className="flex justify-between"><span className="text-khaki">ID:</span> <span className="font-bold text-teak">SM-92658</span></div>
                              <div className="flex justify-between"><span className="text-khaki">Locker Status:</span> <span className="font-bold text-teal-600">Active</span></div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setCheckInState('camera'); setPhoneNum(''); setCheckedInPhone(''); }}
                              className="text-[9px] text-teal-700 underline font-black tracking-wider text-right cursor-pointer"
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
                    <div className="mt-3.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl p-2.5 flex flex-col justify-between h-[155px] relative text-left overflow-hidden">
                      <AnimatePresence>
                        {showNotification && (
                          <motion.div 
                            initial={{ y: -35, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -35, opacity: 0 }}
                            className="absolute top-0 left-0 right-0 z-30 bg-teal-600 text-white text-[9.5px] px-2 py-2 shadow-md flex items-center gap-1.5"
                          >
                            <span className="font-black uppercase">Appointory Live:</span>
                            <span className="truncate flex-1 font-medium">{notificationText.replace('💬 Appointory: ', '').replace('🚨 Appointory: ', '').replace('🩺 Appointory: ', '')}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="font-black text-indigo-600 uppercase tracking-wider">Live Tracker</span>
                        <span className="flex items-center gap-0.5 text-emerald-600 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Active
                        </span>
                      </div>
                      
                      <div className="text-center my-0.5">
                        <AnimatePresence mode="popLayout">
                          <motion.span 
                            key={queuePos}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="block text-[14px] font-heading font-black text-teak leading-none"
                          >
                            Token T-08
                          </motion.span>
                        </AnimatePresence>
                        <span className="text-[9.5px] text-khaki font-black uppercase tracking-wider mt-0.5 block">
                          {queuePos === 3 && 'Position: 3rd in Line'}
                          {queuePos === 2 && 'Position: 2nd in Line'}
                          {queuePos === 1 && '🚨 Next in Line!'}
                          {queuePos === 0 && '🩺 Seeing Doctor'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9.5px] bg-white/70 border border-sandstone/10 px-2 py-1 rounded">
                        <span className="text-khaki font-medium">Est. Wait:</span>
                        <span className="font-bold text-indigo-600">
                          {queuePos === 3 && '~ 15 Mins'}
                          {queuePos === 2 && '~ 10 Mins'}
                          {queuePos === 1 && '~ 5 Mins'}
                          {queuePos === 0 && '0 Mins (Now)'}
                        </span>
                      </div>
                      
                      <div className="flex gap-1.5 pt-1.5">
                        <button 
                          onClick={handleTriggerSms}
                          className="w-1/2 border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-[9.5px] font-black uppercase py-1 rounded cursor-pointer text-center"
                        >
                          Alert Me
                        </button>
                        <button 
                          onClick={handleQueueProgress}
                          className="w-1/2 bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] font-black uppercase py-1 rounded cursor-pointer text-center"
                        >
                          Next Turn
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3 SIMULATOR */}
                  {idx === 2 && (
                    <div className="mt-3.5 bg-emerald-50/20 border border-emerald-100/50 rounded-xl p-2.5 flex flex-col justify-between h-[155px] overflow-hidden text-left">
                      {uploadState !== 'uploaded' ? (
                        <>
                          <div className="grid grid-cols-3 gap-1">
                            <div 
                              onClick={(e) => handleVitalClick('bp', e)}
                              className="bg-white/80 border border-sandstone/10 rounded p-1 cursor-pointer text-center hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors"
                            >
                              <div className="text-[8px] font-black uppercase text-khaki font-black">BP</div>
                              <div className={`text-[10.5px] font-bold ${vitals.bp.startsWith('145') ? 'text-rose-600 animate-pulse font-black' : 'text-teak'}`}>{vitals.bp}</div>
                            </div>
                            <div 
                              onClick={(e) => handleVitalClick('pulse', e)}
                              className="bg-white/80 border border-sandstone/10 rounded p-1 cursor-pointer text-center hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors"
                            >
                              <div className="text-[8px] font-black uppercase text-khaki font-black">Pulse</div>
                              <div className={`text-[10.5px] font-bold ${Number(vitals.pulse) > 100 ? 'text-rose-600 animate-pulse font-black' : 'text-teak'}`}>{vitals.pulse}</div>
                            </div>
                            <div 
                              onClick={(e) => handleVitalClick('temp', e)}
                              className="bg-white/80 border border-sandstone/10 rounded p-1 cursor-pointer text-center hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors"
                            >
                              <div className="text-[8px] font-black uppercase text-khaki font-black">Temp</div>
                              <div className={`text-[10.5px] font-bold ${Number(vitals.temp) > 100 ? 'text-rose-600 animate-pulse font-black' : 'text-teak'}`}>{vitals.temp}</div>
                            </div>
                          </div>

                          <div className="flex gap-1 items-center justify-between text-[9px] py-1">
                            <span className="font-bold text-khaki">Rx Complaint:</span>
                            <div className="flex gap-1">
                              {['Fever', 'High BP', 'Checkup'].map((lbl) => {
                                const val = lbl === 'Fever' ? 'Fever & Cough' : lbl === 'High BP' ? 'Hypertension' : 'General Checkup';
                                return (
                                  <button
                                    key={lbl}
                                    onClick={(e) => handleComplaintChange(val, e)}
                                    className={`px-1 py-0.2 rounded border text-[8px] font-black uppercase cursor-pointer ${
                                      activeComplaint === val 
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

                          <div className="flex justify-between items-center text-[8px] bg-white/70 border border-sandstone/10 p-1.5 rounded">
                            <div className="min-w-0 max-w-[65%]">
                              <div className="font-bold text-emerald-700 uppercase tracking-wider text-[8px]">Active Rx</div>
                              <div className="truncate text-[10.5px] font-bold text-teak">
                                {meds.join(', ')}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button 
                                onClick={handleAddMed}
                                className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[8px] cursor-pointer"
                              >
                                +Add
                              </button>
                              {meds.length > 0 && (
                                <button 
                                  onClick={(e) => handleRemoveMed(meds.length - 1, e)}
                                  className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold px-1.5 py-0.5 rounded text-[8px] cursor-pointer"
                                >
                                  -Del
                                </button>
                              )}
                            </div>
                          </div>

                          <button 
                            onClick={handleSignAndUpload}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black uppercase py-1 rounded cursor-pointer text-center animate-pulse"
                          >
                            {uploadState === 'uploading' ? 'Uploading Cloud Record...' : 'Sign & Upload to Vault'}
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col justify-center items-center h-full space-y-1.5 text-center">
                          {/* Animated signature drawing */}
                          <div className="w-20 h-10 flex items-center justify-center bg-white/60 border border-emerald-200/50 rounded-lg p-1">
                            <svg className="w-16 h-8 text-emerald-700" viewBox="0 0 100 50" fill="none">
                              <motion.path 
                                d="M 10 30 C 30 10, 40 45, 50 15 C 60 -5, 75 35, 90 25 M 35 25 L 85 25" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                              />
                            </svg>
                          </div>
                          <div className="space-y-0.2">
                            <p className="text-[11px] font-bold text-teak">Prescription Signed & Sent ✓</p>
                            <p className="text-[9px] text-khaki font-medium">
                              Linked to patient Secure Vault locker.
                            </p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setUploadState('idle'); }}
                            className="text-[9px] text-emerald-700 font-black uppercase tracking-wider underline cursor-pointer"
                          >
                            Edit prescription
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4 SIMULATOR */}
                  {idx === 3 && (
                    <div className="mt-3.5 bg-rose-50/20 border border-rose-100/50 rounded-xl p-2.5 flex flex-col justify-between h-[155px] overflow-hidden text-left">
                      {vaultLocked ? (
                        <div className="flex flex-col justify-between h-full py-0.5">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="font-black text-rose-600 uppercase tracking-wider">Secured Vault</span>
                            <span className="text-[8.5px] text-khaki font-bold">Hint OTP: 1234</span>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8.5px] font-black uppercase text-rose-700 tracking-wider">Enter SMS OTP Code</label>
                            <input 
                              type="text" 
                              value={otpInput}
                              maxLength={4}
                              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                              placeholder="Enter 4-digit code" 
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-white border border-sandstone/30 rounded px-2 py-1 text-[11px] text-center focus:outline-none focus:border-rose-500"
                            />
                          </div>
                          <button 
                            onClick={handleOtpVerify}
                            disabled={otpInput.length < 4}
                            className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[9.5px] font-black uppercase py-1 rounded cursor-pointer text-center"
                          >
                            Verify & Unlock Vault
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-between h-full">
                          <div className="flex justify-between items-center text-[9px]">
                            <span className="font-bold text-emerald-600">✓ Vault Unlocked</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setVaultLocked(true); setOtpInput(''); }}
                              className="text-rose-600 hover:text-rose-700 font-black uppercase tracking-wider text-[8px] cursor-pointer"
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
                                  {uploadState === 'uploaded' ? `Rx_${activeComplaint.replace(' & ', '_')}.pdf` : 'Rx_CityCare_CCC01.pdf'}
                                </span>
                                <span className="text-[8px] text-khaki font-medium">
                                  {uploadState === 'uploaded' ? `${meds.length} Medicines Linked` : 'Consultation File'}
                                </span>
                              </div>
                              {downloadProgress['Rx'] === 'done' ? (
                                <span className="text-[8.5px] text-emerald-600 font-bold">Saved ✓</span>
                              ) : downloadProgress['Rx'] !== undefined ? (
                                <div className="w-10 bg-sandstone/30 h-1.5 rounded overflow-hidden">
                                  <div className="bg-rose-600 h-full transition-all duration-200" style={{ width: `${downloadProgress['Rx']}%` }}></div>
                                </div>
                              ) : (
                                <button 
                                  onClick={(e) => handleDownload('Rx', e)}
                                  className="text-[9px] text-rose-600 font-black uppercase tracking-wider cursor-pointer hover:underline"
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
                                <span className="text-[8px] text-khaki font-medium">CBC & Diabetes | 24 May</span>
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
                                  className="text-[9px] text-rose-600 font-black uppercase tracking-wider cursor-pointer hover:underline"
                                >
                                  Get
                                </button>
                              )}
                            </motion.div>
                          </motion.div>

                          {/* SVG Vitals Trend Sparkline with path animation */}
                          <div className="flex items-center justify-between text-[8px] bg-rose-50/50 border border-rose-100 p-0.5 rounded">
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
                    </div>
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
                                <div className="flex justify-between"><span className="font-bold text-indigo-700">Range:</span> <span className="text-khaki">Average consultation wait-time calculator</span></div>
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
                      <span className={`text-base font-bold transition-colors duration-500 ${
                        isActive ? 'text-marigold animate-pulse' : 'text-sandstone/60'
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
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;