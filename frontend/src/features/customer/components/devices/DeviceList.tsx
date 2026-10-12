import { Plus } from 'lucide-react';
import type { Device } from '../../types/device';
import DeviceCard from './DeviceCard';
import { Button } from '../../../../components/ui/Button';

interface DeviceListProps {
  devices: Device[];
  onAddClick: () => void;
  onEdit: (device: Device) => void;
  onRemove: (device: Device) => void;
  onTroubleshoot: (device: Device) => void;
}

export default function DeviceList({ devices, onAddClick, onEdit, onRemove, onTroubleshoot }: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">No devices added yet.</h3>
        <p className="text-gray-500 max-w-md mb-8">
          Add your smart home device to start getting personalized troubleshooting support.
        </p>
        <Button onClick={onAddClick}>
          <Plus size={20} className="mr-2" />
          Add Device
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">Manage your registered smart-home devices.</p>
        <Button onClick={onAddClick}>
          <Plus size={20} className="mr-2" />
          Add Device
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <DeviceCard 
            key={device.id} 
            device={device} 
            onEdit={onEdit}
            onRemove={onRemove}
            onTroubleshoot={onTroubleshoot}
          />
        ))}
      </div>
    </div>
  );
}
