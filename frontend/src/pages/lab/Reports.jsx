import React, { useState, useEffect } from 'react';
import { FileCheck, Search, Filter, Download, FileText, User, Calendar } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import axios from 'axios';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { API_URL } from '../../config/runtime';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Use ?filter=all to get historical data for this page
      const res = await axios.get(`${API_URL}/api/lab/reports/recent?filter=all&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to fetch reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = (reports || []).filter(r => {
    if (!r) return false;
    const name = (r.patientName || '').toLowerCase();
    const test = (r.requiredTest || '').toLowerCase();
    const rawPhone = (r.patientPhone || '').toLowerCase();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const rawTerm = searchTerm.toLowerCase();
    const cleanTerm = rawTerm.replace(/\D/g, '');

    return name.includes(rawTerm) ||
      test.includes(rawTerm) ||
      rawPhone.includes(rawTerm) ||
      (cleanTerm.length > 0 && cleanPhone.includes(cleanTerm));
  });

  const handleDownloadReport = (report) => {
    try {
      const doc = new jsPDF();
      const primaryColor = '#14B8A6'; // Default teal-600
      
      // Header
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Diagnostic Lab Report', 20, 25);
      
      // Patient Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.text('PATIENT RECORD', 20, 55);
      doc.line(20, 58, 190, 58);
      
      doc.setFontSize(10);
      doc.text(`Patient Name: ${report.patientName}`, 20, 70);
      doc.text(`Report Date: ${new Date(report.updatedAt || report.createdAt).toLocaleDateString()}`, 140, 70);
      doc.text(`Report ID: ${report._id.slice(-8).toUpperCase()}`, 140, 75);
      
      // Results Table
      const tableData = [
        ['Test Description', 'Category', 'Status'],
        [report.requiredTest || 'Diagnostic Test', 'Laboratory', 'Completed']
      ];
      
      autoTable(doc, {
        startY: 90,
        head: [tableData[0]],
        body: [tableData[1]],
        theme: 'striped',
        headStyles: { fillColor: primaryColor }
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('This is an official computer-generated diagnostic report.', 20, 280);
      
      doc.save(`report-${report.patientName.replace(/\s+/g, '-')}-${report._id.slice(-4)}.pdf`);
      Swal.fire('Success', 'Report downloaded successfully', 'success');
    } catch (err) {
      console.error("PDF Generation Error:", err);
      Swal.fire('Error', 'Failed to generate PDF', 'error');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-body text-gray-900 flex-col md:flex-row">
      <Sidebar role="lab" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-6 flex-grow max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Diagnostic Reports (All Time)</h1>
              <p className="text-gray-600 flex items-center gap-2 text-sm">
                <FileCheck size={16} className="text-teal-500" />
                Access and download all completed lab results
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
               <div className="relative flex-grow sm:flex-grow-0">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input
                   type="text"
                   placeholder="Search reports..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-teal-500 text-sm w-full sm:w-64 shadow-sm"
                 />
               </div>
               <button onClick={fetchReports} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors shrink-0">
                 Refresh
               </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="p-12 text-center">
                <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No reports found</h3>
                <p className="text-gray-500">History of completed reports will appear here.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-[14px] font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
                        <th className="px-6 py-4 text-[14px] font-bold text-gray-500 uppercase tracking-wider">Diagnostic Test</th>
                        <th className="px-6 py-4 text-[14px] font-bold text-gray-500 uppercase tracking-wider">Completion Date</th>
                        <th className="px-6 py-4 text-[14px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredReports.map((report) => (
                        <tr key={report._id} className="hover:bg-gray-50/80 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-[14px] font-bold">
                                {report.patientName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{report.patientName}</div>
                                <div className="text-[14px] text-gray-400">ID: {report._id.substring(18)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-700">{report.requiredTest}</div>
                            <div className="text-[14px] text-teal-600 font-bold uppercase tracking-widest">Diagnostic</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar size={14} className="text-gray-400" />
                              {new Date(report.updatedAt || report.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDownloadReport(report)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-[14px] font-bold text-gray-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition-all shadow-sm"
                            >
                              <Download size={14} /> Download PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filteredReports.map((report) => (
                    <div key={report._id} className="p-4 space-y-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                            {report.patientName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{report.patientName}</h4>
                            <span className="text-[14px] text-gray-400 font-mono">ID: {report._id.substring(18)}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[14px] font-bold bg-green-50 text-green-700 border border-green-100">
                          <FileCheck size={10} /> Completed
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[14px] text-gray-600">
                        <div>
                          <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Diagnostic Test</span>
                          <span className="font-semibold text-gray-800">{report.requiredTest}</span>
                          <span className="text-[14px] text-teal-600 font-bold uppercase tracking-widest block mt-0.5">Diagnostic</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Completed Date</span>
                          <span className="font-semibold text-gray-800 flex items-center justify-end gap-1.5 mt-0.5">
                            <Calendar size={12} className="text-gray-400" />
                            {new Date(report.updatedAt || report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-50">
                        <button 
                          onClick={() => handleDownloadReport(report)}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-xl text-[14px] font-bold transition-all shadow-md shadow-teal-600/10 active:scale-[0.98]"
                        >
                          <Download size={14} /> Download PDF Report
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Reports;
