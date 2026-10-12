import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Wrench } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { authService } from '../services/auth.service';
import type { UserRole } from '../services/auth.service';

export default function Registration() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTechnician = location.pathname.includes('/register/technician');
  const role: UserRole = isTechnician ? 'technician' : 'customer';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    preferredLanguage: 'English',
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Telugu', label: 'Telugu' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password should be at least 6 characters');
    }
    if (!agreed) {
      return setError('You must agree to the Terms & Privacy Policy');
    }

    setLoading(true);
    try {
      await authService.registerUser({
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        preferredLanguage: formData.preferredLanguage,
        password: formData.password,
        role: role,
      });
      navigate('/verify-email');
    } catch (err: any) {
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.';
      if (err.code === 'auth/weak-password') msg = 'Password is too weak.';
      if (err.code === 'auth/invalid-email') msg = 'Invalid email address.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isTechnician ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
            {isTechnician ? <Wrench size={24} /> : <User size={24} />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create {isTechnician ? 'Technician' : 'Customer'} Account
          </h1>
          <p className="text-gray-500">Please fill in your details to register.</p>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
          <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <Input label="Mobile Number" name="mobileNumber" type="tel" value={formData.mobileNumber} onChange={handleChange} required />
          
          <Select 
            label="Preferred Language" 
            name="preferredLanguage" 
            options={languageOptions} 
            value={formData.preferredLanguage} 
            onChange={handleChange} 
            required 
          />

          <Input label="Password" name="password" isPassword value={formData.password} onChange={handleChange} required />
          <Input label="Confirm Password" name="confirmPassword" isPassword value={formData.confirmPassword} onChange={handleChange} required />

          <div className="flex items-center mt-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 cursor-pointer">
              I agree to the Terms & Privacy Policy
            </label>
          </div>

          <div className="pt-4">
            <Button type="submit" fullWidth isLoading={loading}>
              Create Account
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
