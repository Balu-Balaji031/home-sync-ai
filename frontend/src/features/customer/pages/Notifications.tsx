import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, CircleUserRound, Cpu, Loader2, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notification.service';
import type { CustomerNotification, NotificationType } from '../services/notification.service';

type Filter = 'ALL' | NotificationType;

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function notificationIcon(type: NotificationType) {
  if (type === 'SERVICE') return <Ticket size={19} />;
  if (type === 'AI') return <Cpu size={19} />;
  return <CircleUserRound size={19} />;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    try {
      return notificationService.subscribe(
        (nextNotifications) => {
          setNotifications(nextNotifications);
          setLoading(false);
        },
        (listenerError) => {
          setError(listenerError.message || 'Unable to load notifications.');
          setLoading(false);
        },
      );
    } catch (listenerError) {
      setError(listenerError instanceof Error ? listenerError.message : 'Unable to load notifications.');
      setLoading(false);
      return undefined;
    }
  }, []);

  const visibleNotifications = useMemo(() => notifications.filter((notification) => (
    filter === 'ALL' || notification.type === filter
  )), [filter, notifications]);

  const openNotification = async (notification: CustomerNotification) => {
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.notificationId);
      setNotifications((current) => current.map((item) => (
        item.notificationId === notification.notificationId ? { ...item, isRead: true } : item
      )));
    }
    if (notification.ticketId) navigate(`/customer/tickets/${notification.ticketId}`);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">UPDATES</p>
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-2 text-gray-500">Service and account updates in one place.</p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(['ALL', 'SERVICE', 'AI', 'ACCOUNT'] as Filter[]).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
            {item.charAt(0) + item.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500"><Loader2 className="mx-auto mb-3 animate-spin" /> Loading notifications...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : visibleNotifications.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500"><Bell className="mx-auto mb-3 text-gray-400" /> No notifications yet.</div>
      ) : (
        <div className="space-y-3">
          {visibleNotifications.map((notification) => (
            <button key={notification.notificationId} type="button" onClick={() => void openNotification(notification)} className="flex w-full items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow">
              <span className={`mt-0.5 rounded-full p-2 ${notification.isRead ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>{notification.isRead ? <CheckCircle2 size={19} /> : notificationIcon(notification.type)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-900">{notification.title}</span>
                  {!notification.isRead && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />}
                </span>
                <span className="mt-1 block text-sm text-gray-600">{notification.message}</span>
                <span className="mt-2 block text-xs text-gray-400">{formatTime(notification.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
