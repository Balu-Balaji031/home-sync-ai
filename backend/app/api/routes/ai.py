import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.auth import get_current_user_id
from app.core.firebase import get_firestore
from app.models.session import AISession, SessionCreateRequest, SessionResponse
from app.models.message import AIMessage, ChatRequest, SenderType, InputType
from app.services.ai_provider_manager import AIProviderError
from app.services.troubleshooting_service import TroubleshootingResponseError, TroubleshootingService
from app.services.notification_service import create_ai_notification

router = APIRouter()
troubleshooting_service = TroubleshootingService()


def _apply_session_updates(db, session_ref, session: dict, response: dict):
    state_updates = response.get("state_updates", {})
    session_ref.update({
        **state_updates,
        "status": response.get("status", "IN_PROGRESS"),
        "currentStep": response.get("step", "PROBLEM_UNDERSTANDING"),
        "confidence": response.get("confidence", 0.0),
        "safetyStatus": response.get("safety_status", "SAFE"),
        "updatedAt": datetime.utcnow(),
        **({"endedAt": datetime.utcnow()} if response.get("status") in {"RESOLVED", "NEEDS_TECHNICIAN", "UNSAFE"} else {}),
    })
    create_ai_notification(db, session, response.get("status", "IN_PROGRESS"))


def _response_session_updates(response: dict) -> dict:
    return {
        **response.get("state_updates", {}),
        "status": response.get("status", "IN_PROGRESS"),
        "currentStep": response.get("step", "PROBLEM_UNDERSTANDING"),
        "confidence": response.get("confidence", 0.0),
        "safetyStatus": response.get("safety_status", "SAFE"),
    }


def _get_owned_session(db, session_id: str, user_id: str):
    session_ref = db.collection("ai_sessions").document(session_id)
    session_doc = session_ref.get()
    if not session_doc.exists or session_doc.to_dict().get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    session_data = session_doc.to_dict()
    device_doc = db.collection("devices").document(session_data.get("deviceId", "")).get()
    if not device_doc.exists or device_doc.to_dict().get("userId") != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized device access")
    return session_ref, session_data


async def _read_upload(upload: UploadFile, allowed_types: set[str], max_bytes: int, label: str) -> bytes:
    if upload.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail=f"Unsupported {label} format.")
    data = await upload.read(max_bytes + 1)
    if not data:
        raise HTTPException(status_code=422, detail=f"Empty {label} file.")
    if len(data) > max_bytes:
        raise HTTPException(status_code=413, detail=f"{label.capitalize()} is too large.")
    return data


def _valid_image_signature(data: bytes, content_type: str) -> bool:
    signatures = {
        "image/jpeg": data.startswith(b"\xff\xd8\xff"),
        "image/png": data.startswith(b"\x89PNG\r\n\x1a\n"),
        "image/gif": data.startswith((b"GIF87a", b"GIF89a")),
        "image/webp": data.startswith(b"RIFF") and data[8:12] == b"WEBP",
    }
    return signatures.get(content_type, False)

