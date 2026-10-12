import { useAuth } from '../../auth/context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DashboardWelcome() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.fullName || 'Customer'}
          </h2>
          <p className="text-gray-600 max-w-2xl">
            Get help with your smart home devices, troubleshoot problems, and track your support requests.
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button type="button" onClick={() => navigate('/customer/ai-assistant')} className="py-3 px-6 text-base shadow-sm">
            <Bot className="mr-2" size={20} />
            Start AI Troubleshooting
          </Button>
        </div>
      </div>
    </div>
  );
}
