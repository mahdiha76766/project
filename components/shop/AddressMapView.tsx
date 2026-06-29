'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '@/lib/map/leaflet-overrides.css';
import { createMapMarkerIcon } from '@/lib/map/leaflet-marker';
import type { Map as LeafletMap } from 'leaflet';

type Props = {
  latitude: number;
  longitude: number;
  label?: string;
  heightClass?: string;
  className?: string;
};

export function AddressMapView({
  latitude,
  longitude,
  label,
  heightClass = 'h-56',
  className = ''
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || !mapRef.current) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const map = L.map(mapRef.current, {
        scrollWheelZoom: true,
        dragging: true,
        zoomControl: true
      }).setView([latitude, longitude], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      L.marker([latitude, longitude], { icon: createMapMarkerIcon(L) }).addTo(map);

      mapInstance.current = map;
      setTimeout(() => map.invalidateSize(), 100);
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      setReady(false);
    };
  }, [latitude, longitude]);

  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <MapPin className="h-3.5 w-3.5 text-amber-600" />
          {label || 'موقعیت روی نقشه'}
        </span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900"
        >
          <ExternalLink className="h-3 w-3" />
          باز کردن در نقشه
        </a>
      </div>
      <div ref={mapRef} className={`w-full ${heightClass} bg-slate-100`} />
      {!ready ? <p className="px-3 py-2 text-xs text-slate-400">در حال بارگذاری نقشه...</p> : null}
      <p className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400" dir="ltr">
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </p>
    </div>
  );
}
