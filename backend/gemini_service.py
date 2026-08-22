"""
gemini_service.py — Voice-to-JSON extraction and LLM precautionary guidance.
Uses the google-genai SDK with AQ key support.
"""
import os
import json
import tempfile
import asyncio
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

from google import genai
from google.genai import types

_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

AUDIO_MODEL = "gemini-flash-latest"
TEXT_MODEL = "gemini-3.5-flash"


async def parse_audio_to_vitals(audio_bytes: bytes, mime_type: str = "audio/webm") -> dict:
    """
    Upload audio to Gemini and extract 6 vitals + 3 red flags as JSON.
    Returns dict with keys: Age, SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate,
    vaginal_bleeding, severe_headache, facial_swelling
    """
    if not GEMINI_API_KEY or not _client:
        raise ValueError("GEMINI_API_KEY is not set. Add it to .env file.")

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
        uploaded = await asyncio.to_thread(
            _client.files.upload,
            file=tmp_path,
            config=types.UploadFileConfig(mime_type=upload_mime, display_name="patient_vitals_audio")
        )

        for _ in range(10):
            file_info = await asyncio.to_thread(_client.files.get, name=uploaded.name)
            if file_info.state.name == "ACTIVE":
                break
            await asyncio.sleep(1)

        prompt = (
            "Listen to the provided Urdu or English audio carefully. "
            "Extract patient vitals and emergency red flags. Return ONLY a single valid raw JSON object "
            "with exactly these keys: "
            '{"Age": <int>, "SystolicBP": <int>, "DiastolicBP": <int>, "BS": <float>, '
            '"BodyTemp": <float>, "HeartRate": <int>, "vaginal_bleeding": <bool>, '
            '"severe_headache": <bool>, "facial_swelling": <bool>}. '
            "If a vital numeric value is missing, set it to null. Set boolean symptoms to true if mentioned. "
            "Do not include any explanation, markdown, or extra text. Return ONLY the JSON."
        )

        response = await asyncio.to_thread(
            _client.models.generate_content,
            model=AUDIO_MODEL,
            contents=[uploaded, prompt]
        )

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
    Call Gemini to produce 3-4 actionable clinical precautionary measures,
    tailored to the 6 vitals and active red flags.
    """
    if not GEMINI_API_KEY or not _client:
        return _fallback_precautions(risk_level, language, vitals)

    lang_instruction = (
        "Respond entirely in clear, professional Urdu script." if language == "ur"
        else "Respond entirely in clear, professional English."
    )
    
    red_flags = []
    if vitals.get("vaginal_bleeding"):
        red_flags.append("Vaginal Bleeding (Antepartum Hemorrhage risk)")
    if vitals.get("severe_headache"):
        red_flags.append("Severe Headache / Blurred Vision (Preeclampsia risk)")
    if vitals.get("facial_swelling"):
        red_flags.append("Facial / Hand Swelling (Edema / Preeclampsia sign)")
    
    red_flags_str = ", ".join(red_flags) if red_flags else "None reported"

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
        f"Active Emergency Red-Flag Symptoms: {red_flags_str}. "
        f"Overall risk classification: {risk_level}. "
        f"Provide exactly 3 to 4 highly specific, actionable, and clinically accurate "
        f"first-aid and emergency precautionary recommendations for this LHW to follow immediately. "
        f"If emergency symptoms like bleeding, severe headache, or swelling are present, instruct on patient positioning, quiet environment, and rapid transfer. "
        f"Format as a JSON array of strings. Return ONLY the JSON array. "
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
        return _fallback_precautions(risk_level, language, vitals)


def _fallback_precautions(risk_level: str, language: str, vitals: dict = None) -> list[str]:
    vitals = vitals or {}
    has_bleeding = vitals.get("vaginal_bleeding", False)
    has_headache = vitals.get("severe_headache", False) or vitals.get("facial_swelling", False)

    if language == "ur":
        if risk_level == "High Risk":
            measures = [
                "فوری طور پر مریضہ کو نزدیکی تحصیل یا ضلعی ہسپتال منتقل کرنے کا انتظام کریں۔",
                "ہر 15 منٹ بعد بلڈ پریشر اور نبض ریکارڈ کریں۔",
            ]
            if has_bleeding:
                measures.append("مریضہ کو بستر پر سیدھا لٹائیں، پاؤں اونچے رکھیں اور جسمانی مشقت سے روکیں۔")
            elif has_headache:
                measures.append("مریضہ کو تاریک، پرسکون کمرے میں رکھیں تاکہ دورے (Eclampsia) سے بچایا جا سکے۔")
            else:
                measures.append("خاندان کو الرٹ کریں اور ایمبولینس سروس سے فوری رابطہ کریں۔")
            measures.append("ڈاکٹر کے معائنے تک مریضہ کو کھانے یا پینے کے لیے کچھ نہ دیں۔")
            return measures

        return [
            "4 ہفتوں بعد دوبارہ باقاعدہ معائنہ کرائیں۔",
            "آئرن اور فولک ایسڈ کی گولیاں باقاعدگی سے استعمال کریں۔",
            "روزانہ 8 گھنٹے نیند اور مناسب مقدار میں پانی یقینی بنائیں۔",
            "شدید سر درد یا خون بہنے کی صورت میں فوری ہسپتال رجوع کریں۔",
        ]

    if risk_level == "High Risk":
        measures = [
            "Immediately arrange urgent transfer to the nearest THQ or DHQ emergency hospital.",
            "Monitor and record Blood Pressure and Heart Rate every 15 minutes.",
        ]
        if has_bleeding:
            measures.append("Keep patient lying flat with legs slightly elevated to manage hemorrhage risk.")
        elif has_headache:
            measures.append("Keep patient in a quiet, darkened room to minimize eclampsia trigger risks.")
        else:
            measures.append("Alert family members and request emergency ambulance transport immediately.")
        measures.append("Withhold oral fluids and food until evaluated by an obstetrician.")
        return measures

    return [
        "Schedule a routine follow-up antenatal visit in 4 weeks.",
        "Ensure daily Iron and Folic Acid supplementation.",
        "Advise 8 hours of rest and adequate daily fluid intake.",
        "Educate patient to seek emergency hospital care if headache or bleeding occurs.",
    ]