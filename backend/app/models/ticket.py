from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class TicketStatus(str, Enum):
    CREATED = "CREATED"
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    ACCEPTED = "ACCEPTED"
    ON_THE_WAY = "ON_THE_WAY"
    ARRIVED = "ARRIVED"
    REPAIR_STARTED = "REPAIR_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"

class TicketPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class Ticket(BaseModel):
    ticketId: str
    userId: str
    deviceId: str
    sessionId: str
    deviceName: str
    deviceType: str
    title: str
    description: str
    category: str
    priority: TicketPriority = TicketPriority.MEDIUM
    status: TicketStatus = TicketStatus.CREATED
    aiSummary: str
    verificationCode: Optional[str] = None
    verificationStatus: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    assignedTechnicianId: Optional[str] = None
    assignedTechnicianName: Optional[str] = None
    assignedTechnicianSpecialization: Optional[str] = None

class TicketCreateRequest(BaseModel):
    sessionId: str
    deviceId: str
    title: str
    description: str
    category: str
    aiSummary: str

class TicketVerificationRequest(BaseModel):
    verificationCode: str = Field(pattern=r"^\d{6}$")

class RepairCompletionRequest(BaseModel):
    rootCause: str = Field(min_length=1)
    repairPerformed: str = Field(min_length=1)
    partsReplaced: Optional[str] = None
    additionalRepairNotes: Optional[str] = None
    repairOutcome: str = Field(pattern=r"^(FIXED|PARTIALLY_FIXED|NOT_FIXED)$")
