import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, Clock3, Loader2, Ticket as TicketIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ticketService } from '../services/ticket.service';
import type { CreatedTicket } from '../services/ticket.service';

type TicketFilter = 'ALL' | 'ACTIVE' | 'COMPLETED';

const COMPLETED_STATUSES = new Set(['COMPLETED', 'RESOLVED', 'CLOSED']);
const PROGRESS_STAGES = [
  'Ticket Created',
  'Technician Accepted',
  'On the Way',
  'Arrived',
  'Repair Started',
  'Completed',
];

function isCompleted(ticket: CreatedTicket) {
  return COMPLETED_STATUSES.has(ticket.status);
}

function formatDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatPriority(priority: string) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function currentStage(ticket: CreatedTicket) {
  if (isCompleted(ticket)) return 6;
  if (ticket.status === 'REPAIR_STARTED' || ticket.status === 'IN_PROGRESS') return 5;
  if (ticket.status === 'ARRIVED') return 4;
  if (ticket.status === 'ON_THE_WAY') return 3;
  if (ticket.status === 'ACCEPTED') return 2;
  return 1;
}

function statusLabel(status: string) {
  if (status === 'OPEN' || status === 'CREATED') return 'Ticket Created';
  if (status === 'ASSIGNED') return 'Waiting for Technician';
  if (status === 'ACCEPTED') return 'Technician Accepted';
  if (status === 'ON_THE_WAY') return 'On the Way';
  if (status === 'ARRIVED') return 'Arrived';
  if (status === 'REPAIR_STARTED' || status === 'IN_PROGRESS') return 'Repair Started';
  if (isCompleted({ status } as CreatedTicket)) return 'Completed';
  return status.replaceAll('_', ' ');
}

function statusMessage(status: string) {
  if (status === 'OPEN' || status === 'CREATED') return ['Ticket Created', 'Your service request has been created. Waiting for technician assignment.'];
  if (status === 'ASSIGNED') return ['Waiting for Technician', 'Your service request is waiting for technician acceptance.'];
  if (status === 'ACCEPTED') return ['Technician Accepted', 'A technician has accepted your request.'];
  if (status === 'ON_THE_WAY') return ['On the Way', 'Your technician is on the way.'];
  if (status === 'ARRIVED') return ['Arrived', 'Your technician has arrived. Please provide the verification code.'];
  if (status === 'REPAIR_STARTED' || status === 'IN_PROGRESS') return ['Repair Started', 'Repair is currently in progress.'];
  if (isCompleted({ status } as CreatedTicket)) return ['Completed', 'Repair completed successfully.'];
  return [statusLabel(status), 'Your service request is being processed.'];
}

function TicketCard({ ticket, onOpen }: { ticket: CreatedTicket; onOpen: () => void }) {
  const completed = isCompleted(ticket);
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold text-gray-900">{ticket.ticketId}</p>
          <h2 className="mt-4 font-semibold text-gray-900">{ticket.deviceName || ticket.deviceType || 'Smart home device'}</h2>
          <p className="mt-1 text-gray-600">{ticket.description || ticket.title || 'No problem description recorded.'}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${completed ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
          {completed ? 'Completed' : formatPriority(ticket.priority)}
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
        <div>
          <p className="text-xs font-medium text-gray-400">{completed ? 'Completed' : 'Status'}</p>
          <p className="mt-1 text-sm text-gray-600">{completed ? formatDate(ticket.updatedAt) : statusLabel(ticket.status)}</p>
        </div>
        <button type="button" onClick={onOpen} className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
          View Ticket <ChevronRight size={17} className="ml-1" />
        </button>
      </div>
    </article>
  );
}

