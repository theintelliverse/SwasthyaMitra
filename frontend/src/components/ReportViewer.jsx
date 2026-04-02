import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Utility function to decode JWT token and extract phone
const extractPhoneFromToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        return decoded.phone;
    } catch (error) {
        console.warn('Could not decode token:', error);
        return null;
    }
};

const ReportViewer = ({ documents, initialIndex = 0, onClose, onReportRemoved }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(100);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    const MAX_RETRY_ATTEMPTS = 3;
    const TIMEOUT_DURATION = 60000; // 60 seconds for slow networks

    // Safely get current document
    const currentDoc = documents?.[currentIndex];
    const isPdfDocument =
        (currentDoc?.fileType || '').toLowerCase().includes('pdf') ||
        (currentDoc?.fileUrl || '').toLowerCase().includes('.pdf');

    // Effect to update image URL when document changes
    useEffect(() => {
        if (!currentDoc) return;

        console.log('📄 Report changed:', {
            title: currentDoc.title,
            fileUrl: currentDoc.fileUrl,
            fileType: currentDoc.fileType,
            attemptNumber: retryCount + 1
        });

        setImageUrl(currentDoc.fileUrl);
        setLoading(true);
        setError(false);

        // Timeout to detect stuck loading (60 seconds for slow/mobile networks)
        const loadingTimeout = setTimeout(() => {
            console.warn('⏱️ Image loading timeout after 60 seconds - marking as error');
            setLoading(false);
            setError(true);

            Swal.fire({
                icon: 'warning',
                title: '⏱️ Loading Timeout',
                html: `
                    <div style="text-align: left;">
                        <p style="margin: 10px 0;">The image is taking too long to load.</p>
                        <p style="font-size: 14px; color: #666; margin: 10px 0;">This could be due to:</p>
                        <ul style="text-align: left; font-size: 13px; color: #666; margin: 10px 0;">
                            <li>🌐 Slow network connection</li>
                            <li>📁 Large file size</li>
                            <li>🔒 Server connectivity issues</li>
                        </ul>
                        ${retryCount < MAX_RETRY_ATTEMPTS ? `<p style="font-size: 12px; color: #999; margin-top: 10px;">Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}</p>` : ''}
                    </div>
                `,
                confirmButtonColor: '#FFA800',
                background: '#EEF6FA',
                confirmButtonText: retryCount < MAX_RETRY_ATTEMPTS ? '🔄 Retry Loading' : 'Close'
            }).then((result) => {
                if (result.isConfirmed && retryCount < MAX_RETRY_ATTEMPTS) {
                    // Retry by incrementing retry count
                    setRetryCount(retryCount + 1);
                    setError(false);
                    setLoading(true);
                    setImageUrl(currentDoc.fileUrl + '?cache_bust=' + Date.now());
                }
            });
        }, TIMEOUT_DURATION);

        return () => {
            clearTimeout(loadingTimeout);
        };
    }, [currentIndex, currentDoc, retryCount]);

    const handlePrevious = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
        setZoom(100);
        setError(false);
        setLoading(true);
        setRetryCount(0);
    };

    const handleNext = () => {
        if (currentIndex < documents.length - 1) setCurrentIndex(currentIndex + 1);
        setZoom(100);
        setError(false);
        setLoading(true);
        setRetryCount(0);
    };

    const handleZoom = (direction) => {
        const newZoom = direction === 'in' ? zoom + 20 : Math.max(50, zoom - 20);
        setZoom(newZoom);
    };

    const handleDownload = () => {
        if (currentDoc?.fileUrl) {
            const isPdf =
                (currentDoc.fileType || '').toLowerCase().includes('pdf') ||
                currentDoc.fileUrl.toLowerCase().includes('.pdf');
            const a = document.createElement('a');
            a.href = currentDoc.fileUrl;
            a.download = `${currentDoc.title || 'report'}.${isPdf ? 'pdf' : 'jpg'}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    // 🗑️ Remove broken report from database
    const handleRemoveBrokenReport = async () => {
        const confirmResult = await Swal.fire({
            title: '🗑️ Remove Broken Report?',
            html: `<p>This report could not be loaded and will be removed from your health locker.</p><p style="font-size: 12px; color: #666; margin-top: 10px;"><strong>${currentDoc.title}</strong></p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF6B6B',
            cancelButtonColor: '#808080',
            confirmButtonText: 'Yes, Remove It',
            cancelButtonText: 'Keep It'
        });

        if (!confirmResult.isConfirmed) return;

        setIsRemoving(true);
        try {
            const token = localStorage.getItem('token');
            let patientPhone = localStorage.getItem('userPhone');
            const documentId = currentDoc._id;

            // Validate token
            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }

            // If userPhone is not in localStorage, try to extract from token
            if (!patientPhone) {
                patientPhone = extractPhoneFromToken(token);
            }

            // Validate document ID
            if (!documentId) {
                throw new Error('Document ID is missing. Unable to identify the report.');
            }

            // Validate and clean phone number
            if (!patientPhone) {
                throw new Error('Phone number not found in your profile. Please log in again.');
            }

            const originalPhone = patientPhone;
            patientPhone = patientPhone.replace(/\D/g, '').slice(-10);

            // Validate cleaned phone
            if (!patientPhone || patientPhone.length < 10) {
                throw new Error(`Invalid phone number format. Expected 10 digits, got: ${originalPhone}`);
            }

            console.log('📤 Attempting to remove document:', {
                documentId: documentId,
                phoneLength: patientPhone.length,
                phoneLast4: patientPhone.slice(-4),
                hasToken: !!token,
                originalPhone: originalPhone
            });

            // Try with body first, then with query params if needed
            let res;
            try {
                res = await axios.delete(`${API_URL}/api/auth/patient/remove-document/${documentId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    data: { phone: patientPhone }
                });
            } catch (deleteErr) {
                // If body approach fails, try with query params
                console.warn('First attempt failed, trying with query params...');
                console.warn('Delete error:', deleteErr.message);
                res = await axios.delete(
                    `${API_URL}/api/auth/patient/remove-document/${documentId}?phone=${patientPhone}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }

            console.log('✅ Remove response:', res.data);

            if (res.data.success) {
                Swal.fire({
                    title: '✅ Report Removed',
                    text: 'The broken report has been deleted from your locker.',
                    icon: 'success',
                    confirmButtonColor: '#FFA800',
                    background: '#EEF6FA',
                    color: '#0F766E'
                });

                if (onReportRemoved) {
                    onReportRemoved(documentId);
                }

                if (documents.length === 1) {
                    onClose();
                } else {
                    if (currentIndex >= documents.length - 1) {
                        handlePrevious();
                    } else {
                        handleNext();
                    }
                }
            } else {
                throw new Error(res.data.message || 'Server returned failure');
            }
        } catch (err) {
            console.error('❌ Error removing report:', {
                message: err.message,
                status: err.response?.status,
                responseData: err.response?.data,
                documentId: currentDoc?._id,
                hasUserPhone: !!localStorage.getItem('userPhone'),
                hasToken: !!localStorage.getItem('token'),
                fullError: err
            });

            let errorMsg = err.message || 'Failed to remove the report.';

            // Check if it's an API response error
            if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            }

            Swal.fire({
                title: '❌ Failed to Remove',
                html: `
                    <div style="text-align: left; font-size: 14px;">
                        <p><strong>Error:</strong> ${errorMsg}</p>
                        <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 12px; text-align: left;">
                            <p style="margin: 0 0 8px 0; font-weight: bold;">Troubleshooting:</p>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li>Ensure you are logged in</li>
                                <li>Check your internet connection</li>
                                <li>Try refreshing the page and retrying</li>
                                <li>Contact support if the issue persists</li>
                            </ul>
                        </div>
                    </div>
                `,
                icon: 'error',
                confirmButtonColor: '#FF6B6B',
                background: '#EEF6FA',
                showCancelButton: true,
                confirmButtonText: '🔄 Retry',
                cancelButtonText: 'Close'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Retry the removal
                    handleRemoveBrokenReport();
                }
            });
        } finally {
            setIsRemoving(false);
        }
    };

    const handleImageError = () => {
        console.error('❌ Image load error:', currentDoc.fileUrl);
        setLoading(false);
        setError(true);

        Swal.fire({
            title: '⚠️ Report Not Available',
            html: `
                <div style="text-align: left;">
                    <p>This report could not be loaded from storage.</p>
                    <p style="font-size: 13px; color: #666; margin-top: 10px;">Possible reasons:</p>
                    <ul style="text-align: left; font-size: 12px; color: #666; margin: 10px 0;">
                        <li>File has been deleted</li>
                        <li>Link has expired</li>
                        <li>Network connectivity issue</li>
                    </ul>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '🗑️ Remove Report',
            cancelButtonText: 'Close',
            confirmButtonColor: '#FF6B6B',
            cancelButtonColor: '#808080'
        }).then((result) => {
            if (result.isConfirmed) {
                handleRemoveBrokenReport();
            }
        });
    };

    const handleImageLoad = () => {
        console.log('✅ Image loaded successfully:', currentDoc.title);
        setLoading(false);
        setError(false);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-teak rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border-4 border-marigold" style={{ maxHeight: '85vh' }}>

                {/* --- Header with Progress --- */}
                <div className="flex justify-between items-start px-8 py-6 bg-gradient-to-r from-teak to-teak/90 text-white border-b-4 border-marigold">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-heading">{currentDoc.title || 'Diagnostic Report'}</h2>
                            <span className="bg-marigold/30 text-marigold px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-marigold/50">
                                {currentIndex + 1} / {documents.length}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm opacity-90">
                            <span className="flex items-center gap-1.5">
                                <span className="text-marigold">📄</span> {currentDoc.fileType || 'Image'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="text-marigold">📅</span> {new Date(currentDoc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="text-marigold">🕐</span> {new Date(currentDoc.uploadedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/20 rounded-xl transition-all text-white flex-shrink-0"
                    >
                        <X size={28} />
                    </button>
                </div>

                {/* --- Image Viewer --- */}
                <div className="flex-grow flex items-center justify-center bg-gradient-to-b from-black/60 to-black/40 overflow-auto p-6 relative w-full">
                    {loading && !error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/70 to-black/40 z-10 rounded-lg">
                            <div className="flex flex-col items-center gap-6 max-w-sm">
                                {/* Advanced Loading Animation */}
                                <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-white/10 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 border-4 border-marigold border-t-transparent rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
                                    <div className="absolute inset-2 border-2 border-marigold/30 border-r-marigold rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
                                </div>

                                <div className="text-center">
                                    <p className="text-white font-heading text-2xl mb-2">Loading Report</p>
                                    <p className="text-white/60 text-sm leading-relaxed">Fetching your {currentDoc.title || 'diagnostic report'} from secure storage...</p>
                                    <p className="text-white/40 text-xs mt-3 font-mono">{imageUrl ? imageUrl.substring(0, 50) + '...' : 'Preparing...'}</p>
                                </div>

                                {/* Loading Progress Steps */}
                                <div className="space-y-2 w-full pl-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-marigold flex items-center justify-center text-xs text-teak font-bold">✓</div>
                                        <span className="text-xs text-white/70 uppercase tracking-wider">Connecting to vault</span>
                                    </div>
                                    <div className="flex items-center gap-3 animate-pulse">
                                        <div className="w-6 h-6 rounded-full bg-marigold/50 border-2 border-marigold animate-spin"></div>
                                        <span className="text-xs text-white/70 uppercase tracking-wider">Decrypting file</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full border-2 border-white/30"></div>
                                        <span className="text-xs text-white/50 uppercase tracking-wider">Rendering image</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setLoading(false); handleImageError(); }}
                                    className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs uppercase font-bold transition-all"
                                >
                                    Skip / Mark as Error
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center gap-8 text-white px-8 py-12 text-center max-w-md mx-auto">
                            <div className="animate-in zoom-in-95 duration-300 space-y-4 w-full">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mx-auto border-2 border-red-500/30">
                                    <AlertCircle size={48} className="text-red-400" />
                                </div>

                                <div>
                                    <p className="text-2xl font-heading mb-2">Report Unavailable</p>
                                    <p className="text-sm text-white/70 leading-relaxed">
                                        This diagnostic report could not be loaded. The file may have been moved, deleted, or the link is expired.
                                    </p>
                                </div>

                                {/* Error Info Box */}
                                <div className="bg-red-500/10 border-l-4 border-red-500 px-4 py-3 rounded-lg">
                                    <p className="text-xs text-white/60 uppercase tracking-wider mb-1 font-black">Report Details</p>
                                    <p className="text-sm text-white/80 break-all">{currentDoc.title}</p>
                                    <p className="text-xs text-white/60 mt-2">{new Date(currentDoc.uploadedAt).toLocaleDateString('en-IN')}</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                    <button
                                        onClick={handleRemoveBrokenReport}
                                        disabled={isRemoving}
                                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl transition-all font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        {isRemoving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Removing...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={18} /> Remove Report
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all font-bold text-sm uppercase tracking-wide"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {!error && imageUrl && (
                        isPdfDocument ? (
                            <iframe
                                key={currentDoc._id}
                                src={imageUrl}
                                title={currentDoc.title || 'Diagnostic Report PDF'}
                                className="w-full h-full rounded-lg bg-white"
                                onLoad={handleImageLoad}
                            />
                        ) : (
                            <img
                                key={currentDoc._id}
                                src={imageUrl}
                                alt={currentDoc.title}
                                style={{
                                    transform: `scale(${zoom / 100})`,
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto'
                                }}
                                className="object-contain transition-transform cursor-zoom-in animate-in fade-in duration-500"
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                loading="lazy"
                            />
                        )
                    )}
                </div>

                {/* --- Enhanced Controls Bar --- */}
                <div className="bg-gradient-to-r from-teak to-teak/95 px-6 py-5 flex flex-wrap items-center justify-between gap-6 backdrop-blur-sm border-t border-white/10 shadow-lg">

                    {/* Left Section: Zoom Controls */}
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/20">
                        <button
                            onClick={() => handleZoom('out')}
                            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all hover:scale-110 active:scale-95"
                            title="Zoom Out (-)">
                            <ZoomOut size={20} />
                        </button>
                        <div className="flex items-center gap-2 min-w-20">
                            <span className="text-white font-bold text-sm text-center flex-1">{zoom}%</span>
                        </div>
                        <button
                            onClick={() => handleZoom('in')}
                            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all hover:scale-110 active:scale-95"
                            title="Zoom In (+)">
                            <ZoomIn size={20} />
                        </button>
                    </div>

                    {/* Center Section: Navigation */}
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-xl border border-white/20">
                        {documents.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevious}
                                    disabled={currentIndex === 0}
                                    className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all hover:scale-110 active:scale-95"
                                    title="Previous (←)">
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="px-4 py-1 bg-white/10 rounded-lg min-w-fit">
                                    <span className="text-white font-heading text-sm">{currentIndex + 1}</span>
                                    <span className="text-white/60 text-sm"> / {documents.length}</span>
                                </div>
                                <button
                                    onClick={handleNext}
                                    disabled={currentIndex === documents.length - 1}
                                    className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-all hover:scale-110 active:scale-95"
                                    title="Next (→)">
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Right Section: Download */}
                    <button
                        onClick={handleDownload}
                        disabled={error}
                        className="flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-marigold to-marigold/80 hover:from-marigold/90 hover:to-marigold/70 disabled:opacity-40 disabled:cursor-not-allowed text-teak font-bold rounded-xl transition-all text-sm uppercase tracking-wide hover:shadow-lg active:scale-95"
                        title="Download Report (D)">
                        <Download size={20} />
                        <span className="hidden sm:inline">Download</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportViewer;
