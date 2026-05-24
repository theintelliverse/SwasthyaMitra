import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, ExternalLink, QrCode, Info } from 'lucide-react';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const ClinicQR = ({ clinicCode, clinicName }) => {
  const qrRef = useRef();

  // The URL patients will visit when they scan
  const checkInUrl = `${window.location.origin}/patient/checkin?code=${clinicCode}`;

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const image = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = `QR_CheckIn_${clinicName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  return (
    <div className="bg-white border border-sandstone p-6 md:p-6 rounded-3xl shadow-sm flex flex-col items-center relative overflow-hidden group">
      {/* Decorative Branding Accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-marigold/5 rounded-bl-[3rem] -z-0"></div>

      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="flex items-center gap-2 mb-2">
          <QrCode size={20} className="text-marigold" />
          <h3 className="font-heading text-xl text-teak">Clinic QR Gateway</h3>
        </div>

        <p className="text-[14px] text-khaki mb-4 text-center px-2 font-medium leading-relaxed">
          Display this at your reception. Patients scan to join the <span className="text-teak font-bold">Live Queue</span>.
        </p>

        {/* QR Container with Morning Marigold styling */}
        <div
          ref={qrRef}
          className="p-6 bg-parchment rounded-3xl border-2 border-marigold/20 mb-4 shadow-inner relative group/qr transition-transform hover:scale-[1.02]"
        >
          <QRCodeCanvas
            value={checkInUrl}
            size={150}
            bgColor={"#EEF6FA"} // Parchment
            fgColor={"#0F766E"} // Deep Teak
            level={"H"}         // High error correction
            includeMargin={false}
          />
          {/* Subtle Scan Me Indicator */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-opacity bg-teak/5 backdrop-blur-[1px] rounded-[2.5rem]">
            <span className="bg-teak text-white text-[14px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">
              Scan to Test
            </span>
          </div>
        </div>

        {/* Live Link Verification */}
        <div className="w-full bg-parchment border border-sandstone rounded-xl p-3 mb-4 flex items-center justify-between group/link hover:border-marigold transition-colors">
          <div className="overflow-hidden">
            <p className="text-[14px] font-black uppercase text-khaki mb-1">Target URL</p>
            <p className="text-[14px] text-teak font-bold truncate pr-4 italic">
              {checkInUrl.replace('http://', '').replace('https://', '')}
            </p>
          </div>
          <a href={checkInUrl} target="_blank" rel="noreferrer" className="text-khaki hover:text-marigold">
            <ExternalLink size={14} />
          </a>
        </div>

        <button
          onClick={downloadQR}
          className="w-full py-3 bg-teak text-parchment rounded-xl font-bold text-[14px] uppercase tracking-[0.2em] hover:bg-marigold transition-all shadow-xl shadow-[#0F766E]/10 flex items-center justify-center gap-2 active:scale-95"
        >
          <Download size={14} /> Download PNG for Print
        </button>

        <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-parchment rounded-full border border-sandstone">
          <Info size={12} className="text-marigold" />
          <p className="text-[14px] font-black uppercase text-khaki tracking-widest">
            Clinic Identity: <span className="text-teak">{clinicCode}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClinicQR;