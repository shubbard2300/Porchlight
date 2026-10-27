'use client';

import { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Icon3DName } from './Icon3D';
import styles from './HouseMap.module.css';

export type MapHouse = {
  id: string;
  name: string;
  neighborhood: string | null;
  /** Only set when the host chose to show it. */
  address: string | null;
  lat: number;
  lng: number;
  exact: boolean;
  photo: string | null;
  likes: number;
  rank: number;
  lit: string;
};

/** Free vector tiles from OpenFreeMap: no API key, no usage limits. "fiord" is a dusk-blue style that suits the twilight look. */
const STYLE_URL = 'https://tiles.openfreemap.org/styles/fiord';
/** Continental US, for a season with no pins yet. */
const EMPTY_VIEW = { center: [-98.6, 39.5] as [number, number], zoom: 3.2 };

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function popupHtml(h: MapHouse, icon: Icon3DName) {
  const where = h.address ?? `Near ${h.neighborhood ?? 'this neighborhood'} (exact spot shared at check-in)`;
  const art = h.photo
    ? `<img src="${esc(h.photo)}" alt="${esc(h.name)} at night" />`
    : `<img src="/icons/3d/${icon}.webp" alt="" class="${styles.popIcon}" />`;
  const directions = h.address
    ? `<a class="${styles.popLink}" href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lng}" target="_blank" rel="noopener">Directions</a>`
    : '';
  return `<div class="${styles.pop}">
    <div class="${styles.popArt}">${art}<span class="${styles.popRank}">#${h.rank}</span></div>
    <div class="${styles.popBody}">
      ${h.neighborhood ? `<span class="${styles.popLabel}">${esc(h.neighborhood)}</span>` : ''}
      <b class="${styles.popName}">${esc(h.name)}</b>
      <span class="${styles.popMeta}">${esc(where)}</span>
      <span class="${styles.popMeta}">Lit ${esc(h.lit)}</span>
      <div class="${styles.popFoot}"><span class="${styles.popLikes}"><img src="/icons/3d/heart.webp" alt="" width="16" height="16" />${h.likes} verified ${h.likes === 1 ? 'like' : 'likes'}</span>${directions}</div>
    </div>
  </div>`;
}

