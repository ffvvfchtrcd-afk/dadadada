import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-24px)] sm:h-[calc(100vh-40px)] bg-dark-800 rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden font-sans shadow-2xl relative">
      <div className="absolute inset-0 bg-dark-900/50 backdrop-blur-3xl -z-10" />
      
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <TopBar onMenuToggle={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
