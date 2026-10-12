import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { authService } from '../../auth/services/auth.service';
import type { UserProfile } from '../../auth/services/auth.service';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await authService.getCustomers());
    } catch (loadError) {
      console.error(loadError);
      setError('Unable to load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) => [
      customer.fullName,
      customer.email,
      customer.mobileNumber || '',
      customer.city || '',
    ].some((value) => value.toLowerCase().includes(term)));
  }, [customers, search]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">Administration & Verification</p>
        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
      </div>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-5 text-blue-900">
        <Users className="mt-0.5 shrink-0 text-blue-600" size={22} />
        <div>
          <h2 className="font-semibold">Customers</h2>
          <p className="mt-1 text-sm text-blue-800">View registered customer information.</p>
        </div>
      </div>

      {error && <div className="mb-5 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-bold text-slate-900">Registered Customers</h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{customers.length} Customers</span>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Search customers</span>
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customers..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </label>
        </div>

        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="p-8 text-center text-slate-500">{customers.length === 0 ? 'No registered customers yet.' : 'No customers match your search.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {['Name', 'Email', 'Mobile Number', 'Address', 'City', 'State', 'Pincode', 'Landmark'].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.uid} className="align-top">
                    <td className="px-5 py-4 font-semibold text-slate-900">{customer.fullName}</td>
                    <td className="px-5 py-4 text-slate-600">{customer.email}</td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">{customer.mobileNumber || 'Not provided'}</td>
                    <td className="max-w-xs whitespace-normal break-words px-5 py-4 text-slate-600">{[customer.addressLine1, customer.addressLine2].filter(Boolean).join(', ') || 'Not provided'}</td>
                    <td className="px-5 py-4 text-slate-600">{customer.city || 'Not provided'}</td>
                    <td className="px-5 py-4 text-slate-600">{customer.state || 'Not provided'}</td>
                    <td className="px-5 py-4 text-slate-600">{customer.pincode || 'Not provided'}</td>
                    <td className="max-w-xs whitespace-normal break-words px-5 py-4 text-slate-600">{customer.landmark || 'Not provided'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
