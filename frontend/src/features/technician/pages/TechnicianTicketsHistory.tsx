import { useEffect, useState } from 'react';
import { ArrowRight, History, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { technicianTicketService } from '../services/technician-ticket.service';
import type { AssignedTicket } from '../services/technician-ticket.service';

type HistoryFilter = 'ALL' | 'COMPLETED';

function formatDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleString();
}

export default function TechnicianTicketsHistory() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<AssignedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('ALL');

  useEffect(() => {
    let active = true;
    technicianTicketService.getTicketHistory()
      .then((loaded) => { if (active) setTickets(loaded); })
      .catch((err: Error) => { if (active) setError(err.message || 'Unable to load ticket history.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleTickets = filter === 'ALL' ? tickets : tickets.filter((ticket) => ticket.status === 'COMPLETED');

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">TECHNICIAN PORTAL</p>
        <h1 className="text-3xl font-bold text-gray-900">Tickets History</h1>
        <p className="mt-2 text-gray-500">Review completed service tickets handled by you.</p>
      </div>
      <div className="mb-6 flex gap-2">
        {(['ALL', 'COMPLETED'] as HistoryFilter[]).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
            {item.charAt(0) + item.slice(1).toLowerCase()}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500"><Loader2 className="mx-auto mb-3 animate-spin" /> Loading ticket history...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : visibleTickets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500"><History className="mx-auto mb-3 text-gray-400" /> <p>No completed tickets yet.</p><p className="mt-1">Completed service tickets will appear here.</p></div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visibleTickets.map((ticket) => (
            <article key={ticket.ticketId} onClick={() => navigate(`/technician/tickets/${encodeURIComponent(ticket.ticketId)}`)} className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-gray-900">{ticket.ticketId}</p>
                  <p className="mt-3 font-semibold text-gray-900">{ticket.deviceName || 'Unnamed device'} <span className="font-normal text-gray-400">· {ticket.deviceType || 'Device'}</span></p>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Completed</span>
              </div>
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="font-medium text-gray-900">{ticket.customerName}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">{ticket.description || 'No problem description recorded.'}</p>
                  <p className="mt-2 text-sm text-gray-500">Completed {formatDate(ticket.completedAt)}</p>
                </div>
                <ArrowRight size={20} className="text-gray-400" aria-label={`View ${ticket.ticketId}`} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
