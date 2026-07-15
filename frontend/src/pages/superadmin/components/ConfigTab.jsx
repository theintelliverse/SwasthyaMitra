import React from 'react';
import { Settings, Percent, Mail, Info, Save, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

const ToggleSwitch = ({ checked, onChange, disabled, activeColor = "bg-marigold" }) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-marigold/20 ${
        checked ? activeColor : "bg-sandstone/30"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-250 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

const ConfigTab = ({
  config,
  setConfig,
  savingConfig,
  handleUpdateConfig
}) => {
  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in-50 duration-300">
      
      {/* Top Section: Side-by-Side Controls on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
        
        {/* Global System Enforcements Card */}
        <div className="w-full bg-white border border-sandstone/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center gap-3 border-b border-sandstone/15 pb-4">
            <div className="w-9 h-9 rounded-xl bg-marigold/10 flex items-center justify-center text-marigold">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="font-heading text-base font-bold text-teak leading-tight">Global System Enforcements</h3>
              <p className="text-[10px] text-khaki font-medium mt-0.5">Control core platform behaviors and rules</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Subscription Enforcement Toggle */}
            <div className="p-4 bg-parchment/30 border border-sandstone/20 rounded-2xl flex items-center justify-between transition-all hover:bg-parchment/40">
              <div className="pr-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-bold uppercase tracking-wider border border-amber-200/50 mb-1.5">
                  Billing Control
                </span>
                <p className="font-bold text-xs text-teak">Enforce Subscription Expirations</p>
                <p className="text-[10px] text-khaki mt-0.5 leading-relaxed">
                  Locked and redirect clinics/labs to the checkout gateway automatically once their active plan expires.
                </p>
              </div>
              <ToggleSwitch
                checked={!!config.isSubscriptionEnforced}
                onChange={() => handleUpdateConfig({ isSubscriptionEnforced: !config.isSubscriptionEnforced })}
                disabled={savingConfig}
              />
            </div>

            {/* Maintenance Mode Configuration */}
            <div className="p-4 bg-parchment/30 border border-sandstone/20 rounded-2xl space-y-4 transition-all hover:bg-parchment/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[9px] font-bold uppercase tracking-wider border border-rose-200/50 mb-1.5">
                    Platform Status
                  </span>
                  <p className="font-bold text-xs text-teak">Platform Maintenance Lockdown</p>
                  <p className="text-[10px] text-khaki mt-0.5 leading-relaxed">
                    Block all doctor, lab, receptionist, and patient logins with a custom warning.
                  </p>
                </div>
                <ToggleSwitch
                  checked={!!config.isMaintenanceMode}
                  onChange={() => handleUpdateConfig({ isMaintenanceMode: !config.isMaintenanceMode })}
                  disabled={savingConfig}
                  activeColor="bg-rose-500"
                />
              </div>

              {config.isMaintenanceMode && (
                <div className="space-y-3 pt-3 border-t border-sandstone/20 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-khaki flex items-center gap-1">
                      <ShieldAlert size={12} className="text-rose-500" />
                      Maintenance Screen Notice Message
                    </label>
                    <textarea
                      rows={3}
                      value={config.maintenanceMessage}
                      onChange={(e) => setConfig({ ...config, maintenanceMessage: e.target.value })}
                      className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-4 py-3 text-xs outline-none text-teak transition-all placeholder:text-gray-300"
                      placeholder="Specify the reason or estimated return time..."
                    />
                  </div>
                  <button
                    onClick={() => handleUpdateConfig({ maintenanceMessage: config.maintenanceMessage })}
                    disabled={savingConfig}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-500 text-white hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition cursor-pointer border-0 shadow-sm disabled:opacity-50"
                  >
                    <Save size={12} /> Save Lockdown Message
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Discount Campaigns Manager */}
            <div className="p-4 bg-parchment/30 border border-sandstone/20 rounded-2xl space-y-4 transition-all hover:bg-parchment/40">
              <div className="border-b border-sandstone/15 pb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-bold uppercase tracking-wider border border-emerald-200/50 mb-1.5">
                  Promotional
                </span>
                <p className="font-bold text-xs text-teak">Discount & Campaign Settings</p>
                <p className="text-[10px] text-khaki mt-0.5 leading-relaxed">
                  Configure trial periods, legacy user discount percentages, and campaign dates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-teak">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Trial Period (Days)</label>
                  <input
                    type="number"
                    value={config.trialPeriodDays ?? 30}
                    onChange={(e) => setConfig({ ...config, trialPeriodDays: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Legacy Discount (%)</label>
                  <input
                    type="number"
                    value={config.legacyDiscountPercentage ?? 20}
                    onChange={(e) => setConfig({ ...config, legacyDiscountPercentage: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Legacy Discount Label</label>
                  <input
                    type="text"
                    value={config.legacyDiscountLabel ?? 'Legacy User Discount'}
                    onChange={(e) => setConfig({ ...config, legacyDiscountLabel: e.target.value })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki flex items-center gap-1">
                    Legacy Cut-off Date
                  </label>
                  <input
                    type="date"
                    value={config.legacyCutoffDate ? new Date(config.legacyCutoffDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setConfig({ ...config, legacyCutoffDate: e.target.value || null })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                  <div className="flex items-start gap-1.5 mt-1.5 p-2 bg-white/70 border border-sandstone/15 rounded-lg text-[9px] text-khaki font-medium leading-normal">
                    <Info size={11} className="text-marigold shrink-0 mt-0.5" />
                    <span>Facilities registered before this date qualify for the legacy discount.</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Campaign Start Date</label>
                  <input
                    type="date"
                    value={config.legacyDiscountStartDate ? new Date(config.legacyDiscountStartDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setConfig({ ...config, legacyDiscountStartDate: e.target.value || null })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Campaign End Date</label>
                  <input
                    type="date"
                    value={config.legacyDiscountEndDate ? new Date(config.legacyDiscountEndDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => setConfig({ ...config, legacyDiscountEndDate: e.target.value || null })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleUpdateConfig({
                    trialPeriodDays: config.trialPeriodDays,
                    legacyDiscountPercentage: config.legacyDiscountPercentage,
                    legacyDiscountThresholdDays: config.legacyDiscountThresholdDays,
                    legacyCutoffDate: config.legacyCutoffDate,
                    legacyDiscountStartDate: config.legacyDiscountStartDate,
                    legacyDiscountEndDate: config.legacyDiscountEndDate,
                    legacyDiscountLabel: config.legacyDiscountLabel
                  })}
                  disabled={savingConfig}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-marigold text-white hover:bg-marigold/90 active:scale-[0.98] rounded-xl text-[10px] font-black uppercase tracking-widest transition duration-150 cursor-pointer border-0 shadow-sm disabled:opacity-50"
                >
                  <Save size={12} /> Save Campaign Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Taxation & GST Settings Card */}
        <div className="w-full bg-white border border-sandstone/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between border-b border-sandstone/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-marigold/10 flex items-center justify-center text-marigold">
                <Percent size={18} />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-teak leading-tight">Taxation & GST Settings</h3>
                <p className="text-[10px] text-khaki font-medium mt-0.5">Manage tax rates and boundaries</p>
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-wider text-teak cursor-pointer bg-parchment/40 px-3 py-1.5 rounded-xl border border-sandstone/20 select-none">
              <input
                type="checkbox"
                checked={!!config.isGstEnabled}
                onChange={(e) => setConfig({ ...config, isGstEnabled: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-sandstone/40 text-marigold focus:ring-marigold accent-marigold"
              />
              Enable GST
            </label>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-2.5 p-3 bg-parchment/30 border border-sandstone/20 rounded-2xl text-[10.5px] text-khaki font-medium leading-relaxed">
              <Info size={13} className="text-marigold shrink-0 mt-0.5" />
              <span>Configure billing tax rates (CGST, SGST, IGST) applied automatically to customer checkouts based on state boundary criteria.</span>
            </div>

            {config.isGstEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-teak animate-in slide-in-from-top-2 duration-250">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">GSTIN (Registration No.)</label>
                  <input
                    type="text"
                    value={config.gstNumber ?? ''}
                    onChange={(e) => setConfig({ ...config, gstNumber: e.target.value })}
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">CGST Rate (%)</label>
                  <input
                    type="number"
                    value={config.cgstRatePercentage ?? 9}
                    onChange={(e) => setConfig({ ...config, cgstRatePercentage: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">SGST Rate (%)</label>
                  <input
                    type="number"
                    value={config.sgstRatePercentage ?? 9}
                    onChange={(e) => setConfig({ ...config, sgstRatePercentage: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">IGST Rate (%)</label>
                  <input
                    type="number"
                    value={config.igstRatePercentage ?? 18}
                    onChange={(e) => setConfig({ ...config, igstRatePercentage: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Local State Name</label>
                  <input
                    type="text"
                    value={config.gstState ?? 'India'}
                    onChange={(e) => setConfig({ ...config, gstState: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Local State Code</label>
                  <input
                    type="text"
                    value={config.gstStateCode ?? 'GST'}
                    onChange={(e) => setConfig({ ...config, gstStateCode: e.target.value })}
                    placeholder="e.g. MH"
                    className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-3 py-2 outline-none text-teak transition-all font-bold placeholder:text-gray-300"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => handleUpdateConfig({
                  isGstEnabled: config.isGstEnabled,
                  gstNumber: config.gstNumber,
                  cgstRatePercentage: config.cgstRatePercentage,
                  sgstRatePercentage: config.sgstRatePercentage,
                  igstRatePercentage: config.igstRatePercentage,
                  gstState: config.gstState,
                  gstStateCode: config.gstStateCode
                })}
                disabled={savingConfig}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-marigold text-white hover:bg-marigold/90 active:scale-[0.98] rounded-xl text-[10px] font-black uppercase tracking-widest transition duration-150 cursor-pointer border-0 shadow-sm disabled:opacity-50"
              >
                <Save size={12} /> Save Tax Settings
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Support Mailer & SMTP Settings (Full-width Card) */}
      <div className="w-full bg-white border border-sandstone/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center gap-3 border-b border-sandstone/15 pb-4">
          <div className="w-9 h-9 rounded-xl bg-marigold/10 flex items-center justify-center text-marigold">
            <Mail size={18} />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-teak leading-tight">Support Mailer & SMTP Settings</h3>
            <p className="text-[10px] text-khaki font-medium mt-0.5">Configure custom dynamic SMTP credentials for emails and alerts</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-2.5 p-3.5 bg-parchment/30 border border-sandstone/20 rounded-2xl text-[10.5px] text-khaki font-medium leading-relaxed">
            <Info size={14} className="text-marigold shrink-0 mt-0.5" />
            <span>
              These settings dynamically override system default environment mailer settings. Custom SMTP accounts are used for delivery of ticket receipts, administrative alerts, and user support query feedback.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-semibold text-teak">
            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <label className="text-[10px] font-black uppercase tracking-wider text-khaki">Super Admin Notification Email (Receives support requests)</label>
              <input
                type="email"
                value={config.superadminEmail ?? ''}
                onChange={(e) => setConfig({ ...config, superadminEmail: e.target.value })}
                placeholder="e.g. admin@appointory.com"
                className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-4 py-2.5 outline-none text-teak transition-all font-bold placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-khaki">SMTP Host</label>
              <input
                type="text"
                value={config.smtpHost ?? ''}
                onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                placeholder="e.g. smtp.gmail.com"
                className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-4 py-2.5 outline-none text-teak transition-all font-bold placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-khaki">SMTP Port</label>
              <input
                type="number"
                value={config.smtpPort ?? 587}
                onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 587"
                className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-4 py-2.5 outline-none text-teak transition-all font-bold placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-khaki">SMTP Secure Connection (SSL/TLS)</label>
              <div className="flex items-center h-[42px]">
                <ToggleSwitch
                  checked={!!config.smtpSecure}
                  onChange={() => setConfig({ ...config, smtpSecure: !config.smtpSecure })}
                  disabled={savingConfig}
                />
                <span className="text-[10px] text-khaki font-bold uppercase tracking-wider ml-3">SSL/TLS Mode</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-khaki">SMTP User Email</label>
              <input
                type="text"
                value={config.smtpUser ?? ''}
                onChange={(e) => setConfig({ ...config, smtpUser: e.target.value })}
                placeholder="e.g. support@appointory.com"
                className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-4 py-2.5 outline-none text-teak transition-all font-bold placeholder:text-gray-300"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-khaki">SMTP Password / App Password (will be encrypted)</label>
              <input
                type="password"
                value={config.smtpPass ?? ''}
                onChange={(e) => setConfig({ ...config, smtpPass: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full bg-white border border-sandstone/40 focus:border-marigold focus:ring-1 focus:ring-marigold rounded-xl px-4 py-2.5 outline-none text-teak transition-all font-bold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => handleUpdateConfig({
                superadminEmail: config.superadminEmail,
                smtpHost: config.smtpHost,
                smtpPort: config.smtpPort,
                smtpSecure: config.smtpSecure,
                smtpUser: config.smtpUser,
                smtpPass: config.smtpPass
              })}
              disabled={savingConfig}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-marigold text-white hover:bg-marigold/90 active:scale-[0.98] rounded-xl text-[10px] font-black uppercase tracking-widest transition duration-150 cursor-pointer border-0 shadow-sm disabled:opacity-50"
            >
              {savingConfig ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={12} /> Save Mailer Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ConfigTab;
