import React, { useState } from 'react';
import { Plus, Trash2, Layers, Tag, CheckSquare } from 'lucide-react';

const SERVICE_OPTIONS = [
  { key: 'full', label: 'Full Suite (All-Inclusive)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { key: 'billing', label: 'Patient Billing & Invoicing', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { key: 'messaging', label: 'Instant SMS & Queue Alerts', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { key: 'appointments', label: 'Online Booking & Scheduling', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { key: 'lab-connect', label: 'Lab Integration & Diagnostic Routing', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { key: 'analytics', label: 'Advanced Clinic Analytics', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { key: 'health-locker', label: 'Patient Health Locker', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { key: 'bundle', label: 'Custom Service Bundle', color: 'bg-rose-100 text-rose-800 border-rose-300' },
];

const AVAILABLE_MODULES = [
  { key: 'billing', label: 'Billing' },
  { key: 'messaging', label: 'Messaging' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'lab-connect', label: 'Lab Connect' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'health-locker', label: 'Health Locker' },
];

const PlansTab = ({
  plans,
  editingPlan,
  setEditingPlan,
  newPlan,
  setNewPlan,
  handleCreateOrUpdatePlan,
  handleEditPlanClick,
  handleDeletePlan
}) => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredPlans = plans.filter(p => {
    if (activeFilter === 'all') return true;
    return (p.serviceType || 'full') === activeFilter;
  });

  const toggleBundleService = (svcKey) => {
    const current = newPlan.includedServices || [];
    if (current.includes(svcKey)) {
      setNewPlan({ ...newPlan, includedServices: current.filter(s => s !== svcKey) });
    } else {
      setNewPlan({ ...newPlan, includedServices: [...current, svcKey] });
    }
  };

  const getServiceBadge = (serviceType, includedServices = []) => {
    const option = SERVICE_OPTIONS.find(o => o.key === serviceType) || SERVICE_OPTIONS[0];
    if (serviceType === 'bundle') {
      return (
        <div>
          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${option.color}`}>
            Bundle ({includedServices.length})
          </span>
          <div className="text-[9px] font-semibold text-slate-500 mt-0.5">
            {includedServices.join(', ')}
          </div>
        </div>
      );
    }
    return (
      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${option.color}`}>
        {option.label.split(' ')[0]}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create / Edit Form */}
      <div className="lg:col-span-1 bg-white border border-sandstone/30 p-5 rounded-2xl space-y-4 h-max shadow-sm">
        <h4 className="font-extrabold text-sm uppercase tracking-wider text-teak flex items-center gap-1.5">
          <Layers size={16} className="text-marigold" />
          {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
        </h4>
        <form onSubmit={handleCreateOrUpdatePlan} className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Plan Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Billing Pro ₹499"
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-teak focus:border-marigold font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Plan Key (Unique ID)</label>
            <input
              type="text"
              required
              disabled={!!editingPlan}
              placeholder="e.g. billing-pro-monthly"
              value={newPlan.key}
              onChange={(e) => setNewPlan({ ...newPlan, key: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
              className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-teak focus:border-marigold font-bold disabled:opacity-50"
            />
          </div>

          {/* Service Module Type Dropdown */}
          <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-teak flex items-center gap-1">
              <Tag size={12} className="text-marigold" />
              Service Module Category
            </label>
            <select
              value={newPlan.serviceType || 'full'}
              onChange={(e) => setNewPlan({ ...newPlan, serviceType: e.target.value })}
              className="w-full bg-white border border-sandstone/40 rounded-lg px-3 py-2 text-xs outline-none text-teak font-bold"
            >
              {SERVICE_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>

            {/* If serviceType === 'bundle', allow choosing included services */}
            {newPlan.serviceType === 'bundle' && (
              <div className="pt-2 border-t border-amber-500/15">
                <label className="text-[9px] font-black uppercase tracking-wider text-khaki mb-1.5 block">
                  Included Bundle Modules:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {AVAILABLE_MODULES.map(m => (
                    <label key={m.key} className="flex items-center gap-1.5 text-[10px] font-bold text-teak cursor-pointer bg-white p-1.5 rounded border border-sandstone/30">
                      <input
                        type="checkbox"
                        checked={(newPlan.includedServices || []).includes(m.key)}
                        onChange={() => toggleBundleService(m.key)}
                        className="rounded border-sandstone/45 text-marigold focus:ring-marigold"
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Price (INR)</label>
              <input
                type="number"
                required
                placeholder="499"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-teak focus:border-marigold font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Duration (Days)</label>
              <input
                type="number"
                required
                placeholder="30"
                value={newPlan.durationDays}
                onChange={(e) => setNewPlan({ ...newPlan, durationDays: e.target.value })}
                className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-teak focus:border-marigold font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Target Facility Type</label>
            <select
              value={newPlan.facilityType}
              onChange={(e) => setNewPlan({ ...newPlan, facilityType: e.target.value })}
              className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-teak focus:border-marigold font-bold"
            >
              <option value="clinic">Clinic Only</option>
              <option value="lab">Independent Lab Only</option>
              <option value="both">Both Clinic + Lab Combined</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Features (Comma-separated)</label>
            <textarea
              placeholder="GST Invoices, PDF Receipts, SMS Reminders"
              value={newPlan.features}
              onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
              rows={2}
              className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-teak focus:border-marigold font-semibold"
            />
          </div>

          <div className="border-t border-sandstone/25 pt-2.5 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-teak">Traffic Capacity Limits (0 = Unlimited)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] font-bold text-khaki">Max Staff</label>
                <input
                  type="number"
                  value={newPlan.maxStaff}
                  onChange={(e) => setNewPlan({ ...newPlan, maxStaff: e.target.value })}
                  className="w-full mt-0.5 bg-parchment/40 border border-sandstone/40 rounded-lg px-2 py-1 text-xs outline-none text-teak font-bold"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-khaki">Max Patients</label>
                <input
                  type="number"
                  value={newPlan.maxPatients}
                  onChange={(e) => setNewPlan({ ...newPlan, maxPatients: e.target.value })}
                  className="w-full mt-0.5 bg-parchment/40 border border-sandstone/40 rounded-lg px-2 py-1 text-xs outline-none text-teak font-bold"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-khaki">Max Queues</label>
                <input
                  type="number"
                  value={newPlan.maxQueues}
                  onChange={(e) => setNewPlan({ ...newPlan, maxQueues: e.target.value })}
                  className="w-full mt-0.5 bg-parchment/40 border border-sandstone/40 rounded-lg px-2 py-1 text-xs outline-none text-teak font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-teak cursor-pointer">
              <input
                type="checkbox"
                checked={newPlan.isActive}
                onChange={(e) => setNewPlan({ ...newPlan, isActive: e.target.checked })}
                className="rounded border-sandstone/45 text-marigold focus:ring-marigold"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-teak cursor-pointer">
              <input
                type="checkbox"
                checked={newPlan.isCustomPlan}
                onChange={(e) => setNewPlan({ ...newPlan, isCustomPlan: e.target.checked })}
                className="rounded border-sandstone/45 text-marigold focus:ring-marigold"
              />
              Custom Plan
            </label>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              className="flex-grow py-2.5 bg-gradient-to-tr from-marigold to-saffron rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </button>
            {editingPlan && (
              <button
                type="button"
                onClick={() => {
                  setEditingPlan(null);
                  setNewPlan({
                    name: '', key: '', price: '', durationDays: '', facilityType: 'clinic',
                    features: '', maxStaff: '0', maxPatients: '0', maxQueues: '0',
                    isCustomPlan: false, isActive: true, serviceType: 'full', includedServices: []
                  });
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border-0"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Table */}
      <div className="lg:col-span-2 space-y-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="font-extrabold text-sm uppercase tracking-wider text-teak">Active Subscription Plans ({filteredPlans.length})</h4>
          <div className="flex items-center gap-1 bg-white/60 p-1 rounded-xl border border-sandstone/25 text-[10px] font-bold overflow-x-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition border-0 cursor-pointer ${activeFilter === 'all' ? 'bg-marigold text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              All ({plans.length})
            </button>
            {SERVICE_OPTIONS.map(opt => {
              const count = plans.filter(p => (p.serviceType || 'full') === opt.key).length;
              return (
                <button
                  key={opt.key}
                  onClick={() => setActiveFilter(opt.key)}
                  className={`px-2 py-1 rounded-lg transition border-0 cursor-pointer ${activeFilter === opt.key ? 'bg-marigold text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {opt.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto border border-sandstone/25 rounded-2xl bg-white/40 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-sandstone/20 text-khaki font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="p-4">Plan Name & Key</th>
                <th className="p-4">Module Type</th>
                <th className="p-4">Pricing</th>
                <th className="p-4">Facility & Features</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sandstone/15 font-medium text-slate-700">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-khaki font-bold uppercase tracking-widest">No plans found in this category</td>
                </tr>
              ) : (
                filteredPlans.map(p => (
                  <tr key={p._id} className="hover:bg-parchment/30">
                    <td className="p-4">
                      <div className="font-extrabold text-teak text-sm">{p.name}</div>
                      <div className="text-[10px] text-marigold font-mono mt-0.5">{p.key}</div>
                    </td>
                    <td className="p-4">
                      {getServiceBadge(p.serviceType || 'full', p.includedServices)}
                    </td>
                    <td className="p-4">
                      <div className="font-black text-teak">₹{p.price.toLocaleString()}</div>
                      <div className="text-[10px] text-khaki mt-0.5">{p.durationDays} Days</div>
                    </td>
                    <td className="p-4 max-w-[180px]">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black uppercase text-teak tracking-wider">
                        {p.facilityType === 'both' ? 'Clinic + Lab' : p.facilityType}
                      </span>
                      <div className="text-[10px] text-khaki mt-1 line-clamp-2" title={Array.isArray(p.features) ? p.features.join(', ') : p.features}>
                        {Array.isArray(p.features) ? p.features.join(', ') : p.features || 'No custom features'}
                      </div>
                    </td>
                    <td className="p-4 text-center space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {p.isCustomPlan && (
                        <span className="block text-[8px] font-black uppercase tracking-widest text-marigold">
                          Custom Plan
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => handleEditPlanClick(p)}
                          className="p-1.5 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition cursor-pointer border-0"
                          title="Edit Plan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(p._id)}
                          className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition cursor-pointer border-0"
                          title="Delete Plan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlansTab;
