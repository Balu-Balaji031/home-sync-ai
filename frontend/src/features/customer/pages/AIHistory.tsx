import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Loader2,
  MessageSquare,
  MonitorSmartphone,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { aiService } from '../../ai-assistant/services/ai.service';
import type { AIMessage, AISession, SessionStatus } from '../../ai-assistant/types/ai';

 type HistoryFilter = 'ALL' | 'RESOLVED' | 'ESCALATED';

const STATUS_DETAILS: Record<SessionStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  RESOLVED: { label: 'Resolved by AI', className: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  NEEDS_TECHNICIAN: { label: 'Escalated to Service Ticket', className: 'bg-orange-50 text-orange-700', icon: Wrench },
  UNSAFE: { label: 'Safety Escalation', className: 'bg-red-50 text-red-700', icon: ShieldAlert },
  IN_PROGRESS: { label: 'In Progress', className: 'bg-blue-50 text-blue-700', icon: Clock3 },
  CUSTOMER_CANCELLED: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600', icon: CircleAlert },
};

function formatDate(value?: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function statusDetails(status: string) {
  return STATUS_DETAILS[status as SessionStatus] || STATUS_DETAILS.IN_PROGRESS;
}

function isEscalated(status: string) {
  return status === 'NEEDS_TECHNICIAN' || status === 'UNSAFE';
}

function deviceIcon(session: AISession) {
  return session.category === 'Security' ? ShieldAlert : MonitorSmartphone;
}

function HistoryCard({ session, onOpen }: { session: AISession; onOpen: () => void }) {
  const details = statusDetails(session.status);
  const StatusIcon = details.icon;
  const DeviceIcon = deviceIcon(session);

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-blue-200 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start min-w-0">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600 mr-4 shrink-0">
            <DeviceIcon size={24} />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 truncate">{session.deviceName || session.deviceType || 'Smart home device'}</h2>
            <p className="text-sm text-gray-500 truncate">
              {[session.brand, session.room].filter(Boolean).join(' • ') || session.deviceType || 'Device details unavailable'}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${details.className}`}>
          <StatusIcon size={13} />
          {details.label}
        </span>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1">Problem</p>
        <p className="text-gray-800 line-clamp-2">{session.problem || 'No problem description recorded.'}</p>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-gray-500">{formatDate(session.startedAt || session.updatedAt)}</span>
          <button onClick={onOpen} className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700">
            View Conversation
            <ChevronRight size={17} className="ml-1" />
          </button>
        </div>
      </div>
    </article>
  );
}

function Conversation({ session, messages, onBack }: { session: AISession; messages: AIMessage[]; onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft size={17} className="mr-2" />
        Back to history
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1">Troubleshooting Session</p>
            <h1 className="text-2xl font-bold text-gray-900">{session.deviceName || session.deviceType}</h1>
            <p className="text-sm text-gray-500 mt-1">{[session.brand, session.room].filter(Boolean).join(' • ')}</p>
          </div>
          <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${statusDetails(session.status).className}`}>
            {statusDetails(session.status).label}
          </span>
        </div>
        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-[11px] font-bold tracking-wider text-gray-400 uppercase mb-1">Problem</p>
          <p className="text-gray-800">{session.problem || 'No problem description recorded.'}</p>
        </div>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">No messages were recorded for this session.</div>
        ) : messages.map((message) => (
          <div key={message.messageId} className={`flex ${message.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 ${message.sender === 'CUSTOMER' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900 shadow-sm'}`}>
              <div className={`flex items-center text-[11px] font-bold tracking-wide uppercase mb-1 ${message.sender === 'CUSTOMER' ? 'text-blue-100' : 'text-gray-400'}`}>
                {message.sender === 'CUSTOMER' ? 'Customer' : <><Bot size={13} className="mr-1" /> SmartAssist AI</>}
                {message.inputType === 'IMAGE' && <span className="ml-2 font-normal normal-case">Image attached</span>}
                {message.inputType === 'VOICE' && <span className="ml-2 font-normal normal-case">Voice transcript</span>}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AISession | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>('ALL');
  const [loading, setLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      setSessions(await aiService.getSessions());
    } catch (err) {
      console.error(err);
      setError('Unable to load your troubleshooting history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void loadHistory();
  }, [user]);

  useEffect(() => {
    if (!sessionId) {
      setSelectedSession(null);
      setMessages([]);
      return;
    }

    const loadConversation = async () => {
      setConversationLoading(true);
      setError('');
      try {
        const [session, sessionMessages] = await Promise.all([
          aiService.getSession(sessionId),
          aiService.getMessages(sessionId),
        ]);
        setSelectedSession(session);
        setMessages(sessionMessages);
      } catch (err) {
        console.error(err);
        setError('Unable to load this troubleshooting conversation. Please try again.');
      } finally {
        setConversationLoading(false);
      }
    };
    void loadConversation();
  }, [sessionId]);

  const visibleSessions = useMemo(() => {
    if (filter === 'RESOLVED') return sessions.filter((session) => session.status === 'RESOLVED');
    if (filter === 'ESCALATED') return sessions.filter((session) => isEscalated(session.status));
    return sessions;
  }, [filter, sessions]);

  if (sessionId) {
    if (conversationLoading) return <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-3" />Loading conversation...</div>;
    if (error) return <HistoryError message={error} onRetry={() => navigate('/customer/ai-history')} />;
    if (selectedSession) return <Conversation session={selectedSession} messages={messages} onBack={() => navigate('/customer/ai-history')} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-1">Your support history</p>
        <h1 className="text-3xl font-bold text-gray-900">AI Troubleshooting History</h1>
        <p className="text-gray-500 mt-2">View your previous AI troubleshooting conversations and support history.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['ALL', 'RESOLVED', 'ESCALATED'] as HistoryFilter[]).map((value) => (
          <button key={value} onClick={() => setFilter(value)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${filter === value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {value === 'ALL' ? 'All' : value === 'RESOLVED' ? 'Resolved' : 'Escalated'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-3" />Loading your troubleshooting history...</div>
      ) : error ? (
        <HistoryError message={error} onRetry={loadHistory} />
      ) : visibleSessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <MessageSquare size={34} className="mx-auto text-gray-300 mb-4" />
          <h2 className="font-semibold text-gray-900">No troubleshooting history yet</h2>
          <p className="text-sm text-gray-500 mt-2 mb-5">Start an AI troubleshooting session to see your support conversations here.</p>
          <button onClick={() => navigate('/customer/ai-assistant')} className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">Start Troubleshooting</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {visibleSessions.map((session) => <HistoryCard key={session.sessionId} session={session} onOpen={() => navigate(`/customer/ai-history/${session.sessionId}`)} />)}
        </div>
      )}
    </div>
  );
}

function HistoryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-red-100 p-8 text-center">
      <p className="text-red-700 text-sm">{message}</p>
      <button onClick={onRetry} className="mt-4 inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Try Again</button>
    </div>
  );
}
