import React from 'react';
import { DollarSign, Users, Building, HelpCircle, BarChart3, Ticket, Edit, Settings } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const OverviewTab = ({
  totalRevenue,
  activeSubscribers,
  clinics,
  tickets,
  payments,
  config,
  handleEditCampaignModal
}) => {
  const getRevenueChartData = () => {
    const dailyPayments = {};
    payments.forEach(p => {
      const dateStr = new Date(p.billingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyPayments[dateStr] = (dailyPayments[dateStr] || 0) + p.amount;
    });

    return Object.keys(dailyPayments).map(date => ({
      date,
      revenue: dailyPayments[date]
    })).reverse();
  };

  const revenueData = getRevenueChartData();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-sandstone/30 rounded-3xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 p-3 bg-marigold/10 text-marigold rounded-2xl">
            <DollarSign size={20} />
          </div>
          <p className="text-khaki text-[11px] font-black uppercase tracking-wider">Total Revenue</p>
          <h2 className="text-3xl font-black mt-2 text-teak">₹{totalRevenue.toLocaleString()}</h2>
          <p className="text-xs text-khaki mt-1">Paid subscriptions</p>
        </div>

        <div className="bg-white border border-sandstone/30 rounded-3xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 p-3 bg-marigold/10 text-marigold rounded-2xl">
            <Users size={20} />
          </div>
          <p className="text-khaki text-[11px] font-black uppercase tracking-wider">Active Subscribers</p>
          <h2 className="text-3xl font-black mt-2 text-teak">{activeSubscribers}</h2>
          <p className="text-xs text-khaki mt-1">Clinics & Labs active</p>
        </div>

        <div className="bg-white border border-sandstone/30 rounded-3xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 p-3 bg-marigold/10 text-marigold rounded-2xl">
            <Building size={20} />
          </div>
          <p className="text-khaki text-[11px] font-black uppercase tracking-wider">Total Clinics</p>
          <h2 className="text-3xl font-black mt-2 text-teak">{clinics.length}</h2>
          <p className="text-xs text-khaki mt-1">Practitioners registered</p>
        </div>

        <div className="bg-white border border-sandstone/30 rounded-3xl p-6 relative overflow-hidden shadow-sm">
          <div className="absolute right-4 top-4 p-3 bg-marigold/10 text-marigold rounded-2xl">
            <HelpCircle size={20} />
          </div>
          <p className="text-khaki text-[11px] font-black uppercase tracking-wider">Open Tickets</p>
          <h2 className="text-3xl font-black mt-2 text-teak">{tickets.filter(t => t.status === 'open').length}</h2>
          <p className="text-xs text-khaki mt-1">Pending support requests</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white border border-sandstone/30 rounded-3xl p-6 shadow-sm">
        <h3 className="font-heading text-base font-bold flex items-center gap-2 mb-4 text-teak">
          <BarChart3 size={18} className="text-marigold" /> Revenue Stream Trend
        </h3>
        <div className="h-[300px]">
          {revenueData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-khaki font-bold uppercase tracking-widest">
              No subscription purchases yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFA800" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#FFA800" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#7F7668" fontSize={10} tickLine={false} />
                <YAxis stroke="#7F7668" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFBF5', borderColor: '#E8DDCB', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="revenue" stroke="#FFA800" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Campaign & System Status Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discount Settings Card */}
        <div className="bg-white border border-sandstone/30 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading text-base font-bold flex items-center gap-2 text-teak">
              <Ticket size={18} className="text-marigold" /> Active Discount & Campaign Info
            </h3>
            <button
              onClick={handleEditCampaignModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-marigold/10 hover:bg-marigold/20 text-marigold border border-marigold/10 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
            >
              <Edit size={12} /> Edit
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-gray-400 font-bold block mb-1">Campaign Label</span>
              <span className="font-black text-teak">{config.legacyDiscountLabel || 'Legacy User Discount'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-gray-400 font-bold block mb-1">Discount Rate</span>
              <span className="font-black text-marigold text-sm">{config.legacyDiscountPercentage ?? 20}% OFF</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-gray-400 font-bold block mb-1">Free Trial Duration</span>
              <span className="font-black text-indigo-600">{config.trialPeriodDays ?? 30} Days</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 col-span-2 md:col-span-1">
              <span className="text-gray-400 font-bold block mb-1">Cut-off Date</span>
              <span className="font-black text-slate-700">
                {config.legacyCutoffDate ? new Date(config.legacyCutoffDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-gray-400 font-bold block mb-1">Campaign Start</span>
              <span className="font-black text-slate-700">
                {config.legacyDiscountStartDate ? new Date(config.legacyDiscountStartDate).toLocaleDateString() : 'Immediate'}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-gray-400 font-bold block mb-1">Campaign End</span>
              <span className="font-black text-slate-700">
                {config.legacyDiscountEndDate ? new Date(config.legacyDiscountEndDate).toLocaleDateString() : 'Ongoing'}
              </span>
            </div>
          </div>
        </div>

        {/* System Controls Summary Card */}
        <div className="bg-white border border-sandstone/30 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-heading text-base font-bold flex items-center gap-2 text-teak">
            <Settings size={18} className="text-marigold" /> System Status
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-700 block">Subscription Locking</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Redirects expired users</span>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${config.isSubscriptionEnforced ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                {config.isSubscriptionEnforced ? 'Enforced' : 'Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-700 block">Maintenance Mode</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Locks all public client logins</span>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${config.isMaintenanceMode ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                {config.isMaintenanceMode ? 'Active' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="font-bold text-slate-700 block">GST Taxation</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">CGST / SGST / IGST rates</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-marigold/10 text-marigold font-black">
                {config.isGstEnabled ? `CGST ${config.cgstRatePercentage ?? 9}% + SGST ${config.sgstRatePercentage ?? 9}%` : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
