import base64
import json
import os
import time
from typing import Any

import requests


API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")
AI_WORKER_SECRET = os.getenv("AI_WORKER_SECRET", "")
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "30"))
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llava")


def worker_headers() -> dict[str, str]:
    return {"x-ai-worker-secret": AI_WORKER_SECRET}


def fetch_queue() -> list[dict[str, Any]]:
    response = requests.get(f"{API_BASE_URL}/api/ai/queue", headers=worker_headers(), timeout=30)
    response.raise_for_status()
    return response.json().get("receipts", [])


def parse_receipt_with_ollama(image_bytes: bytes) -> dict[str, Any]:
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    prompt = (
        "Extract receipt data and return only JSON with keys: "
        "store (string|null), amount (number|null), date (YYYY-MM-DD|string|null), "
        "merchant (string|null), total (number|null), note (string|null)."
    )
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "images": [image_base64],
        "stream": False,
    }

    response = requests.post(f"{OLLAMA_URL}/api/generate", json=payload, timeout=120)
    response.raise_for_status()
    output = response.json().get("response", "{}")
    try:
        return json.loads(output)
    except json.JSONDecodeError:
        return {"rawOutput": output}


def complete_receipt(receipt_id: str, ai_data: dict[str, Any], ai_status: str) -> None:
    requests.post(
        f"{API_BASE_URL}/api/ai/complete",
        headers=worker_headers(),
        json={"receiptId": receipt_id, "aiData": ai_data, "aiStatus": ai_status},
        timeout=30,
    ).raise_for_status()


def process_receipt(item: dict[str, Any]) -> None:
    receipt_id = item["id"]
    image_url = item["imageUrl"]

    image_response = requests.get(image_url, timeout=60)
    image_response.raise_for_status()
    ai_data = parse_receipt_with_ollama(image_response.content)
    complete_receipt(receipt_id, ai_data, "COMPLETED")


def main() -> None:
    if not AI_WORKER_SECRET:
        raise RuntimeError("Missing AI_WORKER_SECRET environment variable")

    while True:
        try:
            queue = fetch_queue()
            for item in queue:
                try:
                    process_receipt(item)
                except Exception as receipt_error:
                    complete_receipt(item["id"], {"error": str(receipt_error)}, "FAILED")
        except Exception as queue_error:
            print(f"[worker] queue error: {queue_error}")

        time.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
