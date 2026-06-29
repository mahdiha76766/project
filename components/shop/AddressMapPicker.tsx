'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '@/lib/map/leaflet-overrides.css';
import { createMapMarkerIcon } from '@/lib/map/leaflet-marker';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (coords: { latitude: number; longitude: number } | null) => void;
};

const DEFAULT_CENTER = { lat: 35.6892, lng: 51.389 };

export function AddressMapPicker({ latitude, longitude, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const [ready, setReady] = useState(false);
  const hasCoords = latitude != null && longitude != null;
  const [enabled, setEnabled] = useState(hasCoords);

  useEffect(() => {
    if (hasCoords) setEnabled(true);
  }, [hasCoords, latitude, longitude]);

  useEffect(() => {
    if (!enabled || !mapRef.current) return;

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;
      leafletRef.current = L;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }

      const center = hasCoords ? { lat: latitude!, lng: longitude! } : DEFAULT_CENTER;
      const map = L.map(mapRef.current, { scrollWheelZoom: true }).setView(center, hasCoords ? 15 : 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const icon = createMapMarkerIcon(L);

      const setMarker = (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon, draggable: false }).addTo(map);
        }
      };

      if (hasCoords) setMarker(latitude!, longitude!);

      map.on('click', (e) => {
        setMarker(e.latlng.lat, e.latlng.lng);
        onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });

      mapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 100);
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markerRef.current = null;
      leafletRef.current = null;
      setReady(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !mapInstance.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = mapInstance.current;
    const icon = createMapMarkerIcon(L);

    if (hasCoords) {
      map.setView([latitude!, longitude!], map.getZoom(), { animate: false });
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude!, longitude!]);
      } else {
        markerRef.current = L.marker([latitude!, longitude!], { icon, draggable: false }).addTo(map);
      }
    }
  }, [latitude, longitude, hasCoords, enabled]);

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            if (!e.target.checked) onChange(null);
          }}
        />
        <MapPin className="h-4 w-4 text-amber-600" />
        انتخاب موقعیت روی نقشه (اختیاری)
      </label>
      {enabled ? (
        <>
          <div ref={mapRef} className="mt-3 h-56 w-full overflow-hidden rounded-xl bg-slate-100" />
          <p className="mt-2 text-xs text-slate-500">
            {ready ? 'روی نقشه کلیک کنید تا موقعیت ذخیره شود.' : 'در حال بارگذاری نقشه...'}
          </p>
          {hasCoords ? (
            <p className="mt-1 text-[11px] text-slate-400" dir="ltr">
              {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
