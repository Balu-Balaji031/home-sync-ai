from app.services.gemini_service import GeminiService
from app.services.groq_service import GroqService


class AIProviderError(Exception):
    pass


class AIProviderManager:
    def __init__(self):
        self.gemini = GeminiService()
        self.groq = GroqService()
        
    async def get_response(self, system_prompt: str, messages: list, image_bytes: bytes = None, mime_type: str = None) -> dict:
        try:
            return await self.gemini.generate_response(system_prompt, messages, image_bytes, mime_type)
        except Exception:
            if image_bytes:
                raise AIProviderError("Vision processing is temporarily unavailable.")
            try:
                return await self.groq.generate_response(system_prompt, messages)
            except Exception as error:
                raise AIProviderError("No configured AI provider is currently available.") from error
