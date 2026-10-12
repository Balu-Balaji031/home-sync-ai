import { ClipboardCheck, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/context/AuthContext';

export default function TechnicianAssessment() {
  const { profile } = useAuth();
  const assessment = profile?.application?.assessment;

  if (!assessment) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">Assessment Center</h1>
        <p className="mt-3 text-slate-600">No practical assessment has been scheduled yet.</p>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(assessment.centerAddress)}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">Assessment</p>
        <h1 className="text-3xl font-bold text-slate-900">Assessment Center</h1>
        <p className="mt-2 text-slate-600">View your practical assessment schedule, location and instructions.</p>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ClipboardCheck size={21} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Practical Assessment</p>
              <h2 className="text-lg font-bold text-slate-900">Assessment Scheduled</h2>
            </div>
          </div>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Scheduled</span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Detail label="Assessment Center" value={assessment.centerName} />
          <Detail label="Center Address" value={assessment.centerAddress} />
          <Detail label="Specialization Track" value={assessment.specializationTrack} />
          <Detail label="Assessment Date" value={assessment.assessmentDate} />
          <Detail label="Assessment Time" value={assessment.assessmentTime} />
          <Detail label="Technician Instructions" value={assessment.instructions} />
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <Button type="button" onClick={() => window.open(directionsUrl, '_blank', 'noopener,noreferrer')}>
            <MapPin size={17} className="mr-2" />
            Get Directions
          </Button>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700">{value}</p>
    </div>
  );
}
