import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authService } from '../services/auth.service';

export default function AdminRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.registerAdmin(form.email.trim(), form.password);
      navigate('/verify-email');
    } catch (registrationError: any) {
      let message = 'Failed to create admin account.';
      if (registrationError.code === 'auth/email-already-in-use') message = 'This email is already registered.';
      if (registrationError.code === 'auth/invalid-email') message = 'Invalid email address.';
      if (registrationError.code === 'auth/weak-password') message = 'Password is too weak.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Admin Account</h1>
          <p className="text-gray-500">Register your SmartAssist administrator account.</p>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Password" name="password" isPassword value={form.password} onChange={handleChange} required />
          <Input label="Confirm Password" name="confirmPassword" isPassword value={form.confirmPassword} onChange={handleChange} required />
          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={loading}>Create Account</Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an admin account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
