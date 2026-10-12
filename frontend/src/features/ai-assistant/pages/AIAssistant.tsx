import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { deviceService } from '../../customer/services/device.service';
import { aiService } from '../services/ai.service';
import type { Device } from '../../customer/types/device';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Bot, ChevronRight, MonitorSmartphone } from 'lucide-react';

export default function AIAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      if (!user) return;
      try {
        const fetched = await deviceService.getDevices(user.uid);
        setDevices(fetched);
        
        // If coming from My Devices "Troubleshoot" button
        const stateDevice = location.state?.deviceId;
        if (stateDevice && fetched.find(d => d.id === stateDevice)) {
          setSelectedDeviceId(stateDevice);
        } else if (fetched.length > 0) {
          setSelectedDeviceId(fetched[0].id!);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load devices.');
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, [user, location.state]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId || !problem.trim()) {
      setError('Please select a device and describe the problem.');
      return;
    }
    
    setStarting(true);
    setError('');
    
    try {
      const session = await aiService.createSession({
        deviceId: selectedDeviceId,
        language,
        problem: problem.trim()
      });
      navigate(`/customer/ai-assistant/${session.sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      setStarting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading your devices...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bot size={32} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SmartAssist AI</h1>
        <p className="text-gray-500">Guided smart-home troubleshooting assistant</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleStart} className="p-6 md:p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-2">1</span>
              Select Device
            </h2>
            {devices.length === 0 ? (
              <div className="p-4 border border-gray-200 rounded-xl text-center text-gray-500">
                You have no devices registered. Please add a device first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {devices.map(device => (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => setSelectedDeviceId(device.id!)}
                    className={`flex items-start p-4 border rounded-xl transition-all text-left ${
                      selectedDeviceId === device.id 
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg mr-3 ${selectedDeviceId === device.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      <MonitorSmartphone size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{device.deviceName}</p>
                      <p className="text-sm text-gray-500">{device.brand} • {device.room}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-2">2</span>
              Select Language
            </h2>
            <div className="flex gap-4">
              {[
                { code: 'en', label: 'English' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'te', label: 'తెలుగు' }
              ].map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLanguage(lang.code)}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                    language === lang.code
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm mr-2">3</span>
              Describe the Problem
            </h2>
            <Input
              label=""
              value={problem}
              onChange={e => setProblem(e.target.value)}
              placeholder="e.g., My AC is blowing warm air"
              className="w-full"
              required
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={!selectedDeviceId || !problem.trim() || starting}
              isLoading={starting}
              className="w-full sm:w-auto"
            >
              Start Troubleshooting
              <ChevronRight size={18} className="ml-1" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
