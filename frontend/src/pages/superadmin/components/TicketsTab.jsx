import React from 'react';
import { CheckCircle } from 'lucide-react';

const TicketsTab = ({
  tickets,
  handleResolveTicket
}) => {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-sandstone/25 rounded-2xl bg-white/40 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-sandstone/20 text-khaki font-bold uppercase tracking-wider bg-slate-50/50">
              <th className="p-4">Sender Facility</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Message</th>
              <th className="p-4">Date Filed</th>
              <th className="p-4 text-center">Status / Resolve</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sandstone/15 font-medium text-slate-700">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-khaki font-bold uppercase tracking-widest">No support requests filed</td>
              </tr>
            ) : (
              tickets.map(t => (
                <tr key={t._id} className="hover:bg-parchment/30">
                  <td className="p-4">
                    <div className="font-bold text-teak">{t.facilityName}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-khaki tracking-wider font-semibold">
                      {t.facilityType}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div>{t.senderName}</div>
                    <div className="text-[10px] text-khaki">{t.senderEmail}</div>
                  </td>
                  <td className="p-4 font-bold text-slate-800">{t.subject}</td>
                  <td className="p-4 text-slate-600 max-w-[280px] break-words whitespace-pre-wrap">
                    <div>{t.message}</div>
                    {t.status === 'resolved' && t.resolutionText && (
                      <div className="mt-2 p-2 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 text-[10px] font-semibold">
                        <span className="font-bold">Resolution: </span>{t.resolutionText}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-khaki">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-center">
                    {t.status === 'open' ? (
                      <button
                        onClick={() => handleResolveTicket(t._id)}
                        className="px-3 py-1.5 bg-marigold/10 text-marigold border border-marigold/20 hover:bg-marigold hover:text-white rounded-lg transition font-black text-[10px] uppercase tracking-wider flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <CheckCircle size={12} /> Mark Resolve
                      </button>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        Resolved
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketsTab;
