from app.core.config import settings
import google.generativeai as genai
import json

genai.configure(api_key=settings.GEMINI_API_KEY or "DUMMY_KEY_TO_PREVENT_CRASH")

class GeminiService:
    def __init__(self):
        # We use standard model for text
        self.model = genai.GenerativeModel('gemini-3.6-flash')
        
    async def generate_response(self, system_prompt: str, messages: list, image_bytes: bytes = None, mime_type: str = None) -> dict:
        try:
            # We construct a single prompt with the history
            full_prompt = f"System Instructions:\n{system_prompt}\n\n"
            full_prompt += "Conversation History:\n"
            for m in messages:
                role = "Customer" if m["role"] == "user" else "AI"
                full_prompt += f"{role}: {m['content']}\n"
                
            full_prompt += "\nOutput JSON exactly matching the structured schema."
            
            contents = [full_prompt]
            if image_bytes and mime_type:
                contents.append({"mime_type": mime_type, "data": image_bytes})
            
            response = self.model.generate_content(
                contents,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json",
                ),
            )
            
            # Parse response
            return json.loads(response.text)
        except Exception as e:
            raise Exception(f"Gemini API Error: {str(e)}")
