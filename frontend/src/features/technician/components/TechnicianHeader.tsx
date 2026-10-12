import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';

interface TechnicianHeaderProps {
  onMenuClick: () => void;
}

export default function TechnicianHeader({ onMenuClick }: TechnicianHeaderProps) {
  const { profile } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          aria-label="Open navigation"
        >
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Technician Portal</h2>
          <h1 className="text-xl font-bold text-gray-900">SmartAssist</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-default">
          <Bell size={20} />
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {profile?.fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{profile?.fullName}</p>
            <p className="text-xs text-gray-500">{profile?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
