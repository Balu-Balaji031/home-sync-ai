from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Multilingual Smart Home AI Helpdesk API")

# Configure CORS
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}

from app.api.routes.ai import router as ai_router
from app.api.routes.tickets import router as tickets_router
from app.api.routes.account import router as account_router

app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(tickets_router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(account_router, prefix="/api/account", tags=["Account"])
