from fastapi import APIRouter, Depends
from firebase_admin import auth

from app.core.auth import get_current_user_id
from app.core.firebase import get_firestore

router = APIRouter()


@router.delete("/")
async def delete_account(user_id: str = Depends(get_current_user_id)):
    db = get_firestore()
    collections = ("devices", "ai_sessions", "ai_messages", "tickets", "feedback")

    for collection_name in collections:
        documents = db.collection(collection_name).where("userId", "==", user_id).stream()
        batch = db.batch()
        count = 0
        for document in documents:
            batch.delete(document.reference)
            count += 1
            if count == 400:
                batch.commit()
                batch = db.batch()
                count = 0
        if count:
            batch.commit()

    db.collection("users").document(user_id).delete()
    auth.delete_user(user_id)
    return {"status": "deleted"}
