import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { deviceService } from '../services/device.service';
import type { Device } from '../types/device';
import DeviceList from '../components/devices/DeviceList';
import AddDeviceFlow from '../components/devices/AddDeviceFlow';
import EditDeviceModal from '../components/devices/EditDeviceModal';

export default function MyDevices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<'list' | 'add'>('list');
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  
  const [successMessage, setSuccessMessage] = useState('');

  const loadDevices = async () => {
    if (!user) return;
    try {
      const fetched = await deviceService.getDevices(user.uid);
      setDevices(fetched);
    } catch (error) {
      console.error("Error loading devices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [user]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleAddDevice = async (deviceData: any) => {
    if (!user) return;
    await deviceService.addDevice({
      ...deviceData,
      userId: user.uid,
    });
    await loadDevices();
    setView('list');
    showSuccess('Device added successfully.');
  };

  const handleUpdateDevice = async (id: string, updates: Partial<Device>) => {
    await deviceService.updateDevice(id, updates);
    await loadDevices();
    showSuccess('Device updated successfully.');
  };

  const handleRemoveDevice = async (device: Device) => {
    if (window.confirm('Remove Device?\n\nAre you sure you want to remove this device?')) {
      await deviceService.deleteDevice(device.id);
      await loadDevices();
      showSuccess('Device removed successfully.');
    }
  };

  const handleTroubleshoot = (device: Device) => {
    // Navigate to future AI Assistant page passing the device ID in state
    navigate('/customer/assistant', { state: { selectedDeviceId: device.id } });
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading your devices...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">YOUR HOME</h2>
        <h1 className="text-3xl font-bold text-gray-900">My Devices</h1>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {successMessage}
        </div>
      )}

      {view === 'add' ? (
        <AddDeviceFlow 
          onCancel={() => setView('list')} 
          onSave={handleAddDevice} 
        />
      ) : (
        <DeviceList 
          devices={devices} 
          onAddClick={() => setView('add')} 
          onEdit={setEditingDevice}
          onRemove={handleRemoveDevice}
          onTroubleshoot={handleTroubleshoot}
        />
      )}

      {editingDevice && (
        <EditDeviceModal 
          device={editingDevice} 
          onClose={() => setEditingDevice(null)} 
          onSave={handleUpdateDevice} 
        />
      )}
    </div>
  );
}
