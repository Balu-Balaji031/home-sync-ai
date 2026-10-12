import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2, Search, Ticket as TicketIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { technicianTicketService } from '../services/technician-ticket.service';
import type { AssignedTicket } from '../services/technician-ticket.service';

type TicketFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

const COMPLETED_STATUSES = new Set(['RESOLVED', 'CLOSED', 'COMPLETED']);
const IN_PROGRESS_STATUSES = new Set(['IN_PROGRESS', 'REPAIR_STARTED', 'ON_THE_WAY', 'ARRIVED']);

function isCompleted(ticket: AssignedTicket) {
  return COMPLETED_STATUSES.has(ticket.status);
}

function isInProgress(ticket: AssignedTicket) {
  return IN_PROGRESS_STATUSES.has(ticket.status);
}

function statusLabel(status: string) {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function matchesFilter(ticket: AssignedTicket, filter: TicketFilter) {
  if (filter === 'ALL') return true;
  if (filter === 'COMPLETED') return isCompleted(ticket);
  if (filter === 'IN_PROGRESS') return isInProgress(ticket);
  return !isCompleted(ticket) && !isInProgress(ticket);
}

function TicketCard({ ticket }: { ticket: AssignedTicket }) {
  const navigate = useNavigate();
  return (
    <article onClick={() => navigate(`/technician/tickets/${encodeURIComponent(ticket.ticketId)}`)} className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-bold text-gray-900">{ticket.ticketId}</p>
          <p className="mt-4 truncate font-semibold text-gray-900">
            {ticket.deviceName || 'Unnamed device'} <span className="font-normal text-gray-400">· {ticket.deviceType || 'Device'}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{statusLabel(ticket.status)}</span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{statusLabel(ticket.priority)}</span>
        </div>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-gray-100 pt-4">
        <div className="min-w-0">
          <p className="font-medium text-gray-900">{ticket.customerName}</p>
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{ticket.description || 'No problem description recorded.'}</p>
        </div>
        <ArrowRight size={20} className="shrink-0 text-gray-400" aria-label={`View ${ticket.ticketId}`} />
      </div>
    </article>
  );
}

export default function TechnicianTickets() {
  const [tickets, setTickets] = useState<AssignedTicket[]>([]);
  const [filter, setFilter] = useState<TicketFilter>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    technicianTicketService.getAssignedTickets()
      .then((loaded) => { if (active) setTickets(loaded); })
      .catch((err: Error) => { if (active) setError(err.message || 'Unable to load assigned tickets.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const searchable = [ticket.ticketId, ticket.deviceName, ticket.customerName].join(' ').toLowerCase();
      return matchesFilter(ticket, filter) && (!term || searchable.includes(term));
    });
  }, [filter, search, tickets]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">TECHNICIAN PORTAL</p>
        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
        <p className="mt-2 text-gray-500">Manage all your assigned service tickets</p>
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ticket ID, device, or customer..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as TicketFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}
            >
              {item === 'IN_PROGRESS' ? 'In Progress' : item.charAt(0) + item.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500"><Loader2 className="mx-auto mb-3 animate-spin" /> Loading assigned tickets...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500"><TicketIcon className="mx-auto mb-3 text-gray-400" /> No assigned tickets found.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">{filteredTickets.map((ticket) => <TicketCard key={ticket.ticketId} ticket={ticket} />)}</div>
      )}
    </div>
  );
}
