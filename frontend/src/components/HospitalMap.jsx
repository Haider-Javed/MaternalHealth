"use client";
import dynamic from "next/dynamic";

// We dynamically import the inner map to avoid SSR issues with Leaflet
const InnerMap = dynamic(() => import("./HospitalMapInner"), { ssr: false });

export default function HospitalMap(props) {
  return <InnerMap {...props} />;
}
