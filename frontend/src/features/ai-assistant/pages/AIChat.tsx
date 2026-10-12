import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { aiService } from '../services/ai.service';
import { ticketService } from '../../customer/services/ticket.service';
import type { AISession, AIMessage, SessionStep } from '../types/ai';
import { ArrowLeft, Loader2, Bot, Ticket, Send, Image as ImageIcon, Mic, X, Square, AlertTriangle } from 'lucide-react';

const STEPS: { id: SessionStep; label: string }[] = [
  { id: 'DEVICE_IDENTIFIED', label: 'Device' },
  { id: 'PROBLEM_UNDERSTANDING', label: 'Problem' },
  { id: 'BASIC_CHECK', label: 'Basic checks' },
  { id: 'FINDING_CAUSE', label: 'Cause' },
  { id: 'RESOLUTION', label: 'Resolution' },
  { id: 'VERIFICATION', label: 'Verify' }
];

export default function AIChat() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [session, setSession] = useState<AISession | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [createdTicket, setCreatedTicket] = useState<{
    ticketId: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    deviceName: string;
    description: string;
    verificationCode?: string;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId || !user) return;
      try {
        const sess = await aiService.getSession(sessionId);
        setSession(sess);
        const msgs = await aiService.getMessages(sessionId);
        setMessages(msgs);
      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleVoiceSend(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleVoiceSend = async (audioBlob: Blob) => {
    if (!sessionId || !user) return;
    setSending(true);
    try {
      const response = await aiService.sendVoiceMessage(sessionId, audioBlob);
      if (response.user_message) {
        setMessages(prev => [...prev, response.user_message as AIMessage]);
      }
      setMessages(prev => [...prev, response.ai_message]);
      setSession(prev => prev ? { ...prev, ...response.session_updates } : null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to process voice message");
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !imageFile) || !sessionId || sending) return;

    setSending(true);
    
    try {
      let response;
      if (imageFile) {
        // Send multimodal request
        const tempMsg: AIMessage = {
          messageId: Date.now().toString(), sessionId, userId: user!.uid, sender: 'CUSTOMER',
          message: inputText.trim() || 'Attached an image.', inputType: 'IMAGE', language: session?.language || 'en', timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        
        response = await aiService.sendImageMessage(sessionId, imageFile, inputText.trim());
        
        setInputText('');
        removeImage();
      } else {
        // Text only
        const textMsg = inputText.trim();
        const tempMsg: AIMessage = {
          messageId: Date.now().toString(), sessionId, userId: user!.uid, sender: 'CUSTOMER',
          message: textMsg, inputType: 'TEXT', language: session?.language || 'en', timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setInputText('');
        
        response = await aiService.sendMessage({ sessionId, message: textMsg, inputType: 'TEXT' });
      }
      
      setMessages(prev => [...prev, response.ai_message]);
      setSession(prev => prev ? { ...prev, ...response.session_updates } : null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateTicket = async () => {
    if (!session || !user) return;
    setCreatingTicket(true);
    try {
      const summaryMsg = messages.filter(m => m.sender === 'AI').pop()?.message || 'No AI summary available.';
      const ticket = await ticketService.createTicket({
        deviceId: session.deviceId,
        sessionId: session.sessionId,
        title: `Issue with ${session.deviceName}`,
        description: session.problem,
        category: session.category,
        aiSummary: summaryMsg
      });
      setCreatedTicket({
        ticketId: ticket.ticketId,
        priority: ticket.priority,
        deviceName: ticket.deviceName || session.deviceName,
        description: ticket.description || session.problem,
        verificationCode: ticket.verificationCode,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-4" /> Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!session) return null;
  if (createdTicket) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <Ticket size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Ticket Created</h1>
        <p className="mt-2 text-gray-500">A service ticket has been created successfully.</p>
        <div className="mt-6 text-left rounded-xl border border-gray-200 divide-y divide-gray-100">
          <TicketDetail label="Ticket ID" value={createdTicket.ticketId} />
          <TicketDetail label="Priority" value={formatPriority(createdTicket.priority)} />
          <TicketDetail label="Device" value={createdTicket.deviceName} />
          <TicketDetail label="Problem" value={createdTicket.description} />
          <TicketDetail label="Verification Code" value={createdTicket.verificationCode || 'Unavailable'} />
        </div>
        <p className="mt-5 text-sm text-gray-500">Keep this code safe. Give it to the technician when they arrive.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" onClick={() => navigate('/customer/ai-assistant')} className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
            New Chat
          </button>
          <button type="button" onClick={() => navigate('/customer/tickets')} className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">
            View Tickets
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === session.currentStep);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-white max-w-4xl mx-auto rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-gray-200 p-4">
        <div className="flex items-center mb-2">
          <button onClick={() => navigate('/customer/dashboard')} className="text-gray-400 hover:text-gray-900 mr-3">
            <ArrowLeft size={20} />
          </button>
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">AI ASSISTANT</p>
            <h1 className="text-lg font-bold text-gray-900 flex items-center">
              SmartAssist AI
              {session.status === 'UNSAFE' && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center"><AlertTriangle size={12} className="mr-1"/> Unsafe</span>}
            </h1>
          </div>
        </div>
        <div className="ml-8">
          <p className="text-sm font-medium text-gray-700">{session.deviceName} • <span className="text-gray-500 font-normal">{session.brand}</span></p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100 p-3 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max px-4">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || session.status === 'RESOLVED';
            const isCurrent = idx === currentStepIndex && session.status !== 'RESOLVED' && session.status !== 'NEEDS_TECHNICIAN';
            return (
              <div key={step.id} className="flex items-center">
                <span className={`flex items-center text-xs font-medium ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  {isCompleted ? '✓' : isCurrent ? '●' : '○'} <span className="ml-1">{step.label}</span>
                </span>
                {idx < STEPS.length - 1 && <div className="w-4 h-[1px] mx-2 bg-gray-200"></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.map(msg => (
          <div key={msg.messageId} className={`flex ${msg.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender !== 'CUSTOMER' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                <Bot size={16} className="text-blue-600" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
              msg.sender === 'CUSTOMER' 
                ? 'bg-blue-600 text-white rounded-br-sm' 
                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
            }`}>
              {msg.sender !== 'CUSTOMER' && <p className="text-xs text-gray-400 mb-1 font-medium">SmartAssist AI</p>}
              {msg.sender === 'CUSTOMER' && <p className="text-xs text-blue-200 mb-1 font-medium text-right">Customer</p>}
              
              {msg.inputType === 'VOICE' && (
                <div className="mb-1 flex items-center text-xs opacity-75">
                  <Mic size={12} className="mr-1" /> Voice transcript:
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.message}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2"><Bot size={16} className="text-blue-600" /></div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area / Ticket Review */}
      {session.status === 'IN_PROGRESS' || session.status === 'UNSAFE' ? (
        <div className="bg-white border-t border-gray-200 flex flex-col">
          {imagePreview && (
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-start relative">
              <img src={imagePreview} alt="Preview" className="h-20 w-auto rounded border border-gray-200" />
              <button onClick={removeImage} className="absolute top-2 left-2 bg-gray-900/50 text-white p-1 rounded-full hover:bg-gray-900">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="p-3 flex items-end space-x-2">
            <div className="flex-1 bg-gray-100 rounded-2xl flex items-end p-1">
              <label className="p-2 text-gray-500 hover:text-blue-600 cursor-pointer rounded-full hover:bg-white transition-colors flex-shrink-0">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={sending || recording} />
                <ImageIcon size={20} />
              </label>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={recording ? "Recording audio..." : "Describe what you are seeing..."}
                disabled={sending || recording}
                rows={1}
                className="w-full bg-transparent border-0 focus:ring-0 resize-none py-2.5 px-2 text-[15px] placeholder-gray-400 max-h-32 focus:outline-none"
                style={{ minHeight: '44px' }}
              />
              
              {recording ? (
                <button type="button" onClick={stopRecording} className="p-2 text-red-500 hover:text-red-600 rounded-full bg-red-50 hover:bg-red-100 transition-colors flex-shrink-0 mr-1 animate-pulse">
                  <Square size={20} fill="currentColor" />
                </button>
              ) : (
                <button type="button" onClick={startRecording} disabled={sending} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-white transition-colors flex-shrink-0 mr-1">
                  <Mic size={20} />
                </button>
              )}
            </div>
            
            <button 
              onClick={handleSend} 
              disabled={(!inputText.trim() && !imageFile) || sending || recording}
              className="w-11 h-11 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
            >
              {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={18} className="ml-0.5" />}
            </button>
          </div>
          
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-center">
            <button onClick={handleCreateTicket} disabled={creatingTicket} className="text-sm font-medium text-gray-500 hover:text-purple-600 disabled:opacity-50 flex items-center transition-colors">
              {creatingTicket ? <Loader2 className="animate-spin mr-1.5" size={16} /> : <Ticket size={16} className="mr-1.5" />}
              Raise a Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-t border-gray-200 p-6 text-center">
          <p className="text-gray-600 font-medium mb-2">This session has been {session.status.toLowerCase().replace('_', ' ')}.</p>
          {(session.status === 'NEEDS_TECHNICIAN') && (
            <p className="text-sm text-gray-500 mb-4">A ticket has been created for a technician to assist you further.</p>
          )}
          <button onClick={() => navigate('/customer/dashboard')} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

function formatPriority(priority: string) {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function TicketDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 text-right">{value}</span>
    </div>
  );
}
