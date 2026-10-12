import { Bell, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { notificationService } from '../services/notification.service';

interface CustomerHeaderProps {
  onMenuClick: () => void;
}

export default function CustomerHeader({ onMenuClick }: CustomerHeaderProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      return notificationService.subscribe(
        (notifications) => setUnreadCount(notifications.filter((notification) => !notification.isRead).length),
        () => setUnreadCount(0),
      );
    } catch {
      setUnreadCount(0);
      return undefined;
    }
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider hidden sm:block">Customer Portal</h2>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button type="button" onClick={() => navigate('/customer/notifications')} aria-label="Open notifications" className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <div className="hidden sm:flex items-center">
          <span className="text-sm font-medium text-gray-700">{profile?.fullName}</span>
        </div>
      </div>
    </header>
  );
}
