import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    FRONTEND_URL: str = "http://localhost:5173"
    FIREBASE_PROJECT_ID: str | None = None
    GEMINI_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    
    class Config:
        env_file = (".env", ".env.example")
        extra = "ignore"

    def model_post_init(self, __context):
        for field_name in ("GEMINI_API_KEY", "GROQ_API_KEY"):
            value = getattr(self, field_name)
            if isinstance(value, str):
                setattr(self, field_name, value.strip().strip('"').strip("'") or None)

settings = Settings()
