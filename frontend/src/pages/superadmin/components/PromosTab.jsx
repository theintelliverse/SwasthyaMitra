import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const PromosTab = ({
  newPromo,
  setNewPromo,
  handleCreatePromo,
  promos,
  handleDeletePromo
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Form */}
      <div className="lg:col-span-1 bg-white border border-sandstone/30 p-5 rounded-2xl space-y-4 h-max shadow-sm">
        <h4 className="font-extrabold text-sm uppercase tracking-wider text-teak">Create Promo Discount</h4>
        <form onSubmit={handleCreatePromo} className="space-y-3">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Discount Code</label>
            <input
              type="text"
              required
              placeholder="e.g. SWASTHYA20"
              value={newPromo.code}
              onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
              className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-teak focus:border-marigold font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Percentage Off</label>
            <input
              type="number"
              required
              min="1"
              max="100"
              placeholder="20"
              value={newPromo.discountPercentage}
              onChange={(e) => setNewPromo({ ...newPromo, discountPercentage: e.target.value })}
              className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-teak focus:border-marigold font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Expiry Date</label>
            <input
              type="date"
              required
              value={newPromo.expiryDate}
              onChange={(e) => setNewPromo({ ...newPromo, expiryDate: e.target.value })}
              className="w-full mt-1 bg-parchment/40 border border-sandstone/40 rounded-xl px-3.5 py-2 text-xs outline-none text-khaki focus:border-marigold font-bold"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-tr from-marigold to-saffron hover:from-marigold/95 hover:to-saffron/95 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition flex items-center justify-center gap-1.5 mt-2 cursor-pointer border-0"
          >
            <Plus size={14} /> Create Promo
          </button>
        </form>
      </div>

      {/* List Table */}
      <div className="lg:col-span-2 space-y-4">
        <h4 className="font-extrabold text-sm uppercase tracking-wider text-teak">Active Promo Codes ({promos.length})</h4>
        <div className="overflow-x-auto border border-sandstone/25 rounded-2xl bg-white/40 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-sandstone/20 text-khaki font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="p-4">Discount Code</th>
                <th className="p-4">Discount Percentage</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sandstone/15 font-medium text-slate-700">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-khaki font-bold uppercase tracking-widest">No promo codes registered</td>
                </tr>
              ) : (
                promos.map(p => {
                  const isExpired = new Date(p.expiryDate) < new Date();
                  return (
                    <tr key={p._id} className="hover:bg-parchment/30">
                      <td className="p-4 font-extrabold text-teak text-sm tracking-wider">{p.code}</td>
                      <td className="p-4 text-marigold font-bold">{p.discountPercentage}% OFF</td>
                      <td className="p-4 text-slate-500">{new Date(p.expiryDate).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isExpired ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDeletePromo(p._id)}
                          className="p-1.5 bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition cursor-pointer"
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
    </div>
  );
};

export default PromosTab;
