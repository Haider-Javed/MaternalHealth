# MedTriage AI

> **Agentic Maternal Health Co-Pilot for Lady Health Workers (LHWs) in Rural Pakistan**
> 
> *A bilingual (Urdu & English) web system combining Voice AI, dual-layer Machine Learning, Explainable AI (SHAP), and a LangGraph multi-agent safety audit to save maternal lives during field triage.*

---

## 📌 Executive Summary

Maternal mortality in low-resource rural settings remains dangerously high due to delayed detection of obstetric emergencies like **Preeclampsia** and **Antepartum Hemorrhage**. Frontline Lady Health Workers (LHWs) often lack specialist training and immediate medical back-up when evaluating patient vitals in rural dead zones.

**MedTriage AI** bridges this critical gap. It turns any mobile device or browser into a clinical co-pilot:
1. LHWs speak patient vitals and symptoms aloud in **Urdu or English**.
2. **Groq Whisper** and **Llama 3.3** automatically extract structured vitals and physical red-flag symptoms.
3. A **Random Forest ML Model** predicts risk levels alongside **SHAP Explainable AI** contribution percentages.
4. **Deterministic Clinical Overrides** instantly elevate critical symptoms (bleeding, severe headache, facial swelling) to **High Risk**, ensuring **zero false negatives**.
5. A **LangGraph Multi-Agent Supervisor** audits precautions against WHO maternal care standards using **Google Gemini 3.5 Flash**.
6. Generates a printable **Emergency Referral Slip** and locates nearby hospitals via interactive GIS mapping.

---

## ⚡ Key Features

* 🗣️ **Bilingual Voice AI (Whisper v3 + Llama 3.3 70B):** Hands-free voice-to-JSON extraction. LHWs hold a mic button, speak vitals and active symptoms in Urdu or English, and receive pre-filled form fields automatically.
* 🛡️ **Dual-Layer Hybrid Triage Engine:** Statistical classification via Scikit-learn **Random Forest Classifier** paired with **Obstetric Emergency Overrides** (automatically forcing High Risk status when active red flags are present).
* 📊 **SHAP Explainable AI (XAI):** Uses `TreeExplainer` feature attributions to show visual impact percentages for each vital sign (e.g., *Systolic BP: 42% contribution*), demystifying black-box AI for health workers.
* 🤖 **LangGraph Multi-Agent Supervisor:** Stateful 3-agent orchestration (`TriageAgent` → `PrecautionAgent` → `SafetyAuditAgent`) ensuring generated precautions align with WHO maternal health standards.
* 🗺️ **Emergency Facility GIS Mapping:** Automatically queries the **OpenStreetMap Overpass API** within 5km of the LHW's geolocation to show interactive Leaflet map pins, distances, and telephone contacts.
* 📄 **Printable Emergency Referral Slip:** Generates an A4-formatted, print-ready handover document containing patient vitals, active red flags, recommended facilities, and an LHW signature area.
* 🔌 **Model Context Protocol (MCP) Server:** Built with `FastMCP` to allow external hospital management systems (EMRs) and national health platforms to query triage tools over standard protocols.

---

## 🏗️ System Architecture & Workflow

