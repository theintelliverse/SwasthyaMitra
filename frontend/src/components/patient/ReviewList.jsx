import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Star, ShieldCheck, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config/runtime';

const ReviewList = ({ targetType, targetId, targetName, onOpenRating }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState({ score: 0, count: 0 });
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        if (!targetType || !targetId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/ratings/${targetType}/${targetId}`);
            if (res.data?.success) {
                setReviews(res.data.reviews || []);
                setStats(res.data.rating || { score: 0, count: 0 });
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        } finally {
            setLoading(false);
        }
    }, [targetType, targetId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    return (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-900">
                            Patient Ratings & Reviews
                        </h2>
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <ShieldCheck size={12} /> Verified
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                        Genuine feedback from patients who completed consultations or tests{targetName ? ` at ${targetName}` : ''}.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onOpenRating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all cursor-pointer self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                    <Plus size={16} />
                    Rate Experience
                </button>
            </div>

            {/* Score Summary Box */}
            <div className="grid sm:grid-cols-3 gap-4 items-center bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="text-center sm:text-left flex items-center justify-center sm:justify-start gap-3">
                    <span className="text-4xl font-heading font-black text-slate-900">
                        {stats.count > 0 ? stats.score.toFixed(1) : 'New'}
                    </span>
                    <div>
                        <div className="flex items-center text-amber-500">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={stats.score >= i ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            {stats.count > 0 ? `${stats.count} patient rating${stats.count > 1 ? 's' : ''}` : 'No ratings yet'}
                        </p>
                    </div>
                </div>

                <div className="sm:col-span-2 text-xs text-slate-600 leading-relaxed border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-5">
                    <p>Ratings reflect verified clinical visits, doctor communication, and treatment transparency.</p>
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-1.5 text-teal-800 bg-teal-50/60 p-1.5 rounded-lg border border-teal-100">
                        <ShieldCheck size={13} className="text-teal-600 shrink-0" />
                        <span>Medical Privacy Guaranteed: Patient personal identities are 100% anonymized on public profiles.</span>
                    </p>
                </div>
            </div>

            {/* Reviews Listing */}
            {loading ? (
                <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2 text-sm">
                    <RefreshCw className="animate-spin" size={18} />
                    <span>Loading verified reviews...</span>
                </div>
            ) : reviews.length === 0 ? (
                <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                    <MessageSquare size={32} className="text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No Patient Reviews Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Be the first patient to share your consultation or diagnostic experience{targetName ? ` with ${targetName}` : ''}.
                    </p>
                    <button
                        type="button"
                        onClick={onOpenRating}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        Leave First Review
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((r, idx) => (
                        <div
                            key={r._id || idx}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 hover:border-slate-200 transition-colors"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                                        <ShieldCheck size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                                            <span>Verified Patient</span>
                                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                                                Confirmed Visit
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                            <span>
                                                {new Date(r.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-0.5 text-amber-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            className={r.score >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                                        />
                                    ))}
                                </div>
                            </div>

                            {r.review && (
                                <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed pl-10">
                                    "{r.review}"
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default ReviewList;
