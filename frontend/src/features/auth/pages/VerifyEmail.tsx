import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { authService } from '../services/auth.service';
import { MailCheck } from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';

export default function VerifyEmail() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    
    if (user && user.emailVerified) {
      // If already verified, go to login
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    setError('');
    setMessage('');
    
    try {
      await sendEmailVerification(user);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError('Failed to resend email. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleVerified = async () => {
    if (!user) return;
    
    // Force reload user to get fresh emailVerified status
    await user.reload();
    
    if (user.emailVerified) {
      navigate('/login');
    } else {
      setError("Email not verified yet. Please check your inbox and click the link.");
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <MailCheck size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h1>
        <p className="text-gray-600 mb-6">
          We've sent a verification link to<br/>
          <span className="font-semibold text-gray-900">{user.email}</span>
        </p>
        
        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-4">{error}</div>}
        {message && <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-100 mb-4">{message}</div>}

        <div className="space-y-3">
          <Button onClick={handleVerified} fullWidth>
            I've Verified My Email
          </Button>
          
          <Button onClick={handleResend} variant="outline" fullWidth isLoading={resending}>
            Resend Verification Email
          </Button>
        </div>

        <div className="mt-8 text-sm">
          <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700 underline">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