@router.post("/sessions", response_model=SessionResponse)
async def create_session(request: SessionCreateRequest, user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    # Verify device ownership
    device_ref = db.collection('devices').document(request.deviceId)
    device_doc = device_ref.get()
    
    if not device_doc.exists:
        raise HTTPException(status_code=404, detail="Device not found")
        
    device_data = device_doc.to_dict()
    if device_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to access this device")
        
    session_id = str(uuid.uuid4())
    
    session = AISession(
        sessionId=session_id,
        userId=user_id,
        deviceId=request.deviceId,
        deviceType=device_data.get('deviceType', ''),
        category=device_data.get('category', ''),
        deviceName=device_data.get('deviceName', ''),
        brand=device_data.get('brand', ''),
        modelNumber=device_data.get('modelNumber'),
        room=device_data.get('room', ''),
        language=request.language,
        problem=request.problem
    )
    
    try:
        db.collection('ai_sessions').document(session_id).set(session.dict())
        
        # Save initial user message
        msg_id = str(uuid.uuid4())
        initial_msg = AIMessage(
            messageId=msg_id,
            sessionId=session_id,
            userId=user_id,
            sender=SenderType.CUSTOMER,
            message=request.problem,
            language=request.language
        )
        db.collection('ai_messages').document(msg_id).set(initial_msg.dict())
        initial_response = await troubleshooting_service.start_session(session.dict())
        _apply_session_updates(db, db.collection('ai_sessions').document(session_id), session.dict(), initial_response)
        ai_msg_id = str(uuid.uuid4())
        ai_msg = AIMessage(
            messageId=ai_msg_id,
            sessionId=session_id,
            userId=user_id,
            sender=SenderType.AI,
            message=initial_response["message"],
            language=initial_response["language"],
        )
        db.collection('ai_messages').document(ai_msg_id).set(ai_msg.dict())
        session = AISession(**{**session.dict(), **initial_response.get("state_updates", {}),
                               "currentStep": initial_response.get("step", session.currentStep),
                               "status": initial_response.get("status", session.status),
                               "confidence": initial_response.get("confidence", session.confidence),
                               "safetyStatus": initial_response.get("safety_status", session.safetyStatus)})
    except AIProviderError as e:
        raise HTTPException(status_code=503, detail="AI troubleshooting is temporarily unavailable. Please try again shortly or raise a ticket.") from e
    except TroubleshootingResponseError as e:
        raise HTTPException(status_code=502, detail="AI troubleshooting returned an invalid response.") from e
    except Exception as e:
        print(f"Firestore write failed for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize AI session in database.")
    
    return session

@router.get("/sessions", response_model=list[SessionResponse])
async def get_sessions(user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    if not db:
        raise HTTPException(status_code=500, detail="Database not initialized")
        
    docs = list(
        db.collection('ai_sessions')
        .where('userId', '==', user_id)
        .order_by('startedAt', direction='DESCENDING')
        .limit(15)
        .stream()
    )
    sessions = [doc.to_dict() for doc in docs]
    return sessions

@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    session_ref = db.collection('ai_sessions').document(session_id)
    session_doc = session_ref.get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = session_doc.to_dict()
    if session_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    return session_data

@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str, user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    # Verify session ownership first
    session_ref = db.collection('ai_sessions').document(session_id)
    session_doc = session_ref.get()
    
    if not session_doc.exists or session_doc.to_dict().get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    docs = list(db.collection('ai_messages').where('sessionId', '==', session_id).stream())
    messages = [doc.to_dict() for doc in docs]
    messages.sort(key=lambda x: x.get('timestamp', ''))
    return messages

@router.post("/chat")
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    
    # Validate session
    session_ref = db.collection('ai_sessions').document(request.sessionId)
    session_doc = session_ref.get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session_data = session_doc.to_dict()
    if session_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    # Save user message
    user_msg_id = str(uuid.uuid4())
    user_msg = AIMessage(
        messageId=user_msg_id,
        sessionId=request.sessionId,
        userId=user_id,
        sender=SenderType.CUSTOMER,
        message=request.message,
        inputType=request.inputType,
        language=session_data.get('language', 'en'),
    )
    db.collection('ai_messages').document(user_msg_id).set(user_msg.dict())
    
    # Get history
    history_docs_list = list(db.collection('ai_messages').where('sessionId', '==', request.sessionId).stream())
    history = [doc.to_dict() for doc in history_docs_list]
    history.sort(key=lambda x: x.get('timestamp', ''))
    
    # Process with AI
    try:
        ai_response = await troubleshooting_service.process_chat(
            session=session_data,
            conversation_history=history,
            new_message=request.message,
            image_url=None
        )
    except AIProviderError as e:
        raise HTTPException(status_code=503, detail="AI troubleshooting is temporarily unavailable. Please try again shortly or raise a ticket.") from e
    except TroubleshootingResponseError as e:
        raise HTTPException(status_code=502, detail="AI troubleshooting returned an invalid response.") from e
    
    # Save AI message
    ai_msg_id = str(uuid.uuid4())
    ai_msg = AIMessage(
        messageId=ai_msg_id,
        sessionId=request.sessionId,
        userId=user_id,
        sender=SenderType.AI,
        message=ai_response.get("message", ""),
        language=ai_response.get("language", session_data.get('language', 'en'))
    )
    db.collection('ai_messages').document(ai_msg_id).set(ai_msg.dict())
    
    # Update session state
    _apply_session_updates(db, session_ref, session_data, ai_response)
    
    return {
        "ai_message": ai_msg.dict(),
        "session_updates": _response_session_updates(ai_response),
        "needs_escalation": ai_response.get("needs_escalation", False),
        "suggested_action": ai_response.get("suggested_action")
    }

@router.post("/chat/image")
async def chat_image(
    sessionId: str = Form(...),
    text: str = Form(""),
    image: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    db = get_firestore()
    session_ref, session_data = _get_owned_session(db, sessionId, user_id)
    image_bytes = await _read_upload(
        image,
        {"image/jpeg", "image/png", "image/gif", "image/webp"},
        5 * 1024 * 1024,
        "image",
    )
    if not _valid_image_signature(image_bytes, image.content_type or ""):
        raise HTTPException(status_code=415, detail="Image content does not match its declared format.")
    
    # Save user message with image
    user_msg_id = str(uuid.uuid4())
    user_msg = AIMessage(
        messageId=user_msg_id,
        sessionId=sessionId,
        userId=user_id,
        sender=SenderType.CUSTOMER,
        message=text or "Attached an image.",
        inputType=InputType.IMAGE,
        language=session_data.get('language', 'en'),
    )
    db.collection('ai_messages').document(user_msg_id).set(user_msg.dict())
    
    history_docs = db.collection('ai_messages').where('sessionId', '==', sessionId).stream()
    history = [doc.to_dict() for doc in history_docs]
    history.sort(key=lambda item: item.get('timestamp', ''))
    
    try:
        ai_response = await troubleshooting_service.process_chat(
            session=session_data,
            conversation_history=history,
            new_message=text or "Attached an image.",
            image_url=None,
            image_bytes=image_bytes,
            mime_type=image.content_type
        )
    except AIProviderError as e:
        raise HTTPException(status_code=503, detail="AI troubleshooting is temporarily unavailable. Please try again shortly or raise a ticket.") from e
    except TroubleshootingResponseError as e:
        raise HTTPException(status_code=502, detail="AI troubleshooting returned an invalid response.") from e
    
    ai_msg_id = str(uuid.uuid4())
    ai_msg = AIMessage(
        messageId=ai_msg_id, sessionId=sessionId, userId=user_id, sender=SenderType.AI,
        message=ai_response.get("message", ""), language=ai_response.get("language", session_data.get('language', 'en'))
    )
    db.collection('ai_messages').document(ai_msg_id).set(ai_msg.dict())
    
    _apply_session_updates(db, session_ref, session_data, ai_response)
    
    return {
        "ai_message": ai_msg.dict(),
        "session_updates": _response_session_updates(ai_response)
    }

@router.post("/chat/voice")
async def chat_voice(
    sessionId: str = Form(...),
    audio: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    db = get_firestore()
    session_ref, session_data = _get_owned_session(db, sessionId, user_id)
    
    # Voice uses the same troubleshooting state after transcription.
    from app.core.config import settings
    import httpx
    
    transcript = ""
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY != "DUMMY_KEY_TO_PREVENT_CRASH":
        try:
            audio_content = await _read_upload(
                audio,
                {"audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp4"},
                10 * 1024 * 1024,
                "audio",
            )
            async with httpx.AsyncClient() as client:
                files = {'file': (audio.filename, audio_content, audio.content_type)}
                data = {'model': 'whisper-large-v3'}
                headers = {'Authorization': f'Bearer {settings.GROQ_API_KEY}'}
                resp = await client.post('https://api.groq.com/openai/v1/audio/transcriptions', files=files, data=data, headers=headers)
                resp.raise_for_status()
                transcript = resp.json().get('text', '')
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=500, detail="Voice transcription failed. External provider unavailable.")
    else:
        raise HTTPException(status_code=501, detail="Voice transcription requires GROQ_API_KEY configuration.")
        
    if not transcript:
        raise HTTPException(status_code=422, detail="Could not transcribe audio.")

    # Save user message
    user_msg_id = str(uuid.uuid4())
    user_msg = AIMessage(
        messageId=user_msg_id, sessionId=sessionId, userId=user_id, sender=SenderType.CUSTOMER,
        message=transcript, inputType=InputType.VOICE, language=session_data.get('language', 'en')
    )
    db.collection('ai_messages').document(user_msg_id).set(user_msg.dict())
    
    history_docs = db.collection('ai_messages').where('sessionId', '==', sessionId).stream()
    history = [doc.to_dict() for doc in history_docs]
    history.sort(key=lambda item: item.get('timestamp', ''))
    
    try:
        ai_response = await troubleshooting_service.process_chat(
            session=session_data, conversation_history=history, new_message=transcript
        )
    except AIProviderError as e:
        raise HTTPException(status_code=503, detail="AI troubleshooting is temporarily unavailable. Please try again shortly or raise a ticket.") from e
    except TroubleshootingResponseError as e:
        raise HTTPException(status_code=502, detail="AI troubleshooting returned an invalid response.") from e
    
    ai_msg_id = str(uuid.uuid4())
    ai_msg = AIMessage(
        messageId=ai_msg_id, sessionId=sessionId, userId=user_id, sender=SenderType.AI,
        message=ai_response.get("message", ""), language=ai_response.get("language", session_data.get('language', 'en'))
    )
    db.collection('ai_messages').document(ai_msg_id).set(ai_msg.dict())
    
    _apply_session_updates(db, session_ref, session_data, ai_response)
    
    return {
        "user_message": user_msg.dict(),
        "ai_message": ai_msg.dict(),
        "session_updates": _response_session_updates(ai_response)
    }
