import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Bell, LogOut, ShieldAlert, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useAuth } from '../../auth/context/AuthContext';
import { authService } from '../../auth/services/auth.service';
import type { UserSettings } from '../../auth/services/auth.service';

const defaultSettings: UserSettings = {
  notificationPreferences: {
    serviceUpdates: true,
    aiUpdates: true,
    accountSecurityAlerts: true,
    newJobAssignments: true,
    jobStatusUpdates: true,
    technicianAssessmentUpdates: true,
    applicationUpdates: true,
    adminMessages: true,
  },
  appLanguage: 'English',
  preferredServiceTime: '09:00 AM - 06:00 PM',
  technicianPreferences: {
    contactMethod: 'Email',
    preferredJobTypes: ['Installation', 'Repair', 'Troubleshooting'],
    maximumTravelDistance: '15 km',
    jobAssignmentNotifications: true,
    outsidePreferredHours: false,
  },
};

const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
];
const distanceOptions = ['10 km', '15 km', '25 km', '50 km'].map((value) => ({ value, label: value }));
const jobTypes = ['Installation', 'Repair', 'Troubleshooting'];
const contactMethods = ['Email', 'SMS', 'Phone Call'] as const;

function settingsFromProfile(settings?: UserSettings): UserSettings {
  return {
    ...defaultSettings,
    ...settings,
    notificationPreferences: {
      ...defaultSettings.notificationPreferences,
      ...settings?.notificationPreferences,
    },
    technicianPreferences: {
      ...defaultSettings.technicianPreferences,
      ...settings?.technicianPreferences,
      preferredJobTypes: settings?.technicianPreferences?.preferredJobTypes || defaultSettings.technicianPreferences?.preferredJobTypes,
    },
  };
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} /></button>;
}

