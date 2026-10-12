import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarCheck, ClipboardCheck, MapPin, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authService } from '../../auth/services/auth.service';
import type { UserProfile } from '../../auth/services/auth.service';

const DEFAULT_INSTRUCTIONS = 'Bring required hand tools, multimeter, and arrive 15 minutes early.';

const ASSESSMENT_CENTERS = [
  {
    centerId: 'raja-ram-electrical',
    centerName: 'Raja Ram Electrical',
    address: 'Santhosh Theatre, 170, Madurai Road, Opposite Srivilliputhur, Ramakrishnapuram, Mangapuram, Srivilliputhur, Tamil Nadu 626125',
  },
  {
    centerId: 'muthu-electricals',
    centerName: 'Muthu Electricals',
    address: '35, Athukadai Street, Mangapuram, Srivilliputhur, Tamil Nadu 626125',
  },
  {
    centerId: 'hajee-electricals',
    centerName: 'Hajee Electricals',
    address: '130/A, Madurai Road, Madura Coats Colony, Sivagami Puram, Virudhunagar, Tamil Nadu 626001',
  },
  {
    centerId: 'ak-electrical',
    centerName: 'AK Electrical',
    address: 'Mallankinaru Road, MGR Nagar, Pandian Nagar, Virudhunagar, Tamil Nadu 626001',
  },
  {
    centerId: 'moksh-electricals',
    centerName: 'Moksh Electricals',
    address: 'No 3, Sourastra Lane, West Masi Street (Opposite Malabar Gold), Madurai Main, Madurai, Tamil Nadu 625001',
  },
  {
    centerId: 'shahjee-electricals',
    centerName: 'Shahjee Electricals',
    address: '268, W Masi St, Madurai Main, Madurai, Tamil Nadu 625001',
  },
] as const;

type AssignmentForm = {
  centerId: string;
  specializationTrack: string;
  assessmentDate: string;
  assessmentTime: string;
  instructions: string;
};

function initialAssignment(technician?: UserProfile): AssignmentForm {
  const assessment = technician?.application?.assessment;
  return {
    centerId: assessment?.centerId || '',
    specializationTrack: assessment?.specializationTrack || technician?.technicianProfile?.specializations[0] || '',
    assessmentDate: assessment?.assessmentDate || '',
    assessmentTime: assessment?.assessmentTime || '',
    instructions: assessment?.instructions || DEFAULT_INSTRUCTIONS,
  };
}

