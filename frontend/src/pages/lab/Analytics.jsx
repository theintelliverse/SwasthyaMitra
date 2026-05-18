import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, Users, Clock, Calendar } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Analytics Metric Card Component
const AnalyticsMetricCard = ({ title, value, icon, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  const shortTitle = title
    .replace('Avg Processing Time', 'Avg Time')
    .replace('Success Rate', 'Success')
    .replace('Total Patients', 'Patients')
    .replace('Pending Reviews', 'Pending');

  return (
    <div className="bg-white p-2 md:p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center md:items-start text-center md:text-left h-24 justify-center min-w-[70px]">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full mb-1 md:mb-1.5 gap-1 md:gap-0">
        <h3 className="hidden md:block text-[10px] font-black text-gray-400 uppercase tracking-widest flex-1 text-left leading-tight pr-2">{title}</h3>
        <div className={`p-1.5 rounded-lg shrink-0 ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <h3 className="md:hidden text-[8px] font-black text-gray-400 uppercase tracking-widest w-full mb-0.5 leading-tight">{shortTitle}</h3>
      <p className="text-sm md:text-2xl font-black text-gray-900 mb-0">{value}</p>
    </div>
  );
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    avgProcessingTime: 'N/A',
    successRate: '0%',
    totalPatients: 0,
    pendingReviews: 0,
    monthlyStats: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/lab/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch lab analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 font-body text-gray-900 flex-col md:flex-row">
      <Sidebar role="lab" />
      <div className="flex-grow flex flex-col min-h-screen">
        <main className="px-4 md:px-8 py-6 flex-grow max-w-7xl mx-auto w-full space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Lab Analytics</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <BarChart3 size={16} className="text-teal-500" />
              Comprehensive performance and workload insights
            </p>
          </div>

          <div className="flex md:grid overflow-x-auto hide-scrollbar gap-2 md:gap-4 mb-6 pb-2 md:pb-0 snap-x snap-mandatory md:grid-cols-4">
            <div className="snap-start shrink-0 min-w-[21%] md:w-auto">
              <AnalyticsMetricCard title="Avg Processing Time" value={loading ? '...' : data.avgProcessingTime} icon={<Clock size={16} className="md:w-5 md:h-5" />} color="blue" />
            </div>
            <div className="snap-start shrink-0 min-w-[21%] md:w-auto">
              <AnalyticsMetricCard title="Success Rate" value={loading ? '...' : data.successRate} icon={<TrendingUp size={16} className="md:w-5 md:h-5" />} color="green" />
            </div>
            <div className="snap-start shrink-0 min-w-[21%] md:w-auto">
              <AnalyticsMetricCard title="Total Patients" value={loading ? '...' : data.totalPatients} icon={<Users size={16} className="md:w-5 md:h-5" />} color="purple" />
            </div>
            <div className="snap-start shrink-0 min-w-[21%] md:w-auto pr-4 md:pr-0">
              <AnalyticsMetricCard title="Pending Reviews" value={loading ? '...' : data.pendingReviews} icon={<Activity size={16} className="md:w-5 md:h-5" />} color="amber" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity size={18} className="text-teal-500" />
                Workload Volume (Last 6 Months)
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyStats}>
                    <defs>
                      <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Area type="monotone" dataKey="tests" stroke="#14B8A6" strokeWidth={3} fillOpacity={1} fill="url(#colorTests)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                Completion Efficiency
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="tests" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="completed" fill="#14B8A6" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Analytics;
