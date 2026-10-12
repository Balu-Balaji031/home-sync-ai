import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../auth/services/auth.service';
import type { UserProfile } from '../../auth/services/auth.service';

type Decision = 'approve' | 'reject' | null;

export default function AdminFinalApprovals() {
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [decision, setDecision] = useState<Decision>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      setTechnicians(await authService.getFinalApprovalTechnicians());
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to load final approval candidates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTechnicians();
  }, [loadTechnicians]);

  const closeDecision = () => {
    setDecision(null);
    setRejectionReason('');
  };

  const saveDecision = async () => {
    if (!selected || !decision) return;
    if (decision === 'reject' && !rejectionReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await authService.updateFinalTechnicianApproval(
        selected.uid,
        decision === 'approve' ? 'FINAL_APPROVED' : 'REJECTED',
        decision === 'reject' ? rejectionReason.trim() : undefined,
      );
      setTechnicians((current) => current.filter((technician) => technician.uid !== selected.uid));
      setSelected(null);
      closeDecision();
      setMessage(decision === 'approve'
        ? 'Technician approved and made eligible for customer service jobs.'
        : 'Technician application rejected.');
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to save the final approval decision.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">Administration & Verification</p>
        <h1 className="text-3xl font-bold text-slate-900">Final Technician Approval</h1>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
        <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={22} />
        <div>
          <h2 className="font-semibold">Final Admin Review & Job Eligibility</h2>
          <p className="mt-1 text-sm text-blue-800">Once the technician passes practical assessment, the Administrator gives final authorization. Only approved technicians receive customer service tickets.</p>
        </div>
      </div>

      {message && <div className="mb-5 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading final approval candidates...</p> : technicians.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No technicians are pending final approval.</div>
      ) : (
        <div className="space-y-6">
          {technicians.map((technician) => (
            <ApprovalDossier key={technician.uid} technician={technician} onDecision={(nextDecision) => { setSelected(technician); setDecision(nextDecision); setError(''); }} />
          ))}
        </div>
      )}

      {selected && decision && (
        <DecisionModal
          decision={decision}
          rejectionReason={rejectionReason}
          saving={saving}
          onReasonChange={setRejectionReason}
          onCancel={() => { setSelected(null); closeDecision(); }}
          onConfirm={() => void saveDecision()}
        />
      )}
    </div>
  );
}

function ApprovalDossier({ technician, onDecision }: { technician: UserProfile; onDecision: (decision: Exclude<Decision, null>) => void }) {
  const profile = technician.technicianProfile;
  const assessment = technician.application?.assessment;
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Technician Approval Dossier</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{technician.fullName}</h2>
          <p className="text-sm text-slate-500">{technician.email}</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Pending Final Approval</span>
      </div>

      <div className="space-y-5 p-5">
        <DossierSection title="1. Candidate Profile">
          <DataGrid items={[
            ['Name', technician.fullName],
            ['Mobile', technician.mobileNumber || 'Not provided'],
            ['Experience', profile?.yearsOfExperience || 'Not provided'],
            ['Languages', profile?.languages.join(', ') || 'Not provided'],
          ]} />
        </DossierSection>

        <DossierSection title="2. Technical Capabilities">
          <DataGrid items={[
            ['Specializations', profile?.specializations.join(', ') || 'Not provided'],
            ['Skills', profile?.skills.join(', ') || 'Not provided'],
            ['Service Area', profile ? `${profile.serviceArea.city}, ${profile.serviceArea.state} (Radius ${profile.serviceArea.serviceRadius})` : 'Not provided'],
            ['Availability', profile ? `${profile.availability.workingDays.join(', ')} (${profile.availability.startTime} - ${profile.availability.endTime})` : 'Not provided'],
          ]} />
        </DossierSection>

        <DossierSection title="3. Practical Assessment Evaluation" green>
          <DataGrid items={[
            ['Assessment Center', assessment?.centerName || 'Not provided'],
            ['Practical Score', `${assessment?.score ?? 'Not provided'} / 100 (PASSED)`],
            ['Evaluator Feedback', assessment?.evaluationNotes || 'Not provided'],
          ]} />
        </DossierSection>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <Button type="button" variant="danger" onClick={() => onDecision('reject')}>Reject Application</Button>
        <Button type="button" onClick={() => onDecision('approve')}>
          <CheckCircle2 size={17} className="mr-2" />
          Approve Technician (Make Eligible for Jobs)
        </Button>
      </div>
    </section>
  );
}

function DossierSection({ title, green = false, children }: { title: string; green?: boolean; children: ReactNode }) {
  return <div className={`rounded-lg border p-4 ${green ? 'border-green-200 bg-green-50/50' : 'border-slate-200 bg-white'}`}><h3 className={`mb-4 font-semibold ${green ? 'text-green-800' : 'text-slate-900'}`}>{title}</h3>{children}</div>;
}

function DataGrid({ items }: { items: Array<[string, string]> }) {
  return <div className="grid gap-4 sm:grid-cols-2">{items.map(([label, value]) => <div key={label}><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-sm text-slate-700">{value}</p></div>)}</div>;
}

function DecisionModal({ decision, rejectionReason, saving, onReasonChange, onCancel, onConfirm }: { decision: Exclude<Decision, null>; rejectionReason: string; saving: boolean; onReasonChange: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  const approving = decision === 'approve';
  return <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-4"><div className="mx-auto my-16 max-w-lg rounded-xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><h2 className="text-xl font-bold text-slate-900">{approving ? 'Approve Technician?' : 'Reject Application?'}</h2><button type="button" aria-label="Close confirmation" onClick={onCancel} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div><div className="space-y-4 p-5"><p className="text-sm text-slate-600">{approving ? 'This will authorize the technician to receive customer service tickets.' : 'Provide a reason for rejecting this technician application.'}</p>{!approving && <textarea value={rejectionReason} onChange={(event) => onReasonChange(event.target.value)} rows={4} placeholder="Enter rejection reason..." className="w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />}</div><div className="flex justify-end gap-3 border-t border-slate-200 p-5"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="button" variant={approving ? 'primary' : 'danger'} isLoading={saving} onClick={onConfirm}>{approving ? 'Approve Technician' : 'Reject Application'}</Button></div></div></div>;
}
