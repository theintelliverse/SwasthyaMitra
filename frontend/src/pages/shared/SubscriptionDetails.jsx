import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { ShieldCheck, Calendar, Info, Loader2, ArrowRight, CreditCard, History } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import SEO from '../../components/SEO';
import { API_URL } from '../../config/runtime';

const SubscriptionDetails = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [isLab, setIsLab] = useState(false);
  const [facilityInfo, setFacilityInfo] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      setLoading(true);
      try {
        const userRole = localStorage.getItem('role');
        const labRole = localStorage.getItem('labRole');
        const isIndLab = labRole === 'independent_lab';
        setIsLab(isIndLab);
        setRole(userRole || labRole || '');

        if (isIndLab) {
          const token = localStorage.getItem('labToken');
          // Fetch Lab details
          const res = await axios.get(`${API_URL}/api/auth/lab/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setFacilityInfo(res.data.data);
          }
          // Fetch Billing History
          const historyRes = await axios.get(`${API_URL}/api/superadmin/subscription/lab-history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (historyRes.data.success) {
            setBillingHistory(historyRes.data.data || []);
          }
        } else {
          const token = localStorage.getItem('token');
          // Fetch User & Clinic Details
          const res = await axios.get(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            const user = res.data.data;
            const clinicRes = await axios.get(`${API_URL}/api/clinic/public/${user.clinicId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setFacilityInfo(clinicRes.data.data);
          }
          // Fetch Billing History
          const historyRes = await axios.get(`${API_URL}/api/superadmin/subscription/history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (historyRes.data.success) {
            setBillingHistory(historyRes.data.data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching subscription details:", err);
        Swal.fire('Error', 'Failed to retrieve subscription info.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-teal-600 mx-auto" size={36} />
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Retrieving ledger stats...</p>
        </div>
      </div>
    );
  }

  const isPremiumActive = facilityInfo?.subscriptionExpiresAt && new Date(facilityInfo.subscriptionExpiresAt) > new Date();
  const canBuy = role === 'admin' || role === 'doctor' || isLab;

  const daysRemaining = facilityInfo?.subscriptionExpiresAt 
    ? Math.max(0, Math.ceil((new Date(facilityInfo.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role={isLab ? 'lab' : role} />

      <div className="flex-grow flex flex-col min-h-screen overflow-y-auto pb-32 lg:pb-0">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-5xl mx-auto w-full">
          <SEO title="Subscription Status" noindex={true} />

          {/* Header */}
          <header className="mb-10">
            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[12px] font-black uppercase tracking-widest border border-teal-100">
              Billing Ledger
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2.5">
              Premium Subscription Details
            </h1>
            <p className="text-slate-500 font-bold mt-1">
              Verify validity period and manage payment tiers for <span className="text-teal-600">{facilityInfo?.name || facilityInfo?.labName}</span>
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status Panel (Left 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Current Status</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active Subscription Plan Info</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                    isPremiumActive 
                      ? 'bg-emerald-55/10 text-emerald-600 border-emerald-100' 
                      : 'bg-rose-55/10 text-rose-600 border-rose-100'
                  }`}>
                    {isPremiumActive ? 'Premium Active' : 'Expired / Free Tier'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Plan</p>
                    <p className="text-lg font-black text-slate-800 uppercase mt-1">
                      {facilityInfo?.subscriptionPlan || 'Free Plan'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Expiration Date</p>
                    <p className="text-lg font-black text-slate-800 mt-1">
                      {facilityInfo?.subscriptionExpiresAt 
                        ? new Date(facilityInfo.subscriptionExpiresAt).toLocaleDateString(undefined, { dateStyle: 'long' })
                        : 'No active subscription'}
                    </p>
                  </div>
                </div>

                {isPremiumActive && (
                  <div className="p-4 bg-teal-50/40 border border-teal-100/50 rounded-2xl space-y-2 text-xs text-teal-800">
                    <div className="flex justify-between font-bold">
                      <span>Subscription Validity Progress</span>
                      <span>{daysRemaining} days left</span>
                    </div>
                    <div className="w-full bg-slate-200/60 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.max(5, (daysRemaining / 30) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}

                {!isPremiumActive && (
                  <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex gap-3 text-xs text-rose-700 font-medium">
                    <Info size={16} className="shrink-0 text-rose-500 mt-0.5" />
                    <p>
                      Your workspace operates on standard limitations. Upgrade to premium to enable continuous digital queues, unlimited receptionist management, and full reporting.
                    </p>
                  </div>
                )}
              </div>

              {/* Billing History */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <History className="text-teal-600" size={18} />
                  <h3 className="text-lg font-black text-slate-900">Billing History</h3>
                </div>
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Billing Date</th>
                        <th className="p-4">Plan</th>
                        <th className="p-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-600">
                      {(() => {
                        const finalHistory = billingHistory.filter(h => h.status !== 'created');
                        if (finalHistory.length === 0) {
                          return (
                            <tr>
                              <td colSpan="4" className="p-6 text-center text-slate-400 font-bold uppercase tracking-widest">
                                No billing records found
                              </td>
                            </tr>
                          );
                        }
                        return finalHistory.map((h) => {
                          const isMock = h.razorpayOrderId && h.razorpayOrderId.startsWith('order_mock_');
                          return (
                            <tr key={h._id} className="hover:bg-slate-50/40">
                              <td className="p-4 font-mono text-slate-500 flex items-center gap-1.5 flex-wrap">
                                <span>{h.razorpayOrderId}</span>
                                {isMock && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-200/40 tracking-wider">
                                    Test Mode
                                  </span>
                                )}
                              </td>
                              <td className="p-4">{new Date(h.createdAt || h.billingDate).toLocaleDateString()}</td>
                              <td className="p-4 flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded text-[9px] font-black uppercase bg-teal-50 text-teal-700 tracking-wider">
                                  {h.plan}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  h.status === 'captured' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {h.status === 'captured' ? 'Completed' : 'Cancelled'}
                                </span>
                              </td>
                              <td className="p-4 text-right text-emerald-600 font-extrabold">₹{h.amount.toLocaleString()}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Card (Right 1 column) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-lg shadow-teal-900/10">
                <div className="relative z-10 space-y-5">
                  <div>
                    <h4 className="text-base font-black">Plan Management</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Control facility tier</p>
                  </div>

                  {canBuy ? (
                    <>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        Administrator access verified. You can purchase standard tiers or renew your subscription securely.
                      </p>
                      <button
                        onClick={() => navigate('/subscription-checkout')}
                        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer border-0 active:scale-95 animate-pulse"
                      >
                        <CreditCard size={15} /> Buy / Renew Subscription
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        Standard accounts (doctors, receptionists, internal technicians) cannot directly initiate purchases.
                      </p>
                      <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700 text-[10px] text-slate-400 font-bold">
                        Please contact your Clinic Administrator to upgrade or renew premium license access.
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 blur-2xl rounded-full -mr-12 -mt-12" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SubscriptionDetails;