export default function TechnicianSettings() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) setSettings(settingsFromProfile(profile.settings));
  }, [profile]);

  const saveSettings = async (nextSettings: UserSettings) => {
    if (!user) return;
    setSettings(nextSettings);
    setError('');
    try {
      await authService.updateUserSettings(user.uid, nextSettings);
      setMessage('Settings updated successfully.');
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to save your settings.');
    }
  };

  const updateNotifications = (key: keyof UserSettings['notificationPreferences'], value: boolean) => {
    void saveSettings({ ...settings, notificationPreferences: { ...settings.notificationPreferences, [key]: value } });
  };

  const updateTechnicianPreference = <K extends keyof NonNullable<UserSettings['technicianPreferences']>>(key: K, value: NonNullable<UserSettings['technicianPreferences']>[K]) => {
    void saveSettings({ ...settings, technicianPreferences: { ...settings.technicianPreferences, [key]: value } });
  };

  const toggleJobType = (jobType: string) => {
    const current = settings.technicianPreferences?.preferredJobTypes || [];
    updateTechnicianPreference('preferredJobTypes', current.includes(jobType) ? current.filter((item) => item !== jobType) : [...current, jobType]);
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !passwords.current || !passwords.next || !passwords.confirm) {
      setError('Complete all password fields.');
      return;
    }
    if (passwords.next.length < 6 || passwords.next !== passwords.confirm) {
      setError(passwords.next.length < 6 ? 'New password must be at least 6 characters.' : 'New password and confirmation do not match.');
      return;
    }
    setSavingPassword(true);
    setError('');
    try {
      await authService.changePassword(user, passwords.current, passwords.next);
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordOpen(false);
      setMessage('Password changed successfully.');
    } catch (passwordError) {
      console.error(passwordError);
      setError('Unable to change password. Check your current password and try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    setError('');
    try {
      await authService.deleteAccount(user);
      navigate('/login', { replace: true });
    } catch (deleteError) {
      console.error(deleteError);
      setError('Unable to delete your account. Please try again.');
      setDeleteOpen(false);
      setDeleting(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (authLoading || !profile) return <div className="p-8 text-center text-slate-500">Loading your settings...</div>;
  const professionalStatus = profile.application?.status || 'NOT_APPLIED';
  const jobEligibility = professionalStatus === 'FINAL_APPROVED' ? 'Eligible for service jobs' : 'Not yet eligible for service jobs';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6"><p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">Settings</p><h1 className="text-3xl font-bold text-slate-900">Settings</h1><p className="mt-2 text-slate-600">Manage your account, preferences and security.</p></div>
      {message && <div className="mb-5 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <SettingsCard title="Notifications" icon={<Bell size={18} />}>
        <SettingRow title="New Job Assignments" checked={settings.notificationPreferences.newJobAssignments ?? true} onChange={(value) => updateNotifications('newJobAssignments', value)} />
        <SettingRow title="Job Status Updates" checked={settings.notificationPreferences.jobStatusUpdates ?? true} onChange={(value) => updateNotifications('jobStatusUpdates', value)} />
        <SettingRow title="Assessment Updates" checked={settings.notificationPreferences.technicianAssessmentUpdates ?? true} onChange={(value) => updateNotifications('technicianAssessmentUpdates', value)} />
        <SettingRow title="Application Updates" checked={settings.notificationPreferences.applicationUpdates ?? true} onChange={(value) => updateNotifications('applicationUpdates', value)} />
        <SettingRow title="Admin Messages" checked={settings.notificationPreferences.adminMessages ?? true} onChange={(value) => updateNotifications('adminMessages', value)} />
      </SettingsCard>

      <SettingsCard title="Language & Communication">
        <SettingRow title="App Language" description="Language used throughout the application."><Select label="" aria-label="App Language" options={languageOptions} value={settings.appLanguage} onChange={(event) => void saveSettings({ ...settings, appLanguage: event.target.value })} /></SettingRow>
        <div className="border-t border-slate-100 py-4"><p className="font-medium text-slate-900">Preferred Contact Method</p><div className="mt-3 flex flex-wrap gap-5">{contactMethods.map((method) => <label key={method} className="flex items-center gap-2 text-sm text-slate-600"><input type="radio" name="contactMethod" checked={settings.technicianPreferences?.contactMethod === method} onChange={() => updateTechnicianPreference('contactMethod', method)} />{method}</label>)}</div></div>
      </SettingsCard>

      <SettingsCard title="Job Preferences">
        <div className="mb-4"><p className="font-medium text-slate-900">Preferred Job Types</p><div className="mt-3 flex flex-wrap gap-4">{jobTypes.map((jobType) => <label key={jobType} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={settings.technicianPreferences?.preferredJobTypes?.includes(jobType) || false} onChange={() => toggleJobType(jobType)} />{jobType}</label>)}</div></div>
        <SettingRow title="Maximum Travel Distance" description="Preferred maximum distance for job assignments."><Select label="" aria-label="Maximum Travel Distance" options={distanceOptions} value={settings.technicianPreferences?.maximumTravelDistance || '15 km'} onChange={(event) => updateTechnicianPreference('maximumTravelDistance', event.target.value)} /></SettingRow>
        <SettingRow title="Job Assignment Notifications" checked={settings.technicianPreferences?.jobAssignmentNotifications ?? true} onChange={(value) => updateTechnicianPreference('jobAssignmentNotifications', value)} />
      </SettingsCard>

      <SettingsCard title="Availability Preferences">
        <SettingRow title="Receive Job Notifications Outside Preferred Hours" checked={settings.technicianPreferences?.outsidePreferredHours ?? false} onChange={(value) => updateTechnicianPreference('outsidePreferredHours', value)} />
      </SettingsCard>

      <SettingsCard title="Security" icon={<ShieldAlert size={18} />}><SettingRow title="Change Password" description="Update your technician account password."><Button type="button" variant="outline" onClick={() => { setError(''); setPasswordOpen(true); }}>Change Password</Button></SettingRow></SettingsCard>

      <SettingsCard title="Account">
        <SettingRow title="Account Status" value="Active" />
        <SettingRow title="Professional Status" value={professionalStatus} />
        <SettingRow title="Job Eligibility" value={jobEligibility} />
      </SettingsCard>

      <section className="mb-6 rounded-xl border border-red-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><Trash2 className="mt-0.5 text-red-600" size={18} /><div><h2 className="font-bold text-slate-900">Danger Zone</h2><p className="mt-1 text-sm text-slate-500">Permanently delete your technician account.</p><Button type="button" variant="danger" className="mt-4" onClick={() => setDeleteOpen(true)}>Delete Account</Button></div></div></section>
      <Button type="button" variant="outline" onClick={() => void logout()}><LogOut size={17} className="mr-2" />Log Out</Button>

      {passwordOpen && <Modal title="Change Password" onClose={() => setPasswordOpen(false)}><form onSubmit={changePassword} className="space-y-4"><Input label="Current Password" required isPassword value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /><Input label="New Password" required isPassword value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /><Input label="Confirm New Password" required isPassword value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button><Button type="submit" isLoading={savingPassword}>Change Password</Button></div></form></Modal>}
      {deleteOpen && <Modal title="Delete Account" onClose={() => setDeleteOpen(false)}><p className="text-sm text-slate-600">This permanently deletes your technician account and cannot be undone. Are you sure you want to continue?</p><div className="mt-5 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button type="button" variant="danger" isLoading={deleting} onClick={() => void deleteAccount()}>Delete Account</Button></div></Modal>}
    </div>
  );
}

function SettingsCard({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2 text-blue-600"><span>{icon}</span><h2 className="font-bold text-slate-900">{title}</h2></div>{children}</section>;
}

function SettingRow({ title, description, checked, onChange, value, children }: { title: string; description?: string; checked?: boolean; onChange?: (value: boolean) => void; value?: string; children?: ReactNode }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-0 last:pb-0"><div><p className="font-medium text-slate-900">{title}</p>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}{value && <p className="mt-1 text-sm font-medium text-slate-600">{value}</p>}</div>{onChange && <Toggle checked={checked ?? false} onChange={onChange} />}{children}</div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-4"><div className="mx-auto my-16 max-w-lg rounded-xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-slate-900">{title}</h2><button type="button" aria-label="Close modal" onClick={onClose} className="text-2xl text-slate-400">×</button></div><div className="mt-5">{children}</div></div></div>;
}
