import { useEffect, useMemo, useState } from 'react';
import { Check, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../auth/context/AuthContext';
import { authService } from '../../auth/services/auth.service';
import { isTechnicianProfileComplete, technicianProfileCompletion } from '../utils/technicianProfile';
import { technicianTicketService, type AssignedTicket } from '../services/technician-ticket.service';

type DashboardState = 'PROFILE_INCOMPLETE' | 'READY_TO_SUBMIT' | 'UNDER_REVIEW' | 'APPROVED' | 'CHANGES_REQUIRED' | 'REJECTED';

function stateFor(profile: Parameters<typeof isTechnicianProfileComplete>[0]): DashboardState {
  const applicationStatus = profile?.application?.status;
  if (applicationStatus === 'UNDER_REVIEW') return 'UNDER_REVIEW';
  if (
    applicationStatus === 'APPROVED'
    || applicationStatus === 'APPROVED_FOR_ASSESSMENT'
    || applicationStatus === 'ASSESSMENT_SCHEDULED'
    || applicationStatus === 'ASSESSMENT_COMPLETED'
    || applicationStatus === 'FINAL_APPROVED'
  ) return 'APPROVED';
  if (applicationStatus === 'CHANGES_REQUIRED') return 'CHANGES_REQUIRED';
  if (applicationStatus === 'REJECTED') return 'REJECTED';
  return isTechnicianProfileComplete(profile) ? 'READY_TO_SUBMIT' : 'PROFILE_INCOMPLETE';
}

const stateCopy: Record<DashboardState, { title: string; description: string }> = {
  PROFILE_INCOMPLETE: {
    title: 'Profile Incomplete',
    description: 'Complete your professional profile to submit your technician application.',
  },
  READY_TO_SUBMIT: {
    title: 'Ready to Submit',
    description: 'Your professional profile is complete. Review your information and submit your application to the Admin team.',
  },
  UNDER_REVIEW: {
    title: 'Application Submitted',
    description: 'Your application has been submitted successfully. The Admin team is reviewing your professional information.',
  },
  APPROVED: {
    title: 'Application Approved',
    description: 'Your professional application has been approved. You are now eligible for SmartAssist service assignments.',
  },
  CHANGES_REQUIRED: {
    title: 'Changes Required',
    description: 'Your application needs changes before it can be approved.',
  },
  REJECTED: {
    title: 'Application Rejected',
    description: 'Your application was not approved. Please review the application feedback and update your information before resubmitting.',
  },
};

export default function TechnicianDashboard() {
  const { user, profile, loading: authLoading, syncAuthenticatedUser, refreshAuthenticatedProfile } = useAuth();
  const navigate = useNavigate();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const state = stateFor(profile);
  const percent = useMemo(() => technicianProfileCompletion(profile), [profile]);

  useEffect(() => {
    if (user) void refreshAuthenticatedProfile();
  }, [refreshAuthenticatedProfile, user]);

  const submitApplication = async () => {
    if (!user || !profile) return;
    setError('');
    setMessage('');
    if (!isTechnicianProfileComplete(profile)) {
      setError('Complete all required profile information before submitting your application.');
      return;
    }
    if (state === 'UNDER_REVIEW' || state === 'APPROVED') return;
    setSubmitting(true);
    try {
      await authService.submitTechnicianApplication(user.uid);
      await syncAuthenticatedUser(user);
      setReviewOpen(false);
      setMessage('Application submitted successfully.');
    } catch (submitError) {
      console.error(submitError);
      setError('Unable to submit your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !profile) {
    return <div className="p-8 text-center text-gray-500">Loading your dashboard...</div>;
  }

  const data = profile.technicianProfile;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-blue-600">Technician Portal</p>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome back, {profile.fullName}</p>
        <p className="mt-1 text-slate-500">Manage your professional application and service eligibility.</p>
      </div>

      {message && <div className="mb-6 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Application Status</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{stateCopy[state].title}{state === 'APPROVED' && <span className="ml-2 text-green-600">✓</span>}</h2>
            <p className="mt-3 max-w-2xl text-slate-600">{stateCopy[state].description}</p>
            {state === 'CHANGES_REQUIRED' && profile.application?.feedback && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{profile.application.feedback}</p>}
          </div>
          <div className="min-w-56 rounded-lg bg-slate-50 p-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500"><span>Profile Completion</span><span className="text-blue-600">{percent}%</span></div>
            <div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {state === 'PROFILE_INCOMPLETE' && <Button type="button" onClick={() => navigate('/technician/profile')}>Complete Profile</Button>}
          {state === 'CHANGES_REQUIRED' && <Button type="button" onClick={() => navigate('/technician/profile')}>Update Profile</Button>}
          {state === 'READY_TO_SUBMIT' && <>
            <Button type="button" variant="secondary" onClick={() => setReviewOpen(true)}>Review Application</Button>
            <Button type="button" onClick={() => void submitApplication()} isLoading={submitting}>Submit Application</Button>
          </>}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">Professional Summary</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Summary label="Experience" value={data?.yearsOfExperience ? `${data.yearsOfExperience} ${data.yearsOfExperience === '1' ? 'Year' : 'Years'}` : 'Not provided'} />
            <Summary label="Specialization" value={data?.specializations?.join(', ') || 'Not provided'} />
            <Summary label="Languages" value={data?.languages?.join(', ') || 'Not provided'} />
            <Summary label="Service Area" value={data?.serviceArea?.city ? `${data.serviceArea.city} · ${data.serviceArea.serviceRadius || 'Radius not provided'}` : 'Not provided'} />
          </div>
          <button type="button" onClick={() => navigate('/technician/profile')} className="mt-5 text-sm font-medium text-blue-600 hover:text-blue-700">Edit Profile</button>
        </section>
        <Progress status={state} />
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">What Happens Next</h2>
        <p className="mt-2 text-slate-600">{nextMessage(state)}</p>
      </section>

      {state === 'APPROVED' && user && <ApprovedWorkOverview navigate={navigate} technicianId={user.uid} />}

      {reviewOpen && <ReviewApplication profile={profile} onBack={() => setReviewOpen(false)} onSubmit={() => void submitApplication()} submitting={submitting} />}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-sm font-medium text-slate-900">{value}</p></div>;
}

function Progress({ status }: { status: DashboardState }) {
  const stages = status === 'CHANGES_REQUIRED' || status === 'REJECTED'
    ? ['Profile', 'Application Submitted', 'Changes Required', 'Approval', 'Job Eligibility']
    : ['Profile', 'Application Submitted', 'Admin Review', 'Approval', 'Job Eligibility'];
  const active = status === 'PROFILE_INCOMPLETE' ? 0 : status === 'READY_TO_SUBMIT' ? 0 : status === 'UNDER_REVIEW' ? 2 : status === 'CHANGES_REQUIRED' || status === 'REJECTED' ? 2 : 4;
  const completed = status === 'PROFILE_INCOMPLETE' ? -1 : status === 'READY_TO_SUBMIT' ? 0 : status === 'UNDER_REVIEW' ? 1 : status === 'CHANGES_REQUIRED' || status === 'REJECTED' ? 0 : 4;
  return <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Application Progress</h2><div className="mt-5 space-y-4">{stages.map((stage, index) => <div key={stage} className="flex items-center gap-3">{index <= completed ? <Check className="text-green-600" size={18} /> : index === active ? <Circle className="fill-blue-100 text-blue-600" size={18} /> : <Circle className="text-slate-300" size={18} />}<span className={index === active ? 'font-semibold text-blue-700' : index <= completed ? 'text-slate-700' : 'text-slate-400'}>{stage}</span></div>)}</div></section>;
}

function nextMessage(status: DashboardState) {
  return {
    PROFILE_INCOMPLETE: 'Complete your professional profile before submitting your technician application.',
    READY_TO_SUBMIT: 'Review your professional information and submit your application for Admin verification.',
    UNDER_REVIEW: 'Your application is currently being reviewed by the Admin team. You will be notified when the status changes.',
    APPROVED: 'Your technician application has been approved. You can now receive SmartAssist service assignments.',
    CHANGES_REQUIRED: 'Update the requested profile information and resubmit your application.',
    REJECTED: 'Review the application feedback and update your professional information before resubmitting.',
  }[status];
}

function ApprovedWorkOverview({ navigate, technicianId }: { navigate: ReturnType<typeof useNavigate>; technicianId: string }) {
  const [tickets, setTickets] = useState<AssignedTicket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<AssignedTicket[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const loadOverview = async () => {
      try {
        const [assigned, history] = await Promise.all([
          technicianTicketService.getAssignedTickets(),
          technicianTicketService.getTicketHistory(),
        ]);
        if (active) {
          setTickets(assigned);
          setCompletedTickets(history);
          setLoadError('');
        }
      } catch (overviewError) {
        console.error('Failed to load technician work overview:', overviewError);
        if (active) setLoadError('Unable to load work overview.');
      }
    };

    void loadOverview();
    return () => {
      active = false;
    };
  }, [technicianId]);

  const newTickets = tickets.filter((ticket) =>
    !ticket.assignedTechnicianId && (ticket.status === 'CREATED' || ticket.status === 'OPEN'),
  ).length;
  const inProgress = tickets.filter((ticket) =>
    ticket.assignedTechnicianId === technicianId
      && ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'REPAIR_STARTED'].includes(ticket.status),
  ).length;
  const completed = completedTickets.filter((ticket) =>
    ticket.assignedTechnicianId === technicianId && ticket.status === 'COMPLETED',
  ).length;

  return <section className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold text-slate-900">Work Overview</h2>{loadError && <p className="text-sm text-red-600">{loadError}</p>}<div className="grid gap-4 sm:grid-cols-3"><Summary label="New Tickets" value={String(newTickets)} /><Summary label="In Progress" value={String(inProgress)} /><Summary label="Completed" value={String(completed)} /></div><div className="border-t border-slate-100 pt-5"><h3 className="font-bold text-slate-900">Service Assignments</h3><p className="mt-2 text-sm text-gray-600">Your current service assignments and available requests are shown in Tickets.</p><Button type="button" variant="secondary" className="mt-4" onClick={() => navigate('/technician/tickets')}>View My Tickets</Button></div></section>;
}

function ReviewApplication({ profile, onBack, onSubmit, submitting }: { profile: NonNullable<Parameters<typeof isTechnicianProfileComplete>[0]>; onBack: () => void; onSubmit: () => void; submitting: boolean }) {
  const data = profile.technicianProfile;
  return <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-4"><div className="mx-auto my-8 max-w-4xl rounded-xl bg-white p-6 shadow-xl sm:p-8"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Review Application</p><h2 className="mt-1 text-2xl font-bold text-slate-900">Professional Information Summary</h2></div><button type="button" onClick={onBack} className="text-2xl text-slate-400" aria-label="Close review">×</button></div><div className="mt-6 grid gap-6 md:grid-cols-2"><ReviewSection title="Personal Information" rows={[['Full Name', profile.fullName], ['Email', profile.email], ['Mobile Number', profile.mobileNumber || 'Not provided']]} /><ReviewSection title="Professional Information" rows={[['Years of Experience', data?.yearsOfExperience || 'Not provided'], ['Description', data?.professionalDescription || 'Not provided']]} /><ReviewSection title="Specialization" rows={[['Selected', data?.specializations.join(', ') || 'Not provided']]} /><ReviewSection title="Skills / Categories" rows={[['Selected', data?.skills.join(', ') || 'Not provided']]} /><ReviewSection title="Languages" rows={[['Supported', data?.languages.join(', ') || 'Not provided']]} /><ReviewSection title="Service Area" rows={data ? [['City', data.serviceArea.city], ['State', data.serviceArea.state], ['Pincodes', data.serviceArea.pincodes], ['Radius', data.serviceArea.serviceRadius]] : [['Details', 'Not provided']]} /><ReviewSection title="Availability" rows={data ? [['Working Days', data.availability.workingDays.join(', ')], ['Hours', `${data.availability.startTime} - ${data.availability.endTime}`]] : [['Details', 'Not provided']]} /></div><div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5"><Button type="button" variant="secondary" onClick={onBack}>Back</Button><Button type="button" onClick={onSubmit} isLoading={submitting}>Submit Application</Button></div></div></div>;
}

function ReviewSection({ title, rows }: { title: string; rows: string[][] }) {
  return <section><h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{title}</h3><div className="mt-2 space-y-2 text-sm">{rows.map(([label, value]) => <div key={label}><span className="font-medium text-slate-700">{label}: </span><span className="text-slate-600">{value}</span></div>)}</div></section>;
}