function TicketProgress({ ticket }: { ticket: CreatedTicket }) {
  const activeStage = currentStage(ticket);
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold tracking-wider text-gray-400">SERVICE PROGRESS</h2>
      <div className="mt-5 space-y-4">
        {PROGRESS_STAGES.map((stage, index) => {
          const complete = index < activeStage;
          const current = index === activeStage;
          return (
            <div key={stage} className={`flex items-center gap-3 ${current ? 'font-semibold text-blue-700' : complete ? 'text-gray-700' : 'text-gray-400'}`}>
              {complete ? <CheckCircle2 size={19} className="text-green-600" /> : current ? <Clock3 size={19} className="text-blue-600" /> : <span className="h-[19px] w-[19px] rounded-full border-2 border-current" />}
              <span>{stage}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TicketDetails({ ticket, onBack }: { ticket: CreatedTicket; onBack: () => void }) {
  const [heading, message] = statusMessage(ticket.status);
  const hasTechnician = Boolean(ticket.assignedTechnicianId || ticket.assignedTechnicianName);
  return (
    <div className="max-w-5xl mx-auto">
      <button type="button" onClick={onBack} className="mb-6 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
        <ArrowLeft size={17} className="mr-2" /> Back to My Tickets
      </button>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold tracking-wider text-gray-400">SERVICE TICKET</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{ticket.ticketId}</h1>
        <h2 className="mt-5 text-lg font-semibold text-gray-900">{ticket.deviceName || ticket.deviceType || 'Smart home device'}</h2>
        <p className="mt-1 text-gray-700">{ticket.description || ticket.title || 'No problem description recorded.'}</p>
        <div className="mt-5 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">
          <div><p className="text-xs text-gray-400">Priority</p><p className="mt-1 font-medium text-gray-900">{formatPriority(ticket.priority)}</p></div>
          <div><p className="text-xs text-gray-400">Created</p><p className="mt-1 font-medium text-gray-900">{formatDate(ticket.createdAt)}</p></div>
          <div><p className="text-xs text-gray-400">Status</p><p className="mt-1 font-medium text-gray-900">{statusLabel(ticket.status)}</p></div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TicketProgress ticket={ticket} />
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold tracking-wider text-gray-400">SERVICE VERIFICATION</h2>
          <p className="mt-5 text-3xl font-bold tracking-[0.35em] text-gray-900">{ticket.verificationCode || '------'}</p>
          <p className="mt-3 text-sm text-gray-500">{ticket.verificationCode ? 'Give this 6-digit code to the technician when they arrive.' : 'A verification code is not available for this ticket.'}</p>
          {ticket.verificationStatus === 'VERIFIED' && <p className="mt-3 text-sm font-semibold text-green-700">Code Verified</p>}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold tracking-wider text-gray-400">SERVICE DETAILS</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-gray-400">Device</p><p className="mt-1 font-medium text-gray-900">{ticket.deviceName || ticket.deviceType || 'Unavailable'}</p></div>
          <div><p className="text-xs text-gray-400">Problem</p><p className="mt-1 font-medium text-gray-900">{ticket.description || ticket.title || 'Unavailable'}</p></div>
          <div><p className="text-xs text-gray-400">Priority</p><p className="mt-1 font-medium text-gray-900">{formatPriority(ticket.priority)}</p></div>
          <div><p className="text-xs text-gray-400">Created</p><p className="mt-1 font-medium text-gray-900">{formatDate(ticket.createdAt)}</p></div>
        </div>
      </section>

      {hasTechnician && (
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold tracking-wider text-gray-400">TECHNICIAN</h2>
          <p className="mt-4 font-semibold text-gray-900">{ticket.assignedTechnicianName || 'Assigned technician'}</p>
          <p className="mt-1 text-sm text-gray-500">Verified Technician</p>
          {ticket.assignedTechnicianSpecialization && <p className="mt-3 text-sm text-gray-600">Specialization: {ticket.assignedTechnicianSpecialization}</p>}
        </section>
      )}

      <section className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="font-semibold text-blue-900">{heading}</h2>
        <p className="mt-1 text-sm text-blue-800">{message}</p>
      </section>
    </div>
  );
}

export default function MyTickets() {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId?: string }>();
  const [tickets, setTickets] = useState<CreatedTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<CreatedTicket | null>(null);
  const [filter, setFilter] = useState<TicketFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    setLoading(true);
    setError('');
    setSelectedTicket(null);
    Promise.all([
      ticketService.getTickets(),
      ticketId ? ticketService.getTicket(ticketId) : Promise.resolve(null),
    ])
      .then(([loaded, detail]) => {
        if (!active) return;
        setTickets(loaded);
        setSelectedTicket(detail);
        if (ticketId) {
          unsubscribe = ticketService.subscribeToTicket(
            ticketId,
            (updatedTicket) => {
              if (!active) return;
              setSelectedTicket(updatedTicket);
              setTickets((currentTickets) => currentTickets.map((ticket) => (
                ticket.ticketId === updatedTicket.ticketId ? updatedTicket : ticket
              )));
            },
            (listenerError) => {
              if (active) setError(listenerError.message || 'Unable to listen for ticket updates.');
            },
          );
        }
      })
      .catch((err: Error) => { if (active) setError(err.message || 'Unable to load your tickets.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [ticketId]);

  const counts = useMemo(() => ({
    ALL: tickets.length,
    ACTIVE: tickets.filter((ticket) => !isCompleted(ticket)).length,
    COMPLETED: tickets.filter(isCompleted).length,
  }), [tickets]);

  const visibleTickets = useMemo(() => tickets.filter((ticket) => (
    filter === 'ALL' || (filter === 'COMPLETED' ? isCompleted(ticket) : !isCompleted(ticket))
  )), [filter, tickets]);

  if (ticketId) {
    if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="mx-auto mb-4 animate-spin" /> Loading ticket...</div>;
    if (!selectedTicket) return <div className="p-8 text-center text-red-600">{error || 'Ticket not found.'}</div>;
    return <TicketDetails ticket={selectedTicket} onBack={() => navigate('/customer/tickets')} />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-gray-400">MY TICKETS</p>
        <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
        <p className="mt-2 text-gray-500">Track your service requests and repair progress.</p>
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {(['ALL', 'ACTIVE', 'COMPLETED'] as TicketFilter[]).map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'}`}>
            {item.charAt(0) + item.slice(1).toLowerCase()} ({counts[item]})
          </button>
        ))}
      </div>
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500"><Loader2 className="mx-auto mb-3 animate-spin" /> Loading your tickets...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : visibleTickets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500"><TicketIcon className="mx-auto mb-3 text-gray-400" /> No tickets found.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">{visibleTickets.map((ticket) => <TicketCard key={ticket.ticketId} ticket={ticket} onOpen={() => navigate(`/customer/tickets/${ticket.ticketId}`)} />)}</div>
      )}
    </div>
  );
}
