import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from firebase_admin import firestore
from app.core.auth import get_current_technician_id, get_current_user_id
from app.core.firebase import get_firestore
from app.models.ticket import (
    Ticket,
    TicketCreateRequest,
    TicketPriority,
    TicketStatus,
    RepairCompletionRequest,
    TicketVerificationRequest,
)
from app.services.notification_service import create_service_notification

router = APIRouter()

def determine_priority(description: str, ai_summary: str) -> TicketPriority:
    text = f"{description} {ai_summary}".lower()
    high_urgency_terms = (
        "safety", "electrical", "smoke", "burning smell", "burning",
        "electric shock", "exposed wire", "exposed wires", "shock",
        "danger", "sparks", "spark", "fire",
    )
    medium_urgency_terms = (
        "not working", "doesn't work", "doesnt work", "won't work",
        "wont work", "failed", "failure", "broken", "repair", "service",
        "not functioning",
    )
    if any(term in text for term in high_urgency_terms):
        return TicketPriority.HIGH
    if any(term in text for term in medium_urgency_terms):
        return TicketPriority.MEDIUM
    return TicketPriority.LOW

def generate_verification_code(db) -> str:
    for _ in range(10):
        code = f"{secrets.randbelow(1_000_000):06d}"
        if not list(db.collection("tickets").where("verificationCode", "==", code).limit(1).stream()):
            return code
    raise HTTPException(status_code=500, detail="Unable to generate a unique verification code")

def ensure_ticket_verification(db, ticket_ref, ticket: dict) -> dict:
    code = ticket.get("verificationCode")
    updates = {}
    if not isinstance(code, str) or len(code) != 6 or not code.isdigit():
        code = generate_verification_code(db)
        updates["verificationCode"] = code
        ticket["verificationCode"] = code
    if not ticket.get("verificationStatus"):
        updates["verificationStatus"] = "PENDING"
        ticket["verificationStatus"] = "PENDING"
    if updates:
        ticket_ref.update(updates)
    return ticket

def ticket_created_at(ticket: dict) -> datetime:
    value = ticket.get("createdAt")
    if isinstance(value, datetime):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.min.replace(tzinfo=timezone.utc)

