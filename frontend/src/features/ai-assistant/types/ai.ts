export type SessionStatus = 'IN_PROGRESS' | 'RESOLVED' | 'NEEDS_TECHNICIAN' | 'UNSAFE' | 'CUSTOMER_CANCELLED';

export type SessionStep = 'DEVICE_IDENTIFIED' | 'PROBLEM_UNDERSTANDING' | 'BASIC_CHECK' | 'FINDING_CAUSE' | 'RESOLUTION' | 'VERIFICATION';

export type SenderType = 'CUSTOMER' | 'AI' | 'SYSTEM';

export type InputType = 'TEXT' | 'IMAGE' | 'VOICE';

export interface AISession {
  sessionId: string;
  userId: string;
  deviceId: string;
  deviceType: string;
  category: string;
  deviceName: string;
  brand: string;
  modelNumber?: string;
  room: string;
  language: string;
  problem: string;
  currentStep: SessionStep;
  status: SessionStatus;
  confidence: number;
  safetyStatus: string;
  startedAt?: string;
  updatedAt: string;
}

export interface AIMessage {
  messageId: string;
  sessionId: string;
  userId: string;
  sender: SenderType;
  message: string;
  inputType: InputType;
  language: string;
  timestamp: string;
}

export interface SessionCreateRequest {
  deviceId: string;
  language: string;
  problem: string;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  inputType?: InputType;
}

export interface ChatResponse {
  ai_message: AIMessage;
  session_updates: Partial<AISession>;
  needs_escalation: boolean;
  suggested_action?: string;
}
