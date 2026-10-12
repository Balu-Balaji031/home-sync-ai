import { NavLink, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  FileText,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { authService } from '../../auth/services/auth.service';

const menuItems = [
  { name: 'Applications', path: '/admin/applications', icon: FileText },
  { name: 'Assessments', path: '/admin/assessments', icon: ClipboardCheck },
  { name: 'Final Approvals', path: '/admin/final-approvals', icon: FileCheck2 },
  { name: 'Approved Technicians', path: '/admin/approved-technicians', icon: BadgeCheck },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck size={23} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">SmartAssist</h1>
            <p className="text-xs font-medium text-slate-500">Admin</p>
          </div>
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Operations Portal</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5" aria-label="Admin navigation">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={19} className={`mr-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 bg-slate-50 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            {profile?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">{profile?.fullName}</p>
            <p className="truncate text-xs text-slate-500">{profile?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
        >
          <LogOut size={18} className="mr-2" />
          Log out
        </button>
      </div>
    </aside>
  );
}
