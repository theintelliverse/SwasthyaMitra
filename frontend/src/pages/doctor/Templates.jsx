import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2,
  Edit3,
  Layout,
  RefreshCw,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import Swal from 'sweetalert2';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Load from localStorage for now, since there's no backend endpoint yet
    const savedTemplates = localStorage.getItem('doctor_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    } else {
      // Default templates if none exist
      const defaults = [
        { id: 1, name: 'Viral Fever Protocol', drugs: 'Paracetamol 500mg, Vitamin C, Zinc', instruction: 'Post meals', category: 'General' },
        { id: 2, name: 'Acute Hypertension', drugs: 'Amlodipine 5mg, Telmisartan 40mg', instruction: 'Once daily (Morning)', category: 'Cardio' },
        { id: 3, name: 'General Cough/Cold', drugs: 'Levocetirizine 5mg, Montelukast, Cough Syrup', instruction: 'Before bed', category: 'General' },
        { id: 4, name: 'Type 2 Diabetes Control', drugs: 'Metformin 500mg, Glimepiride 1mg', instruction: 'Twice daily', category: 'Endocrine' }
      ];
      setTemplates(defaults);
      localStorage.setItem('doctor_templates', JSON.stringify(defaults));
    }
    setLoading(false);
  }, []);

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete Template?',
      text: "This action cannot be undone.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete'
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = templates.filter(t => t.id !== id);
        setTemplates(updated);
        localStorage.setItem('doctor_templates', JSON.stringify(updated));
        Swal.fire('Deleted!', 'Template removed successfully.', 'success');
      }
    });
  };

  const handleCreate = () => {
    Swal.fire({
      title: 'Create New Clinical Template',
      html: `
        <div class="space-y-4">
          <input id="t-name" class="swal2-input w-full" placeholder="Protocol Name (e.g. Migraine)">
          <input id="t-category" class="swal2-input w-full" placeholder="Category (e.g. Neurology)">
          <textarea id="t-drugs" class="swal2-textarea w-full" placeholder="Medicines (separate with commas)"></textarea>
          <input id="t-instr" class="swal2-input w-full" placeholder="General Instructions">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Save Template',
      confirmButtonColor: '#0d9488',
      preConfirm: () => {
        const name = document.getElementById('t-name').value;
        const drugs = document.getElementById('t-drugs').value;
        const instr = document.getElementById('t-instr').value;
        const category = document.getElementById('t-category').value || 'General';
        if (!name || !drugs) return Swal.showValidationMessage('Name and Drugs are required');
        return { name, drugs, instruction: instr, category };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const newT = { id: Date.now(), ...result.value };
        const updated = [...templates, newT];
        setTemplates(updated);
        localStorage.setItem('doctor_templates', JSON.stringify(updated));
        Swal.fire('Saved!', 'New template added to library.', 'success');
      }
    });
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.drugs.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-body text-slate-900 flex-col md:flex-row">
      <Sidebar role="doctor" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-8 flex-grow max-w-7xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Clinical Templates</h1>
              <p className="text-slate-500 flex items-center gap-2 font-medium text-xs">
                <ClipboardList size={14} className="text-indigo-500" />
                Manage and standardize your clinical protocols and medication sets
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Protocol name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-xs w-full md:w-56 shadow-sm transition-all"
                />
              </div>
              <button 
                onClick={handleCreate}
                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Categories Grid (Optional Visual) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
             {['General', 'Cardio', 'Neuro', 'Endocrine', 'Pediatric', 'ENT'].map(cat => (
               <button 
                 key={cat}
                 onClick={() => setSearchTerm(cat)}
                 className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                   searchTerm === cat 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-600'
                 }`}
               >
                 {cat}
               </button>
             ))}
          </div>

          {/* Templates List */}
          <div className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="h-48 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse"></div>
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-20 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <Layout size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Templates Found</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">Create pre-defined medication sets for common conditions to speed up your workflow.</p>
                <button 
                  onClick={handleCreate}
                  className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                  Add Your First Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredTemplates.map((t) => (
                    <div key={t.id} className="bg-white border border-slate-100 p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                       {/* Background Accent */}
                       <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50/50 rounded-bl-[3rem] -mr-6 -mt-6 group-hover:scale-110 transition-transform"></div>
                       
                       <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                             <FileText size={20} />
                          </div>
                          <div className="flex gap-2">
                             <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                <Edit3 size={14} />
                             </button>
                             <button 
                                onClick={() => handleDelete(t.id)}
                                className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-red-600 hover:bg-red-50 transition-all"
                             >
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                       
                       <div className="mb-4 relative z-10">
                          <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-full mb-2 inline-block">
                             {t.category}
                          </span>
                          <h4 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{t.name}</h4>
                          <p className="text-xs font-bold text-slate-500 leading-relaxed line-clamp-2">{t.drugs}</p>
                       </div>
 
                       <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest py-3 border-t border-slate-50 mt-1">
                          <div className="flex items-center gap-1.5 text-slate-400">
                             <RefreshCw size={12} className="text-indigo-500" />
                             {t.instruction}
                          </div>
                          <button 
                            onClick={() => navigate('/doctor/dashboard')}
                            className="flex items-center gap-1 text-indigo-600 hover:translate-x-1 transition-transform"
                          >
                             Use Protocol <ChevronRight size={12} />
                          </button>
                       </div>
                    </div>
                 ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Templates;
