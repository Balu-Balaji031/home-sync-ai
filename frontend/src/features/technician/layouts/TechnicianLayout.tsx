import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TechnicianHeader from '../components/TechnicianHeader';
import TechnicianSidebar from '../components/TechnicianSidebar';

export default function TechnicianLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 transform md:relative md:translate-x-0 transition duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <TechnicianSidebar />
      </div>

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TechnicianHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
