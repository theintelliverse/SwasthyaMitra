import React from 'react';
import { Outlet } from 'react-router-dom';
import PatientBottomNav from './PatientBottomNav';

/**
 * Unified Layout for Patient Panel
 * Keeps the bottom navigation bar permanently mounted and visible
 * across all tabs, pages, and menus without unmounting or flickering.
 */
const PatientLayout = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-body antialiased flex flex-col relative">
      {/* Main Content Area with safe bottom spacing for mobile bottom bar */}
      <main className="flex-1 pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Persistent Native Mobile App Bottom Navigation Bar */}
      <PatientBottomNav />
    </div>
  );
};

export default PatientLayout;
