import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useAuth } from '../../auth/context/AuthContext';
import { authService } from '../../auth/services/auth.service';
import type { TechnicianProfile } from '../../auth/services/auth.service';

const stateOptions = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
].map((value) => ({ value, label: value }));

const experienceOptions = Array.from({ length: 10 }, (_, index) => ({
  value: String(index),
  label: `${index} ${index === 1 ? 'year' : 'years'}`,
})).concat({ value: '10+', label: '10+ years' });

const radiusOptions = ['5 km', '10 km', '15 km', '20 km', '25 km', '50 km']
  .map((value) => ({ value, label: value }));

const specializationOptions = [
  'Electrical Installation', 'Home Wiring', 'Smart Home Installation',
  'CCTV & Security', 'AC / HVAC', 'Appliance Repair', 'Networking',
];
const skillOptions = [
  'Smart Lighting', 'Smart Sensors', 'Smart Security', 'Smart Locks',
  'Smart Home Automation', 'Smart Device Setup', 'Security Camera Installation',
  'Camera Configuration', 'DVR / NVR Setup', 'Video Doorbell Installation',
  'Security Sensor Setup',
];
const languageOptions = ['English', 'Tamil', 'Telugu', 'Hindi'];
const workingDayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const emptyTechnicianProfile: TechnicianProfile = {
  yearsOfExperience: '',
  professionalDescription: '',
  specializations: [],
  skills: [],
  languages: [],
  serviceArea: { city: '', state: '', pincodes: '', serviceRadius: '' },
  availability: { workingDays: [], startTime: '', endTime: '' },
};

function profileFromAuth(
  profile: Parameters<typeof buildForm>[0] | null,
): TechnicianForm {
  const technicianProfile = profile?.technicianProfile;
  return {
    fullName: profile?.fullName || '',
    mobileNumber: profile?.mobileNumber || '',
    technicianProfile: {
      ...emptyTechnicianProfile,
      ...technicianProfile,
      serviceArea: { ...emptyTechnicianProfile.serviceArea, ...technicianProfile?.serviceArea },
      availability: { ...emptyTechnicianProfile.availability, ...technicianProfile?.availability },
      specializations: technicianProfile?.specializations || [],
      skills: technicianProfile?.skills || [],
      languages: technicianProfile?.languages || [],
    },
  };
}

type TechnicianForm = {
  fullName: string;
  mobileNumber: string;
  technicianProfile: TechnicianProfile;
};

function buildForm(profile: { fullName?: string; mobileNumber?: string; technicianProfile?: TechnicianProfile } | null) {
  return profileFromAuth(profile);
}

type ErrorMap = Record<string, string>;

function validate(form: TechnicianForm): ErrorMap {
  const errors: ErrorMap = {};
  const data = form.technicianProfile;
  if (!form.fullName.trim()) errors.fullName = 'Full Name is required.';
  if (!form.mobileNumber.trim()) errors.mobileNumber = 'Mobile Number is required.';
  if (!data.yearsOfExperience) errors.yearsOfExperience = 'Years of Experience is required.';
  if (!data.specializations.length) errors.specializations = 'Select at least one specialization.';
  if (!data.skills.length) errors.skills = 'Select at least one skill.';
  if (!data.languages.length) errors.languages = 'Select at least one supported language.';
  if (!data.serviceArea.city.trim()) errors.city = 'City is required.';
  if (!data.serviceArea.state) errors.state = 'State is required.';
  if (!data.serviceArea.pincodes.trim()) errors.pincodes = 'Pincodes are required.';
  if (!data.serviceArea.serviceRadius) errors.serviceRadius = 'Service Radius is required.';
  if (!data.availability.workingDays.length) errors.workingDays = 'Select at least one working day.';
  if (!data.availability.startTime) errors.startTime = 'Start Time is required.';
  if (!data.availability.endTime) errors.endTime = 'End Time is required.';
  if (data.availability.startTime && data.availability.endTime &&
      data.availability.startTime >= data.availability.endTime) {
    errors.endTime = 'End Time must be later than Start Time.';
  }
  return errors;
}

function completion(form: TechnicianForm): number {
  const data = form.technicianProfile;
  const areas = [
    Boolean(form.fullName.trim() && form.mobileNumber.trim()),
    Boolean(data.yearsOfExperience && data.professionalDescription.trim()),
    data.specializations.length > 0,
    data.skills.length > 0,
    data.languages.length > 0,
    Boolean(data.serviceArea.city && data.serviceArea.state && data.serviceArea.pincodes && data.serviceArea.serviceRadius),
    Boolean(data.availability.workingDays.length && data.availability.startTime && data.availability.endTime && data.availability.startTime < data.availability.endTime),
  ];
  return Math.round((areas.filter(Boolean).length / areas.length) * 100);
}

