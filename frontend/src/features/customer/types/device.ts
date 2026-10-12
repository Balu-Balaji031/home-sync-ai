export type DeviceCategory = 
  | 'Security' 
  | 'Lighting' 
  | 'Climate' 
  | 'Entertainment' 
  | 'Networking' 
  | 'Kitchen' 
  | 'Cleaning' 
  | 'Other';

export type DeviceType = 
  // Security
  | 'Smart Door Lock'
  | 'Smart Security Camera'
  | 'Smart Video Doorbell'
  | 'Smart Door Sensor'
  // Lighting
  | 'Smart Bulb'
  | 'Smart Light'
  | 'Smart Light Strip'
  // Climate
  | 'Smart AC'
  | 'Smart Air Purifier'
  | 'Smart Fan'
  // Entertainment
  | 'Smart TV'
  | 'Smart Speaker'
  | 'Streaming Device'
  // Networking
  | 'Smart Wi-Fi Router'
  | 'Wi-Fi Mesh System'
  | 'Smart Wi-Fi Extender'
  // Kitchen
  | 'Smart Refrigerator'
  | 'Smart Microwave'
  | 'Smart Dishwasher'
  // Cleaning
  | 'Smart Washing Machine'
  | 'Smart Dryer'
  | 'Robot Vacuum'
  // Other
  | 'Smart Plug'
  | 'Smart Thermostat'
  | 'Smart Hub'
  | 'Smart Sensor'
  | 'Other Smart Device';

export interface Device {
  id: string;
  userId: string;
  deviceType: DeviceType;
  category: DeviceCategory;
  deviceName: string;
  brand: string;
  modelNumber?: string;
  room: string;
  createdAt: string;
  updatedAt: string;
}

export const DEVICE_CATEGORIES: Record<DeviceCategory, DeviceType[]> = {
  'Security': [
    'Smart Door Lock',
    'Smart Security Camera',
    'Smart Video Doorbell',
    'Smart Door Sensor'
  ],
  'Lighting': [
    'Smart Bulb',
    'Smart Light',
    'Smart Light Strip'
  ],
  'Climate': [
    'Smart AC',
    'Smart Air Purifier',
    'Smart Fan'
  ],
  'Entertainment': [
    'Smart TV',
    'Smart Speaker',
    'Streaming Device'
  ],
  'Networking': [
    'Smart Wi-Fi Router',
    'Wi-Fi Mesh System',
    'Smart Wi-Fi Extender'
  ],
  'Kitchen': [
    'Smart Refrigerator',
    'Smart Microwave',
    'Smart Dishwasher'
  ],
  'Cleaning': [
    'Smart Washing Machine',
    'Smart Dryer',
    'Robot Vacuum'
  ],
  'Other': [
    'Smart Plug',
    'Smart Thermostat',
    'Smart Hub',
    'Smart Sensor',
    'Other Smart Device'
  ]
};
