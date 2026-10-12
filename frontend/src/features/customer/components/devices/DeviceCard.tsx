import { useState } from 'react';
import { MoreVertical, Shield, Lightbulb, Snowflake, Tv, Wifi, Refrigerator, WashingMachine, Plug } from 'lucide-react';
import type { Device, DeviceCategory } from '../../types/device';
import { Button } from '../../../../components/ui/Button';

interface DeviceCardProps {
  device: Device;
  onEdit: (device: Device) => void;
  onRemove: (device: Device) => void;
  onTroubleshoot: (device: Device) => void;
}

export default function DeviceCard({ device, onEdit, onRemove, onTroubleshoot }: DeviceCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getIcon = (category: DeviceCategory) => {
    switch (category) {
      case 'Security': return <Shield size={24} className="text-indigo-600" />;
      case 'Lighting': return <Lightbulb size={24} className="text-yellow-500" />;
      case 'Climate': return <Snowflake size={24} className="text-cyan-500" />;
      case 'Entertainment': return <Tv size={24} className="text-purple-500" />;
      case 'Networking': return <Wifi size={24} className="text-blue-500" />;
      case 'Kitchen': return <Refrigerator size={24} className="text-orange-500" />;
      case 'Cleaning': return <WashingMachine size={24} className="text-teal-500" />;
      default: return <Plug size={24} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-full relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          {getIcon(device.category)}
        </div>
        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <MoreVertical size={20} />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              <button
                onClick={() => { setMenuOpen(false); onEdit(device); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                onClick={() => { setMenuOpen(false); onRemove(device); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-gray-900 truncate">{device.deviceName}</h3>
        <p className="text-sm text-gray-500 truncate">{device.brand} &middot; {device.deviceType}</p>
        <p className="text-sm text-gray-500 mt-2">Location: <span className="font-medium text-gray-700">{device.room}</span></p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center text-xs text-green-600 font-medium mb-4">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
          Registered
        </div>
        <Button 
          variant="outline" 
          fullWidth 
          onClick={() => onTroubleshoot(device)}
          className="text-sm"
        >
          Troubleshoot
        </Button>
      </div>
      
      {/* Overlay for closing menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)}></div>
      )}
    </div>
  );
}
