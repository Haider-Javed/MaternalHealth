"""
main.py — FastAPI application with CORS, LangGraph multi-agent pipeline, and MCP endpoints.
"""
import os
import json
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from groq import Groq

from agent_workflow import run_triage_workflow
from osm_service import fetch_nearby_hospitals

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(
    title="MedTriage AI — Agentic Maternal Health API",
    description="Bilingual Multi-Agent Triage System for Lady Health Workers in Rural Pakistan",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


class PredictRequest(BaseModel):
    Age: int = Field(..., ge=10, le=70)
    SystolicBP: int = Field(..., ge=60, le=220)
    DiastolicBP: int = Field(..., ge=40, le=140)
    BS: float = Field(..., ge=3.0, le=25.0)
    BodyTemp: float = Field(..., ge=95.0, le=106.0)
    HeartRate: int = Field(..., ge=40, le=180)
    vaginal_bleeding: bool = Field(default=False)
    severe_headache: bool = Field(default=False)
    facial_swelling: bool = Field(default=False)
    language: str = Field(default="en", pattern="^(en|ur)$")


@app.get("/")
def health_check():
    return {"status": "online", "service": "MedTriage AI Multi-Agent API v3"}


@app.post("/api/process-audio")
async def process_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    filename = file.filename if file.filename else "audio.webm"
    mime_type = file.content_type if file.content_type else "audio/webm"

    try:
        transcription = client.audio.transcriptions.create(
            file=(filename, audio_bytes, mime_type),
            model="whisper-large-v3",
            prompt="Patient vitals: Age, SystolicBP, DiastolicBP, BS, BodyTemp, HeartRate, Vaginal Bleeding, Severe Headache, Facial Swelling"
        )
        spoken_text = transcription.text

        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract patient vitals and emergency red flags from the text into a JSON object with keys: "
                        "Age (int), SystolicBP (int), DiastolicBP (int), BS (float), BodyTemp (float), HeartRate (int), "
                        "vaginal_bleeding (bool), severe_headache (bool), facial_swelling (bool). "
                        "If a vital numeric value is missing, set it to null. "
                        "Set red flag booleans to true if explicitly mentioned or implied, otherwise false."
                    )
                },
                {"role": "user", "content": spoken_text}
            ],
            response_format={"type": "json_object"}
        )
        vitals = json.loads(completion.choices[0].message.content)

    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Audio processing failed: {exc}")

    return {"transcript": spoken_text, "vitals": vitals}


@app.post("/api/predict")
async def predict_risk(req: PredictRequest):
    """Executes the multi-agent LangGraph workflow with SHAP feature attribution."""
    try:
        vitals_dict = req.model_dump(exclude={"language"})
        result_state = await run_triage_workflow(vitals_dict, req.language)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Agentic workflow execution failed: {exc}")

    return {
        "risk_level": result_state["risk_level"],
        "probability": round(result_state["probability"], 4),
        "feature_contributions": result_state["feature_contributions"],
        "precautionary_measures": result_state["precautions"],
        "audit_passed": result_state["audit_passed"],
        "audit_notes": result_state["audit_notes"],
    }


@app.get("/api/nearby-hospitals")
async def nearby_hospitals(
    lat: float = Query(..., description="Patient latitude"),
    lng: float = Query(..., description="Patient longitude"),
):
    try:
        hospitals = await fetch_nearby_hospitals(lat, lng)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"hospitals": hospitals}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)