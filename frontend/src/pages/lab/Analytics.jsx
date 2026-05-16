import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, Users, Clock, Calendar } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const Analytics = () => {
  const [data, setData] = useState({
    monthlyStats: [
      { name: 'Jan', tests: 40, completed: 35 },
      { name: 'Feb', tests: 45, completed: 40 },
      { name: 'Mar', tests: 60, completed: 55 },
      { name: 'Apr', tests: 55, completed: 50 },
      { name: 'May', tests: 75, completed: 70 },
      { name: 'Jun', tests: 90, completed: 85 },
    ],
    testDistribution: [
      { name: 'Blood', value: 45 },
      { name: 'Urine', value: 25 },
      { name: 'COVID-19', value: 20 },
      { name: 'Other', value: 10 },
    ]
  });

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Avg Processing Time', value: '4.2 hrs', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Success Rate', value: '98.5%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Total Patients', value: '1,284', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Pending Reviews', value: '12', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon size={20} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
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
