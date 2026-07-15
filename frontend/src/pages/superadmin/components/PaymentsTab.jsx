import React from 'react';
import { Trash2 } from 'lucide-react';

const PaymentsTab = ({
  payments,
  handleDeletePayment
}) => {
  const finalPayments = payments.filter(p => p.status !== 'created');

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-sandstone/25 rounded-2xl bg-white/40 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-sandstone/20 text-khaki font-bold uppercase tracking-wider bg-slate-50/50">
              <th className="p-4">Facility Name & Contact</th>
              <th className="p-4">Razorpay Order / Payment ID</th>
              <th className="p-4">Selected Plan</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4">Billing Date</th>
              <th className="p-4 text-right">Amount Paid</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sandstone/15 font-medium text-slate-700">
            {finalPayments.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-khaki font-bold uppercase tracking-widest">No transactions recorded</td>
              </tr>
            ) : (
              finalPayments.map(p => {
                const facName = p.facilityId ? (p.facilityId.name || p.facilityId.labName) : 'Unknown/Deleted Facility';
                const facEmail = p.facilityId ? p.facilityId.email : 'N/A';
                const facPhone = p.facilityId ? (p.facilityId.phone || p.facilityId.contactPhone || 'N/A') : 'N/A';
                return (
                  <tr key={p._id} className="hover:bg-parchment/30">
                    <td className="p-4">
                      <div className="font-extrabold text-teak text-sm">{facName}</div>
                      <div className="text-[10px] text-marigold uppercase tracking-wider font-bold mt-0.5">{p.facilityType}</div>
                      <div className="text-[10px] text-khaki mt-1">{facEmail} · {facPhone}</div>
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      <div>Order: {p.razorpayOrderId}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Pay ID: {p.razorpayPaymentId || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-marigold/10 text-marigold">
                        {p.plan}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        p.status === 'captured' ? 'bg-emerald-500/10 text-emerald-600' :
                        p.status === 'failed' ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{new Date(p.billingDate).toLocaleString()}</td>
                    <td className="p-4 text-right text-emerald-600 font-extrabold text-sm">₹{p.amount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeletePayment(p._id)}
                        className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition cursor-pointer"
                        title="Delete Transaction Record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentsTab;
