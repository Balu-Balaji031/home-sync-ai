import { auth } from '../../../services/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../services/firebase';
import type { 
  SessionCreateRequest, 
  AISession, 
  ChatRequest, 
  ChatResponse, 
  AIMessage 
} from '../types/ai';

const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE = configuredApiUrl.replace(/\/+$/, '').endsWith('/api')
  ? configuredApiUrl.replace(/\/+$/, '')
  : `${configuredApiUrl.replace(/\/+$/, '')}/api`;

const getHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorText = await res.text();
    try {
      const errorJson = JSON.parse(errorText);
      errorText = errorJson.detail || errorText;
    } catch (e) {
      // Not JSON
    }
    
    if (res.status === 401) {
      throw new Error(`Authentication failed (401): ${errorText}`);
    } else if (res.status === 403) {
      throw new Error(`Forbidden (403): ${errorText}`);
    } else if (res.status === 404) {
      throw new Error(`Endpoint not found (404): ${errorText}`);
    } else if (res.status === 422) {
      throw new Error(`Validation error (422): ${errorText}`);
    } else if (res.status >= 500) {
      throw new Error(`Backend error (${res.status}): ${errorText}`);
    } else {
      throw new Error(`Error ${res.status}: ${errorText}`);
    }
  }
  return res.json();
};

const serializeTimestamp = (value: unknown): string | unknown => {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  return value;
};

const serializeDocument = <T extends object>(data: T): T => (
  Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, serializeTimestamp(value)])
  ) as T
);

const isUnavailableIndexError = (error: unknown) => (
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && error.code === 'failed-precondition'
  && 'message' in error
  && typeof error.message === 'string'
  && error.message.includes('index')
);

export const aiService = {
  async getSessions(): Promise<AISession[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const toSession = (sessionDoc: { id: string; data: () => Record<string, unknown> }) => serializeDocument({
      ...sessionDoc.data(),
      sessionId: sessionDoc.id,
    }) as AISession;

    try {
      const sessionsQuery = query(
        collection(db, 'ai_sessions'),
        where('userId', '==', user.uid),
        orderBy('startedAt', 'desc'),
        limit(15)
      );
      const snapshot = await getDocs(sessionsQuery);
      return snapshot.docs.map(toSession);
    } catch (error) {
      if (!isUnavailableIndexError(error)) throw error;

      console.warn('AI history index is unavailable; using the customer-scoped fallback query.', error);
      const ownedSessionsQuery = query(
        collection(db, 'ai_sessions'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(ownedSessionsQuery);
      return snapshot.docs
        .map(toSession)
        .sort((first, second) => (
          new Date(second.startedAt || second.updatedAt).getTime()
          - new Date(first.startedAt || first.updatedAt).getTime()
        ))
        .slice(0, 15);
    }
  },

  async createSession(data: SessionCreateRequest): Promise<AISession> {
    try {
      const res = await fetch(`${API_BASE}/ai/sessions`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Backend unreachable. Please check if the server is running.');
      }
      throw error;
    }
  },

  async getSession(sessionId: string): Promise<AISession> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const sessionDoc = await getDoc(doc(db, 'ai_sessions', sessionId));
    if (!sessionDoc.exists() || sessionDoc.data().userId !== user.uid) {
      throw new Error('Troubleshooting session not found.');
    }
    return serializeDocument({
      ...sessionDoc.data(),
      sessionId: sessionDoc.id,
    }) as AISession;
  },

  async getMessages(sessionId: string): Promise<AIMessage[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const sessionDoc = await getDoc(doc(db, 'ai_sessions', sessionId));
    if (!sessionDoc.exists() || sessionDoc.data().userId !== user.uid) {
      throw new Error('Troubleshooting session not found.');
    }

    const messagesQuery = query(
      collection(db, 'ai_messages'),
      where('sessionId', '==', sessionId),
      where('userId', '==', user.uid)
    );
    const snapshot = await getDocs(messagesQuery);
    return snapshot.docs
      .map((messageDoc) => serializeDocument({
        ...messageDoc.data(),
        messageId: messageDoc.id,
      }) as AIMessage)
      .sort((first, second) => (
        new Date(first.timestamp).getTime() - new Date(second.timestamp).getTime()
      ));
  },

  async sendMessage(data: ChatRequest): Promise<ChatResponse> {
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Backend unreachable. Please check if the server is running.');
      }
      throw error;
    }
  },

  async sendImageMessage(sessionId: string, imageFile: File, text: string = ''): Promise<ChatResponse> {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('image', imageFile);
    formData.append('text', text);

    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();

    try {
      const res = await fetch(`${API_BASE}/ai/chat/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return handleResponse(res);
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Backend unreachable. Please check if the server is running.');
      }
      throw error;
    }
  },

  async sendVoiceMessage(sessionId: string, audioBlob: Blob): Promise<{ user_message?: AIMessage, ai_message: AIMessage, session_updates: any }> {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('audio', audioBlob, 'voice_message.webm');

    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();

    try {
      const res = await fetch(`${API_BASE}/ai/chat/voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return handleResponse(res);
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Backend unreachable. Please check if the server is running.');
      }
      throw error;
    }
  }
};
