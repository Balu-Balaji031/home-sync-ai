import { useEffect, useState } from 'react';
import { ArrowRight, Bell, LogOut, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useAuth } from '../../auth/context/AuthContext';
import { authService } from '../../auth/services/auth.service';
import type { UserSettings } from '../../auth/services/auth.service';
import { notificationService } from '../services/notification.service';

const defaultSettings: UserSettings = {
  notificationPreferences: {
    serviceUpdates: true,
    aiUpdates: true,
    accountSecurityAlerts: true,
  },
  appLanguage: 'English',
  preferredServiceTime: '09:00 AM - 06:00 PM',
};

const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Tamil', label: 'தமிழ்' },
  { value: 'Telugu', label: 'తెలుగు' },
];

const serviceTimeOptions = [
  { value: '09:00 AM - 06:00 PM', label: '09:00 AM - 06:00 PM' },
  { value: '10:00 AM - 07:00 PM', label: '10:00 AM - 07:00 PM' },
  { value: '11:00 AM - 08:00 PM', label: '11:00 AM - 08:00 PM' },
];

function settingsFromProfile(settings?: UserSettings): UserSettings {
  return {
    notificationPreferences: {
      ...defaultSettings.notificationPreferences,
      ...settings?.notificationPreferences,
    },
    appLanguage: settings?.appLanguage || defaultSettings.appLanguage,
    preferredServiceTime: settings?.preferredServiceTime || defaultSettings.preferredServiceTime,
  };
}

function PreferenceToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function CustomerSettings() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) setSettings(settingsFromProfile(profile.settings));
  }, [profile]);

  const saveSettings = async (nextSettings: UserSettings) => {
    if (!user) return;
    setSettings(nextSettings);
    setError('');
    setMessage('');
    try {
      await authService.updateUserSettings(user.uid, nextSettings);
      setMessage('Settings updated successfully.');
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to save your settings. Please try again.');
    }
  };

  const updateNotification = (key: keyof UserSettings['notificationPreferences'], value: boolean) => {
    void saveSettings({
      ...settings,
      notificationPreferences: { ...settings.notificationPreferences, [key]: value },
    });
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!user) return;
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setError('Complete all password fields.');
      return;
    }
    if (passwords.next.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    setLoading(true);
    try {
      await authService.changePassword(user, passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      setChangePasswordOpen(false);
      await notificationService.createAccountNotification('password-changed');
      setMessage('Password changed successfully.');
    } catch (passwordError) {
      console.error(passwordError);
      setError('Unable to change password. Check your current password and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      await authService.deleteAccount(user);
      navigate('/login', { replace: true });
    } catch (deleteError) {
      console.error(deleteError);
      setError('Unable to delete your account. Please try again.');
      setDeleteOpen(false);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (authLoading || !profile) {
    return <div className="p-8 text-center text-gray-500">Loading your settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-1">Account</p>
        <h1 className="text-3xl font-bold text-gray-900">SETTINGS</h1>
        <p className="text-gray-500 mt-2">Manage your account, preferences and security.</p>
      </div>

      {message && <div className="mb-6 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <SettingsCard title="NOTIFICATIONS" icon={<Bell size={18} />}>
        <SettingRow title="Service Updates" description="Updates about service requests and tickets.">
          <PreferenceToggle checked={settings.notificationPreferences.serviceUpdates} onChange={(value) => updateNotification('serviceUpdates', value)} />
        </SettingRow>
        <SettingRow title="AI Updates" description="Updates about your AI troubleshooting sessions.">
          <PreferenceToggle checked={settings.notificationPreferences.aiUpdates} onChange={(value) => updateNotification('aiUpdates', value)} />
        </SettingRow>
        <SettingRow title="Account & Security Alerts" description="Important account and security notifications.">
          <PreferenceToggle checked={settings.notificationPreferences.accountSecurityAlerts} onChange={(value) => updateNotification('accountSecurityAlerts', value)} />
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="LANGUAGE & PREFERENCES">
        <SettingRow title="App Language" description="Language used throughout the application.">
          <Select label="" name="appLanguage" aria-label="App Language" options={languageOptions} value={settings.appLanguage} onChange={(event) => void saveSettings({ ...settings, appLanguage: event.target.value })} className="min-w-36" />
        </SettingRow>
        <SettingRow title="Preferred Service Time" description={settings.preferredServiceTime}>
          <button type="button" aria-label="Change preferred service time" onClick={() => {
            const index = serviceTimeOptions.findIndex((option) => option.value === settings.preferredServiceTime);
            const next = serviceTimeOptions[(index + 1) % serviceTimeOptions.length].value;
            void saveSettings({ ...settings, preferredServiceTime: next });
          }} className="text-gray-500 hover:text-blue-600"><ArrowRight size={20} /></button>
        </SettingRow>
      </SettingsCard>

      <SettingsCard title="SECURITY" icon={<ShieldAlert size={18} />}>
        <SettingRow title="Change Password" description="Update your account password.">
          <button type="button" onClick={() => { setError(''); setChangePasswordOpen(true); }} className="text-gray-500 hover:text-blue-600"><ArrowRight size={20} /></button>
        </SettingRow>
        <SettingRow title="Delete Account" description="Permanently delete your SmartAssist account.">
          <button type="button" onClick={() => { setError(''); setDeleteOpen(true); }} className="text-gray-500 hover:text-red-600"><ArrowRight size={20} /></button>
        </SettingRow>
      </SettingsCard>

      <div className="mt-8 flex justify-center">
        <Button type="button" variant="secondary" onClick={handleLogout}><LogOut size={18} className="mr-2" />Log Out</Button>
      </div>

      {changePasswordOpen && (
        <Modal title="Change Password" onClose={() => setChangePasswordOpen(false)}>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <Input label="Current Password" type="password" isPassword value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} required />
            <Input label="New Password" type="password" isPassword value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} required />
            <Input label="Confirm New Password" type="password" isPassword value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} required />
            <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setChangePasswordOpen(false)}>Cancel</Button><Button type="submit" isLoading={loading}>Change Password</Button></div>
          </form>
        </Modal>
      )}

      {deleteOpen && (
        <Modal title="Delete your account?" onClose={() => setDeleteOpen(false)}>
          <p className="text-sm text-gray-600">This action will permanently delete your SmartAssist account and associated customer data.</p>
          <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)} disabled={loading}>Cancel</Button><Button type="button" variant="danger" onClick={() => void handleDelete()} isLoading={loading}>Delete Account</Button></div>
        </Modal>
      )}
    </div>
  );
}

function SettingsCard({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return <section className="mb-8"><h2 className="mb-3 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-500">{icon}{title}</h2><div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">{children}</div></section>;
}

function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 border-b border-gray-100 p-5 last:border-b-0"><div><p className="font-medium text-gray-900">{title}</p><p className="mt-1 text-sm text-gray-500">{description}</p></div><div className="shrink-0">{children}</div></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold text-gray-900">{title}</h2><button type="button" onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-700" aria-label="Close">×</button></div>{children}</div></div>;
}
