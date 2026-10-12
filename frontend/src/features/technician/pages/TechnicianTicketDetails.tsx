import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Loader2, MapPin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { technicianTicketService } from '../services/technician-ticket.service';
import type { RepairCompletionData, TechnicianTicketDetails as TicketDetails } from '../services/technician-ticket.service';

const STEPS = ['Created', 'Accepted', 'On the Way', 'Arrived', 'Repair Started', 'Completed'];
const OUTCOMES: Array<{ value: RepairCompletionData['repairOutcome']; label: string }> = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'PARTIALLY_FIXED', label: 'Partially Fixed' },
  { value: 'NOT_FIXED', label: 'Not Fixed' },
];

function currentStep(status: string) {
  if (status === 'ACCEPTED') return 1;
  if (status === 'ON_THE_WAY') return 2;
  if (status === 'ARRIVED') return 3;
  if (status === 'REPAIR_STARTED' || status === 'IN_PROGRESS') return 4;
  if (status === 'RESOLVED' || status === 'CLOSED' || status === 'COMPLETED') return 5;
  return 0;
}

function displayValue(value: string | undefined) {
  return value || 'N/A';
}

function formatDate(value: string | undefined) {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function hasUsableAddress(address: string | undefined) {
  return Boolean(address && address.trim() && address.trim() !== 'N/A');
}

export default function TechnicianTicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [startingTravel, setStartingTravel] = useState(false);
  const [markingArrived, setMarkingArrived] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [rootCause, setRootCause] = useState('');
  const [repairPerformed, setRepairPerformed] = useState('');
  const [partsReplaced, setPartsReplaced] = useState('');
  const [additionalRepairNotes, setAdditionalRepairNotes] = useState('');
  const [repairOutcome, setRepairOutcome] = useState<RepairCompletionData['repairOutcome'] | ''>('');
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ticketId) return;
    technicianTicketService.getTicket(ticketId)
      .then(setTicket)
      .catch((err: Error) => setError(err.message || 'Unable to load ticket.'))
      .finally(() => setLoading(false));
  }, [ticketId]);

  async function acceptTicket() {
    if (!ticketId) return;
    setAccepting(true);
    setError('');
    try {
      const updatedTicket = await technicianTicketService.acceptTicket(ticketId);
      setTicket((current) => current ? { ...current, ...updatedTicket } : updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept ticket.');
    } finally {
      setAccepting(false);
    }
  }

  async function startTravel() {
    if (!ticketId) return;
    setStartingTravel(true);
    setError('');
    try {
      const updatedTicket = await technicianTicketService.startTravel(ticketId);
      setTicket((current) => current ? { ...current, ...updatedTicket } : updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update ticket.');
    } finally {
      setStartingTravel(false);
    }
  }

  async function markArrived() {
    if (!ticketId) return;
    setMarkingArrived(true);
    setError('');
    try {
      const updatedTicket = await technicianTicketService.markArrived(ticketId);
      setTicket((current) => current ? { ...current, ...updatedTicket } : updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update ticket.');
    } finally {
      setMarkingArrived(false);
    }
  }

  async function verifyOtp() {
    if (!ticketId) return;
    setVerifying(true);
    setError('');
    try {
      const updatedTicket = await technicianTicketService.verifyCode(ticketId, verificationCode);
      setTicket((current) => current ? { ...current, ...updatedTicket } : updatedTicket);
      setVerificationCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify the OTP.');
    } finally {
      setVerifying(false);
    }
  }

  async function completeRepair() {
    if (!ticketId) return;
    if (!rootCause.trim() || !repairPerformed.trim() || !repairOutcome) {
      setError('Root Cause, Repair Performed, and Repair Outcome are required.');
      return;
    }
    setCompleting(true);
    setError('');
    try {
      const updatedTicket = await technicianTicketService.completeRepair(ticketId, {
        rootCause: rootCause.trim(),
        repairPerformed: repairPerformed.trim(),
        partsReplaced: partsReplaced.trim(),
        additionalRepairNotes: additionalRepairNotes.trim(),
        repairOutcome,
      });
      setTicket((current) => current ? { ...current, ...updatedTicket } : updatedTicket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete repair.');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500"><Loader2 className="mx-auto mb-3 animate-spin" />Loading ticket...</div>;
  if (!ticket) return <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error || 'Ticket not found.'}</div>;

  const activeStep = currentStep(ticket.status);
  const canAccept = ticket.status === 'OPEN' || ticket.status === 'CREATED';
  const canStartTravel = ticket.status === 'ACCEPTED';
  const canMarkArrived = ticket.status === 'ON_THE_WAY';
  const canVerifyOtp = ticket.status === 'ARRIVED';
  const canCompleteRepair = ticket.status === 'REPAIR_STARTED';
  const isCompleted = ticket.status === 'COMPLETED';
  const customerAddress = ticket.customerAddress;
  const hasAddress = hasUsableAddress(customerAddress);
  const mapsUrl = hasAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress.trim())}`
    : undefined;

  return (
    <div className="mx-auto max-w-5xl">
      <button type="button" onClick={() => navigate('/technician/tickets')} className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600">
        <ArrowLeft size={18} /> Back to Tickets
      </button>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">Ticket Details</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900">{ticket.ticketId}</h1>
            <p className="mt-2 text-gray-600">{displayValue(ticket.deviceName)} · {displayValue(ticket.deviceType)}</p>
            <p className="mt-2 text-sm text-gray-500">Created {formatDate(ticket.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{ticket.status.replaceAll('_', ' ')}</span>
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{ticket.priority}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-6">
          {STEPS.map((step, index) => (
            <div key={step} className="text-center">
              <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${index <= activeStep ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {index < activeStep || (isCompleted && index === activeStep) ? <Check size={18} /> : index + 1}
              </div>
              <p className={`mt-2 text-xs font-semibold ${index <= activeStep ? 'text-blue-700' : 'text-gray-400'}`}>{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 border-t border-gray-100 pt-6 md:grid-cols-2">
          <section>
            <h2 className="text-lg font-bold text-gray-900">Customer & Location</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="font-semibold text-gray-500">Customer</dt><dd className="text-gray-900">{displayValue(ticket.customerName)}</dd></div>
              <div><dt className="font-semibold text-gray-500">Phone</dt><dd className="text-gray-900">{displayValue(ticket.customerPhone)}</dd></div>
              <div><dt className="font-semibold text-gray-500">Address</dt><dd className="text-gray-900">{displayValue(ticket.customerAddress)}</dd></div>
            </dl>
            {hasAddress ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <MapPin size={16} />
                Get Directions
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-400"
              >
                <MapPin size={16} />
                Get Directions
              </button>
            )}
            {!hasAddress && <p className="mt-2 text-xs text-gray-500">Customer address is unavailable.</p>}
          </section>
          <section>
            <h2 className="text-lg font-bold text-gray-900">Problem Description</h2>
            <p className="mt-4 text-sm text-gray-700">{displayValue(ticket.description)}</p>
            {ticket.aiSummary && <><h3 className="mt-5 text-sm font-bold text-gray-900">AI Troubleshooting Summary</h3><p className="mt-2 text-sm text-gray-700">{ticket.aiSummary}</p></>}
          </section>
        </div>

        {canAccept && (
          <div className="mt-8 rounded-lg bg-blue-50 p-5">
            <p className="text-sm text-blue-800">Accept this job to begin the service workflow.</p>
            <button type="button" onClick={acceptTicket} disabled={accepting} className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {accepting ? 'Accepting...' : 'Accept Job'}
            </button>
          </div>
        )}
        {canStartTravel && (
          <div className="mt-8 rounded-lg bg-blue-50 p-5">
            <p className="text-sm text-blue-800">Start travel to update the customer that you are on the way.</p>
            <button type="button" onClick={startTravel} disabled={startingTravel} className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {startingTravel ? 'Updating...' : 'On the Way'}
            </button>
          </div>
        )}
        {canMarkArrived && (
          <div className="mt-8 rounded-lg bg-blue-50 p-5">
            <p className="text-sm text-blue-800">Mark the ticket arrived when you reach the customer.</p>
            <button type="button" onClick={markArrived} disabled={markingArrived} className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {markingArrived ? 'Updating...' : 'Arrived'}
            </button>
          </div>
        )}
        {canVerifyOtp && (
          <div className="mt-8 rounded-lg bg-blue-50 p-5">
            <h2 className="text-lg font-bold text-gray-900">OTP Verification</h2>
            <p className="mt-2 text-sm text-blue-800">Ask the customer for the 6-digit OTP shown on their ticket.</p>
            <p className="mt-1 text-sm text-blue-800">Enter it below to verify the customer.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit OTP"
                aria-label="6-digit OTP"
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button type="button" onClick={verifyOtp} disabled={verifying || verificationCode.length !== 6} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                {verifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        )}
        {(canCompleteRepair || isCompleted) && (
          <section className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-5">
            {isCompleted && <h2 className="text-lg font-bold text-green-700">REPAIR COMPLETED ✓</h2>}
            <h2 className={`${isCompleted ? 'mt-5' : ''} text-lg font-bold text-gray-900`}>Repair Details</h2>
            <h3 className="mt-5 text-sm font-bold text-gray-900">AI Troubleshooting History</h3>
            <p className="mt-2 text-sm text-gray-700">{displayValue(ticket.aiSummary)}</p>

            {canCompleteRepair ? (
              <>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Root Cause *
                    <input value={rootCause} onChange={(event) => setRootCause(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                  <label className="text-sm font-semibold text-gray-700">
                    Parts Replaced (Optional)
                    <input value={partsReplaced} onChange={(event) => setPartsReplaced(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                  <label className="text-sm font-semibold text-gray-700 md:col-span-2">
                    Repair Performed *
                    <textarea value={repairPerformed} onChange={(event) => setRepairPerformed(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                  <label className="text-sm font-semibold text-gray-700 md:col-span-2">
                    Additional Notes (Optional)
                    <textarea value={additionalRepairNotes} onChange={(event) => setAdditionalRepairNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-normal text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  </label>
                </div>
                <fieldset className="mt-5">
                  <legend className="text-sm font-semibold text-gray-700">Repair Outcome *</legend>
                  <div className="mt-3 flex flex-wrap gap-4">
                    {OUTCOMES.map((outcome) => (
                      <label key={outcome.value} className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="radio" name="repairOutcome" value={outcome.value} checked={repairOutcome === outcome.value} onChange={() => setRepairOutcome(outcome.value)} />
                        {outcome.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button type="button" onClick={completeRepair} disabled={completing} className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {completing ? 'Completing...' : 'Complete Repair'}
                </button>
              </>
            ) : (
              <dl className="mt-5 space-y-3 text-sm">
                <div><dt className="font-semibold text-gray-500">Root Cause</dt><dd className="text-gray-900">{displayValue(ticket.rootCause)}</dd></div>
                <div><dt className="font-semibold text-gray-500">Repair Performed</dt><dd className="text-gray-900">{displayValue(ticket.repairPerformed)}</dd></div>
                <div><dt className="font-semibold text-gray-500">Parts Replaced</dt><dd className="text-gray-900">{displayValue(ticket.partsReplaced)}</dd></div>
                <div><dt className="font-semibold text-gray-500">Additional Notes</dt><dd className="text-gray-900">{displayValue(ticket.additionalRepairNotes)}</dd></div>
                <div><dt className="font-semibold text-gray-500">Repair Outcome</dt><dd className="text-gray-900">{displayValue(ticket.repairOutcome)}</dd></div>
                <div><dt className="font-semibold text-gray-500">Completed</dt><dd className="text-gray-900">{formatDate(ticket.completedAt)}</dd></div>
              </dl>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
