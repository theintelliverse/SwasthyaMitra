import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ShieldCheck, Check, X, Sliders, Info } from 'lucide-react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [analyticsConsent, setAnalyticsConsent] = useState(false);

    useEffect(() => {
        let timer;
        try {
            const savedConsent = localStorage.getItem('appointory_cookie_consent');
            if (!savedConsent) {
                // Delay banner slightly to prevent layout shifts on initial paint
                timer = setTimeout(() => {
                    setIsVisible(true);
                }, 1000);
            } else {
                const parsed = JSON.parse(savedConsent);
                if (parsed.analytics && typeof window !== 'undefined' && typeof window.gtag === 'function') {
                    window.gtag('consent', 'update', {
                        analytics_storage: 'granted'
                    });
                }
            }
        } catch (e) {
            console.warn('Could not read cookie consent preference:', e);
            timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, []);

    const updateGtagConsent = (granted) => {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                analytics_storage: granted ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });
        }
    };

    const handleAcceptAll = () => {
        const consentData = {
            necessary: true,
            analytics: true,
            timestamp: new Date().toISOString()
        };
        try {
            localStorage.setItem('appointory_cookie_consent', JSON.stringify(consentData));
        } catch (e) {
            console.warn(e);
        }
        updateGtagConsent(true);
        setIsVisible(false);
        setShowModal(false);
    };

    const handleDeclineNonEssential = () => {
        const consentData = {
            necessary: true,
            analytics: false,
            timestamp: new Date().toISOString()
        };
        try {
            localStorage.setItem('appointory_cookie_consent', JSON.stringify(consentData));
        } catch (e) {
            console.warn(e);
        }
        updateGtagConsent(false);
        setIsVisible(false);
        setShowModal(false);
    };

    const handleSavePreferences = () => {
        const consentData = {
            necessary: true,
            analytics: analyticsConsent,
            timestamp: new Date().toISOString()
        };
        try {
            localStorage.setItem('appointory_cookie_consent', JSON.stringify(consentData));
        } catch (e) {
            console.warn(e);
        }
        updateGtagConsent(analyticsConsent);
        setIsVisible(false);
        setShowModal(false);
    };

    if (!isVisible && !showModal) {
        return null;
    }

    return (
        <>
            {/* Floating Banner */}
            {isVisible && !showModal && (
                <aside
                    role="region"
                    aria-label="Cookie and Privacy Consent Banner"
                    className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
                >
                    <div className="bg-white border-2 border-[#D4E4DF] rounded-3xl p-5 sm:p-6 shadow-2xl shadow-[#1A3C34]/15 space-y-4 text-[#1A3C34]">
                        <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#1F7A56] border border-emerald-200 flex items-center justify-center shrink-0">
                                <Cookie size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-heading font-bold text-base text-[#1A3C34] tracking-tight">
                                    Privacy & Cookie Preferences
                                </h3>
                                <p className="text-xs text-[#5C7C74] font-medium leading-relaxed">
                                    We use essential browser storage to secure your login, manage OPD queues, and protect health lockers. We only load optional analytics cookies if you consent under our Google Consent Mode v2 setup.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D4E4DF]/60 text-xs font-semibold">
                            <Link
                                to="/cookie-policy"
                                className="text-[#1F7A56] hover:underline underline-offset-4 font-bold"
                            >
                                Read Cookie Policy
                            </Link>

                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="text-[#5C7C74] hover:text-[#1A3C34] underline underline-offset-4 cursor-pointer"
                            >
                                Customize Preferences
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleDeclineNonEssential}
                                className="px-4 py-2.5 bg-[#F7FAF9] hover:bg-[#D4E4DF]/50 text-[#1A3C34] border border-[#D4E4DF] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F7A56]"
                            >
                                Reject Non-Essential
                            </button>
                            <button
                                type="button"
                                onClick={handleAcceptAll}
                                className="px-4 py-2.5 bg-[#1F7A56] hover:bg-[#1A3C34] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-[#1F7A56]/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1F7A56]"
                            >
                                Accept All
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            {/* Custom Preferences Modal */}
            {showModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cookie-modal-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A3C34]/60 backdrop-blur-xs animate-in fade-in duration-200"
                >
                    <div className="bg-white border border-[#D4E4DF] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-[#1A3C34]">
                        <div className="flex items-center justify-between pb-3 border-b border-[#D4E4DF]/60">
                            <div className="flex items-center gap-2.5">
                                <Sliders size={20} className="text-[#1F7A56]" />
                                <h3 id="cookie-modal-title" className="font-heading text-lg font-bold text-[#1A3C34]">
                                    Manage Cookie Preferences
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                aria-label="Close preferences modal"
                                className="p-1 rounded-lg text-[#5C7C74] hover:bg-[#F7FAF9] hover:text-[#1A3C34]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 text-xs">
                            {/* Strictly Necessary */}
                            <div className="p-4 bg-[#F7FAF9] border border-[#D4E4DF] rounded-2xl space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#1A3C34] text-sm">Strictly Necessary Storage</span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-[#1F7A56] font-bold rounded-md uppercase text-[10px]">
                                        Always Active
                                    </span>
                                </div>
                                <p className="text-[#5C7C74] leading-relaxed">
                                    Required for session authentication (JWT), role-based clinical security, CSRF protection, and health locker access. Cannot be deactivated.
                                </p>
                            </div>

                            {/* Analytics */}
                            <div className="p-4 bg-[#F7FAF9] border border-[#D4E4DF] rounded-2xl space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-[#1A3C34] text-sm">Anonymous Analytics Cookies</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={analyticsConsent}
                                            onChange={(e) => setAnalyticsConsent(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#1F7A56] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1F7A56]"></div>
                                    </label>
                                </div>
                                <p className="text-[#5C7C74] leading-relaxed">
                                    Allows us to measure site performance and system reliability anonymously via Google Analytics.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleDeclineNonEssential}
                                className="flex-1 py-2.5 px-4 bg-[#F7FAF9] hover:bg-[#D4E4DF]/50 text-[#1A3C34] border border-[#D4E4DF] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                            >
                                Reject Optional
                            </button>
                            <button
                                type="button"
                                onClick={handleSavePreferences}
                                className="flex-1 py-2.5 px-4 bg-[#1F7A56] hover:bg-[#1A3C34] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CookieConsent;
