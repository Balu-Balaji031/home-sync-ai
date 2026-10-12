import re

class SafetyService:
    @staticmethod
    def detect_unsafe_condition(message: str) -> bool:
        unsafe_keywords = [
            "spark", "sparks", "smoke", "fire", "burning smell", "burnt smell",
            "electric shock", "exposed wire", "mains", "melt", "flame", "electrocute",
            "தீ", "புகை", "மின்சாரம் தாக்க", "విద్యుత్ షాక్", "పొగ", "మంట",
        ]
        
        msg_lower = message.lower()
        for kw in unsafe_keywords:
            if kw in msg_lower or re.search(r'\b' + re.escape(kw) + r'\b', msg_lower):
                return True
        return False
        
    @staticmethod
    def get_safety_warning(language: str = "en") -> dict:
        messages = {
            "en": "Please stop using the device and avoid touching exposed electrical parts. This may be dangerous. Please arrange for a qualified technician.",
            "ta": "சாதனத்தைப் பயன்படுத்துவதை நிறுத்தி, வெளிப்பட்ட மின்சாரப் பகுதிகளைத் தொடாதீர்கள். இது ஆபத்தானதாக இருக்கலாம். தகுதியான தொழில்நுட்ப நிபுணரை அணுகவும்.",
            "te": "పరికరాన్ని ఉపయోగించడం ఆపి, బయట కనిపించే విద్యుత్ భాగాలను తాకవద్దు. ఇది ప్రమాదకరం కావచ్చు. అర్హత కలిగిన సాంకేతిక నిపుణుడిని సంప్రదించండి.",
        }
        return {
            "message": messages.get(language, messages["en"]),
            "language": language if language in messages else "en",
            "step": "RESOLUTION",
            "status": "UNSAFE",
            "confidence": 1.0,
            "safety_status": "UNSAFE",
            "needs_escalation": True,
            "suggested_action": "RAISE_TICKET"
        }
