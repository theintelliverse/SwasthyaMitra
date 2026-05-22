import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    Download, FileSpreadsheet, ArrowLeft, Loader2, 
    Users, BriefcaseMedical, Search, Eye, Table as TableIcon, RefreshCcw, ShieldCheck,
    Clock, LogIn, LogOut, Timer, CalendarSearch, Database
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const AdminReports = () => {
    const navigate = useNavigate();
    
    // States
    const [view, setView] = useState('medical'); // 'medical', 'staff', or 'sessions'
    const [data, setData] = useState({ medicalRecords: [], staffList: [], sessions: [], staffStats: [] });
    const [searchTerm, setSearchTerm] = useState("");
    const [dates, setDates] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Fetch Today's stats by default for the summary widget
        const todayStr = new Date().toISOString().split('T')[0];
        fetchInitialStats(todayStr);
    }, []);

    const fetchInitialStats = async (date) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/staff/admin/preview-data?startDate=${date}&endDate=${date}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData({ 
                medicalRecords: res.data.medicalRecords || [], 
                staffList: res.data.staffList || [],
                sessions: res.data.sessions || [],
                staffStats: res.data.staffStats || []
            });
        } catch (err) { console.error("Initial stats failed", err); }
    };

    const fetchPreviewData = async (silent = false) => {
        if (!dates.start || !dates.end) return alert("Please select both Start and End dates.");
        
        if (!silent) setLoading(true);
        else setIsSyncing(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/staff/admin/preview-data?startDate=${dates.start}&endDate=${dates.end}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setData({ 
                medicalRecords: res.data.medicalRecords || [], 
                staffList: res.data.staffList || [],
                sessions: res.data.sessions || [],
                staffStats: res.data.staffStats || []
            });
            setHasSearched(true);
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

    // Filter Logic
    const filteredData = useMemo(() => {
        const query = searchTerm.toLowerCase();
        if (view === 'medical') {
            return data.medicalRecords.filter(item => 
                item.patientName?.toLowerCase().includes(query) || 
                item.patientPhone?.includes(query)
            );
        } else if (view === 'staff') {
            return data.staffList.filter(item => 
                item.name?.toLowerCase().includes(query) || 
                item.role?.toLowerCase().includes(query)
            );
        } else {
            return data.sessions.filter(item => 
                item.staffId?.name?.toLowerCase().includes(query) ||
                item.staffId?.role?.toLowerCase().includes(query)
            );
        }
    }, [view, data, searchTerm]);

    const getAvgWorkTime = (staffId) => {
        const stats = data.staffStats.find(s => s._id === staffId);
        if (!stats) return "N/A";
        const mins = Math.round(stats.avgMinutes);
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-body">
            <Sidebar role="admin" />
            
            <div className="flex-grow p-6 lg:p-10 overflow-y-auto h-screen custom-scrollbar max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-teal-100">
                                Analytics Hub
                            </span>
                            {isSyncing && <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></div>}
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinic Intelligence</h1>
                        <p className="text-slate-400 font-bold text-sm mt-1">Audit logs, personnel performance, and operational data.</p>
                    </div>

                    <div className="flex bg-white border border-slate-100 p-1.5 rounded-2xl shadow-sm">
                        <TabBtn active={view === 'medical'} onClick={() => setView('medical')} icon={<BriefcaseMedical size={14} />} label="Medical" />
                        <TabBtn active={view === 'staff'} onClick={() => setView('staff')} icon={<Users size={14} />} label="Staff" />
                        <TabBtn active={view === 'sessions'} onClick={() => setView('sessions')} icon={<Clock size={14} />} label="Sessions" />
                    </div>
                </header>

                <div className="grid lg:grid-cols-3 gap-10">
                    {/* Left Panel: Controls */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-lg text-slate-900">Intelligence Portal</h3>
                                <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400"><FileSpreadsheet size={16} /></div>
                            </div>
                            
                            <div className="space-y-4 mb-5">
                                <DateInput label="Start Date" onChange={(e) => setDates({...dates, start: e.target.value})} />
                                <DateInput label="End Date" onChange={(e) => setDates({...dates, end: e.target.value})} />
                            </div>

                            <div className="space-y-2.5">
                                <button 
                                    onClick={() => fetchPreviewData()}
                                    disabled={loading || !dates.start || !dates.end}
                                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 hover:bg-slate-800 transition-all disabled:opacity-30 active:scale-95"
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <CalendarSearch size={14} />}
                                    {loading ? 'Accessing...' : 'Review Intelligence'}
                                </button>

                                <button 
                                    onClick={handleDownload}
                                    disabled={isDownloading || !hasSearched}
                                    className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/10 disabled:opacity-30 active:scale-95"
                                >
                                    {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    {isDownloading ? 'Generating...' : 'Export CSV Report'}
                                </button>
                            </div>
                            
                            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 leading-normal uppercase tracking-wider">
                                    Define a date range to unlock medical logs, staff productivity metrics, and duty cycles.
                                </p>
                            </div>
                        </div>

                        {/* Summary Widget */}
                        <div className="bg-slate-900 p-5 rounded-3xl text-white overflow-hidden relative group">
                            <div className="relative z-10">
                                <h4 className="text-base font-black mb-0.5">Operational Health</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Total Logs Processed</p>
                                <div className="text-3xl font-black text-teal-500 mb-1.5">
                                    {data.medicalRecords.length + data.sessions.length}+
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    {hasSearched ? `Range: ${dates.start} to ${dates.end}` : "Today's Clinical Activity"}
                                </p>
                            </div>
                            <ShieldCheck size={80} className="absolute -bottom-6 -right-6 text-white/5 group-hover:rotate-12 transition-transform duration-500" />
                        </div>
                    </div>

                    {/* Right Panel: Data Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm overflow-hidden flex flex-col min-h-[700px]">
                            {/* Search & Refresh Bar */}
                            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                                <div className="relative w-full md:w-80">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder={`Filter ${view} records...`}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl outline-none focus:border-teal-500 text-sm font-bold shadow-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={!hasSearched}
                                    />
                                </div>
                                <button 
                                    onClick={() => fetchPreviewData(true)} 
                                    disabled={!hasSearched}
                                    className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm active:scale-95 disabled:opacity-30"
                                >
                                    <RefreshCcw size={18} className={isSyncing ? 'animate-spin text-teal-500' : ''} />
                                </button>
                            </div>
                            
                            <div className="flex-grow overflow-auto p-8 custom-scrollbar relative">
                                {!hasSearched ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                            <Database size={40} className="text-slate-200" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Clinical Vault Locked</h3>
                                        <p className="text-slate-400 font-bold text-sm max-w-xs mx-auto">
                                            Please select a <b>Start Date</b> and <b>End Date</b> in the Intelligence Portal to retrieve clinical records.
                                        </p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-separate border-spacing-y-4">
                                        <thead className="sticky top-0 bg-white z-10">
                                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {view === 'medical' ? (
                                                    <>
                                                        <th className="px-6 py-4">Patient Case</th>
                                                        <th className="px-6 py-4">Clinician</th>
                                                        <th className="px-6 py-4 text-right">Timestamp</th>
                                                    </>
                                                ) : view === 'staff' ? (
                                                    <>
                                                        <th className="px-6 py-4">Team Member</th>
                                                        <th className="px-6 py-4">Avg. Duty</th>
                                                        <th className="px-6 py-4 text-right">Status</th>
                                                    </>
                                                ) : (
                                                    <>
                                                        <th className="px-6 py-4">Professional</th>
                                                        <th className="px-6 py-4 text-center">Login / Logout</th>
                                                        <th className="px-6 py-4 text-right">Duration</th>
                                                    </>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.map((item) => (
                                                <tr key={item._id} className="group hover:scale-[1.005] transition-all duration-300">
                                                    <td className="px-6 py-6 bg-slate-50/50 rounded-l-[2rem] border-y border-l border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100 uppercase group-hover:text-teal-600 transition-colors">
                                                                {(item.patientName || item.name || item.staffId?.name || '??').substring(0, 2)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-sm text-slate-900">
                                                                    {item.patientName || item.name || item.staffId?.name}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                    {item.patientPhone || item.role || item.staffId?.role}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-6 bg-slate-50/50 border-y border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30">
                                                        {view === 'medical' ? (
                                                            <span className="text-xs font-black text-teal-600">Dr. {item.doctorId?.name}</span>
                                                        ) : view === 'staff' ? (
                                                            <div className="flex items-center gap-2">
                                                                <Timer size={14} className="text-slate-300" />
                                                                <span className="text-xs font-black text-slate-700">{getAvgWorkTime(item._id)}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1 items-center">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-100">
                                                                    <LogIn size={10} className="text-green-500" />
                                                                    {new Date(item.loginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                </div>
                                                                {item.logoutTime && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                                        <LogOut size={10} className="text-rose-400" />
                                                                        {new Date(item.logoutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-6 bg-slate-50/50 rounded-r-[2rem] border-y border-r border-transparent group-hover:border-teal-100 group-hover:bg-teal-50/30 text-right">
                                                        {view === 'medical' ? (
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.visitDate).toLocaleDateString()}</span>
                                                        ) : view === 'staff' ? (
                                                            <div className={`w-2.5 h-2.5 rounded-full inline-block ${item.isActive !== false ? 'bg-green-500 shadow-lg shadow-green-500/20 animate-pulse' : 'bg-slate-200'}`}></div>
                                                        ) : (
                                                            <span className="text-xs font-black text-teal-600">
                                                                {item.sessionDurationMinutes ? `${item.sessionDurationMinutes}m` : '--'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredData.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="text-center py-32">
                                                        <div className="flex flex-col items-center opacity-20">
                                                            <ShieldCheck size={48} className="mb-4" />
                                                            <p className="text-xs font-black uppercase tracking-widest">Vault Empty</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// UI Components
const TabBtn = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2.5 ${active ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20 scale-105' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
    >
        {icon} {label}
    </button>
);

const DateInput = ({ label, onChange }) => (
    <div className="group">
        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2.5 block mb-1.5 group-focus-within:text-teal-600 transition-colors">{label}</label>
        <input 
            type="date" 
            className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl outline-none focus:border-teal-500 focus:bg-white text-xs font-bold transition-all shadow-sm"
            onChange={onChange}
        />
    </div>
);

export default AdminReports;