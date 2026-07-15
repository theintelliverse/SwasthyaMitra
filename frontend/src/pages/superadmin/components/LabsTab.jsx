import React from 'react';
import { Search, Edit, Gift, ToggleLeft, Trash2 } from 'lucide-react';

const LabsTab = ({
  filteredLabs,
  searchTerm,
  setSearchTerm,
  handleSetCustomPrice,
  handleToggleNetwork,
  handleTogglePremium,
  handleEditSubscription,
  handleGiftSubscription,
  handleToggleActive,
  handleDeleteFacility
}) => {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-khaki" size={16} />
        <input
          type="text"
          placeholder="Search lab name or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-sandstone/40 rounded-2xl pl-10 pr-4 py-3 text-sm text-teak outline-none focus:border-marigold font-semibold"
        />
      </div>

      <div className="overflow-x-auto border border-sandstone/25 rounded-2xl bg-white/40 shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-sandstone/20 text-khaki font-bold uppercase tracking-wider bg-slate-50/50">
              <th className="p-4">Lab Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Metrics</th>
              <th className="p-4">Custom Pricing</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4 text-center">Appointory Network</th>
              <th className="p-4 text-center">Premium Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sandstone/15 font-medium text-slate-700">
            {filteredLabs.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-khaki font-bold uppercase tracking-widest">No independent labs found</td>
              </tr>
            ) : (
              filteredLabs.map(l => {
                const isExpired = l.subscriptionExpiresAt && new Date(l.subscriptionExpiresAt) < new Date();
                return (
                  <tr key={l._id} className={`hover:bg-parchment/30 transition-colors ${!l.isActive ? 'opacity-60 bg-rose-50/10' : ''}`}>
                    <td className="p-4">
                      <div className="font-black text-teak text-sm flex items-center gap-2">
                        {l.labName}
                        {!l.isActive && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase">Closed Temp</span>
                        )}
                      </div>
                      <div className="text-[10px] text-marigold uppercase tracking-widest font-black mt-0.5">{l.labCode}</div>
                      <div className="text-[10px] text-khaki mt-1">Joined: {new Date(l.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4 text-khaki">
                      <div className="text-slate-800 font-semibold">{l.phone}</div>
                      <div className="text-[10px] mt-0.5">{l.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 font-semibold">Reports filed: {l.reportCount}</div>
                      <div className="text-emerald-600 font-bold mt-1">Sales: ₹{(l.revenueContributed || 0).toLocaleString()}</div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleSetCustomPrice(l._id, 'lab', l.customSubscriptionPrice)}
                        className="px-2.5 py-1 bg-white border border-sandstone/30 text-slate-700 hover:text-marigold hover:border-marigold/60 rounded-xl transition cursor-pointer font-bold"
                      >
                        {l.customSubscriptionPrice !== undefined && l.customSubscriptionPrice !== null
                          ? `₹${l.customSubscriptionPrice}/mo`
                          : 'Standard Plan'}
                      </button>
                    </td>
                    <td className="p-4">
                      {l.subscriptionExpiresAt ? (
                        <div className="space-y-1">
                          <div className={isExpired ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                            {new Date(l.subscriptionExpiresAt).toLocaleDateString()}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-khaki">
                            {l.subscriptionPlan}
                          </div>
                        </div>
                      ) : (
                        <span className="text-rose-600 font-bold">Unsubscribed</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleNetwork(l._id, 'lab')}
                        className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm border border-sandstone/10"
                        style={{
                          backgroundColor: l.showOnNetwork !== false ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: l.showOnNetwork !== false ? '#10b981' : '#ef4444'
                        }}
                      >
                        {l.showOnNetwork !== false ? 'Visible' : 'Hidden'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleTogglePremium(l._id, 'lab')}
                        className="text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition cursor-pointer shadow-sm border border-sandstone/10"
                        style={{
                          backgroundColor: l.isPremium ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: l.isPremium ? '#10b981' : '#ef4444'
                        }}
                      >
                        {l.isPremium ? 'Active' : 'Expired'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => handleEditSubscription(l._id, 'lab', l.subscriptionPlan, l.subscriptionExpiresAt)}
                          className="p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition cursor-pointer"
                          title="Edit Subscription Details"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleGiftSubscription(l._id, 'lab')}
                          className="p-2 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition cursor-pointer"
                          title="Gift Free Trial Extension"
                        >
                          <Gift size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(l._id, 'lab')}
                          className={`p-2 rounded-xl transition cursor-pointer ${l.isActive
                              ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-650 hover:text-white'
                              : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-650 hover:text-white'
                            }`}
                          title={l.isActive ? "Temporarily Close Lab" : "Open Lab"}
                        >
                          <ToggleLeft size={15} className={l.isActive ? 'text-amber-655' : 'text-emerald-600'} />
                        </button>
                        <button
                          onClick={() => handleDeleteFacility(l._id, 'lab')}
                          className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition cursor-pointer"
                          title="Delete Facility"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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

export default LabsTab;
