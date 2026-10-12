import { useState } from 'react';
import type { Device } from '../../types/device';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface EditDeviceModalProps {
  device: Device;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Device>) => Promise<void>;
}

export default function EditDeviceModal({ device, onClose, onSave }: EditDeviceModalProps) {
  const [formData, setFormData] = useState({
    deviceName: device.deviceName,
    brand: device.brand,
    modelNumber: device.modelNumber || '',
    room: device.room
  });
  const [saving, setSaving] = useState(false);

  const rooms = [
    { value: 'Living Room', label: 'Living Room' },
    { value: 'Bedroom', label: 'Bedroom' },
    { value: 'Kitchen', label: 'Kitchen' },
    { value: 'Dining Room', label: 'Dining Room' },
    { value: 'Bathroom', label: 'Bathroom' },
    { value: 'Entrance', label: 'Entrance' },
    { value: 'Office', label: 'Office' },
    { value: 'Other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(device.id, formData);
      onClose();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-900">Edit Device</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
            <input type="text" disabled value={device.deviceType} className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed text-sm" />
          </div>

          <Input 
            label="Device Name" 
            value={formData.deviceName} 
            onChange={e => setFormData({...formData, deviceName: e.target.value})} 
            required 
          />
          <Input 
            label="Brand" 
            value={formData.brand} 
            onChange={e => setFormData({...formData, brand: e.target.value})} 
            required 
          />
          <Input 
            label="Model Number (Optional)" 
            value={formData.modelNumber} 
            onChange={e => setFormData({...formData, modelNumber: e.target.value})} 
          />
          <Select 
            label="Room" 
            options={rooms} 
            value={formData.room} 
            onChange={e => setFormData({...formData, room: e.target.value})} 
            required 
          />

          <div className="pt-4 flex space-x-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
