import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  MonitorSmartphone, 
  Bot, 
  MessageSquare, 
  Ticket, 
  Bell, 
  User as UserIcon, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { authService } from '../../auth/services/auth.service';

export default function CustomerSidebar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/customer/dashboard', active: true },
    { name: 'My Devices', icon: MonitorSmartphone, path: '/customer/devices', active: true },
    { name: 'AI Assistant', icon: Bot, path: '/customer/ai-assistant', active: true },
    { name: 'AI Troubleshooting History', icon: MessageSquare, path: '/customer/ai-history', active: true },
    { name: 'My Tickets', icon: Ticket, path: '/customer/tickets', active: true },
    { name: 'Notifications', icon: Bell, path: '/customer/notifications', active: true },
  ];

  const bottomItems = [
    { name: 'Profile', icon: UserIcon, path: '/customer/profile', active: true },
    { name: 'Settings', icon: Settings, path: '/customer/settings', active: true },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Branding */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center text-blue-600 mb-1">
          <Home size={28} className="mr-2" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">SMARTASSIST AI</h1>
        </div>
        <p className="text-xs text-gray-500 font-medium ml-9">Smart Home Support</p>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.active ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon size={20} className="mr-3" />
                  {item.name}
                </NavLink>
              ) : (
                <div className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-400 cursor-default">
                  <item.icon size={20} className="mr-3" />
                  {item.name}
                </div>
              )}
            </div>
          ))}

          <hr className="my-4 border-gray-200" />

          {bottomItems.map((item) => (
            item.active ? (
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
            ) : (
              <div key={item.name} className="flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-400 cursor-default">
                <item.icon size={20} className="mr-3" />
                {item.name}
              </div>
            )
          ))}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center mb-4">
          <button
            type="button"
            aria-label="Open customer settings"
            onClick={() => navigate('/customer/settings')}
            className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold"
          >
            {profile?.fullName.charAt(0).toUpperCase()}
          </button>
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
