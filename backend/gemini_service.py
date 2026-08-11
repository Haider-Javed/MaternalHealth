"""
gemini_service.py — Voice-to-JSON extraction and LLM precautionary guidance.
Uses the new google-genai SDK which supports AQ. format API keys.
"""
import os
import json
import tempfile
import asyncio
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Use the new google-genai SDK that supports AQ. keys
from google import genai
from google.genai import types

_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# gemini-flash-latest supports audio/multimodal inputs via File API
AUDIO_MODEL = "gemini-flash-latest"
# gemini-3.5-flash for text-only tasks (precautions)
TEXT_MODEL = "gemini-3.5-flash"



async def parse_audio_to_vitals(audio_bytes: bytes, mime_type: str = "audio/webm") -> dict:
    """
    Upload audio to Gemini (multimodal model) and extract 6 patient vitals as JSON.
    Returns dict with keys: Age, SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate
    """
    if not GEMINI_API_KEY or not _client:
        raise ValueError("GEMINI_API_KEY is not set. Add it to .env file.")

    # Determine correct suffix and mime type for the file
    if "ogg" in mime_type:
        suffix, upload_mime = ".ogg", "audio/ogg"
    elif "mp4" in mime_type or "mp4a" in mime_type:
        suffix, upload_mime = ".mp4", "audio/mp4"
    elif "webm" in mime_type:
        suffix, upload_mime = ".webm", "audio/webm"
    else:
        suffix, upload_mime = ".wav", "audio/wav"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        # Upload the audio file using new SDK
        uploaded = await asyncio.to_thread(
            _client.files.upload,
            file=tmp_path,
            config=types.UploadFileConfig(mime_type=upload_mime, display_name="patient_vitals_audio")
        )

        # Wait for file to become ACTIVE (ready to use)
        import time
        for _ in range(10):
            file_info = await asyncio.to_thread(_client.files.get, name=uploaded.name)
            if file_info.state.name == "ACTIVE":
                break
            await asyncio.sleep(1)

        prompt = (
            "Listen to the provided Urdu or English audio carefully. "
            "Extract the following 6 patient vitals and return ONLY a single valid raw JSON object "
            "with exactly these keys: "
            '{"Age": <int>, "SystolicBP": <int>, "DiastolicBP": <int>, '
            '"BS": <float>, "BodyTemp": <float>, "HeartRate": <int>}. '
            "Do not include any explanation, markdown, or extra text. Return ONLY the JSON."
        )

        # Pass the uploaded file object directly — correct way in google-genai v2
        response = await asyncio.to_thread(
            _client.models.generate_content,
            model=AUDIO_MODEL,
            contents=[uploaded, prompt]
        )

        # Clean up uploaded file
        await asyncio.to_thread(_client.files.delete, name=uploaded.name)

    except Exception as exc:
        raise ValueError(f"Audio parsing failed: {exc}") from exc
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


    raw = response.text.strip()
    try:
        if "{" in raw:
            start = raw.find("{")
            end = raw.rfind("}")
            if start != -1 and end != -1 and end >= start:
                raw = raw[start:end + 1]
        return json.loads(raw)
    except Exception as exc:
        raise ValueError(f"Failed to parse JSON response from model: {raw}. Error: {exc}") from exc


async def generate_precautions(
    risk_level: str,
    vitals: dict,
    language: str = "en"
) -> list[str]:
    """
    Call Gemini to produce 3-4 actionable clinical precautionary measures.
    language: "en" for English, "ur" for Urdu
    """
    if not GEMINI_API_KEY or not _client:
        return _fallback_precautions(risk_level, language)

    lang_instruction = (
        "Respond entirely in clear, professional Urdu script." if language == "ur"
        else "Respond entirely in clear, professional English."
    )
    vitals_str = (
        f"Age: {vitals.get('Age')} years, "
        f"Systolic BP: {vitals.get('SystolicBP')} mmHg, "
        f"Diastolic BP: {vitals.get('DiastolicBP')} mmHg, "
        f"Blood Sugar: {vitals.get('BS')} mmol/L, "
        f"Body Temperature: {vitals.get('BodyTemp')} °F, "
        f"Heart Rate: {vitals.get('HeartRate')} bpm"
    )

    prompt = (
        f"A Lady Health Worker (LHW) in rural Pakistan has assessed a pregnant patient. "
        f"Patient vitals: {vitals_str}. "
        f"ML model risk classification: {risk_level}. "
        f"Provide exactly 3 to 4 highly specific, actionable, and clinically accurate "
        f"first-aid and precautionary care recommendations for this LHW to follow immediately. "
        f"Format as a JSON array of strings, each being one recommendation. "
        f"Return ONLY the JSON array, no other text. "
        f"{lang_instruction}"
    )

    try:
        response = await asyncio.to_thread(
            _client.models.generate_content,
            model=TEXT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        raw = response.text.strip()
        if "[" in raw:
            start = raw.find("[")
            end = raw.rfind("]")
            if start != -1 and end != -1 and end >= start:
                raw = raw[start:end + 1]
        return json.loads(raw)
    except Exception as exc:
        print(f"[Gemini] Error generating precautions: {exc}. Falling back to static recommendations.")
        return _fallback_precautions(risk_level, language)


def _fallback_precautions(risk_level: str, language: str) -> list[str]:
    """Static fallback used when Gemini API key is missing or call fails."""
    if language == "ur":
        if risk_level == "High Risk":
            return [
                "فوری طور پر مریضہ کو تحصیل یا ضلعی ہسپتال منتقل کریں۔",
                "ہر 15 منٹ بعد بلڈ پریشر نوٹ کریں اور ریکارڈ کریں۔",
                "خاندان کو الرٹ کریں اور ایمبولینس سروس سے رابطہ کریں۔",
                "مریضہ کو پانی پلانا بند کریں جب تک ڈاکٹر کا مشورہ نہ ملے۔",
            ]
        return [
            "4 ہفتوں بعد دوبارہ معائنہ کرائیں۔",
            "آئرن اور فولک ایسڈ کی گولیاں باقاعدگی سے لیں۔",
            "روزانہ 8 گھنٹے آرام کریں اور مناسب پانی پئیں۔",
            "خطرناک علامات جیسے شدید سر درد یا خون بہنے پر فوری ہسپتال جائیں۔",
        ]
    if risk_level == "High Risk":
        return [
            "Immediately arrange transfer to the nearest THQ or DHQ Hospital.",
            "Monitor blood pressure every 15 minutes and document readings.",
            "Alert family members and contact emergency ambulance services.",
            "Do not allow oral intake until evaluated by a specialist.",
        ]
    return [
        "Schedule a routine follow-up antenatal visit in 4 weeks.",
        "Ensure daily Iron and Folic Acid supplementation.",
        "Advise 8 hours of rest and adequate fluid intake daily.",
        "Educate patient to seek care immediately for severe headache or bleeding.",
    ]
