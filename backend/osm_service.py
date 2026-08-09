"""
osm_service.py — OpenStreetMap Overpass API hospital query handler.
"""
import httpx
import math
from typing import List, Dict, Any

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
TIMEOUT_SECONDS = 10.0

# Fallback hospital list for Pakistan (used when Overpass API fails)
FALLBACK_HOSPITALS = [
    {"id": 1, "name": "PIMS Hospital Islamabad", "lat": 33.7105, "lng": 73.0513,
     "type": "DHQ Hospital", "phone": "+92-51-9260771"},
    {"id": 2, "name": "Shifa International Hospital", "lat": 33.7215, "lng": 73.0630,
     "type": "Private Hospital", "phone": "+92-51-8464646"},
    {"id": 3, "name": "Polyclinic Hospital Islamabad", "lat": 33.7238, "lng": 73.0935,
     "type": "Federal Hospital", "phone": "+92-51-9218300"},
    {"id": 4, "name": "Benazir Bhutto Hospital Rawalpindi", "lat": 33.6007, "lng": 73.0679,
     "type": "THQ Hospital", "phone": "+92-51-9270001"},
]


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute great-circle distance between two coordinates in km."""
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


async def fetch_nearby_hospitals(lat: float, lng: float, radius_m: int = 5000) -> List[Dict[str, Any]]:
    """
    Query OSM Overpass API for hospitals within radius_m metres of (lat, lng).
    Falls back to FALLBACK_HOSPITALS on error or empty result.
    """
    query = (
        f"[out:json][timeout:{int(TIMEOUT_SECONDS)}];"
        f"("
        f"  node[\"amenity\"=\"hospital\"](around:{radius_m},{lat},{lng});"
        f"  way[\"amenity\"=\"hospital\"](around:{radius_m},{lat},{lng});"
        f");"
        f"out center;"
    )

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            data = resp.json()

        results = []
        for i, element in enumerate(data.get("elements", [])):
            h_lat = element.get("lat") or element.get("center", {}).get("lat")
            h_lng = element.get("lon") or element.get("center", {}).get("lon")
            if h_lat is None or h_lng is None:
                continue
            tags = element.get("tags", {})
            name = (tags.get("name:en") or tags.get("name") or f"Hospital {i + 1}")
            dist_km = _haversine_km(lat, lng, h_lat, h_lng)
            results.append({
                "id": i + 1,
                "name": name,
                "lat": h_lat,
                "lng": h_lng,
                "type": tags.get("healthcare", "Hospital"),
                "phone": tags.get("phone") or tags.get("contact:phone") or "—",
                "distance_km": round(dist_km, 2),
            })

        if results:
            return sorted(results, key=lambda h: h["distance_km"])[:10]

    except Exception as exc:
        print(f"[OSM] Overpass query failed: {exc}. Using fallback hospital list.")

    # Attach distances to fallback list and return
    for h in FALLBACK_HOSPITALS:
        h["distance_km"] = round(_haversine_km(lat, lng, h["lat"], h["lng"]), 2)
    return sorted(FALLBACK_HOSPITALS, key=lambda h: h["distance_km"])