export default function TechnicianFoundationPage() {
  const { user, profile, loading: authLoading, syncAuthenticatedUser } = useAuth();
  const [form, setForm] = useState<TechnicianForm>(() => buildForm(null));
  const [savedForm, setSavedForm] = useState<TechnicianForm>(() => buildForm(null));
  const [errors, setErrors] = useState<ErrorMap>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const percent = useMemo(() => completion(form), [form]);

  useEffect(() => {
    const next = buildForm(profile);
    setForm(next);
    setSavedForm(next);
    setErrors({});
  }, [profile]);

  const updateForm = (update: (current: TechnicianForm) => TechnicianForm) => {
    setForm(update);
    setErrors({});
    setFeedback('');
    setError('');
  };

  const toggle = (field: 'specializations' | 'skills' | 'languages', value: string) => {
    updateForm((current) => {
      const values = current.technicianProfile[field];
      return {
        ...current,
        technicianProfile: {
          ...current.technicianProfile,
          [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
        },
      };
    });
  };

  const toggleDay = (value: string) => {
    updateForm((current) => {
      const days = current.technicianProfile.availability.workingDays;
      return {
        ...current,
        technicianProfile: {
          ...current.technicianProfile,
          availability: {
            ...current.technicianProfile.availability,
            workingDays: days.includes(value) ? days.filter((item) => item !== value) : [...days, value],
          },
        },
      };
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback('');
    setError('');
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    if (!user) {
      setError('You must be logged in to update your profile.');
      return;
    }
    const nextForm = {
      ...form,
      fullName: form.fullName.trim(),
      mobileNumber: form.mobileNumber.trim(),
      technicianProfile: {
        ...form.technicianProfile,
        professionalDescription: form.technicianProfile.professionalDescription.trim(),
        serviceArea: {
          ...form.technicianProfile.serviceArea,
          city: form.technicianProfile.serviceArea.city.trim(),
          pincodes: form.technicianProfile.serviceArea.pincodes.trim(),
        },
      },
    };
    setLoading(true);
    try {
      await authService.updateTechnicianProfile(user.uid, nextForm);
      setForm(nextForm);
      setSavedForm(nextForm);
      await syncAuthenticatedUser(user);
      setFeedback('Profile saved successfully.');
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to save your profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !profile) {
    return <div className="p-8 text-center text-gray-500">Loading your profile...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div>
          <p className="mb-1 text-sm font-bold uppercase tracking-wider text-blue-600">Technician Profile</p>
          <h1 className="text-3xl font-bold text-slate-900">Professional Profile</h1>
          <p className="mt-2 max-w-2xl text-slate-500">Complete your professional information to become eligible for the SmartAssist technician verification process.</p>
        </div>
        <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:w-64">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
            <span>Profile Completion</span><span className="text-xl text-blue-600">{percent}%</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} /></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {feedback && <div className="rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">{feedback}</div>}
        {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <ProfileSection title="Personal Information">
          <div className="grid gap-5 md:grid-cols-3">
            <Input label="Full Name" value={form.fullName} onChange={(event) => updateForm((current) => ({ ...current, fullName: event.target.value }))} required error={errors.fullName} />
            <Input label="Email Address" type="email" value={profile.email || user?.email || ''} readOnly className="cursor-not-allowed bg-slate-50 text-slate-500" required />
            <Input label="Mobile Number" type="tel" value={form.mobileNumber} onChange={(event) => updateForm((current) => ({ ...current, mobileNumber: event.target.value }))} required error={errors.mobileNumber} />
          </div>
        </ProfileSection>

        <ProfileSection title="Professional Information">
          <div className="space-y-5">
            <div className="max-w-sm"><Select label="Years of Experience" options={experienceOptions} value={form.technicianProfile.yearsOfExperience} onChange={(event) => updateForm((current) => ({ ...current, technicianProfile: { ...current.technicianProfile, yearsOfExperience: event.target.value } }))} required error={errors.yearsOfExperience} placeholder="Select experience" /></div>
            <label className="flex flex-col text-sm font-medium text-slate-700">Professional Description<textarea value={form.technicianProfile.professionalDescription} onChange={(event) => updateForm((current) => ({ ...current, technicianProfile: { ...current.technicianProfile, professionalDescription: event.target.value } }))} rows={4} className="mt-1.5 rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Describe your professional experience" /></label>
          </div>
        </ProfileSection>

        <SelectionSection title="Specialization" options={specializationOptions} selected={form.technicianProfile.specializations} onToggle={(value) => toggle('specializations', value)} error={errors.specializations} />
        <SelectionSection title="Skills / Categories" helper="Select skills related to your chosen specialization." options={skillOptions} selected={form.technicianProfile.skills} onToggle={(value) => toggle('skills', value)} error={errors.skills} />
        <SelectionSection title="Languages You Can Support" options={languageOptions} selected={form.technicianProfile.languages} onToggle={(value) => toggle('languages', value)} error={errors.languages} />

        <ProfileSection title="Service Area">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="City" value={form.technicianProfile.serviceArea.city} onChange={(event) => updateForm((current) => ({ ...current, technicianProfile: { ...current.technicianProfile, serviceArea: { ...current.technicianProfile.serviceArea, city: event.target.value } } }))} required error={errors.city} />
            <Select label="State" options={stateOptions} value={form.technicianProfile.serviceArea.state} onChange={(event) => updateForm((current) => ({ ...current, technicianProfile: { ...current.technicianProfile, serviceArea: { ...current.technicianProfile.serviceArea, state: event.target.value } } }))} required error={errors.state} placeholder="Select State" />
            <Input label="Pincodes" placeholder="600028, 600018, 600020" value={form.technicianProfile.serviceArea.pincodes} onChange={(event) => updateForm((current) => ({ ...current, technicianProfile: { ...current.technicianProfile, serviceArea: { ...current.technicianProfile.serviceArea, pincodes: event.target.value } } }))} required error={errors.pincodes} />
            <Select label="Service Radius" options={radiusOptions} value={form.technicianProfile.serviceArea.serviceRadius} onChange={(event) => updateForm((current) => ({ ...current, technicianProfile: { ...current.technicianProfile, serviceArea: { ...current.technicianProfile.serviceArea, serviceRadius: event.target.value } } }))} required error={errors.serviceRadius} placeholder="Select Radius" />
          </div>
        </ProfileSection>

        <ProfileSection title="Availability">
          <div className="space-y-5">
            <div><p className="mb-2 text-sm font-medium text-slate-700">Working Days <span className="text-red-500">*</span></p><ChipGrid options={workingDayOptions} selected={form.technicianProfile.availability.workingDays} onToggle={toggleDay} /><FieldError message={errors.workingDays} /></div>
            <div className="grid gap-5 sm:grid-cols-2"><Input label="Start Time" type="time" value={form.technicianProfile.availability.startTime} onChange={(event) => updateForm((current) => ({ ...current, technicianProfile: { ...current.technicianProfile, availability: { ...current.technicianProfile.availability, startTime: event.target.value } } }))} required error={errors.startTime} /><Input label="End Time" type="time" value={form.technicianProfile.availability.endTime} onChange={(event) => updateForm((current) => ({ ...current, technicianProfile: { ...current.technicianProfile, availability: { ...current.technicianProfile.availability, endTime: event.target.value } } }))} required error={errors.endTime} /></div>
          </div>
        </ProfileSection>

        <div className="flex justify-end gap-3 pb-8"><Button type="button" variant="secondary" onClick={() => { setForm(savedForm); setErrors({}); setError(''); setFeedback(''); }} disabled={loading}>Cancel</Button><Button type="submit" isLoading={loading}>Save Profile</Button></div>
      </form>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="mb-5 text-lg font-bold text-slate-900">{title}</h2>{children}</section>;
}

function SelectionSection({ title, helper, options, selected, onToggle, error }: { title: string; helper?: string; options: string[]; selected: string[]; onToggle: (value: string) => void; error?: string }) {
  return <ProfileSection title={title}>{helper && <p className="-mt-3 mb-4 text-sm text-slate-500">{helper}</p>}<ChipGrid options={options} selected={selected} onToggle={onToggle} /><FieldError message={error} /></ProfileSection>;
}

function ChipGrid({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div className="flex flex-wrap gap-3">{options.map((option) => { const isSelected = selected.includes(option); return <button key={option} type="button" onClick={() => onToggle(option)} aria-pressed={isSelected} className={`rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'}`}><span className={`mr-2 inline-flex h-4 w-4 items-center justify-center rounded border text-xs ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>{isSelected ? '✓' : ''}</span>{option}</button>; })}</div>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-red-600">{message}</p> : null;
}