export default function AdminAssessments() {
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [modalMode, setModalMode] = useState<'assignment' | 'evaluation' | null>(null);
  const [assignment, setAssignment] = useState<AssignmentForm>(() => initialAssignment());
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmResult, setConfirmResult] = useState<'PASS' | 'FAIL' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      setTechnicians(await authService.getAssessmentTechnicians());
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to load assessment candidates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTechnicians();
  }, [loadTechnicians]);

  const openAssignment = (technician: UserProfile) => {
    setSelected(technician);
    setModalMode('assignment');
    setAssignment(initialAssignment(technician));
    setError('');
  };

  const selectedCenter = ASSESSMENT_CENTERS.find((center) => center.centerId === assignment.centerId);

  const saveAssignment = async () => {
    if (!selected || !selectedCenter || !assignment.specializationTrack || !assignment.assessmentDate || !assignment.assessmentTime || !assignment.instructions.trim()) {
      setError('Complete all required assessment assignment fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await authService.assignTechnicianAssessment(selected.uid, {
        centerId: selectedCenter.centerId,
        centerName: selectedCenter.centerName,
        centerAddress: selectedCenter.address,
        specializationTrack: assignment.specializationTrack,
        assessmentDate: assignment.assessmentDate,
        assessmentTime: assignment.assessmentTime,
        instructions: assignment.instructions.trim(),
      });
      setSelected(null);
      setModalMode(null);
      setMessage('Assessment scheduled successfully.');
      await loadTechnicians();
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to schedule this assessment.');
    } finally {
      setSaving(false);
    }
  };

  const openEvaluation = (technician: UserProfile) => {
    const assessment = technician.application?.assessment;
    setSelected(technician);
    setModalMode('evaluation');
    setScore(assessment?.score === null || assessment?.score === undefined ? '' : String(assessment.score));
    setNotes(assessment?.evaluationNotes || '');
    setError('');
  };

  const saveEvaluation = async () => {
    if (!selected || !score || !notes.trim()) {
      setError('Enter a score and evaluation notes before continuing.');
      return;
    }
    const numericScore = Number(score);
    if (!Number.isInteger(numericScore) || numericScore < 0 || numericScore > 100) {
      setError('Score must be a whole number between 0 and 100.');
      return;
    }
    if (!confirmResult) return;
    setSaving(true);
    setError('');
    try {
      await authService.evaluateTechnicianAssessment(selected.uid, numericScore, notes.trim(), confirmResult);
      setSelected(null);
      setModalMode(null);
      setConfirmResult(null);
      setMessage(`Assessment marked as ${confirmResult === 'PASS' ? 'passed' : 'failed'}.`);
      await loadTechnicians();
    } catch (saveError) {
      console.error(saveError);
      setError('Unable to save the assessment result.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">Administration & Verification</p>
        <h1 className="text-3xl font-bold text-slate-900">Practical Assessment Assignment & Evaluation</h1>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
        <ClipboardCheck className="mt-0.5 shrink-0 text-blue-600" size={22} />
        <div>
          <h2 className="font-semibold">Practical Assessment Management</h2>
          <p className="mt-1 text-sm text-blue-800">Assign a physical evaluation center and evaluate technician competency with on-site practical grading.</p>
        </div>
      </div>

      {message && <div className="mb-5 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading assessment candidates...</p> : technicians.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">No technicians are currently approved for practical assessment.</div>
      ) : (
        <div className="space-y-6">
          {technicians.map((technician) => <AssessmentCard key={technician.uid} technician={technician} onAssign={() => openAssignment(technician)} onEvaluate={() => openEvaluation(technician)} />)}
        </div>
      )}

      {selected && modalMode === 'assignment' && (
        <AssignmentModal technician={selected} form={assignment} selectedCenter={selectedCenter} saving={saving} onChange={setAssignment} onClose={() => { setSelected(null); setModalMode(null); }} onSave={() => void saveAssignment()} />
      )}
      {selected && modalMode === 'evaluation' && (
        <EvaluationModal technician={selected} score={score} notes={notes} result={confirmResult} saving={saving} onScoreChange={setScore} onNotesChange={setNotes} onResult={setConfirmResult} onClose={() => { setSelected(null); setModalMode(null); setConfirmResult(null); }} onSave={() => void saveEvaluation()} />
      )}
    </div>
  );
}

