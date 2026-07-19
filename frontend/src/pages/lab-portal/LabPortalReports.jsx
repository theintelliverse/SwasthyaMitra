import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FileCheck,
  Search,
  RefreshCw,
  Download,
  Calendar,
  User,
  Phone,
  Building,
  FileText,
  Eye,
  CheckCircle2,
  Filter,
  ArrowLeft,
  FlaskConical
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import SEO from '../../components/SEO';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import ReportViewer from '../../components/ReportViewer';
import { API_URL } from '../../config/runtime';

const labApi = () => {
  const token = localStorage.getItem('labToken') || localStorage.getItem('token');
  return axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });
};

const LabPortalReports = () => {
  const navigate = useNavigate();
  const labName = localStorage.getItem('labName') || localStorage.getItem('userName') || 'Lab';
  const labCode = localStorage.getItem('labCode') || '';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'today' or 'all'

  // Viewer modal state
  const [selectedReportDocs, setSelectedReportDocs] = useState(null);

  const fetchPastReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await labApi().get('/api/lab-connect/test-requests/lab');
      if (res.data.success) {
        setRequests(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch lab reports:', err);
      // Fallback for clinic user or alternative route
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('labToken');
        const res2 = await axios.get(`${API_URL}/api/lab/reports/recent?limit=200&filter=all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res2.data.success) {
          const mapped = (res2.data.data || []).map(item => ({
            ...item,
            status: 'Completed',
            testName: item.requiredTest
          }));
          setRequests(mapped);
        }
      } catch (err2) {
        console.error('Fallback report fetch error:', err2);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('labToken') || localStorage.getItem('token');
    if (!token) {
      navigate('/lab/login');
      return;
    }
    fetchPastReports();
  }, [fetchPastReports, navigate]);

  // Filter completed reports for this lab
  const completedReports = (requests || []).filter(r => r && r.status === 'Completed');

  const filteredReports = completedReports.filter(r => {
    if (!r) return false;

    // Time filter check
    if (timeFilter === 'today') {
      const today = new Date().toDateString();
      const rawDate = r.completedAt || r.updatedAt || r.createdAt;
      const reportDate = rawDate ? new Date(rawDate).toDateString() : '';
      if (reportDate !== today) return false;
    }

    const name = (r.patientName || '').toLowerCase();
    const phone = (r.patientPhone || '').toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');
    const test = (r.testName || '').toLowerCase();
    const clinicRaw = typeof r.clinicId === 'object' && r.clinicId ? (r.clinicId.name || r.clinicId.clinicCode || '') : (r.clinicId || '');
    const clinic = String(clinicRaw).toLowerCase();
    const term = (searchTerm || '').toLowerCase();
    const cleanTerm = term.replace(/\D/g, '');

    return name.includes(term) ||
      test.includes(term) ||
      clinic.includes(term) ||
      phone.includes(term) ||
      (cleanTerm.length > 0 && cleanPhone.includes(cleanTerm));
  });

  const handleDownloadPDF = (report) => {
    try {
      const doc = new jsPDF();
      const primaryColor = '#1B6CA8';

      // Header
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text((labName || 'LAB DIAGNOSTIC REPORT').toUpperCase(), 20, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Lab ID: ${labCode}`, 140, 25);

      // Patient & Visit Details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PATIENT DIAGNOSTIC RECORD', 20, 55);
      doc.line(20, 58, 190, 58);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Patient Name: ${report.patientName}`, 20, 70);
      doc.text(`Mobile Number: ${report.patientPhone}`, 20, 77);
      doc.text(`Referred Clinic: ${report.clinicId?.name || report.clinicId?.clinicCode || 'Walk-in / Direct'}`, 20, 84);

      const compDate = report.completedAt || report.updatedAt || report.createdAt;
      doc.text(`Completion Date: ${new Date(compDate).toLocaleDateString()}`, 130, 70);
      doc.text(`Report ID: LP-${report._id.slice(-8).toUpperCase()}`, 130, 77);

      // Test Table
      const tableData = [
        ['Diagnostic Test', 'Notes / Observations', 'Status'],
        [report.testName || 'Diagnostic Test', report.notes || 'Fulfilled & Verified', 'Completed']
      ];

      autoTable(doc, {
        startY: 95,
        head: [tableData[0]],
        body: [tableData[1]],
        theme: 'striped',
        headStyles: { fillColor: primaryColor }
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Official computer-generated laboratory report issued by SwasthyaMitra Lab Network.', 20, 280);

      doc.save(`LabReport-${report.patientName.replace(/\s+/g, '_')}-${report._id.slice(-4)}.pdf`);
      Swal.fire({ icon: 'success', title: 'PDF Downloaded', timer: 1500, showConfirmButton: false });
    } catch (err) {
      console.error('PDF Generation Error:', err);
      Swal.fire('Error', 'Failed to generate report PDF', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="lab" />

      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-8">
          <SEO
            title="Past Lab Reports Archive"
            description="Archive of all past diagnostic reports processed by your independent laboratory."
            url="/lab/portal/reports"
            noindex={true}
          />

          {/* ══════════════════════════════════════════════
              HEADER & NAV
          ══════════════════════════════════════════════ */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/lab/portal/dashboard')}
                className="w-11 h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95 shrink-0"
                title="Back to Lab Dashboard"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
                  Past Lab Reports
                </h1>
                <p className="text-slate-500 flex items-center gap-2 font-medium text-sm">
                  <FlaskConical size={16} className="text-blue-600" />
                  Historical record of diagnostic reports completed by {labName}
                </p>
              </div>
            </div>

            {/* Actions & Search */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Time Filter Pills */}
              <div className="flex items-center bg-slate-200/60 p-1 rounded-2xl border border-slate-200/50">
                <button
                  onClick={() => setTimeFilter('today')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    timeFilter === 'today'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeFilter('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                    timeFilter === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Time
                </button>
              </div>

              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Patient, test, or clinic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm w-full md:w-64 shadow-sm transition-all font-medium"
                />
              </div>

              <button
                onClick={fetchPastReports}
                className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                title="Refresh List"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Metric Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <FileCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Completed Reports</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{completedReports.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                <Filter size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtered Count</p>
                <p className="text-2xl font-black text-slate-900 mt-0.5">{filteredReports.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Laboratory</p>
                <p className="text-sm font-black text-slate-800 truncate mt-1">{labName}</p>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════
              REPORTS TABLE
          ══════════════════════════════════════════════ */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 font-bold text-sm">Fetching lab reports archive...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <FileText size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Past Reports Found</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">
                  {searchTerm ? 'No past reports match your search filter.' : 'Completed lab reports will be archived here automatically.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/60 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Test</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Clinic Info</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest">Completed Date</th>
                      <th className="px-6 py-4 text-[14px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredReports.map((r) => {
                      const compDate = r.completedAt || r.updatedAt || r.createdAt;
                      const hasUploadedFiles = r.reports && r.reports.length > 0;

                      return (
                        <tr key={r._id} className="hover:bg-slate-50/40 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[14px] border border-blue-100">
                                {(r.patientName || 'UP').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">{r.patientName || 'Unknown Patient'}</p>
                                <p className="text-[14px] font-bold text-slate-400 tracking-wider mt-0.5">{r.patientPhone || 'No Phone'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div>
                              <p className="text-sm font-black text-slate-700">{r.testName || 'Diagnostic Test'}</p>
                              <p className="text-[14px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
                                {hasUploadedFiles ? `${r.reports.length} File(s) Attached` : 'Completed'}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                              <Building size={14} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {r.clinicId?.name || r.clinicId?.clinicCode || 'Direct Booking'}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                              <Calendar size={14} className="text-slate-400" />
                              {new Date(compDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </td>

                          <td className="px-6 py-5 text-right space-x-2">
                            {hasUploadedFiles && (
                              <button
                                onClick={() => setSelectedReportDocs(r.reports)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all active:scale-95"
                                title="View Attached Files"
                              >
                                <Eye size={13} /> View Files
                              </button>
                            )}

                            <button
                              onClick={() => handleDownloadPDF(r)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 uppercase tracking-wider hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all shadow-sm active:scale-95"
                              title="Download Report PDF"
                            >
                              <Download size={13} /> Download PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Viewer Modal for Uploaded Files */}
      {selectedReportDocs && selectedReportDocs.length > 0 && (
        <ReportViewer
          documents={selectedReportDocs}
          initialIndex={0}
          onClose={() => setSelectedReportDocs(null)}
        />
      )}
    </div>
  );
};

export default LabPortalReports;
