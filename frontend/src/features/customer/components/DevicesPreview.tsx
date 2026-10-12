import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export default function DevicesPreview() {
  const navigate = useNavigate();
  // Hardcoded to empty state for MVP layout
  const devices: any[] = [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">My Devices</h3>
        {devices.length > 0 && (
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</button>
        )}
      </div>
      
      {devices.length > 0 ? (
        <div className="space-y-4">
          {/* Placeholder for future device list */}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-48 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-900 font-medium mb-1 mt-4">No devices added yet.</p>
          <p className="text-gray-500 text-sm max-w-xs mb-4">
            Add your smart home device to start getting personalized support.
          </p>
          <Button variant="outline" className="text-sm py-2" onClick={() => navigate('/customer/devices')}>
            <Plus size={16} className="mr-1" />
            Add Device
          </Button>
        </div>
      )}
    </div>
  );
}
