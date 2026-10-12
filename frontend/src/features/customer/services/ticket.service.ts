import { auth } from '../../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface TicketCreateRequest {
  deviceId: string;
  sessionId: string;
  title: string;
  description: string;
  category: string;
  aiSummary: string;
}

export interface CreatedTicket {
  ticketId: string;
  userId: string;
  deviceId: string;
  sessionId: string;
  deviceName: string;
  deviceType: string;
  description: string;
  aiSummary: string;
  title?: string;
  category?: string;
  verificationCode?: string;
  verificationStatus?: 'PENDING' | 'VERIFIED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'CREATED' | 'OPEN' | 'ASSIGNED' | 'ACCEPTED' | 'ON_THE_WAY' | 'ARRIVED' | 'REPAIR_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianSpecialization?: string;
}

const getHeaders = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

};

function normalizeTicketData(data: Record<string, unknown>): CreatedTicket {
  const normalized = { ...data } as Record<string, unknown>;
  for (const field of ['createdAt', 'updatedAt', 'completedAt']) {
    const value = normalized[field];
    if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      normalized[field] = value.toDate().toISOString();
    }
  }
  return normalized as unknown as CreatedTicket;
}

export const ticketService = {
  async createTicket(data: TicketCreateRequest): Promise<CreatedTicket> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/tickets/`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(data)
      });
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Ticket service is unavailable. Please check that the backend is running and try again.');
      }
      throw error;
    }
    
    if (!res.ok) {
      let errorText = await res.text();
      try {
        const errorJson = JSON.parse(errorText);
        errorText = errorJson.detail || errorText;
      } catch (e) {
        // Not JSON
      }
      throw new Error(`Failed to create ticket: ${errorText}`);
    }
    
    return res.json() as Promise<CreatedTicket>;
  },

  async getTickets(): Promise<CreatedTicket[]> {
    const res = await fetch(`${API_BASE}/tickets/`, {
      headers: await getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load tickets: ${await res.text()}`);
    }
    return res.json() as Promise<CreatedTicket[]>;
  },

  async getTicket(ticketId: string): Promise<CreatedTicket> {
    const res = await fetch(`${API_BASE}/tickets/${encodeURIComponent(ticketId)}`, {
      headers: await getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to load ticket: ${await res.text()}`);
    }
    return res.json() as Promise<CreatedTicket>;
  },

  subscribeToTicket(ticketId: string, onUpdate: (ticket: CreatedTicket) => void, onError: (error: Error) => void): Unsubscribe {
    return onSnapshot(
      doc(db, 'tickets', ticketId),
      (snapshot) => {
        if (!snapshot.exists()) {
          onError(new Error('Ticket not found.'));
          return;
        }
        onUpdate(normalizeTicketData({ ticketId: snapshot.id, ...snapshot.data() }));
      },
      (error) => onError(error),
    );
  }
};
