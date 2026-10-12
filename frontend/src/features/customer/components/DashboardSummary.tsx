import { MonitorSmartphone, Ticket, MessageSquare } from 'lucide-react';

interface DashboardCounts {
  devices: number;
  activeTickets: number;
  aiSessions: number;
}

export default function DashboardSummary({ counts }: { counts: DashboardCounts }) {
  const stats = [
    { name: 'My Devices', value: counts.devices, icon: MonitorSmartphone, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Active Tickets', value: counts.activeTickets, icon: Ticket, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'AI Sessions', value: counts.aiSessions, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => (
        <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center">
          <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
            <stat.icon size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
