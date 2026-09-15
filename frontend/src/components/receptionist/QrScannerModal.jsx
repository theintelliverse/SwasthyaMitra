import React, { useState, useEffect, useRef } from 'react';
import { QrCode, X, Search, CheckCircle, Camera, Smartphone, AlertCircle, ArrowRight, Stethoscope, Receipt } from 'lucide-react';

const QrScannerModal = ({ isOpen, onClose, onScanSuccess, navigate }) => {
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState(null);
  const [scannedPatient, setScannedPatient] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parseQrPayload = (rawText) => {
    if (!rawText) return null;
    let phone = '';
    let name = '';

    try {
      // Check if rawText is JSON
      if (rawText.trim().startsWith('{')) {
        const parsed = JSON.parse(rawText);
        phone = parsed.phone || parsed.mobile || '';
        name = parsed.name || parsed.patientName || '';
      } else {
        // Raw string (e.g. phone number or ID)
        phone = rawText.replace(/\D/g, '').slice(-10);
      }
    } catch {
      phone = rawText.replace(/\D/g, '').slice(-10);
    }

    // Clean phone number to 10 digits
    phone = phone.replace(/\D/g, '').slice(-10);

    if (phone.length === 10) {
      return { phone, name: name || 'Scanned Patient' };
    }
    return null;
  };

  const handleScanSubmit = (e) => {
    e?.preventDefault();
    setError(null);
    const parsed = parseQrPayload(inputVal);

    if (!parsed) {
      setError('Invalid QR payload or phone number. Please scan a valid patient QR code or 10-digit mobile number.');
      return;
    }

    setScannedPatient(parsed);
    if (onScanSuccess) {
      onScanSuccess(parsed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleScanSubmit();
    }
  };

  const startCamera = async () => {
    setCameraActive(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraActive(false);
      setError('Camera access denied or unavailable. You can scan using a hardware USB barcode reader or type the 10-digit mobile number below.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleModalClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode className="text-teal-400" size={20} />
            <h3 className="font-black text-base tracking-tight">Scan Patient Health Pass</h3>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Camera View Box */}
          {cameraActive ? (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border-2 border-teal-500 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-teal-400/50 rounded-xl m-6 pointer-events-none animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-black text-teal-300 uppercase bg-slate-900/80 px-2 py-0.5 rounded border border-teal-500/40">Align QR Code in frame</span>
              </div>
              <button
                onClick={stopCamera}
                className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 text-white text-[10px] font-black rounded-lg uppercase"
              >
                Close Camera
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto">
                <Camera size={24} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Scan QR Code or USB Barcode</p>
                <p className="text-xs font-bold text-slate-400 mt-0.5">Use camera or hardware scanner input</p>
              </div>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md shadow-teal-600/20 active:scale-95 transition-all inline-flex items-center gap-1.5"
              >
                <Camera size={14} /> Open Live Camera
              </button>
            </div>
          )}

          {/* Scanner Input / Fallback Search */}
          <form onSubmit={handleScanSubmit} className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider">
              Hardware Scanner Input / Mobile Number
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="Scan QR or enter 10-digit phone number..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-slate-900 hover:bg-slate-800 text-teal-400 rounded-xl transition-all"
                title="Search / Scan"
              >
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Scanned Result & Quick Workflow Actions */}
          {scannedPatient && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-base">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-teal-700">Patient QR Verified</span>
                  <p className="text-sm font-black text-slate-900">{scannedPatient.name || 'Verified Patient'}</p>
                  <p className="text-xs font-bold text-slate-600">Mobile: {scannedPatient.phone}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-teal-200/60 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleModalClose();
                    if (navigate) {
                      navigate(`/receptionist/queue?phone=${scannedPatient.phone}&name=${encodeURIComponent(scannedPatient.name)}`);
                    }
                  }}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Stethoscope size={13} className="text-teal-400" />
                  <span>Book Token</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleModalClose();
                    if (navigate) {
                      navigate(`/receptionist/billing?phone=${scannedPatient.phone}`);
                    }
                  }}
                  className="py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-teal-600/20"
                >
                  <Receipt size={13} />
                  <span>Generate Bill</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Works with physical QR codes, Patient Mobile Hub & USB Barcode Scanners
        </div>
      </div>
    </div>
  );
};

export default QrScannerModal;
