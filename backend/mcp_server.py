"""
mcp_server.py — Model Context Protocol (MCP) Server for MedTriage AI.
Exposes maternal health triage tools as standardized MCP tool definitions.
"""
import asyncio
from mcp.server.fastmcp import FastMCP
from model import predict
from osm_service import fetch_nearby_hospitals

mcp = FastMCP("MedTriage-AI-Server")


@mcp.tool()
async def triage_maternal_vitals(
    age: int,
    systolic_bp: int,
    diastolic_bp: int,
    bs: float,
    body_temp: float,
    heart_rate: int,
    vaginal_bleeding: bool = False,
    severe_headache: bool = False,
    facial_swelling: bool = False,
) -> dict:
    """
    Triage maternal health risk based on 6 vital signs and 3 emergency red flags.
    Returns risk level, probability score, and SHAP vital contributions.
    """
    risk_level, probability, feature_contributions = predict(
        age=age,
        systolic_bp=systolic_bp,
        diastolic_bp=diastolic_bp,
        bs=bs,
        body_temp=body_temp,
        heart_rate=heart_rate,
        vaginal_bleeding=vaginal_bleeding,
        severe_headache=severe_headache,
        facial_swelling=facial_swelling,
    )
    return {
        "risk_level": risk_level,
        "probability": round(probability, 4),
        "feature_contributions": feature_contributions,
    }


@mcp.tool()
async def find_nearby_emergency_hospitals(latitude: float, longitude: float) -> dict:
    """Find nearby emergency healthcare facilities within 5km for urgent maternal referral."""
    hospitals = await fetch_nearby_hospitals(latitude, longitude)
    return {"hospitals": hospitals}


if __name__ == "__main__":
    mcp.run()