import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { authService } from '../../auth/services/auth.service';
import type { UserProfile } from '../../auth/services/auth.service';

export default function AdminApprovedTechnicians() {
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      setTechnicians(await authService.getApprovedTechnicians());
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to load approved technicians.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTechnicians();
  }, [loadTechnicians]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">Administration & Verification</p>
        <h1 className="text-3xl font-bold text-slate-900">Approved Technicians</h1>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
        <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={22} />
        <div>
          <h2 className="font-semibold">Approved Technicians</h2>
          <p className="mt-1 text-sm text-blue-800">View verified technicians who are approved and eligible for service jobs.</p>
        </div>
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">Approved Technicians</h2>
          <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
            {technicians.length} Approved
          </span>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading approved technicians...</p>
        ) : technicians.length === 0 ? (
          <p className="p-8 text-center text-slate-500">No approved technicians yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {['Name', 'Email', 'Mobile', 'Experience', 'Specialization', 'Skills', 'Languages', 'City'].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {technicians.map((technician) => {
                  const profile = technician.technicianProfile;
                  return (
                    <tr key={technician.uid} className="align-top">
                      <td className="px-5 py-4 font-semibold text-slate-900">{technician.fullName}</td>
                      <td className="px-5 py-4 text-slate-600">{technician.email}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">{technician.mobileNumber || 'Not provided'}</td>
                      <td className="px-5 py-4 text-slate-600">{profile?.yearsOfExperience || 'Not provided'}</td>
                      <td className="max-w-xs whitespace-normal break-words px-5 py-4 text-slate-600">{profile?.specializations.join(', ') || 'Not provided'}</td>
                      <td className="max-w-xs whitespace-normal break-words px-5 py-4 text-slate-600">{profile?.skills.join(', ') || 'Not provided'}</td>
                      <td className="max-w-xs whitespace-normal break-words px-5 py-4 text-slate-600">{profile?.languages.join(', ') || 'Not provided'}</td>
                      <td className="px-5 py-4 text-slate-600">{profile?.serviceArea.city || 'Not provided'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
