import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Download, FileSpreadsheet, ArrowLeft, Loader2, 
    Users, BriefcaseMedical, Search, Eye, Table as TableIcon, RefreshCcw, ShieldCheck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const AdminReports = () => {
    const navigate = useNavigate();
    
    // States
    const [view, setView] = useState('medical'); // 'medical' or 'staff'
    const [data, setData] = useState({ medicalRecords: [], staffList: [] });
    const [searchTerm, setSearchTerm] = useState("");
    const [dates, setDates] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        fetchPreviewData();
    }, []);

    const fetchPreviewData = async (silent = false) => {
        if (!silent) setLoading(true);
        else setIsSyncing(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/staff/admin/preview-data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Access nested data structure correctly
            setData({ 
                medicalRecords: res.data.medicalRecords || [], 
                staffList: res.data.staffList || [] 
            });
        } catch (err) {
            console.error("Preview fetch failed", err);
        } finally {
            setLoading(false);
            setIsSyncing(false);
        }
    };

    const handleDownload = async () => {
        if (!dates.start || !dates.end) return alert("Please select a valid date range.");
        setIsDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${API_URL}/api/staff/admin/reports/download?startDate=${dates.start}&endDate=${dates.end}`,
                { 
                    headers: { Authorization: `Bearer ${token}` }, 
                    responseType: 'blob' 
                }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Clinic_Report_${dates.start}_to_${dates.end}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { 
            alert("No records found for this period to export."); 
        } finally { 
            setIsDownloading(false); 
        }
    };

    // Filter Logic for Preview
    const filteredData = (view === 'medical' ? data.medicalRecords : data.staffList).filter(item => {
        const query = searchTerm.toLowerCase();
        if (view === 'medical') {
            return item.patientName?.toLowerCase().includes(query) || item.patientPhone?.includes(query);
        }
        return item.name?.toLowerCase().includes(query) || item.role?.toLowerCase().includes(query);
    });

    if (loading) return (
        <div className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-4">
            <RefreshCcw size={40} className="text-marigold animate-spin" />
            <p className="font-heading text-teak text-xl">Loading Clinical Intelligence...</p>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-parchment text-teak font-body">
            <Sidebar role="admin" />
            
            <div className="flex-grow p-6 lg:p-10 overflow-y-auto h-screen custom-scrollbar">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-heading text-teak">Clinic Intelligence</h1>
                            {isSyncing && <div className="w-2 h-2 bg-marigold rounded-full animate-ping"></div>}
                        </div>
                        <p className="text-khaki text-sm font-medium italic">Comprehensive audit logs and performance data export.</p>
                    </div>

                    <div className="flex bg-white border border-sandstone p-1.5 rounded-2xl shadow-sm">
                        <TabBtn active={view === 'medical'} onClick={() => setView('medical')} icon={<BriefcaseMedical size={14} />} label="Medical Logs" />
                        <TabBtn active={view === 'staff'} onClick={() => setView('staff')} icon={<Users size={14} />} label="Staff Roster" />
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Left Panel: Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white border border-sandstone p-8 rounded-[3rem] shadow-sm sticky top-0">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-heading text-xl">Export Portal</h3>
                                <ShieldCheck size={20} className="text-marigold opacity-30" />
                            </div>
                            
                            <div className="space-y-5 mb-10">
                                <DateInput label="Start Date" onChange={(e) => setDates({...dates, start: e.target.value})} />
                                <DateInput label="End Date" onChange={(e) => setDates({...dates, end: e.target.value})} />
                            </div>

                            <button 
                                onClick={handleDownload}
                                disabled={isDownloading}
                                className="w-full bg-teak text-parchment py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-marigold transition-all shadow-xl disabled:opacity-50 active:scale-95"
                            >
                                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
                                {isDownloading ? 'Building CSV...' : 'Download Full CSV'}
                            </button>
                            
                            <div className="mt-8 p-6 bg-parchment border border-dashed border-sandstone rounded-3xl">
                                <p className="text-[10px] font-bold text-khaki leading-relaxed">
                                    Exports include patient demographics, doctor notes, and consultation duration.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Data Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-sandstone rounded-[3.5rem] shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                            {/* Search & Refresh Bar */}
                            <div className="p-8 border-b border-sandstone flex flex-col md:flex-row justify-between items-center gap-4 bg-parchment/30">
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-khaki" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder={`Search ${view}...`}
                                        className="w-full pl-11 pr-4 py-3 bg-white border border-sandstone rounded-2xl outline-none focus:border-marigold text-sm font-bold"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => fetchPreviewData(true)} className="p-3 bg-white border border-sandstone rounded-xl text-khaki hover:text-marigold transition-all">
                                    <RefreshCcw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                </button>
                            </div>
                            
                            <div className="flex-grow overflow-auto p-6 custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-y-3">
                                    <thead className="sticky top-0 bg-white z-10">
                                        <tr className="text-[10px] font-black uppercase tracking-widest text-khaki">
                                            {view === 'medical' ? (
                                                <>
                                                    <th className="px-6 py-4">Patient Case</th>
                                                    <th className="px-6 py-4">Clinical Staff</th>
                                                    <th className="px-6 py-4 text-right">Visit Timestamp</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-6 py-4">Staff Member</th>
                                                    <th className="px-6 py-4">Access Level</th>
                                                    <th className="px-6 py-4 text-right">System Status</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((item) => (
                                            <tr key={item._id} className="group hover:scale-[1.005] transition-all cursor-default">
                                                <td className="px-6 py-5 bg-white rounded-l-3xl border-y border-l border-sandstone group-hover:border-marigold">
                                                    <p className="font-bold text-sm text-teak">{item.patientName || item.name}</p>
                                                    <p className="text-[10px] font-medium text-khaki">{item.patientPhone || item.email}</p>
                                                </td>
                                                <td className="px-6 py-5 bg-white border-y border-sandstone group-hover:border-marigold">
                                                    {view === 'medical' ? (
                                                        <span className="text-xs font-bold text-teak">Dr. {item.doctorId?.name}</span>
                                                    ) : (
                                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${item.role === 'doctor' ? 'bg-marigold/10 border-marigold text-marigold' : 'bg-teak/5 border-teak/20 text-teak'}`}>
                                                            {item.role}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 bg-white rounded-r-3xl border-y border-r border-sandstone group-hover:border-marigold text-right">
                                                    {view === 'medical' ? (
                                                        <span className="text-[10px] font-black text-marigold tracking-widest">{new Date(item.visitDate).toLocaleDateString()}</span>
                                                    ) : (
                                                        <div className={`w-2 h-2 rounded-full inline-block ${item.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-400'}`}></div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredData.length === 0 && (
                                            <tr>
                                                <td colSpan="3" className="text-center py-20 text-khaki italic font-medium opacity-50">
                                                    No matching records found in the vault.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components for cleaner code
const TabBtn = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${active ? 'bg-marigold text-white shadow-md' : 'text-khaki hover:bg-parchment'}`}
    >
        {icon} {label}
    </button>
);

const DateInput = ({ label, onChange }) => (
    <div>
        <label className="text-[10px] font-black uppercase tracking-widest text-khaki ml-2 block mb-2">{label}</label>
        <input 
            type="date" 
            className="w-full bg-parchment border border-sandstone p-4 rounded-2xl outline-none focus:border-marigold text-sm font-bold transition-colors"
            onChange={onChange}
        />
    </div>
);

export default AdminReports;