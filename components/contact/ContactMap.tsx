'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { cn } from '@/lib/utils/cn';
import '@/lib/map/leaflet-overrides.css';

type Props = {
  lat: number;
  lng: number;
  zoom: number;
  title: string;
  onLocationChange?: (lat: number, lng: number, zoom: number) => Promise<boolean>;
};

export function ContactMap({ lat, lng, zoom, title, onLocationChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  const { editMode, isAdmin } = useSiteContent();
  const editable = Boolean(onLocationChange && isAdmin && editMode);
  const [ready, setReady] = useState(false);

  const persist = (mLat: number, mLng: number, mZoom: number) => {
    if (onLocationChange) void onLocationChange(mLat, mLng, mZoom);
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      const L = await import('leaflet');

      if (cancelled || !mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current, { scrollWheelZoom: !editable }).setView([lat, lng], zoom);
      
      // Satellite Layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
      }).addTo(map);

      // Labels Layer (to make it readable)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        pane: 'shadowPane' // Put labels above satellite but below markers if possible, or just add it
      }).addTo(map);

      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute h-10 w-10 rounded-full bg-brand-500/40 map-ping-anim"></div>
            <div class="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      const marker = L.marker([lat, lng], { icon, draggable: editable }).addTo(map);
      
      const popupContent = `
        <div class="p-1 text-right" style="font-family: inherit;">
          <h3 class="text-sm font-black text-surface-900">${title}</h3>
          <p class="mt-1 text-xs text-surface-500">موقعیت دقیق فروشگاه</p>
        </div>
      `;
      
      marker.bindPopup(popupContent, { closeButton: false, offset: [0, -32] }).openPopup();

      if (editable) {
        map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
          marker.setLatLng(e.latlng);
          persist(e.latlng.lat, e.latlng.lng, map.getZoom());
        });
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          persist(pos.lat, pos.lng, map.getZoom());
        });
      }

      mapInstance.current = map;
      markerRef.current = marker;
      setReady(true);
    };

    void init();
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable]);

  useEffect(() => {
    if (!mapInstance.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapInstance.current.setView([lat, lng], zoom, { animate: true });
    markerRef.current.dragging?.[editable ? 'enable' : 'disable']();
  }, [lat, lng, zoom, editable]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-surface-200 shadow-card">
      {editable ? (
        <div className="absolute inset-x-0 top-0 z-[500] flex items-center justify-center gap-2 bg-amber-500/95 px-3 py-2 text-xs font-bold text-white">
          <Navigation className="h-3.5 w-3.5" />
          روی نقشه کلیک کنید یا مارکر را بکشید
        </div>
      ) : null}
      <div ref={mapRef} className={cn('h-[22rem] w-full bg-surface-100 sm:h-[28rem]', editable && 'pt-8')} />
      <div className="flex items-center justify-between gap-3 border-t border-surface-200 bg-gradient-to-l from-brand-50/50 to-white px-4 py-3 text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold text-surface-800">
          <MapPin className="h-3.5 w-3.5 text-brand-600" />
          {title}
        </span>
        {ready ? (
          <span dir="ltr" className="font-mono text-[11px] text-surface-500">
            {lat.toFixed(5)}, {lng.toFixed(5)} · z{zoom}
          </span>
        ) : null}
      </div>
    </div>
  );
}
