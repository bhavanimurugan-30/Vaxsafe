import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu } from 'lucide-react';

export default function AppLayout({ children, currentPage, onNavigate }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onNavigate={onNavigate}
          currentPage={currentPage}
          onMenuToggle={() => setMobileSidebarOpen(true)}
        />

        {/* Mobile menu trigger bar */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-2 text-xs font-medium"
          >
            <Menu className="w-5 h-5" />
            <span>Navigation Menu</span>
          </button>
          <span className="text-xs font-mono font-semibold text-teal-700 uppercase">
            VaxSafe Console
          </span>
        </div>

        {/* Dynamic Page View Scroll Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
