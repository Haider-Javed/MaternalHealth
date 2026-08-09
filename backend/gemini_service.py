"""
gemini_service.py — Voice-to-JSON extraction and LLM precautionary guidance.
"""
import os
import json
import tempfile
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)


async def parse_audio_to_vitals(audio_bytes: bytes, mime_type: str = "audio/webm") -> dict:
    """
    Upload audio to Gemini 1.5 Flash and extract 6 patient vitals as JSON.
    Returns dict with keys: Age, SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set. Add it to .env file.")

    # Write audio to a temp file so genai can upload it
    suffix = ".webm" if "webm" in mime_type else ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        uploaded = genai.upload_file(path=tmp_path, mime_type=mime_type)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content([
            uploaded,
            (
                "Listen to the provided Urdu or English audio carefully. "
                "Extract the following 6 patient vitals and return ONLY a single valid raw JSON object "
                "with exactly these keys: "
                "{\"Age\": <int>, \"SystolicBP\": <int>, \"DiastolicBP\": <int>, "
                "\"BS\": <float>, \"BodyTemp\": <float>, \"HeartRate\": <int>}. "
                "Do not include any explanation, markdown, or extra text. Return ONLY the JSON."
            )
        ])
        genai.delete_file(uploaded.name)
    finally:
        os.unlink(tmp_path)

    raw = response.text.strip()
    # Strip markdown code fences if model wraps in them
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def generate_precautions(
    risk_level: str,
    vitals: dict,
    language: str = "en"
) -> list[str]:
    """
    Call Gemini 1.5 Flash to produce 3-4 actionable clinical precautionary measures.
    language: "en" for English, "ur" for Urdu
    """
    if not GEMINI_API_KEY:
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

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _fallback_precautions(risk_level: str, language: str) -> list[str]:
    """Static fallback used when Gemini API key is missing."""
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
