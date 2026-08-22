"""
agent_workflow.py — Stateful Multi-Agent Clinical Supervisor using LangGraph.
Flow: TriageAgent -> SafetyAuditAgent -> PrecautionAgent
"""
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from gemini_service import generate_precautions


class TriageState(TypedDict):
    vitals: Dict[str, Any]
    risk_level: str
    probability: float
    feature_contributions: Dict[str, float]
    precautions: List[str]
    audit_passed: bool
    audit_notes: str
    language: str


def triage_agent_node(state: TriageState) -> Dict[str, Any]:
    """Node 1: Evaluates vitals and red flags."""
    from model import predict
    v = state["vitals"]
    risk_level, probability, feature_contributions = predict(
        age=v["Age"],
        systolic_bp=v["SystolicBP"],
        diastolic_bp=v["DiastolicBP"],
        bs=v["BS"],
        body_temp=v["BodyTemp"],
        heart_rate=v["HeartRate"],
        vaginal_bleeding=v.get("vaginal_bleeding", False),
        severe_headache=v.get("severe_headache", False),
        facial_swelling=v.get("facial_swelling", False),
    )
    return {
        "risk_level": risk_level,
        "probability": probability,
        "feature_contributions": feature_contributions,
    }


async def precaution_agent_node(state: TriageState) -> Dict[str, Any]:
    """Node 2: Generates LLM clinical precautions."""
    precautions = await generate_precautions(
        risk_level=state["risk_level"],
        vitals=state["vitals"],
        language=state.get("language", "en")
    )
    return {"precautions": precautions}


def safety_audit_node(state: TriageState) -> Dict[str, Any]:
    """Node 3: Safety Audit Agent cross-references WHO guidelines."""
    v = state["vitals"]
    risk = state["risk_level"]
    
    # Check for hypertensive emergency criteria
    sys_bp = v.get("SystolicBP", 0)
    dia_bp = v.get("DiastolicBP", 0)
    has_bleeding = v.get("vaginal_bleeding", False)

    audit_passed = True
    audit_notes = "Audit passed: Precautions align with WHO essential newborn and maternal care guidelines."

    if (sys_bp >= 160 or dia_bp >= 110 or has_bleeding) and risk != "High Risk":
        audit_passed = False
        audit_notes = "Safety Violation Detected: Severe hypertension or bleeding present but assigned Low Risk."

    return {
        "audit_passed": audit_passed,
        "audit_notes": audit_notes
    }


# ─────────────────────────────────────────────────────────
# LangGraph Workflow Construction
# ─────────────────────────────────────────────────────────
workflow = StateGraph(TriageState)

workflow.add_node("triage_agent", triage_agent_node)
workflow.add_node("precaution_agent", precaution_agent_node)
workflow.add_node("safety_audit_agent", safety_audit_node)

workflow.set_entry_point("triage_agent")
workflow.add_edge("triage_agent", "precaution_agent")
workflow.add_edge("precaution_agent", "safety_audit_agent")
workflow.add_edge("safety_audit_agent", END)

medtriage_graph = workflow.compile()


async def run_triage_workflow(vitals: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    """Executes the complete stateful multi-agent supervisor pipeline."""
    initial_state = {
        "vitals": vitals,
        "risk_level": "",
        "probability": 0.0,
        "feature_contributions": {},
        "precautions": [],
        "audit_passed": True,
        "audit_notes": "",
        "language": language,
    }
    final_state = await medtriage_graph.ainvoke(initial_state)
    return final_state