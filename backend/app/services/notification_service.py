from datetime import datetime


SERVICE_NOTIFICATIONS = {
    "CREATED": ("Service Request Created", "Your service request has been created successfully."),
    "ACCEPTED": ("Technician Accepted", "Your technician has accepted your service request."),
    "ON_THE_WAY": ("Technician On the Way", "Your technician is travelling to your location."),
    "ARRIVED": ("Technician Arrived", "Your technician has arrived at your location."),
    "REPAIR_STARTED": (
        "Repair Started",
        "The technician has verified your service request and started the repair.",
    ),
    "COMPLETED": ("Repair Completed", "Your repair has been completed successfully."),
}


def create_notification(
    db,
    notification_id: str,
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    ticket_id: str | None = None,
) -> None:
    data = {
        "notificationId": notification_id,
        "userId": user_id,
        "type": notification_type,
        "title": title,
        "message": message,
        "isRead": False,
        "createdAt": datetime.utcnow(),
    }
    if ticket_id:
        data["ticketId"] = ticket_id
    db.collection("notifications").document(notification_id).set(data, merge=False)


def create_service_notification(db, ticket: dict, transition: str) -> None:
    details = SERVICE_NOTIFICATIONS.get(transition)
    if not details:
        return
    ticket_id = ticket["ticketId"]
    create_notification(
        db,
        f"service_{ticket_id}_{transition.lower()}",
        ticket["userId"],
        "SERVICE",
        details[0],
        details[1],
        ticket_id,
    )


def create_ai_notification(db, session: dict, status: str) -> None:
    if status == "NEEDS_TECHNICIAN":
        title = "Technician Support Required"
        message = "Your issue requires technician assistance. A service ticket has been created."
    elif status in {"RESOLVED", "UNSAFE"}:
        title = "AI Troubleshooting Completed"
        message = "Your AI troubleshooting session has been completed."
    else:
        return
    create_notification(
        db,
        f"ai_{session['sessionId']}_{status.lower()}",
        session["userId"],
        "AI",
        title,
        message,
    )
