from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class SenderType(str, Enum):
    CUSTOMER = "CUSTOMER"
    AI = "AI"
    SYSTEM = "SYSTEM"

class InputType(str, Enum):
    TEXT = "TEXT"
    IMAGE = "IMAGE"
    VOICE = "VOICE"

class AIMessage(BaseModel):
    messageId: str
    sessionId: str
    userId: str
    sender: SenderType
    message: str
    inputType: InputType = InputType.TEXT
    language: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChatRequest(BaseModel):
    sessionId: str
    message: str
    inputType: InputType = InputType.TEXT
