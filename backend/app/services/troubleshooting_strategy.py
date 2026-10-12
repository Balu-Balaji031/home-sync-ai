from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class DiagnosticCheck:
    key: str
    purpose: str
    safe: bool = True


STRATEGIES: dict[str, tuple[DiagnosticCheck, ...]] = {
    "lighting": (
        DiagnosticCheck("power_available", "confirm that the light or its switch has power"),
        DiagnosticCheck("physical_light_behavior", "observe whether the light is completely off, flickering, or dim"),
        DiagnosticCheck("app_control", "check whether the light responds to the smart-home app"),
        DiagnosticCheck("device_online", "check whether the device appears online in the app"),
        DiagnosticCheck("other_devices_online", "compare connectivity with another smart-home device"),
        DiagnosticCheck("pairing_state", "check whether the light remains paired to the home system"),
        DiagnosticCheck("safe_recovery", "try only a safe, user-accessible restart or re-pairing action"),
    ),
    "climate": (
        DiagnosticCheck("power_available", "confirm that the AC has power"),
        DiagnosticCheck("display_status", "check the AC display and any visible error code"),
        DiagnosticCheck("operating_mode", "check the selected mode and temperature setting"),
        DiagnosticCheck("airflow", "check whether air is moving and whether it feels cool or warm"),
        DiagnosticCheck("remote_or_app_control", "check whether the remote or app controls the AC"),
        DiagnosticCheck("filter_condition", "check the accessible filter only if safe and user-serviceable"),
    ),
    "entertainment": (
        DiagnosticCheck("power_available", "confirm that the TV has power"),
        DiagnosticCheck("display_status", "check whether the display is blank, damaged, or showing an error"),
        DiagnosticCheck("remote_control", "check whether the TV responds to its remote or controls"),
        DiagnosticCheck("input_source", "check the selected input or source"),
        DiagnosticCheck("network_status", "check whether the TV is connected to the network"),
        DiagnosticCheck("app_or_streaming", "check whether the issue affects one app or all content"),
    ),
    "cleaning": (
        DiagnosticCheck("power_available", "confirm that the washing machine has power"),
        DiagnosticCheck("door_status", "check whether the door or lid is fully closed"),
        DiagnosticCheck("cycle_selection", "check the selected cycle and start control"),
        DiagnosticCheck("water_supply", "check whether the water supply is available"),
        DiagnosticCheck("drainage", "check whether the machine can drain normally"),
        DiagnosticCheck("error_code", "record any visible error code"),
    ),
    "kitchen": (
        DiagnosticCheck("power_available", "confirm that the refrigerator has power"),
        DiagnosticCheck("display_status", "check the display and any visible error code"),
        DiagnosticCheck("temperature_setting", "check the selected temperature"),
        DiagnosticCheck("door_seal", "check whether the door closes and seals normally"),
        DiagnosticCheck("airflow", "check for normal internal airflow without dismantling anything"),
        DiagnosticCheck("cooling_behavior", "check whether cooling is absent or intermittent"),
    ),
    "general": (
        DiagnosticCheck("power_available", "confirm that the device has power"),
        DiagnosticCheck("status_behavior", "describe what the device does when operated"),
        DiagnosticCheck("user_control", "check whether the device responds to its normal control"),
        DiagnosticCheck("connection_status", "check connectivity if this device uses a network"),
        DiagnosticCheck("error_code", "record any visible error or status message"),
        DiagnosticCheck("safe_recovery", "try only a safe, user-accessible restart"),
    ),
}


CATEGORY_ALIASES = {
    "lighting": "lighting",
    "climate": "climate",
    "entertainment": "entertainment",
    "cleaning": "cleaning",
    "kitchen": "kitchen",
}


class TroubleshootingStrategy:
    def get_checks(self, session: dict[str, Any]) -> tuple[DiagnosticCheck, ...]:
        category = str(session.get("category", "")).lower()
        return STRATEGIES.get(CATEGORY_ALIASES.get(category, "general"), STRATEGIES["general"])

    def get_available_checks(self, session: dict[str, Any]) -> list[DiagnosticCheck]:
        completed = set(session.get("completedChecks", []))
        return [check for check in self.get_checks(session) if check.key not in completed]

    def get_context(self, session: dict[str, Any]) -> str:
        checks = self.get_checks(session)
        available = self.get_available_checks(session)
        return "\n".join(
            [
                "Diagnostic strategy (use the first relevant available check, not a checklist):",
                *(f"- {check.key}: {check.purpose}" for check in checks),
                "Available checks:",
                *(f"- {check.key}: {check.purpose}" for check in available),
            ]
        )

    def is_known_check(self, session: dict[str, Any], check_key: str | None) -> bool:
        return bool(check_key) and check_key in {check.key for check in self.get_checks(session)}

    def is_safe_action(self, action: str | None) -> bool:
        if not action:
            return True
        dangerous = (
            "exposed wire", "electrical panel", "mains wiring", "bypass", "open the panel",
            "touch the wire", "repair the circuit", "gas line", "refrigerant",
        )
        normalized = action.lower()
        return not any(term in normalized for term in dangerous)
