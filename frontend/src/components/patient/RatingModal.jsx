import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, X, CheckCircle, RefreshCw, ShieldCheck, Edit3 } from 'lucide-react';
import Swal from 'sweetalert2';
import { API_URL } from '../../config/runtime';

const RatingModal = ({
    isOpen,
    onClose,
    targetType, // 'doctor' | 'clinic' | 'lab'
    targetId,
    targetName,
    existingReview = null, // If provided, modal opens in edit mode
    onSuccess
}) => {
    const isEditMode = Boolean(existingReview?._id);

    const [score, setScore] = useState(existingReview?.score || 5);
    const [hoverScore, setHoverScore] = useState(0);
    const [review, setReview] = useState(existingReview?.review || '');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (existingReview) {
            setScore(existingReview.score || 5);
            setReview(existingReview.review || '');
        } else {
            setScore(5);
            setReview('');
        }
    }, [existingReview, isOpen]);

    if (!isOpen) return null;

    const starDescriptions = {
        1: 'Poor Experience',
        2: 'Needs Improvement',
        3: 'Good Consultation',
        4: 'Very Good Care',
        5: 'Exceptional Healthcare'
    };

    const effectiveTargetType = existingReview?.targetType || targetType;
    const effectiveTargetId = existingReview?.targetId || targetId;
    const effectiveTargetName = existingReview?.targetName || targetName;

    const getTargetTitle = () => {
        const prefix = isEditMode ? 'Edit Review for' : 'Rate';
        if (effectiveTargetType === 'doctor') return `${prefix} Dr. ${effectiveTargetName || 'Specialist'}`;
        if (effectiveTargetType === 'clinic') return `${prefix} ${effectiveTargetName || 'Clinic'}`;
        if (effectiveTargetType === 'lab') return `${prefix} ${effectiveTargetName || 'Diagnostic Lab'}`;
        return `${prefix} Healthcare Service`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!score || score < 1 || score > 5) {
            Swal.fire({
                icon: 'warning',
                title: 'Please Select Stars',
                text: 'Select a rating from 1 to 5 stars.',
                confirmButtonColor: '#0D9488'
            });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const rawPhone = localStorage.getItem('userPhone') || '';
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            let res;
            if (isEditMode && existingReview?._id) {
                // Direct update endpoint
                res = await axios.put(`${API_URL}/api/ratings/${existingReview._id}`, {
                    score,
                    review: review.trim(),
                    patientPhone: rawPhone
                }, { headers });
            } else {
                // Submit (creates new or updates existing)
                res = await axios.post(`${API_URL}/api/ratings`, {
                    targetType: effectiveTargetType,
                    targetId: effectiveTargetId,
                    score,
                    review: review.trim(),
                    patientPhone: rawPhone
                }, { headers });
            }

            if (res.data?.success) {
                Swal.fire({
                    icon: 'success',
                    title: isEditMode ? 'Review Updated! ⭐' : 'Thank You! ⭐',
                    text: isEditMode 
                        ? 'Your review and rating have been updated successfully.'
                        : 'Your verified rating and review have been published.',
                    confirmButtonColor: '#0D9488',
                    timer: 2300,
                    showConfirmButton: false
                });

                if (onSuccess) {
                    onSuccess(res.data.rating, res.data.review);
                }
                onClose();
            }
        } catch (err) {
            console.error('Error submitting rating:', err);
            Swal.fire({
                icon: 'error',
                title: isEditMode ? 'Update Failed' : 'Submission Failed',
                text: err.response?.data?.message || 'Could not record rating. Please try again.',
                confirmButtonColor: '#0D9488'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rating-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center">
                            {isEditMode ? <Edit3 size={19} className="text-amber-600" /> : <Star size={20} className="fill-amber-400" />}
                        </div>
                        <div>
                            <h3 id="rating-modal-title" className="font-heading text-lg font-bold text-slate-900 leading-snug">
                                {getTargetTitle()}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                {isEditMode ? 'Modify Your Existing Rating' : 'Verified Patient Rating'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close rating modal"
                        className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star Selection */}
                    <div className="text-center space-y-2 py-2 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {isEditMode ? 'Update your score' : 'How was your experience?'}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((starValue) => {
                                const isFilled = (hoverScore || score) >= starValue;
                                return (
                                    <button
                                        key={starValue}
                                        type="button"
                                        onMouseEnter={() => setHoverScore(starValue)}
                                        onMouseLeave={() => setHoverScore(0)}
                                        onClick={() => setScore(starValue)}
                                        className="p-1 rounded-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                                    >
                                        <Star
                                            size={32}
                                            className={`${
                                                isFilled
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-300 hover:text-amber-200'
                                            } transition-colors`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-sm font-bold text-amber-700">
                            {starDescriptions[hoverScore || score]}
                        </p>
                    </div>

                    {/* Patient Privacy Assurance Callout */}
                    <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-teal-900">
                        <ShieldCheck size={18} className="text-teal-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-slate-900">100% Confidential &amp; Anonymized</p>
                            <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                                Under DPDP Act 2023, your personal identity is never displayed publicly. Your review will appear strictly as <strong>"Verified Patient"</strong> on public profiles.
                            </p>
                        </div>
                    </div>

                    {/* Review Feedback Comment */}
                    <div className="space-y-1.5">
                        <label htmlFor="review-comment" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Feedback / Review Notes <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            id="review-comment"
                            rows="3"
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            placeholder="Describe consultation quality, wait-time, cabin hygiene, or care experience..."
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="animate-spin" size={16} />
                                    <span>{isEditMode ? 'Updating...' : 'Recording...'}</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} />
                                    <span>{isEditMode ? 'Update Review' : 'Submit Rating'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
