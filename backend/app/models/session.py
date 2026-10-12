from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SessionStatus(str, Enum):
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    NEEDS_TECHNICIAN = "NEEDS_TECHNICIAN"
    UNSAFE = "UNSAFE"
    CUSTOMER_CANCELLED = "CUSTOMER_CANCELLED"

class SessionStep(str, Enum):
    DEVICE_IDENTIFIED = "DEVICE_IDENTIFIED"
    PROBLEM_UNDERSTANDING = "PROBLEM_UNDERSTANDING"
    BASIC_CHECK = "BASIC_CHECK"
    FINDING_CAUSE = "FINDING_CAUSE"
    RESOLUTION = "RESOLUTION"
    VERIFICATION = "VERIFICATION"

class SafetyStatus(str, Enum):
    SAFE = "SAFE"
    WARNING = "WARNING"
    UNSAFE = "UNSAFE"

class AISession(BaseModel):
    sessionId: str
    userId: str
    deviceId: str
    deviceType: str
    category: str
    deviceName: str
    brand: str
    modelNumber: Optional[str] = None
    room: str
    language: str
    problem: str
    currentStep: SessionStep = SessionStep.DEVICE_IDENTIFIED
    status: SessionStatus = SessionStatus.IN_PROGRESS
    confidence: float = 0.0
    safetyStatus: SafetyStatus = SafetyStatus.SAFE
    completedChecks: List[str] = Field(default_factory=list)
    questionsAsked: List[str] = Field(default_factory=list)
    possibleCauses: List[str] = Field(default_factory=list)
    currentHypothesis: Optional[str] = None
    confirmedFacts: List[str] = Field(default_factory=list)
    rejectedCauses: List[str] = Field(default_factory=list)
    customerAnswers: List[str] = Field(default_factory=list)
    attemptedActions: List[str] = Field(default_factory=list)
    startedAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    endedAt: Optional[datetime] = None

class SessionCreateRequest(BaseModel):
    deviceId: str
    language: str
    problem: str

class SessionResponse(AISession):
    pass
