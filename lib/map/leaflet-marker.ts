import type { DivIcon } from 'leaflet';

const MARKER_W = 25;
const MARKER_H = 41;

/** Custom map pin from /public/marker-icon.png — DivIcon avoids CSS stretch issues */
export function createMapMarkerIcon(L: typeof import('leaflet')): DivIcon {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<img src="/marker-icon.png" alt="" width="${MARKER_W}" height="${MARKER_H}" draggable="false" />`,
    iconSize: [MARKER_W, MARKER_H],
    iconAnchor: [MARKER_W / 2, MARKER_H],
    popupAnchor: [0, -MARKER_H + 4]
  });
}
