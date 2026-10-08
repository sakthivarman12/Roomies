"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export interface MapPerson {
  id: string;
  name: string;
  color: string;
  photo?: string;
  initials: string;
  lat: number;
  lng: number;
  hasStory: boolean;
  isMe: boolean;
  updated: string;
}

interface Props {
  people: MapPerson[];
  home?: { lat: number; lng: number; name: string };
  focus?: { lat: number; lng: number; nonce: number } | null;
  onSelect: (id: string) => void;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

function pinHtml(p: MapPerson): string {
  const inner = p.photo ? `<img src="${esc(p.photo)}" alt="" />` : `<span>${esc(p.initials)}</span>`;
  return `<div class="rm-pin ${p.hasStory ? "rm-pin-story" : ""} ${p.isMe ? "rm-pin-me" : ""}" style="--pin:${esc(p.color)}"><div class="rm-pin-face">${inner}</div><i class="rm-pin-tail"></i></div>`;
}

export default function MapView({ people, home, focus, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; });

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([home?.lat ?? 12.9716, home?.lng ?? 77.5946], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(m);
    L.control.zoom({ position: "bottomleft" }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; layer.current = null; fitted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current; const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const pts: L.LatLngTuple[] = [];
    if (home) {
      L.marker([home.lat, home.lng], {
        icon: L.divIcon({ className: "", iconSize: [40, 40], iconAnchor: [20, 20], html: '<div class="rm-home" aria-hidden="true">⌂</div>' }),
        title: home.name, keyboard: false,
      }).addTo(g);
      pts.push([home.lat, home.lng]);
    }
    for (const p of people) {
      const mk = L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className: "", iconSize: [52, 62], iconAnchor: [26, 58], html: pinHtml(p) }),
        title: `${p.name} · ${p.updated}`, alt: p.name, riseOnHover: true,
      });
      mk.on("click", () => onSelectRef.current(p.id));
      mk.addTo(g);
      pts.push([p.lat, p.lng]);
    }
    if (!fitted.current && pts.length > 1) { m.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 15 }); fitted.current = true; }
  }, [people, home]);

  useEffect(() => {
    if (focus && map.current) map.current.flyTo([focus.lat, focus.lng], Math.max(map.current.getZoom(), 16), { duration: 0.9 });
  }, [focus]);

  return <div ref={el} className="rm-map h-full w-full" role="application" aria-label="Map of roommate locations" />;
}
