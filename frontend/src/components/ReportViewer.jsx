import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { 
    X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, 
    AlertCircle, Trash2, Maximize2, Minimize2, RotateCcw, 
    FileText, ExternalLink, RefreshCw, Eye, Move
} from 'lucide-react';
import { API_URL } from '../config/runtime';

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
    const [zoom, setZoom] = useState(100); // 50% to 350%
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [touchDistance, setTouchDistance] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [imageUrl, setImageUrl] = useState(null);
    const [pdfViewMode, setPdfViewMode] = useState('preview'); // 'preview' (A4 image) | 'embed' (Native PDF)

    const viewerContainerRef = useRef(null);
    const TIMEOUT_DURATION = 60000;

    // Safely get current document
    const currentDoc = documents?.[currentIndex];
    const isPdfDocument =
        (currentDoc?.fileType || '').toLowerCase().includes('pdf') ||
        (currentDoc?.fileUrl || '').toLowerCase().includes('.pdf');

    // High-resolution 300 DPI A4 page rendering via Cloudinary
    const getCloudinaryPreviewImage = (url, page = 1) => {
        if (!url) return '';
        if (url.includes('cloudinary.com')) {
            // High-res 300 DPI, 2000px width, crisp PNG render of specific page
            const params = `f_png,q_auto:best,dn_300,w_2000,pg_${page}`;
            return url.replace(/\.pdf(\?.*)?$/i, '.png$1').replace('/upload/', `/upload/${params}/`);
        }
        return url;
    };

    const getDirectPdfUrl = (url) => {
        if (!url) return '';
        if (url.includes('cloudinary.com') && !url.includes('fl_inline')) {
            return url.replace('/upload/', '/upload/fl_inline/');
        }
        return url;
    };

    const getDownloadUrl = (url, title) => {
        if (!url) return '';
        if (url.includes('cloudinary.com')) {
            const cleanTitle = encodeURIComponent((title || 'report').replace(/[^a-zA-Z0-9_-]/g, '_'));
            return url.replace('/upload/', `/upload/fl_attachment:${cleanTitle}/`);
        }
        return url;
    };

    // Reset zoom and pan whenever document changes
    const resetZoomAndPan = useCallback(() => {
        setZoom(100);
        setPan({ x: 0, y: 0 });
        setIsDragging(false);
    }, []);

    // Navigation between documents in locker
    const handlePrevious = useCallback(() => {
        setCurrentIndex((prev) => {
            if (prev > 0) {
                resetZoomAndPan();
                return prev - 1;
            }
            return prev;
        });
    }, [resetZoomAndPan]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => {
            if (prev < (documents?.length || 1) - 1) {
                resetZoomAndPan();
                return prev + 1;
            }
            return prev;
        });
    }, [documents?.length, resetZoomAndPan]);

    // Zoom Controls
    const handleZoom = useCallback((action) => {
        if (action === 'in') {
            setZoom((prev) => Math.min(350, prev + 25));
        } else if (action === 'out') {
            setZoom((prev) => {
                const next = Math.max(50, prev - 25);
                if (next <= 100) setPan({ x: 0, y: 0 });
                return next;
            });
        } else if (action === 'reset') {
            resetZoomAndPan();
        } else if (action === 'fit-width') {
            setZoom(150);
            setPan({ x: 0, y: 0 });
        }
    }, [resetZoomAndPan]);

    // Effect to update image URL when document changes
    useEffect(() => {
        if (!currentDoc) return;
        let active = true;

        Promise.resolve().then(() => {
            if (active) {
                setImageUrl(currentDoc.fileUrl);
                setLoading(true);
                setError(false);
                setPageNumber(1);
                resetZoomAndPan();
            }
        });

        const loadingTimeout = setTimeout(() => {
            setLoading(false);
            setError(true);
            Swal.fire({
                icon: 'warning',
                title: 'Loading Timeout',
                text: 'The document is taking longer than expected to load.',
                confirmButtonColor: '#0D9488'
            });
        }, TIMEOUT_DURATION);

        return () => {
            clearTimeout(loadingTimeout);
        };
    }, [currentIndex, currentDoc, resetZoomAndPan]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === '+' || e.key === '=') handleZoom('in');
            if (e.key === '-' || e.key === '_') handleZoom('out');
            if (e.key === '0') resetZoomAndPan();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrevious, handleZoom, onClose, resetZoomAndPan]);

    // Smart Double Click: Toggle between 100% and 175%
    const handleDoubleClick = () => {
        if (zoom > 110) {
            resetZoomAndPan();
        } else {
            setZoom(175);
            setPan({ x: 0, y: 0 });
        }
    };

    // Mouse Wheel Zoom
    const handleWheel = (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 20 : -20;
            setZoom((prev) => {
                const next = Math.min(350, Math.max(50, prev + delta));
                if (next <= 100) setPan({ x: 0, y: 0 });
                return next;
            });
        }
    };

    // Mouse Drag Panning
    const handleMouseDown = (e) => {
        if (zoom > 100 && e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 100) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch Gestures: Pinch to Zoom & One-finger Pan
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setTouchDistance(dist);
        } else if (e.touches.length === 1 && zoom > 100) {
            setIsDragging(true);
            setDragStart({
                x: e.touches[0].clientX - pan.x,
                y: e.touches[0].clientY - pan.y
            });
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && touchDistance) {
            const currentDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const delta = (currentDist - touchDistance) * 0.8;
            setZoom((prev) => {
                const next = Math.min(350, Math.max(50, Math.round(prev + delta)));
                if (next <= 100) setPan({ x: 0, y: 0 });
                return next;
            });
            setTouchDistance(currentDist);
        } else if (e.touches.length === 1 && isDragging && zoom > 100) {
            setPan({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };

    const handleTouchEnd = () => {
        setTouchDistance(null);
        setIsDragging(false);
    };

    // Fullscreen Toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            viewerContainerRef.current?.requestFullscreen?.().catch((err) => {
                console.warn('Could not enter fullscreen:', err);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen?.().catch((err) => {
                console.warn('Could not exit fullscreen:', err);
            });
            setIsFullscreen(false);
        }
    };

    const handleDownload = () => {
        if (currentDoc?.fileUrl) {
            const isPdf =
                (currentDoc.fileType || '').toLowerCase().includes('pdf') ||
                currentDoc.fileUrl.toLowerCase().includes('.pdf');
            const targetUrl = isPdf ? getDownloadUrl(currentDoc.fileUrl, currentDoc.title) : currentDoc.fileUrl;
            const a = document.createElement('a');
            a.href = targetUrl;
            a.download = `${currentDoc.title || 'medical_report'}.${isPdf ? 'pdf' : 'jpg'}`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    // Remove broken report from database
    const handleRemoveBrokenReport = async () => {
        const confirmResult = await Swal.fire({
            title: 'Remove Report?',
            html: `<p>This report could not be loaded and will be removed from your locker.</p><p style="font-size: 13px; color: #64748b; margin-top: 10px;"><strong>${currentDoc.title}</strong></p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#E11D48',
            cancelButtonColor: '#64748B',
            confirmButtonText: 'Yes, Remove It',
            cancelButtonText: 'Cancel'
        });

        if (!confirmResult.isConfirmed) return;

        setIsRemoving(true);
        try {
            const token = localStorage.getItem('token');
            let patientPhone = localStorage.getItem('userPhone');
            const documentId = currentDoc._id;

            if (!token) throw new Error('Authentication token not found. Please log in again.');
            if (!patientPhone) patientPhone = extractPhoneFromToken(token);
            if (!documentId) throw new Error('Document ID is missing.');

            const cleanedPhone = patientPhone.replace(/\D/g, '').slice(-10);

            const res = await axios.delete(`${API_URL}/api/auth/patient/remove-document/${documentId}`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                data: { phone: cleanedPhone }
            });

            if (res.data.success) {
                Swal.fire({
                    title: 'Report Removed',
                    text: 'The document has been removed from your locker.',
                    icon: 'success',
                    confirmButtonColor: '#0D9488'
                });

                if (onReportRemoved) onReportRemoved(documentId);
                if (documents.length <= 1) {
                    onClose();
                } else {
                    if (currentIndex >= documents.length - 1) {
                        handlePrevious();
                    } else {
                        handleNext();
                    }
                }
            }
        } catch (err) {
            console.error('Error removing report:', err);
            Swal.fire({
                title: 'Failed to Remove',
                text: err.response?.data?.message || err.message || 'Server error removing report.',
                icon: 'error',
                confirmButtonColor: '#0D9488'
            });
        } finally {
            setIsRemoving(false);
        }
    };

    const handleImageError = () => {
        setLoading(false);
        setError(true);
    };

    const handleImageLoad = () => {
        setLoading(false);
        setError(false);
    };

    return (
        <div 
            ref={viewerContainerRef}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[999] flex flex-col overflow-hidden animate-in fade-in duration-200 select-none font-body"
        >
            {/* --- Top Header Bar --- */}
            <header className="flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 text-white z-30 shrink-0 gap-2">
                {/* Left: Document Info */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-teal-600/20 text-teal-400 rounded-xl flex items-center justify-center border border-teal-500/30 shrink-0">
                        <FileText size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-md">
                                {currentDoc?.title || 'Diagnostic Report'}
                            </h2>
                            {documents?.length > 1 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300 border border-white/10 shrink-0">
                                    {currentIndex + 1} / {documents.length}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                            {currentDoc?.fileType || 'Medical Report'} • {currentDoc?.uploadedAt ? new Date(currentDoc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Verified Document'}
                        </p>
                    </div>
                </div>

                {/* Center: Mode Switcher & Page Controls */}
                <div className="hidden md:flex items-center gap-2">
                    {isPdfDocument && (
                        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
                            <button
                                type="button"
                                onClick={() => { setPdfViewMode('preview'); resetZoomAndPan(); }}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    pdfViewMode === 'preview'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Eye size={13} /> A4 Page View
                            </button>
                            <button
                                type="button"
                                onClick={() => { setPdfViewMode('embed'); resetZoomAndPan(); }}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    pdfViewMode === 'embed'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <FileText size={13} /> Native PDF Frame
                            </button>
                        </div>
                    )}

                    {/* PDF Multi-page flip (Page 1, 2, 3...) */}
                    {isPdfDocument && pdfViewMode === 'preview' && (
                        <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700/80 text-xs">
                            <button
                                type="button"
                                onClick={() => { setPageNumber((p) => Math.max(1, p - 1)); setLoading(true); }}
                                disabled={pageNumber <= 1}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                                title="Previous Page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-slate-200 font-semibold px-1">Page {pageNumber}</span>
                            <button
                                type="button"
                                onClick={() => { setPageNumber((p) => p + 1); setLoading(true); }}
                                className="p-1 text-slate-400 hover:text-white transition-colors"
                                title="Next Page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Open direct PDF in new tab */}
                    {isPdfDocument && (
                        <a
                            href={getDirectPdfUrl(imageUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700/80"
                            title="Open PDF in New Browser Tab"
                        >
                            <ExternalLink size={15} />
                            <span className="hidden lg:inline">Open in Tab</span>
                        </a>
                    )}

                    {/* Download */}
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="p-2 sm:px-3 sm:py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition-all active:scale-95"
                        title="Download Document"
                    >
                        <Download size={15} />
                        <span className="hidden sm:inline">Download</span>
                    </button>

                    {/* Fullscreen */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all hidden sm:flex"
                        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>

                    {/* Close */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 rounded-xl transition-all ml-1"
                        title="Close Viewer (Esc)"
                    >
                        <X size={20} />
                    </button>
                </div>
            </header>

            {/* --- Mobile View Mode Bar --- */}
            {isPdfDocument && (
                <div className="flex md:hidden items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                        <button
                            type="button"
                            onClick={() => { setPdfViewMode('preview'); resetZoomAndPan(); }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                pdfViewMode === 'preview' ? 'bg-teal-600 text-white' : 'text-slate-400'
                            }`}
                        >
                            A4 Page
                        </button>
                        <button
                            type="button"
                            onClick={() => { setPdfViewMode('embed'); resetZoomAndPan(); }}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                pdfViewMode === 'embed' ? 'bg-teal-600 text-white' : 'text-slate-400'
                            }`}
                        >
                            PDF Frame
                        </button>
                    </div>

                    {pdfViewMode === 'preview' && (
                        <div className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 text-xs text-white">
                            <button
                                type="button"
                                onClick={() => { setPageNumber((p) => Math.max(1, p - 1)); setLoading(true); }}
                                disabled={pageNumber <= 1}
                                className="p-0.5 disabled:opacity-30"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span className="text-[11px] font-semibold">Page {pageNumber}</span>
                            <button
                                type="button"
                                onClick={() => { setPageNumber((p) => p + 1); setLoading(true); }}
                                className="p-0.5"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- Central Canvas: A4 Sheet Document Stage --- */}
            <main 
                className="flex-1 overflow-hidden relative flex items-center justify-center bg-gradient-to-b from-slate-950 via-[#0a0f1d] to-slate-950 p-2 sm:p-6"
                onWheel={handleWheel}
            >
                {/* Loading state */}
                {loading && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 z-20 backdrop-blur-sm animate-in fade-in">
                        <div className="w-12 h-12 rounded-full border-3 border-teal-500/20 border-t-teal-500 animate-spin mb-3"></div>
                        <p className="text-white font-semibold text-sm tracking-tight">Rendering High-Resolution Page...</p>
                        <p className="text-slate-400 text-xs mt-1">Preparing 300 DPI A4 document layout</p>
                    </div>
                )}

                {/* Error state */}
                {error && (
                    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl z-20">
                        <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/20">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Document Load Issue</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                            Could not load the high-resolution image preview. You can open the original PDF file directly or remove this entry.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2.5 w-full">
                            {isPdfDocument && (
                                <a
                                    href={getDirectPdfUrl(imageUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                                >
                                    <ExternalLink size={14} /> Open Original PDF
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={handleRemoveBrokenReport}
                                disabled={isRemoving}
                                className="flex-1 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
                            >
                                <Trash2 size={14} /> Remove
                            </button>
                        </div>
                    </div>
                )}

                {/* Main A4 Document Sheet / PDF Embed */}
                {!error && imageUrl && (
                    isPdfDocument && pdfViewMode === 'embed' ? (
                        /* Native PDF iframe embed */
                        <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-white">
                            <iframe
                                src={getDirectPdfUrl(imageUrl)}
                                title={currentDoc?.title || 'PDF Report'}
                                className="w-full h-full min-h-[500px] border-0"
                                onLoad={handleImageLoad}
                            />
                        </div>
                    ) : (
                        /* A4 High-Res Document Sheet with Pinch-to-Zoom and Drag */
                        <div
                            className="relative flex items-center justify-center w-full h-full overflow-hidden"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onDoubleClick={handleDoubleClick}
                        >
                            <div
                                className={`relative bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] rounded-md md:rounded-lg overflow-hidden border border-slate-200/60 select-none transition-transform duration-75 ease-out ${
                                    zoom > 100 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
                                }`}
                                style={{
                                    width: '100%',
                                    maxWidth: '820px',
                                    aspectRatio: '1 / 1.414',
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                                    transformOrigin: 'center center',
                                    touchAction: 'none'
                                }}
                            >
                                <img
                                    key={`${currentDoc?._id}-pg-${pageNumber}`}
                                    src={isPdfDocument ? getCloudinaryPreviewImage(imageUrl, pageNumber) : imageUrl}
                                    alt={currentDoc?.title || 'Diagnostic Report'}
                                    className="w-full h-full object-contain pointer-events-none select-none bg-white"
                                    draggable={false}
                                    onLoad={handleImageLoad}
                                    onError={isPdfDocument ? () => setPdfViewMode('embed') : handleImageError}
                                />
                            </div>
                        </div>
                    )
                )}
            </main>

            {/* --- Floating Bottom Toolbar for Zoom & Navigation --- */}
            <footer className="relative z-30 px-3 py-3 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between gap-3 text-white backdrop-blur-md">
                {/* Previous / Next Document Controls */}
                <div className="flex items-center gap-1.5">
                    {documents?.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all active:scale-95"
                                title="Previous Report (←)"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-xs font-semibold text-slate-300 px-2 hidden sm:inline">
                                Doc {currentIndex + 1} of {documents.length}
                            </span>
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={currentIndex === (documents?.length || 1) - 1}
                                className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all active:scale-95"
                                title="Next Report (→)"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </>
                    )}
                </div>

                {/* Central Zoom Controls (Pinch & Button Driven) */}
                <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 shadow-lg mx-auto">
                    {/* Zoom Out */}
                    <button
                        type="button"
                        onClick={() => handleZoom('out')}
                        disabled={zoom <= 50}
                        className="p-2 hover:bg-slate-700 disabled:opacity-30 text-white rounded-xl transition-all active:scale-90"
                        title="Zoom Out (-)"
                    >
                        <ZoomOut size={16} />
                    </button>

                    {/* Reset Zoom percentage indicator */}
                    <button
                        type="button"
                        onClick={() => handleZoom('reset')}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700/70 rounded-lg transition-colors min-w-[55px] text-center"
                        title="Click to Reset Zoom (100%)"
                    >
                        {zoom}%
                    </button>

                    {/* Zoom In */}
                    <button
                        type="button"
                        onClick={() => handleZoom('in')}
                        disabled={zoom >= 350}
                        className="p-2 hover:bg-slate-700 disabled:opacity-30 text-white rounded-xl transition-all active:scale-90"
                        title="Zoom In (+)"
                    >
                        <ZoomIn size={16} />
                    </button>

                    <div className="w-[1px] h-4 bg-slate-700 mx-1 hidden sm:block"></div>

                    {/* Fit to Width preset */}
                    <button
                        type="button"
                        onClick={() => handleZoom('fit-width')}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/70 rounded-lg transition-colors hidden sm:block"
                        title="Fit Document Width"
                    >
                        Fit Width
                    </button>

                    {/* Reset button */}
                    <button
                        type="button"
                        onClick={() => handleZoom('reset')}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/70 rounded-xl transition-colors"
                        title="Reset (100% & Center)"
                    >
                        <RotateCcw size={15} />
                    </button>
                </div>

                {/* Gesture hint */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
                    <Move size={13} className="text-teal-400" />
                    <span>Pinch or double-click to zoom • Drag to pan</span>
                </div>
            </footer>
        </div>
    );
};

export default ReportViewer;
