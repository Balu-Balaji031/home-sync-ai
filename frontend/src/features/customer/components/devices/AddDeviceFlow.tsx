import { useState } from 'react';
import { 
  Search, ChevronRight, ArrowLeft,
  Lock, Camera, Bell, Zap,
  Lightbulb, Snowflake, Wind, Fan,
  Tv, Speaker, MonitorPlay,
  Router, Network, Wifi,
  Refrigerator, Microwave, Utensils,
  WashingMachine, Disc,
  Plug, Thermometer, Box, Activity, Home
} from 'lucide-react';
import { DEVICE_CATEGORIES } from '../../types/device';
import type { DeviceCategory, DeviceType } from '../../types/device';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { Button } from '../../../../components/ui/Button';

interface AddDeviceFlowProps {
  onCancel: () => void;
  onSave: (device: {
    deviceType: DeviceType;
    category: DeviceCategory;
    deviceName: string;
    brand: string;
    modelNumber?: string;
    room: string;
  }) => Promise<void>;
}

export default function AddDeviceFlow({ onCancel, onSave }: AddDeviceFlowProps) {
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory>('Security');
  const [selectedType, setSelectedType] = useState<DeviceType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    deviceName: '',
    brand: '',
    modelNumber: '',
    room: 'Living Room'
  });
  const [saving, setSaving] = useState(false);

  const categories = Object.keys(DEVICE_CATEGORIES) as DeviceCategory[];
  
  // Filter types based on search
  const displayedTypes = searchQuery.trim() !== '' 
    ? Object.entries(DEVICE_CATEGORIES).flatMap(([cat, types]) => 
        types.filter(t => t.toLowerCase().includes(searchQuery.toLowerCase())).map(t => ({ type: t, category: cat as DeviceCategory }))
      )
    : DEVICE_CATEGORIES[selectedCategory].map(t => ({ type: t, category: selectedCategory }));

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

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      // Security
      case 'Smart Door Lock': return <Lock size={24} className="text-blue-600" />;
      case 'Smart Security Camera': return <Camera size={24} className="text-blue-600" />;
      case 'Smart Video Doorbell': return <Bell size={24} className="text-blue-600" />;
      case 'Smart Door Sensor': return <Zap size={24} className="text-blue-600" />;
      // Lighting
      case 'Smart Bulb':
      case 'Smart Light':
      case 'Smart Light Strip': return <Lightbulb size={24} className="text-blue-600" />;
      // Climate
      case 'Smart AC': return <Snowflake size={24} className="text-blue-600" />;
      case 'Smart Air Purifier': return <Wind size={24} className="text-blue-600" />;
      case 'Smart Fan': return <Fan size={24} className="text-blue-600" />;
      // Entertainment
      case 'Smart TV': return <Tv size={24} className="text-blue-600" />;
      case 'Smart Speaker': return <Speaker size={24} className="text-blue-600" />;
      case 'Streaming Device': return <MonitorPlay size={24} className="text-blue-600" />;
      // Networking
      case 'Smart Wi-Fi Router': return <Router size={24} className="text-blue-600" />;
      case 'Wi-Fi Mesh System': return <Network size={24} className="text-blue-600" />;
      case 'Smart Wi-Fi Extender': return <Wifi size={24} className="text-blue-600" />;
      // Kitchen
      case 'Smart Refrigerator': return <Refrigerator size={24} className="text-blue-600" />;
      case 'Smart Microwave': return <Microwave size={24} className="text-blue-600" />;
      case 'Smart Dishwasher': return <Utensils size={24} className="text-blue-600" />;
      // Cleaning
      case 'Smart Washing Machine': return <WashingMachine size={24} className="text-blue-600" />;
      case 'Smart Dryer': return <Wind size={24} className="text-blue-600" />;
      case 'Robot Vacuum': return <Disc size={24} className="text-blue-600" />;
      // Other
      case 'Smart Plug': return <Plug size={24} className="text-blue-600" />;
      case 'Smart Thermostat': return <Thermometer size={24} className="text-blue-600" />;
      case 'Smart Hub': return <Box size={24} className="text-blue-600" />;
      case 'Smart Sensor': return <Activity size={24} className="text-blue-600" />;
      case 'Other Smart Device': return <Home size={24} className="text-blue-600" />;
      default: return <Home size={24} className="text-blue-600" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    
    setSaving(true);
    let trueCategory = selectedCategory;
    for (const [cat, types] of Object.entries(DEVICE_CATEGORIES)) {
      if ((types as string[]).includes(selectedType)) {
        trueCategory = cat as DeviceCategory;
        break;
      }
    }

    try {
      await onSave({
        deviceType: selectedType,
        category: trueCategory,
        ...formData
      });
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  if (selectedType) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center">
          <button onClick={() => setSelectedType(null)} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add {selectedType}</h2>
            <p className="text-sm text-gray-500">Provide details for your device.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input 
            label="Device Name" 
            placeholder="e.g. Bedroom AC"
            value={formData.deviceName} 
            onChange={e => setFormData({...formData, deviceName: e.target.value})} 
            required 
          />
          <Input 
            label="Brand" 
            placeholder="e.g. Samsung"
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
          <div className="pt-6 flex space-x-4">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} className="flex-1">
              Add Device
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Choose a device</h2>
          <p className="text-gray-500 text-sm">Select the smart-home device you want to add.</p>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search devices"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full md:w-64"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Categories Sidebar */}
        {!searchQuery && (
          <div className="w-full md:w-48 flex-shrink-0 border-r border-gray-100 pr-4">
            <div className="space-y-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    selectedCategory === cat 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {cat}
                  <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                    {DEVICE_CATEGORIES[cat].length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Types Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTypes.map(({ type, category }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="flex flex-col items-start p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="p-2 bg-blue-50 rounded-lg mb-3 group-hover:bg-blue-100 transition-colors">
                {getDeviceIcon(type)}
              </div>
              <div className="w-full flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-blue-700">{type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{category}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600" />
              </div>
            </button>
          ))}
          {displayedTypes.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No devices found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
