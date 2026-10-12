import { auth } from '../../../services/firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface AssignedTicket {
  ticketId: string;
  status: string;
  priority: string;
  deviceName: string;
  deviceType: string;
  customerName: string;
  description: string;
  userId: string;
  assignedTechnicianId?: string;
  completedAt?: string;
  repairOutcome?: string;
}

export interface TechnicianTicketDetails extends AssignedTicket {
  title: string;
  category: string;
  aiSummary: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  rootCause?: string;
  repairPerformed?: string;
  partsReplaced?: string;
  additionalRepairNotes?: string;
  repairOutcome?: 'FIXED' | 'PARTIALLY_FIXED' | 'NOT_FIXED';
  completedAt?: string;
}

export interface RepairCompletionData {
  rootCause: string;
  repairPerformed: string;
  partsReplaced: string;
  additionalRepairNotes: string;
  repairOutcome: 'FIXED' | 'PARTIALLY_FIXED' | 'NOT_FIXED';
}

async function getHeaders() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${await user.getIdToken()}`,
  };
}

export const technicianTicketService = {
  async getAssignedTickets(): Promise<AssignedTicket[]> {
    const response = await fetch(`${API_BASE}/tickets/assigned`, {
      headers: await getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to load assigned tickets: ${await response.text()}`);
    }
    return response.json() as Promise<AssignedTicket[]>;
  },
  async getTicketHistory(): Promise<AssignedTicket[]> {
    const response = await fetch(`${API_BASE}/tickets/history`, {
      headers: await getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to load ticket history: ${await response.text()}`);
    }
    return response.json() as Promise<AssignedTicket[]>;
  },
  async getTicket(ticketId: string): Promise<TechnicianTicketDetails> {
    const response = await fetch(`${API_BASE}/tickets/technician/${encodeURIComponent(ticketId)}`, {
      headers: await getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to load ticket: ${await response.text()}`);
    }
    return response.json() as Promise<TechnicianTicketDetails>;
  },
  async acceptTicket(ticketId: string): Promise<TechnicianTicketDetails> {
    const response = await fetch(`${API_BASE}/tickets/technician/${encodeURIComponent(ticketId)}/accept`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to accept ticket: ${await response.text()}`);
    }
    return response.json() as Promise<TechnicianTicketDetails>;
  },
  async startTravel(ticketId: string): Promise<TechnicianTicketDetails> {
    const response = await fetch(`${API_BASE}/tickets/technician/${encodeURIComponent(ticketId)}/on-the-way`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ticket: ${await response.text()}`);
    }
    return response.json() as Promise<TechnicianTicketDetails>;
  },
  async markArrived(ticketId: string): Promise<TechnicianTicketDetails> {
    const response = await fetch(`${API_BASE}/tickets/technician/${encodeURIComponent(ticketId)}/arrived`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to update ticket: ${await response.text()}`);
    }
    return response.json() as Promise<TechnicianTicketDetails>;
  },
  async verifyCode(ticketId: string, verificationCode: string): Promise<TechnicianTicketDetails> {
    const response = await fetch(`${API_BASE}/tickets/${encodeURIComponent(ticketId)}/verify`, {
      method: 'POST',
      headers: { ...(await getHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationCode }),
    });
    if (!response.ok) {
      throw new Error(`Verification failed: ${await response.text()}`);
    }
    return response.json() as Promise<TechnicianTicketDetails>;
  },
  async completeRepair(ticketId: string, data: RepairCompletionData): Promise<TechnicianTicketDetails> {
    const response = await fetch(`${API_BASE}/tickets/technician/${encodeURIComponent(ticketId)}/complete`, {
      method: 'POST',
      headers: { ...(await getHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to complete repair: ${await response.text()}`);
    }
    return response.json() as Promise<TechnicianTicketDetails>;
  },
};
