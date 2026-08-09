"use client";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icon paths in Next.js/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

function FitBounds({ userLat, userLng, hospitals }) {
  const map = useMap();
  useEffect(() => {
    const points = [[userLat, userLng], ...hospitals.map(h => [h.lat, h.lng])];
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
  }, [map, userLat, userLng, hospitals]);
  return null;
}

export default function HospitalMapInner({ userLat, userLng, hospitals }) {
  return (
    <MapContainer
      center={[userLat, userLng]}
      zoom={13}
      className="w-full rounded-2xl shadow-xl"
      style={{ height: "420px", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds userLat={userLat} userLng={userLng} hospitals={hospitals} />
      <Marker position={[userLat, userLng]} icon={userIcon}>
        <Popup><strong>📍 Patient Location</strong></Popup>
      </Marker>
      {hospitals.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-emerald-700">🏥 {h.name}</p>
              <p className="text-gray-600">{h.type}</p>
              {h.distance_km !== undefined && <p>📏 {h.distance_km} km away</p>}
              {h.phone !== "—" && <p>📞 {h.phone}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
