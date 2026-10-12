import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../auth/context/AuthContext';
import DashboardWelcome from '../components/DashboardWelcome';
import DashboardSummary from '../components/DashboardSummary';
import NeedsAttention from '../components/NeedsAttention';
import DevicesPreview from '../components/DevicesPreview';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ devices: 0, activeTickets: 0, aiSessions: 0 });

  useEffect(() => {
    if (!user) return undefined;
    const activeStatuses = new Set(['CREATED', 'OPEN', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'REPAIR_STARTED', 'IN_PROGRESS']);
    const subscriptions = [
      onSnapshot(query(collection(db, 'devices'), where('userId', '==', user.uid)), (snapshot) => {
        setCounts((current) => ({ ...current, devices: snapshot.size }));
      }),
      onSnapshot(query(collection(db, 'tickets'), where('userId', '==', user.uid)), (snapshot) => {
        const activeTickets = snapshot.docs.filter((ticket) => activeStatuses.has(String(ticket.data().status))).length;
        setCounts((current) => ({ ...current, activeTickets }));
      }),
      onSnapshot(query(collection(db, 'ai_sessions'), where('userId', '==', user.uid)), (snapshot) => {
        setCounts((current) => ({ ...current, aiSessions: snapshot.size }));
      }),
    ];
    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardWelcome />
      <DashboardSummary counts={counts} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NeedsAttention />
        <DevicesPreview />
      </div>
    </div>
  );
}
