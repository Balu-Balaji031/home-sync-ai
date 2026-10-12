from app.core.config import settings
from groq import Groq
import json

class GroqService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY or "DUMMY_KEY_TO_PREVENT_CRASH")
        self.model = "openai/gpt-oss-20b"

    async def generate_response(self, system_prompt: str, messages: list) -> dict:
        try:
            formatted_messages = [{"role": "system", "content": system_prompt}]
            for m in messages:
                role = "user" if m["role"] == "user" else "assistant"
                formatted_messages.append({"role": role, "content": m["content"]})
                
            response = self.client.chat.completions.create(
                messages=formatted_messages,
                model=self.model,
                response_format={"type": "json_object"},
            )
            
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            raise Exception(f"Groq API Error: {str(e)}")
