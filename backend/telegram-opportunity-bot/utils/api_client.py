import requests
from bot.config import BACKEND_URL


def send_message_to_backend(message: str):
    """
    Forward a raw Telegram message to the FastAPI backend.
    The backend is responsible for parsing, validation, eligibility checks,
    storage and reminders.
    """
    if not message or not message.strip():
        print("Received empty message. Skipping backend call.")
        return {"error": "empty_message"}

    payload = {"message": message}

    print("Forwarding message to backend...")
    print("Backend URL:", BACKEND_URL)

    try:
        response = requests.post(BACKEND_URL, json=payload, timeout=10)
        print("Backend HTTP status:", response.status_code)

        try:
            data = response.json()
        except Exception:
            # Handle non‑JSON responses gracefully
            data = {
                "error": "invalid_json_response",
                "status_code": response.status_code,
                "text": response.text[:200],
            }

        print("Backend response JSON:", data)
        return data

    except requests.RequestException as e:
        print("Error while calling backend:", str(e))
        return {"error": str(e)}