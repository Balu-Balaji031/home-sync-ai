import { useEffect, useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/context/AuthContext';
import { authService } from '../../auth/services/auth.service';
import type { UserProfile } from '../../auth/services/auth.service';
import { notificationService } from '../services/notification.service';

type ProfileField = 'fullName' | 'mobileNumber' | 'addressLine1' | 'addressLine2' | 'city' | 'state' | 'pincode' | 'landmark' | 'preferredLanguage';

type ProfileForm = Record<ProfileField, string>;

type ProfileErrors = Partial<Record<ProfileField, string>>;

const emptyForm: ProfileForm = {
  fullName: '',
  mobileNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  landmark: '',
  preferredLanguage: '',
};

const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Tamil', label: 'தமிழ்' },
  { value: 'Telugu', label: 'తెలుగు' },
];

const stateOptions = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
].map((state) => ({ value: state, label: state }));

function formFromProfile(profile: UserProfile | null): ProfileForm {
  const savedState = profile?.state || '';
  return {
    fullName: profile?.fullName || '',
    mobileNumber: profile?.mobileNumber || '',
    addressLine1: profile?.addressLine1 || '',
    addressLine2: profile?.addressLine2 || '',
    city: profile?.city || '',
    state: stateOptions.some((option) => option.value === savedState) ? savedState : '',
    pincode: profile?.pincode || '',
    landmark: profile?.landmark || '',
    preferredLanguage: profile?.preferredLanguage || '',
  };
}

function validateForm(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};
  const requiredFields: Array<[ProfileField, string]> = [
    ['fullName', 'Full Name is required.'],
    ['mobileNumber', 'Mobile Number is required.'],
    ['addressLine1', 'Address Line 1 is required.'],
    ['city', 'City is required.'],
    ['state', 'State is required.'],
    ['pincode', 'Pincode is required.'],
    ['preferredLanguage', 'Preferred Language is required.'],
  ];

  for (const [field, message] of requiredFields) {
    if (!form[field].trim()) errors[field] = message;
  }

  if (form.state.trim() && !stateOptions.some((option) => option.value === form.state.trim())) {
    errors.state = 'Select a valid state.';
  }

  if (form.pincode.trim() && !/^\d{4,10}$/.test(form.pincode.trim())) {
    errors.pincode = 'Enter a valid pincode.';
  }

  return errors;
}

export default function CustomerProfile() {
  const { user, profile, loading: authLoading, syncAuthenticatedUser } = useAuth();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [savedForm, setSavedForm] = useState<ProfileForm>(emptyForm);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const nextForm = formFromProfile(profile);
    setForm(nextForm);
    setSavedForm(nextForm);
    setErrors({});
    setFeedback('');
    setError('');
  }, [profile]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const field = event.target.name as ProfileField;
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFeedback('');
    setError('');
  };

  const handleCancel = () => {
    setForm(savedForm);
    setErrors({});
    setFeedback('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback('');
    setError('');

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!user) {
      setError('You must be logged in to update your profile.');
      return;
    }

    const nextForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    ) as ProfileForm;

    setLoading(true);
    try {
      await authService.updateUserProfile(user.uid, nextForm);
      setForm(nextForm);
      setSavedForm(nextForm);
      await syncAuthenticatedUser(user);
      await notificationService.createAccountNotification('profile-updated');
      setFeedback('Profile updated successfully.');
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-1">Account</p>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-500 mt-2">Your contact and service location details.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
        {feedback && <div className="mb-6 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">{feedback}</div>}
        {error && <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-5">
          <Input label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} required error={errors.fullName} />
          <Input label="Email Address" name="email" type="email" value={profile.email || user?.email || ''} readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" required />
          <Input label="Mobile Number" name="mobileNumber" type="tel" value={form.mobileNumber} onChange={handleChange} required error={errors.mobileNumber} />
          <Input label="Address Line 1" name="addressLine1" value={form.addressLine1} onChange={handleChange} required error={errors.addressLine1} />
          <Input label="Address Line 2" name="addressLine2" value={form.addressLine2} onChange={handleChange} error={errors.addressLine2} />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input label="City" name="city" value={form.city} onChange={handleChange} required error={errors.city} />
            <Select label="State" name="state" options={stateOptions} value={form.state} onChange={handleChange} required error={errors.state} placeholder="Select State" />
          </div>

          <Input label="Pincode" name="pincode" inputMode="numeric" value={form.pincode} onChange={handleChange} required error={errors.pincode} />
          <Input label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} error={errors.landmark} />
          <Select label="Preferred Language" name="preferredLanguage" options={languageOptions} value={form.preferredLanguage} onChange={handleChange} required error={errors.preferredLanguage} />
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-gray-100 pt-6">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={loading}>Cancel</Button>
          <Button type="submit" isLoading={loading}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
