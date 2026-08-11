"""
main.py — FastAPI application with CORS, routing, and all endpoints.
"""
import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from groq import Groq

from model import predict
from gemini_service import generate_precautions
from osm_service import fetch_nearby_hospitals

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(
    title="MedTriage AI — Maternal Health API",
    description="Bilingual Maternal Risk Triage for Lady Health Workers in Rural Pakistan",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Groq client using environment variable
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# ─────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    Age: int = Field(..., ge=10, le=70, json_schema_extra={"example": 28})
    SystolicBP: int = Field(..., ge=60, le=220, json_schema_extra={"example": 140})
    DiastolicBP: int = Field(..., ge=40, le=140, json_schema_extra={"example": 90})
    BS: float = Field(..., ge=3.0, le=25.0, json_schema_extra={"example": 8.5})
    BodyTemp: float = Field(..., ge=95.0, le=106.0, json_schema_extra={"example": 98.6})
    HeartRate: int = Field(..., ge=40, le=180, json_schema_extra={"example": 75})
    language: str = Field(default="en", pattern="^(en|ur)$")


# ─────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────
@app.get("/")
def health_check():
    return {"status": "online", "service": "MedTriage AI Backend v2"}


@app.post("/api/process-audio")
async def process_audio(file: UploadFile = File(...)):
    """
    Receive an audio recording, transcribe it using Groq Whisper,
    and extract the 6 vitals as JSON using Groq Llama.
    """
    audio_bytes = await file.read()
    filename = file.filename if file.filename else "audio.webm"
    mime_type = file.content_type if file.content_type else "audio/webm"

    try:
        # 1. Transcribe audio using Groq Whisper model
        transcription = client.audio.transcriptions.create(
            file=(filename, audio_bytes, mime_type),
            model="whisper-large-v3",
            prompt="Patient vitals: Age, SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate"
        )
        spoken_text = transcription.text

        # 2. Extract structured JSON vitals using Groq Llama model
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Extract patient vitals from the text into a JSON object with keys: Age (int), SystolicBP (int), DiastolicBP (int), BS (float), BodyTemp (float), HeartRate (int). If a value is missing, set it to null."
                },
                {
                    "role": "user",
                    "content": spoken_text
                }
            ],
            response_format={"type": "json_object"}
        )
        vitals = json.loads(completion.choices[0].message.content)

    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Audio processing failed: {exc}")

    return {"transcript": spoken_text, "vitals": vitals}


@app.post("/api/predict")
async def predict_risk(req: PredictRequest):
    """
    Run the Random Forest model on 6 vitals + call Gemini for LLM precautions.
    Returns risk_level, probability, and precautionary_measures list.
    """
    try:
        risk_level, probability = predict(
            age=req.Age,
            systolic_bp=req.SystolicBP,
            diastolic_bp=req.DiastolicBP,
            bs=req.BS,
            body_temp=req.BodyTemp,
            heart_rate=req.HeartRate,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Model inference failed: {exc}")

    vitals_dict = req.model_dump(exclude={"language"})
    try:
        precautions = await generate_precautions(risk_level, vitals_dict, req.language)
    except Exception:
        precautions = []

    return {
        "risk_level": risk_level,
        "probability": round(probability, 4),
        "precautionary_measures": precautions,
    }


@app.get("/api/nearby-hospitals")
async def nearby_hospitals(
    lat: float = Query(..., description="Patient latitude"),
    lng: float = Query(..., description="Patient longitude"),
):
    """
    Return up to 10 hospitals within 5 km using OSM Overpass API.
    Falls back to a hardcoded Pakistan hospital list on failure.
    """
    try:
        hospitals = await fetch_nearby_hospitals(lat, lng)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"hospitals": hospitals}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)