```text
                                 [ LHW Voice / Manual Vitals Input ]
                                                 │
                                                 ▼
                                     [ Next.js 16 Web Client ]
                                                 │
                                                 │ POST /api/process-audio (WebM/MP4)
                                                 ▼
                                    [ Groq Whisper-large-v3 ]
                                                 │
                                                 │ Speech Transcript
                                                 ▼
                                  [ Groq Llama-3.3-70b-versatile ]
                                                 │
                                                 │ Structured Vitals & Red Flags JSON
                                                 ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FastAPI Backend Pipeline                                │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          LangGraph Multi-Agent Workflow                        │   │
│   │                                                                                │   │
│   │   ┌──────────────────┐      ┌────────────────────┐      ┌──────────────────┐   │   │
│   │   │   Triage Agent   │ ───► │  Precaution Agent  │ ───► │   Safety Audit   │   │   │
│   │   │  (RF + Red Flag) │      │  (Gemini 3.5 Flash)│      │  (WHO Standards) │   │   │
│   │   └────────┬─────────┘      └────────────────────┘      └──────────────────┘   │   │
│   └────────────┼───────────────────────────────────────────────────────────────────┘   │
│                │                                                                       │
│                ▼                                                                       │
│     [ SHAP TreeExplainer ] ──► Computes % feature contribution weights                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                                 │
                                                 │ Unified JSON Response
                                                 ▼
                                  [ Assessment Results Screen ]
                       ├── Color-Coded Risk Card & Confidence Score
                       ├── SHAP Clinical Risk Driver Bars
                       ├── 3-4 Gemini Actionable Precaution Steps
                       ├── Leaflet Emergency Hospital Pins (<5km)
                       └── Printable A4 Emergency Referral Slip
🛠️ Tech StackDomainTechnologyDescriptionFrontendNext.js 16 (App Router), Tailwind CSS, React-LeafletMobile-first UI supporting native Urdu Right-to-Left (RTL) typographyBackend APIFastAPI, Uvicorn, PydanticAsynchronous Python gateway with request validationMachine LearningScikit-learn (Random Forest), SHAPTabular classification and Explainable AI feature attributionMulti-AgentLangGraph, LangChainStateful 3-node clinical supervisor pipelineVoice AIGroq API (whisper-large-v3 & llama-3.3-70b)Sub-second speech recognition and structured JSON extractionGenerative AIGoogle Gemini 3.5 FlashActionable clinical first-aid precautions in Urdu/EnglishProtocol / InteropFastMCP (Model Context Protocol)Standardized tool interfaces for national EMR integrationGIS MappingOpenStreetMap Overpass API, Leaflet.jsProximity search for nearby emergency healthcare facilities📥 Getting StartedPrerequisitesPython: 3.12+Node.js: v18+ & npmAPI Keys: Groq API Key and Google Gemini API Key1. Backend SetupBash# Clone repository
git clone [https://github.com/Haider-Javed/MaternalHealth.git](https://github.com/Haider-Javed/MaternalHealth.git)
cd MaternalHealth/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file in the root folder
echo "GROQ_API_KEY=your_groq_api_key_here" > ../.env
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> ../.env

# Run FastAPI Web Server
uvicorn main:app --reload
Backend will run locally on http://127.0.0.1:8000.2. Frontend SetupBash# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Run Next.js development server
npm run dev
Frontend will run locally on http://localhost:3000.🔌 Model Context Protocol (MCP) ServerMedTriage AI includes a standalone MCP Server that exposes triage tools to AI agents or hospital management platforms:Bashcd backend
python mcp_server.py
Exposed MCP Toolstriage_maternal_vitals: Accepts 6 vitals and 3 red flags, returning risk status, confidence, and SHAP weights.find_nearby_emergency_hospitals: Accepts coordinates (lat, lng), returning hospital metadata and distance.📡 API Payload ExampleRequest Payload (POST /api/predict)JSON{
  "Age": 35,
  "SystolicBP": 145,
  "DiastolicBP": 95,
  "BS": 11.2,
  "BodyTemp": 100.1,
  "HeartRate": 102,
  "vaginal_bleeding": true,
  "severe_headache": false,
  "facial_swelling": false,
  "language": "en"
}
Response PayloadJSON{
  "risk_level": "High Risk",
  "probability": 0.95,
  "feature_contributions": {
    "SystolicBP": 42.1,
    "BS": 31.4,
    "Age": 12.3,
    "DiastolicBP": 8.2,
    "HeartRate": 4.0,
    "BodyTemp": 2.0
  },
  "precautionary_measures": [
    "Immediately arrange urgent transfer to the nearest THQ or DHQ emergency hospital.",
    "Keep patient lying flat with legs slightly elevated to manage hemorrhage risk.",
    "Monitor and record Blood Pressure and Heart Rate every 15 minutes.",
    "Withhold oral fluids and food until evaluated by an obstetrician."
  ],
  "audit_passed": true,
  "audit_notes": "Audit passed: Precautions align with WHO essential newborn and maternal care guidelines."
}
🚀 Future Roadmap📱 Automated Emergency Signal Dispatch (Phase 2): Integrate Twilio/WhatsApp APIs to automatically send emergency alerts with patient vitals and GPS coordinates directly to the nearest hospital's triage desk to reserve a bed before arrival.📶 Full Offline PWA & Edge Inference (Phase 3): Implement Service Workers, IndexedDB storage, and ONNX WebAssembly local inference so Lady Health Workers can perform full triage in zero-connectivity rural dead zones.👥 Contributors👤 Haider Javed — Co-Founder & AI Engineer👤 Muhammad Azeem ud din Babar — Co-Founder & Full-Stack Engineer
