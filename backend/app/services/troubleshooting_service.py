from typing import Any

from app.prompts.troubleshooting_prompt import TROUBLESHOOTING_SYSTEM_PROMPT
from app.services.ai_provider_manager import AIProviderError, AIProviderManager
from app.services.safety_service import SafetyService
from app.services.troubleshooting_strategy import TroubleshootingStrategy


class TroubleshootingResponseError(Exception):
    pass


class TroubleshootingService:
    def __init__(self):
        self.ai_manager = AIProviderManager()
        self.safety = SafetyService()
        self.strategy = TroubleshootingStrategy()

    async def start_session(self, session: dict[str, Any]) -> dict[str, Any]:
        return await self.process_chat(session, [], session.get("problem", ""))

    async def process_chat(
        self,
        session: dict[str, Any],
        conversation_history: list[dict[str, Any]],
        new_message: str,
        image_url: str | None = None,
        image_bytes: bytes | None = None,
        mime_type: str | None = None,
    ) -> dict[str, Any]:
        if self.safety.detect_unsafe_condition(new_message):
            return self.safety.get_safety_warning(session.get("language", "en"))

        system_prompt = f"{TROUBLESHOOTING_SYSTEM_PROMPT}\n\n{self._build_context(session)}"
        messages = self._format_history(conversation_history)
        content = new_message
        if image_url:
            content += f"\n[User uploaded image for this same troubleshooting session: {image_url}]"
        messages.append({"role": "user", "content": content})

        try:
            response = await self.ai_manager.get_response(system_prompt, messages, image_bytes, mime_type)
        except AIProviderError:
            raise
        except Exception as error:
            raise TroubleshootingResponseError("The troubleshooting response was invalid.") from error

        return self._validate_response(response, session, new_message)

    def _build_context(self, session: dict[str, Any]) -> str:
        state = {
            "device": session.get("deviceName"),
            "type": session.get("deviceType"),
            "category": session.get("category"),
            "brand": session.get("brand"),
            "model": session.get("modelNumber") or "Unknown",
            "room": session.get("room"),
            "language": session.get("language", "en"),
            "original_problem": session.get("problem"),
            "current_step": session.get("currentStep", "DEVICE_IDENTIFIED"),
            "status": session.get("status", "IN_PROGRESS"),
            "confidence": session.get("confidence", 0.0),
            "safety_status": session.get("safetyStatus", "SAFE"),
            "possible_causes": session.get("possibleCauses", []),
            "current_hypothesis": session.get("currentHypothesis"),
            "confirmed_facts": session.get("confirmedFacts", []),
            "rejected_causes": session.get("rejectedCauses", []),
            "customer_answers": session.get("customerAnswers", []),
            "completed_checks": session.get("completedChecks", []),
            "questions_already_asked": session.get("questionsAsked", []),
            "attempted_actions": session.get("attemptedActions", []),
        }
        state_lines = [f"{key}: {value}" for key, value in state.items()]
        return "[SESSION STATE]\n" + "\n".join(state_lines) + "\n\n" + self.strategy.get_context(session)

    @staticmethod
    def _format_history(history: list[dict[str, Any]]) -> list[dict[str, str]]:
        return [
            {
                "role": "user" if message.get("sender") == "CUSTOMER" else "assistant",
                "content": message.get("message", ""),
            }
            for message in history
            if message.get("message")
        ]

    def _validate_response(self, response: dict[str, Any], session: dict[str, Any], customer_message: str) -> dict[str, Any]:
        if not isinstance(response, dict) or not isinstance(response.get("message"), str) or not response["message"].strip():
            raise TroubleshootingResponseError("The AI provider returned no customer-facing message.")

        language = response.get("language") or session.get("language", "en")
        if language not in {"en", "ta", "te"}:
            language = session.get("language", "en")
        status = response.get("status", "IN_PROGRESS")
        step = response.get("step", session.get("currentStep", "PROBLEM_UNDERSTANDING"))
        safety_status = response.get("safety_status", "SAFE")
        if status not in {"IN_PROGRESS", "RESOLVED", "NEEDS_TECHNICIAN", "UNSAFE"}:
            status = "IN_PROGRESS"
        if step not in {"DEVICE_IDENTIFIED", "PROBLEM_UNDERSTANDING", "BASIC_CHECK", "FINDING_CAUSE", "RESOLUTION", "VERIFICATION"}:
            step = "PROBLEM_UNDERSTANDING"
        if safety_status not in {"SAFE", "WARNING", "UNSAFE"}:
            safety_status = "SAFE"

        if self.safety.detect_unsafe_condition(response["message"]):
            return self.safety.get_safety_warning(language)
        if safety_status == "UNSAFE" or status == "UNSAFE":
            return self.safety.get_safety_warning(language)

        check_key = response.get("check_key")
        completed_checks = list(dict.fromkeys(session.get("completedChecks", [])))
        if self.strategy.is_known_check(session, check_key) and check_key not in completed_checks:
            completed_checks.append(check_key)
        elif check_key and check_key in completed_checks:
            check_key = None

        questions = list(dict.fromkeys(session.get("questionsAsked", [])))
        message = response["message"].strip()
        if self._looks_like_question(message) and message not in questions:
            questions.append(message)

        confirmed_facts = list(dict.fromkeys(session.get("confirmedFacts", [])))
        confirmed_facts.extend(self._string_list(response.get("new_facts")))
        rejected_causes = list(dict.fromkeys(session.get("rejectedCauses", [])))
        rejected_causes.extend(self._string_list(response.get("rejected_causes")))
        answers = list(session.get("customerAnswers", []))
        if customer_message and customer_message not in answers:
            answers.append(customer_message)

        status = "NEEDS_TECHNICIAN" if len(questions) >= 12 and status == "IN_PROGRESS" else status
        needs_escalation = bool(response.get("needs_escalation")) or status == "NEEDS_TECHNICIAN"
        if status == "RESOLVED" and step != "VERIFICATION":
            status = "IN_PROGRESS"

        try:
            confidence = max(0.0, min(1.0, float(response.get("confidence", session.get("confidence", 0.0)))))
        except (TypeError, ValueError):
            confidence = 0.0

        return {
            "message": message,
            "language": language,
            "step": step,
            "status": status,
            "confidence": confidence,
            "safety_status": safety_status,
            "needs_escalation": needs_escalation,
            "suggested_action": response.get("suggested_action"),
            "state_updates": {
                "completedChecks": completed_checks,
                "questionsAsked": questions,
                "possibleCauses": self._string_list(response.get("possible_causes")) or session.get("possibleCauses", []),
                "currentHypothesis": response.get("current_hypothesis") or session.get("currentHypothesis"),
                "confirmedFacts": confirmed_facts,
                "rejectedCauses": rejected_causes,
                "customerAnswers": answers,
                "attemptedActions": list(session.get("attemptedActions", [])),
            },
        }

    @staticmethod
    def _string_list(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]

    @staticmethod
    def _looks_like_question(message: str) -> bool:
        return "?" in message or message.rstrip().endswith(("吗", "ஆ?", "దా?"))
