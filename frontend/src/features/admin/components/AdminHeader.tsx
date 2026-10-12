import { Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { profile } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open admin navigation"
          className="-ml-2 mr-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-blue-600" />
          <div>
            <p className="hidden text-xs font-bold uppercase tracking-wider text-slate-400 sm:block">Admin Portal</p>
            <h2 className="text-lg font-bold text-slate-900">Operations</h2>
          </div>
        </div>
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {profile?.fullName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">{profile?.fullName}</p>
          <p className="text-xs text-slate-500">{profile?.email}</p>
        </div>
      </div>
    </header>
  );
}