export function HouseMap({ houses, icon, seasonLabel, unplaced }: { houses: MapHouse[]; icon: Icon3DName; seasonLabel: string; unplaced: number }) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!el.current) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;

    (async () => {
      const [maplibre, style] = await Promise.all([
        import('maplibre-gl').then((m) => m.default),
        fetch(STYLE_URL).then((r) => { if (!r.ok) throw new Error(`map style ${r.status}`); return r.json(); }),
      ]);
      if (cancelled || !el.current) return;
      const byId = new Map(houses.map((h) => [h.id, h]));

      map = new maplibre.Map({
        container: el.current,
        style,
        ...EMPTY_VIEW,
        attributionControl: { compact: true },
        cooperativeGestures: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibre.GeolocateControl({ positionOptions: { enableHighAccuracy: false }, trackUserLocation: false }), 'top-right');
      map.addControl(new maplibre.FullscreenControl(), 'top-right');

      if (houses.length > 0) {
        const bounds = new maplibre.LngLatBounds();
        houses.forEach((h) => bounds.extend([h.lng, h.lat]));
        map.fitBounds(bounds, { padding: { top: 80, bottom: 40, left: 40, right: 60 }, maxZoom: 14, duration: 0 });
      }

      map.on('load', async () => {
        if (!map) return;
        try {
          const img = await (await fetch(`/icons/3d/${icon}.webp`)).blob().then(createImageBitmap);
          if (!map.hasImage('season')) map.addImage('season', img, { pixelRatio: 2 });
        } catch {
          // Without the icon the pins still show as glowing dots.
        }

        map.addSource('houses', {
          type: 'geojson',
          cluster: true,
          clusterRadius: 44,
          clusterMaxZoom: 13,
          data: {
            type: 'FeatureCollection',
            features: houses.map((h) => ({
              type: 'Feature',
              id: h.id,
              properties: { id: h.id, exact: h.exact, rank: h.rank },
              geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
            })),
          },
        });

        map.addLayer({
          id: 'cluster-glow', type: 'circle', source: 'houses', filter: ['has', 'point_count'],
          paint: { 'circle-color': '#ffb000', 'circle-opacity': 0.28, 'circle-blur': 0.6, 'circle-radius': ['step', ['get', 'point_count'], 30, 10, 38, 50, 48] },
        });
        map.addLayer({
          id: 'clusters', type: 'circle', source: 'houses', filter: ['has', 'point_count'],
          paint: { 'circle-color': '#ffb000', 'circle-stroke-color': '#14123a', 'circle-stroke-width': 2.5, 'circle-radius': ['step', ['get', 'point_count'], 18, 10, 23, 50, 30] },
        });
        map.addLayer({
          id: 'cluster-count', type: 'symbol', source: 'houses', filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 15, 'text-allow-overlap': true },
          paint: { 'text-color': '#14123a' },
        });
        // Approximate pins get a soft lilac halo so it reads as "somewhere around here".
        map.addLayer({
          id: 'pin-area', type: 'circle', source: 'houses', filter: ['all', ['!', ['has', 'point_count']], ['!', ['get', 'exact']]],
          paint: { 'circle-color': '#b9a6ff', 'circle-opacity': 0.3, 'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 14, 15, 46], 'circle-stroke-color': '#b9a6ff', 'circle-stroke-width': 1.5 },
        });
        map.addLayer({
          id: 'pin-glow', type: 'circle', source: 'houses', filter: ['!', ['has', 'point_count']],
          paint: { 'circle-color': '#ffb000', 'circle-opacity': 0.35, 'circle-blur': 0.7, 'circle-radius': 26 },
        });
        map.addLayer({
          id: 'pins', type: 'circle', source: 'houses', filter: ['!', ['has', 'point_count']],
          paint: { 'circle-color': '#fff4e4', 'circle-stroke-color': '#14123a', 'circle-stroke-width': 2.5, 'circle-radius': 19 },
        });
        if (map.hasImage('season')) {
          map.addLayer({
            id: 'pin-icons', type: 'symbol', source: 'houses', filter: ['!', ['has', 'point_count']],
            layout: { 'icon-image': 'season', 'icon-size': 0.24, 'icon-allow-overlap': true },
          });
        }

        const popup = new maplibre.Popup({ offset: 20, maxWidth: '300px', className: styles.popWrap });
        const openHouse = (f: MapGeoJSONFeature) => {
          const h = byId.get(String(f.properties.id));
          if (!h || !map) return;
          popup.setLngLat([h.lng, h.lat]).setHTML(popupHtml(h, icon)).addTo(map);
        };
        for (const layer of ['pins', 'pin-icons']) {
          map.on('click', layer, (e) => e.features?.[0] && openHouse(e.features[0]));
          map.on('mouseenter', layer, () => { map!.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layer, () => { map!.getCanvas().style.cursor = ''; });
        }
        map.on('click', 'clusters', async (e) => {
          const f = e.features?.[0];
          if (!f || !map) return;
          const zoom = await (map.getSource('houses') as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id);
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        });
        map.on('mouseenter', 'clusters', () => { map!.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'clusters', () => { map!.getCanvas().style.cursor = ''; });
      });
    })().catch(() => setFailed(true));

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [houses, icon]);

  return (
    <>
      <div className={styles.frame}>
        <div ref={el} className={styles.map} role="region" aria-label={`Map of ${seasonLabel} houses`} />
        <div className={styles.badge}>
          <img src={`/icons/3d/${icon}.webp`} alt="" width={28} height={28} />
          <div>
            <b>{seasonLabel} map</b>
            <span>{houses.length === 0 ? 'No pins yet' : `${houses.length} ${houses.length === 1 ? 'house' : 'houses'} lit up`}</span>
          </div>
        </div>
        {houses.length === 0 && !failed && (
          <div className={styles.emptyNote}>Be the first pin on the map. Approved houses show up here for everyone.</div>
        )}
        {failed && <div className={styles.emptyNote}>The map couldn&rsquo;t load right now. The house list below has every entry.</div>}
      </div>
      {unplaced > 0 && (
        <p className={styles.unplaced}>{unplaced} more {unplaced === 1 ? 'house is' : 'houses are'} still placing {unplaced === 1 ? 'its pin' : 'their pins'}. You&rsquo;ll find {unplaced === 1 ? 'it' : 'them'} in the list below.</p>
      )}
    </>
  );
}
