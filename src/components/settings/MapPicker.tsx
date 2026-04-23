import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.divIcon({
  className: '',
  html: `<svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="#3b82f6"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
});

interface MapPickerProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (updates: { lat?: number; lng?: number; radius?: number }) => void;
  onExpandedChange?: (expanded: boolean) => void;
}

export function MapPicker({ lat, lng, radius, onChange, onExpandedChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [expanded, setExpanded] = useState(true);
  const skipViewUpdate = useRef(false);

  useEffect(() => {
    onExpandedChange?.(true);
  }, []);

  useEffect(() => {
    if (!expanded || !containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 14,
      attributionControl: false,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: true, icon: markerIcon }).addTo(map);
    const circle = L.circle([lat, lng], {
      radius,
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      skipViewUpdate.current = true;
      circle.setLatLng(pos);
      onChange({
        lat: Math.round(pos.lat * 10000) / 10000,
        lng: Math.round(pos.lng * 10000) / 10000,
      });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      skipViewUpdate.current = true;
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      onChange({
        lat: Math.round(e.latlng.lat * 10000) / 10000,
        lng: Math.round(e.latlng.lng * 10000) / 10000,
      });
    });

    mapRef.current = map;
    circleRef.current = circle;
    markerRef.current = marker;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      circleRef.current = null;
      markerRef.current = null;
    };
  }, [expanded]);

  useEffect(() => {
    if (!mapRef.current || !circleRef.current || !markerRef.current) return;
    const pos = L.latLng(lat, lng);
    markerRef.current.setLatLng(pos);
    circleRef.current.setLatLng(pos);
    circleRef.current.setRadius(radius);
    if (!skipViewUpdate.current) {
      mapRef.current.setView(pos, mapRef.current.getZoom());
    }
    skipViewUpdate.current = false;
  }, [lat, lng, radius]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => { const next = !expanded; setExpanded(next); onExpandedChange?.(next); }}
        className="w-full flex items-center justify-between gap-2 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md px-3 py-2 border border-gray-600 transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {expanded ? 'Hide Map' : 'Select Area on Map'}
        </span>
        <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {expanded && (
        <div className="rounded-md overflow-hidden border border-gray-600">
          <div
            ref={containerRef}
            style={{ height: 220 }}
            className="w-full bg-gray-900"
          />
          <p className="text-[10px] text-gray-500 px-2 py-1 bg-gray-750">
            Click or drag marker to select center. Blue circle shows the capture radius.
          </p>
        </div>
      )}
    </div>
  );
}
