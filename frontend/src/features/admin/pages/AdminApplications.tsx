import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { authService } from '../../auth/services/auth.service';
import type { TechnicianApplicationStatus, UserProfile } from '../../auth/services/auth.service';

type Action = 'approve' | 'changes' | 'reject' | null;

function formatDate(value: unknown): string {
  if (!value) return 'Not provided';
  if (typeof value === 'string') return new Date(value).toLocaleDateString();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toLocaleDateString();
  }
  return 'Not provided';
}

export default function AdminApplications() {
  const [applications, setApplications] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [action, setAction] = useState<Action>(null);
  const [feedback, setFeedback] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      setApplications(await authService.getPendingTechnicianApplications());
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to load technician applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const updateApplication = async (status: TechnicianApplicationStatus) => {
    if (!selected) return;
    if (status === 'CHANGES_REQUIRED' && !feedback.trim()) {
      setError('Feedback is required when requesting changes.');
      return;
    }
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await authService.updateTechnicianApplication(selected.uid, {
        status,
        ...(status === 'CHANGES_REQUIRED' ? { feedback: feedback.trim() } : {}),
        ...(status === 'REJECTED' ? { rejectionReason: rejectionReason.trim() } : {}),
        ...(status === 'APPROVED_FOR_ASSESSMENT' ? { approvedForAssessmentAt: new Date().toISOString() } : {}),
      });
      setSelected(null);
      setAction(null);
      setFeedback('');
      setRejectionReason('');
      setMessage(status === 'APPROVED_FOR_ASSESSMENT'
        ? 'Technician approved for assessment.'
        : status === 'CHANGES_REQUIRED'
          ? 'Change request sent to the technician.'
          : 'Application rejected.');
      await loadApplications();
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to update this application.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">Administration & Verification</p>
        <h1 className="text-3xl font-bold text-slate-900">Technician Applications</h1>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
        <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={22} />
        <div><h2 className="font-semibold">Technician Verification Workflow</h2><p className="mt-1 text-sm text-blue-800">Review submitted technician profiles. Approving at this stage authorizes the technician for practical evaluation at an assessment center.</p></div>
      </div>

      {message && <div className="mb-5 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">Submitted Applications</h2>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{applications.length} Pending</span>
        </div>
        {loading ? <p className="p-8 text-center text-slate-500">Loading applications...</p> : applications.length === 0 ? <p className="p-8 text-center text-slate-500">No pending technician applications.</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr>{['Technician Name', 'Specialization', 'Experience', 'Languages', 'Service Area', 'Application Date', 'Status', 'Action'].map((heading) => <th key={heading} className="px-5 py-3 font-semibold">{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((application) => <tr key={application.uid} className="align-top">
                  <td className="px-5 py-4"><p className="font-semibold text-slate-900">{application.fullName}</p><p className="mt-1 text-xs text-slate-500">{application.email}</p></td>
                  <td className="px-5 py-4 text-slate-600">{application.technicianProfile?.specializations.join(', ') || 'Not provided'}</td>
                  <td className="px-5 py-4 text-slate-600">{application.technicianProfile?.yearsOfExperience || 'Not provided'}</td>
                  <td className="px-5 py-4 text-slate-600">{application.technicianProfile?.languages.join(', ') || 'Not provided'}</td>
                  <td className="px-5 py-4 text-slate-600">{application.technicianProfile?.serviceArea.city || 'Not provided'}{application.technicianProfile?.serviceArea.state ? `, ${application.technicianProfile.serviceArea.state}` : ''}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-slate-600">{formatDate(application.application?.submittedAt)}</td>
                  <td className="px-5 py-4"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending Review</span></td>
                  <td className="px-5 py-4"><Button type="button" variant="outline" className="whitespace-nowrap" onClick={() => setSelected(application)}>View Application</Button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && <ApplicationModal application={selected} onClose={() => setSelected(null)} onAction={setAction} />}
      {action && selected && <ActionDialog action={action} saving={saving} feedback={feedback} rejectionReason={rejectionReason} setFeedback={setFeedback} setRejectionReason={setRejectionReason} onCancel={() => setAction(null)} onConfirm={() => void updateApplication(action === 'approve' ? 'APPROVED_FOR_ASSESSMENT' : action === 'changes' ? 'CHANGES_REQUIRED' : 'REJECTED')} />}
    </div>
  );
}

function ApplicationModal({ application, onClose, onAction }: { application: UserProfile; onClose: () => void; onAction: (action: Exclude<Action, null>) => void }) {
  const data = application.technicianProfile;
  return <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-4"><div className="mx-auto my-6 max-w-4xl rounded-xl bg-white shadow-xl"><div className="flex items-start justify-between border-b border-slate-200 p-6"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Technician Application</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{application.fullName}</h2><p className="mt-2 text-sm text-slate-500">Application ID: {application.uid}</p><p className="text-sm text-slate-500">Submitted: {formatDate(application.application?.submittedAt)}</p></div><button type="button" onClick={onClose} aria-label="Close application" className="text-slate-400 hover:text-slate-700"><X /></button></div><div className="grid gap-6 p-6 md:grid-cols-2"><Detail title="Personal Information" values={[`Full Name: ${application.fullName}`, `Email Address: ${application.email}`, `Mobile Number: ${application.mobileNumber || 'Not provided'}`]} /><Detail title="Professional Information" values={[`Experience: ${data?.yearsOfExperience || 'Not provided'}`, `Specializations: ${data?.specializations.join(', ') || 'Not provided'}`, `Skills / Categories: ${data?.skills.join(', ') || 'Not provided'}`, `Languages: ${data?.languages.join(', ') || 'Not provided'}`]} /><Detail title="Summary" values={[data?.professionalDescription || 'Not provided']} /><Detail title="Service Area & Availability" values={data ? [`City & State: ${data.serviceArea.city}, ${data.serviceArea.state}`, `Service Radius: ${data.serviceArea.serviceRadius}`, `Pincodes: ${data.serviceArea.pincodes}`, `Working Schedule: ${data.availability.workingDays.join(', ')} (${data.availability.startTime} - ${data.availability.endTime})`] : ['Not provided']} /></div><div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 p-6"><Button type="button" variant="danger" onClick={() => onAction('reject')}>Reject Application</Button><Button type="button" variant="secondary" onClick={() => onAction('changes')}>Request Changes</Button><Button type="button" onClick={() => onAction('approve')}>Approve for Assessment</Button></div></div></div>;
}

function Detail({ title, values }: { title: string; values: string[] }) {
  return <section><h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3><div className="mt-3 space-y-2 text-sm text-slate-600">{values.map((value) => <p key={value}>{value}</p>)}</div></section>;
}

function ActionDialog({ action, saving, feedback, rejectionReason, setFeedback, setRejectionReason, onCancel, onConfirm }: { action: Exclude<Action, null>; saving: boolean; feedback: string; rejectionReason: string; setFeedback: (value: string) => void; setRejectionReason: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  const isChanges = action === 'changes';
  const isReject = action === 'reject';
  const title = action === 'approve' ? 'Approve for Assessment?' : isChanges ? 'Request Changes' : 'Reject Application?';
  const description = action === 'approve' ? 'This will move the technician to the Assessment stage.' : isChanges ? 'Please provide feedback for the technician.' : 'Are you sure you want to reject this technician application?';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p>{isChanges && <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} rows={4} placeholder="Admin feedback" className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />}{isReject && <textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={3} placeholder="Rejection reason" className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />}<div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button><Button type="button" variant={isReject ? 'danger' : 'primary'} onClick={onConfirm} isLoading={saving}>{isChanges ? 'Request Changes' : action === 'approve' ? 'Approve for Assessment' : 'Reject Application'}</Button></div></div></div>;
}