function AssessmentCard({ technician, onAssign, onEvaluate }: { technician: UserProfile; onAssign: () => void; onEvaluate: () => void }) {
  const assessment = technician.application?.assessment;
  const scheduled = technician.application?.status === 'ASSESSMENT_SCHEDULED';
  const completed = technician.application?.status === 'ASSESSMENT_COMPLETED';
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Step {scheduled || completed ? '7 & 8' : '7'}</p><h2 className="text-lg font-bold text-slate-900">{technician.fullName}</h2><p className="text-sm text-slate-500">{technician.email}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${completed ? 'bg-slate-100 text-slate-600' : scheduled ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{completed ? `Assessment ${assessment?.result || 'Completed'}` : scheduled ? 'Assessment Scheduled' : 'Approved for Assessment'}</span>
      </div>
      {assessment ? (
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Detail label="Assessment Center" value={assessment.centerName} />
          <Detail label="Specialization" value={assessment.specializationTrack} />
          <Detail label="Scheduled Date & Time" value={`${assessment.assessmentDate} at ${assessment.assessmentTime}`} />
          <Detail label="Center Address" value={assessment.centerAddress} />
          <Detail label="Technician Instructions" value={assessment.instructions} />
          {completed && <><Detail label="Score" value={`${assessment.score ?? 'Not provided'} / 100`} /><Detail label="Evaluation Notes" value={assessment.evaluationNotes || 'Not provided'} /></>}
        </div>
      ) : <p className="p-5 text-sm text-slate-600">Ready for assessment center assignment.</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4">
        {completed ? <span className={`rounded-lg px-4 py-2 text-sm font-semibold ${assessment?.result === 'PASS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{assessment?.result === 'PASS' ? 'PASS' : 'FAIL'}</span> : scheduled ? <><Button type="button" variant="outline" onClick={onAssign}>Reschedule / Change Center</Button><Button type="button" onClick={onEvaluate}>Enter Evaluation Result</Button></> : <Button type="button" onClick={onAssign}><CalendarCheck size={17} className="mr-2" />Assign Assessment</Button>}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm text-slate-700">{value}</p></div>;
}

function AssignmentModal({ technician, form, selectedCenter, saving, onChange, onClose, onSave }: { technician: UserProfile; form: AssignmentForm; selectedCenter?: typeof ASSESSMENT_CENTERS[number]; saving: boolean; onChange: (form: AssignmentForm) => void; onClose: () => void; onSave: () => void }) {
  return <Modal title="Assign Assessment Center (Step 7)" onClose={onClose}><p className="mb-5 text-sm text-slate-500">Assign practical evaluation location for <strong>{technician.fullName}</strong></p><div className="space-y-4">
    <label className="block text-sm font-medium text-slate-700">Assessment Center <span className="text-red-500">*</span><select value={form.centerId} onChange={(event) => onChange({ ...form, centerId: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"><option value="">Select Assessment Center</option>{ASSESSMENT_CENTERS.map((center) => <option key={center.centerId} value={center.centerId}>{center.centerName}</option>)}</select></label>
    <div><label className="block text-sm font-medium text-slate-700">Center Address</label><div className="mt-1.5 flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600"><MapPin size={16} className="shrink-0 text-slate-400" />{selectedCenter?.address || 'Select a center to view its address.'}</div></div>
    <label className="block text-sm font-medium text-slate-700">Specialization Track <span className="text-red-500">*</span><select value={form.specializationTrack} onChange={(event) => onChange({ ...form, specializationTrack: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"><option value="">Select Specialization</option>{technician.technicianProfile?.specializations.map((specialization) => <option key={specialization} value={specialization}>{specialization}</option>)}</select></label>
    <div className="grid gap-4 sm:grid-cols-2"><Input label="Assessment Date" type="date" required value={form.assessmentDate} onChange={(event) => onChange({ ...form, assessmentDate: event.target.value })} /><Input label="Assessment Time" type="time" required value={form.assessmentTime} onChange={(event) => onChange({ ...form, assessmentTime: event.target.value })} /></div>
    <label className="block text-sm font-medium text-slate-700">Instructions for Technician <span className="text-red-500">*</span><textarea value={form.instructions} onChange={(event) => onChange({ ...form, instructions: event.target.value })} rows={3} className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" /></label>
    <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" isLoading={saving} onClick={onSave}>Assign Assessment</Button></div>
  </div></Modal>;
}

function EvaluationModal({ technician, score, notes, result, saving, onScoreChange, onNotesChange, onResult, onClose, onSave }: { technician: UserProfile; score: string; notes: string; result: 'PASS' | 'FAIL' | null; saving: boolean; onScoreChange: (value: string) => void; onNotesChange: (value: string) => void; onResult: (result: 'PASS' | 'FAIL' | null) => void; onClose: () => void; onSave: () => void }) {
  return <Modal title="Step 8: Practical Evaluation Result" onClose={onClose}><div className="mb-5 rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-600"><strong>Candidate:</strong> {technician.fullName}</p><p className="mt-1 text-sm text-slate-600"><strong>Track:</strong> {technician.application?.assessment?.specializationTrack}</p></div><div className="space-y-4">
    <Input label="Practical Evaluation Score (0 - 100)" type="number" min="0" max="100" required value={score} onChange={(event) => onScoreChange(event.target.value)} />
    <label className="block text-sm font-medium text-slate-700">Evaluator Assessment Notes <span className="text-red-500">*</span><textarea value={notes} onChange={(event) => onNotesChange(event.target.value)} rows={5} placeholder="Enter practical observations..." className="mt-1.5 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" /></label>
    {result && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Confirm that the technician has successfully {result === 'PASS' ? 'passed' : 'not passed'} the practical assessment.</p>}
    <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" variant="danger" isLoading={saving} onClick={() => onResult('FAIL')}>Mark as Fail</Button><Button type="button" isLoading={saving} onClick={() => onResult('PASS')}>Mark as Pass</Button>{result && <Button type="button" className="hidden" onClick={onSave}>Confirm</Button>}</div>
    {result && <div className="flex justify-end"><Button type="button" isLoading={saving} onClick={onSave}>Confirm Mark as {result === 'PASS' ? 'Pass' : 'Fail'}</Button></div>}
  </div></Modal>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-4"><div className="mx-auto my-6 max-w-2xl rounded-xl bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-200 p-5"><h2 className="text-xl font-bold text-slate-900">{title}</h2><button type="button" aria-label="Close modal" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={20} /></button></div><div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-5">{children}</div></div></div>;
}
