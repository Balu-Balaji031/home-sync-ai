import { NavLink, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  ClipboardList,
  History,
  Home,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { authService } from '../../auth/services/auth.service';

const topItems = [
  { name: 'Dashboard', icon: Home, path: '/technician/dashboard' },
  { name: 'Assessment Center', icon: ClipboardCheck, path: '/technician/assessment' },
  { name: 'Tickets', icon: ClipboardList, path: '/technician/tickets' },
  { name: 'Tickets History', icon: History, path: '/technician/tickets-history' },
];

const bottomItems = [
  { name: 'Profile', icon: UserIcon, path: '/technician/profile' },
  { name: 'Settings', icon: Settings, path: '/technician/settings' },
];

export default function TechnicianSidebar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const renderItem = (item: typeof topItems[number]) => (
    <NavLink
      key={item.name}
      to={item.path}
      className={({ isActive }) =>
        `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`
      }
    >
      <item.icon size={20} className="mr-3" />
      {item.name}
    </NavLink>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center text-blue-600 mb-1">
          <Home size={28} className="mr-2" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">SMARTASSIST AI</h1>
        </div>
        <p className="text-xs text-gray-500 font-medium ml-9">Technician Portal</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {topItems.map(renderItem)}
          <hr className="my-4 border-gray-200" />
          {bottomItems.map(renderItem)}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {profile?.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">{profile?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <LogOut size={18} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
}