@router.post("/", response_model=Ticket)
async def create_ticket(request: TicketCreateRequest, user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    
    # Validate device ownership
    device_ref = db.collection('devices').document(request.deviceId)
    device_doc = device_ref.get()
    if not device_doc.exists or device_doc.to_dict().get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    device_data = device_doc.to_dict()
        
    # Validate session ownership
    session_ref = db.collection('ai_sessions').document(request.sessionId)
    session_doc = session_ref.get()
    if not session_doc.exists or session_doc.to_dict().get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    verification_code = generate_verification_code(db)
    
    ticket = Ticket(
        ticketId=ticket_id,
        userId=user_id,
        deviceId=request.deviceId,
        sessionId=request.sessionId,
        deviceName=device_data.get("deviceName", ""),
        deviceType=device_data.get("deviceType", ""),
        title=request.title,
        description=request.description,
        category=request.category,
        aiSummary=request.aiSummary,
        priority=determine_priority(request.description, request.aiSummary),
        verificationCode=verification_code,
        verificationStatus="PENDING",
    )
    
    db.collection('tickets').document(ticket_id).set(ticket.dict())
    create_service_notification(db, ticket.dict(), "CREATED")
    
    # Update session status
    session_ref.update({
        "status": "NEEDS_TECHNICIAN",
        "updatedAt": datetime.utcnow()
    })
    
    return ticket

@router.get("/")
async def get_tickets(user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    tickets = db.collection('tickets').where('userId', '==', user_id).stream()
    customer_tickets = []
    for ticket_doc in tickets:
        ticket = ticket_doc.to_dict()
        ticket.pop("verificationCode", None)
        customer_tickets.append(ticket)
    return sorted(
        customer_tickets,
        key=ticket_created_at,
        reverse=True,
    )

@router.post("/{ticket_id}/verify", response_model=Ticket)
async def verify_ticket(
    ticket_id: str,
    request: TicketVerificationRequest,
    user_id: str = Depends(get_current_technician_id),
):
    db = get_firestore()
    ticket_ref = db.collection("tickets").document(ticket_id)
    ticket_doc = ticket_ref.get()
    if not ticket_doc.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket = ticket_doc.to_dict()
    if ticket.get("assignedTechnicianId") != user_id:
        raise HTTPException(status_code=403, detail="Only the assigned technician can verify this ticket")
    if ticket.get("status") != TicketStatus.ARRIVED.value:
        raise HTTPException(status_code=409, detail="Verification is available after the technician arrives")
    if ticket.get("verificationCode") != request.verificationCode:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    ticket_ref.update({
        "verificationStatus": "VERIFIED",
        "status": TicketStatus.REPAIR_STARTED.value,
        "updatedAt": datetime.utcnow(),
    })
    ticket.update({
        "verificationStatus": "VERIFIED",
        "status": TicketStatus.REPAIR_STARTED.value,
    })
    create_service_notification(db, ticket, TicketStatus.REPAIR_STARTED.value)
    return ticket

@router.get("/assigned")
async def get_assigned_tickets(user_id: str = Depends(get_current_technician_id)):
    db = get_firestore()
    results = []
    for ticket_doc in db.collection("tickets").stream():
        ticket = ticket_doc.to_dict()
        assigned_id = ticket.get("assignedTechnicianId")
        if ticket.get("status") in (TicketStatus.COMPLETED.value, TicketStatus.RESOLVED.value, TicketStatus.CLOSED.value):
            continue
        if assigned_id and assigned_id != user_id:
            continue
        if not assigned_id and ticket.get("status") not in (TicketStatus.CREATED.value, TicketStatus.OPEN.value):
            continue
        customer_doc = db.collection("users").document(ticket.get("userId", "")).get()
        customer = customer_doc.to_dict() if customer_doc.exists else {}
        device_name = ticket.get("deviceName", "")
        device_type = ticket.get("deviceType", "")
        if not device_name or not device_type:
            device_doc = db.collection("devices").document(ticket.get("deviceId", "")).get()
            device = device_doc.to_dict() if device_doc.exists else {}
            device_name = device_name or device.get("deviceName", "")
            device_type = device_type or device.get("deviceType", "")
        results.append({
            **ticket,
            "deviceName": device_name,
            "deviceType": device_type,
            "customerName": customer.get("fullName", "Customer"),
        })
    return sorted(results, key=ticket_created_at, reverse=True)

@router.get("/history")
async def get_ticket_history(user_id: str = Depends(get_current_technician_id)):
    db = get_firestore()
    results = []
    for ticket_doc in db.collection("tickets").where("assignedTechnicianId", "==", user_id).stream():
        ticket = ticket_doc.to_dict()
        if ticket.get("status") != TicketStatus.COMPLETED.value:
            continue
        customer_doc = db.collection("users").document(ticket.get("userId", "")).get()
        customer = customer_doc.to_dict() if customer_doc.exists else {}
        results.append({
            **ticket,
            "customerName": customer.get("fullName", "Customer"),
        })
    return sorted(results, key=ticket_created_at, reverse=True)

@router.get("/technician/{ticket_id}")
async def get_technician_ticket(ticket_id: str, user_id: str = Depends(get_current_technician_id)):
    db = get_firestore()
    ticket_ref = db.collection("tickets").document(ticket_id)
    ticket_doc = ticket_ref.get()
    if not ticket_doc.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket = ticket_doc.to_dict()
    if ticket.get("assignedTechnicianId") and ticket.get("assignedTechnicianId") != user_id:
        raise HTTPException(status_code=403, detail="Only the assigned technician can access this ticket")
    customer_doc = db.collection("users").document(ticket.get("userId", "")).get()
    customer = customer_doc.to_dict() if customer_doc.exists else {}
    device_name = ticket.get("deviceName", "")
    device_type = ticket.get("deviceType", "")
    if not device_name or not device_type:
        device_doc = db.collection("devices").document(ticket.get("deviceId", "")).get()
        device = device_doc.to_dict() if device_doc.exists else {}
        device_name = device_name or device.get("deviceName", "")
        device_type = device_type or device.get("deviceType", "")

    address_parts = [
        customer.get("addressLine1"),
        customer.get("addressLine2"),
        customer.get("city"),
        customer.get("state"),
        customer.get("pincode"),
    ]
    return {
        **ticket,
        "deviceName": device_name,
        "deviceType": device_type,
        "customerName": customer.get("fullName", "Customer"),
        "customerPhone": customer.get("mobileNumber") or "N/A",
        "customerAddress": ", ".join(str(part) for part in address_parts if part) or "N/A",
    }

@router.post("/technician/{ticket_id}/accept")
async def accept_technician_ticket(ticket_id: str, user_id: str = Depends(get_current_technician_id)):
    db = get_firestore()
    ticket_ref = db.collection("tickets").document(ticket_id)
    ticket_doc = ticket_ref.get()
    if not ticket_doc.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")

    technician_doc = db.collection("users").document(user_id).get()
    technician = technician_doc.to_dict() if technician_doc.exists else {}
    updated_at = datetime.utcnow()
    assignment_updates = {
        "status": TicketStatus.ACCEPTED.value,
        "assignedTechnicianId": user_id,
        "assignedTechnicianName": technician.get("fullName"),
        "updatedAt": updated_at,
    }
    transaction = db.transaction()

    @firestore.transactional
    def assign_ticket(transaction):
        transaction_snapshot = ticket_ref.get(transaction=transaction)
        if not transaction_snapshot.exists:
            raise HTTPException(status_code=404, detail="Ticket not found")
        ticket = transaction_snapshot.to_dict()
        if ticket.get("assignedTechnicianId"):
            raise HTTPException(status_code=409, detail="Ticket is already assigned")
        if ticket.get("status") not in (None, TicketStatus.CREATED.value, TicketStatus.OPEN.value):
            raise HTTPException(status_code=409, detail="Ticket is no longer available for acceptance")
        transaction.update(ticket_ref, assignment_updates)
        return {**ticket, **assignment_updates}

    ticket = assign_ticket(transaction)
    create_service_notification(db, ticket, TicketStatus.ACCEPTED.value)
    return ticket

@router.post("/technician/{ticket_id}/on-the-way")
async def start_technician_travel(ticket_id: str, user_id: str = Depends(get_current_technician_id)):
    db = get_firestore()
    ticket_ref = db.collection("tickets").document(ticket_id)
    ticket_doc = ticket_ref.get()
    if not ticket_doc.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket = ticket_doc.to_dict()
    if ticket.get("assignedTechnicianId") != user_id:
        raise HTTPException(status_code=403, detail="Only the assigned technician can update this ticket")
    if ticket.get("status") != TicketStatus.ACCEPTED.value:
        raise HTTPException(status_code=409, detail="Ticket must be accepted before starting travel")

    updated_at = datetime.utcnow()
    ticket_ref.update({
        "status": TicketStatus.ON_THE_WAY.value,
        "updatedAt": updated_at,
    })
    ticket["status"] = TicketStatus.ON_THE_WAY.value
    ticket["updatedAt"] = updated_at
    create_service_notification(db, ticket, TicketStatus.ON_THE_WAY.value)
    return ticket

@router.post("/technician/{ticket_id}/arrived")
async def mark_technician_arrived(ticket_id: str, user_id: str = Depends(get_current_technician_id)):
    db = get_firestore()
    ticket_ref = db.collection("tickets").document(ticket_id)
    ticket_doc = ticket_ref.get()
    if not ticket_doc.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket = ticket_doc.to_dict()
    if ticket.get("assignedTechnicianId") != user_id:
        raise HTTPException(status_code=403, detail="Only the assigned technician can update this ticket")
    if ticket.get("status") != TicketStatus.ON_THE_WAY.value:
        raise HTTPException(status_code=409, detail="Ticket must be on the way before marking arrival")

    updated_at = datetime.utcnow()
    ticket_ref.update({
        "status": TicketStatus.ARRIVED.value,
        "updatedAt": updated_at,
    })
    ticket["status"] = TicketStatus.ARRIVED.value
    ticket["updatedAt"] = updated_at
    create_service_notification(db, ticket, TicketStatus.ARRIVED.value)
    return ticket

@router.post("/technician/{ticket_id}/complete")
async def complete_technician_repair(
    ticket_id: str,
    request: RepairCompletionRequest,
    user_id: str = Depends(get_current_technician_id),
):
    db = get_firestore()
    ticket_ref = db.collection("tickets").document(ticket_id)
    ticket_doc = ticket_ref.get()
    if not ticket_doc.exists:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ticket = ticket_doc.to_dict()
    if ticket.get("assignedTechnicianId") != user_id:
        raise HTTPException(status_code=403, detail="Only the assigned technician can update this ticket")
    if ticket.get("status") != TicketStatus.REPAIR_STARTED.value:
        raise HTTPException(status_code=409, detail="Ticket must be in repair started status before completion")
    if not request.rootCause.strip() or not request.repairPerformed.strip():
        raise HTTPException(status_code=422, detail="Root cause and repair performed are required")

    updated_at = datetime.utcnow()
    completed_at = updated_at
    updates = {
        "status": TicketStatus.COMPLETED.value,
        "rootCause": request.rootCause.strip(),
        "repairPerformed": request.repairPerformed.strip(),
        "partsReplaced": (request.partsReplaced or "").strip(),
        "additionalRepairNotes": (request.additionalRepairNotes or "").strip(),
        "repairOutcome": request.repairOutcome,
        "completedAt": completed_at,
        "updatedAt": updated_at,
    }
    ticket_ref.update(updates)
    ticket.update(updates)
    create_service_notification(db, ticket, TicketStatus.COMPLETED.value)
    return ticket

@router.get("/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    ticket_ref = db.collection("tickets").document(ticket_id)
    ticket_doc = ticket_ref.get()
    if not ticket_doc.exists or ticket_doc.to_dict().get("userId") != user_id:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ensure_ticket_verification(db, ticket_ref, ticket_doc.to_dict())
