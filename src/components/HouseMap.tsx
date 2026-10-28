'use client';

import { useEffect, useRef, useState } from 'react';
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Icon3DName } from './Icon3D';
import { CROWD_LEVELS, crowdLevel, crowdLine } from '@/lib/crowd';
import { BOOST_HOURS, TIERS, type Tier } from '@/lib/pitstops';
import { circleRing } from '@/lib/blocks';
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
  /** Visitors who checked in during the crowd window. */
  crowd: number;
};

/** A sponsor's pin. Shown under the houses so the decorations stay the main event. */
export type MapPitstop = {
  id: string;
  name: string;
  category: string;
  tier: Tier;
  offer: string;
  address: string;
  lat: number;
  lng: number;
};

/** An anchor block: a glowing zone around a well-known decorated street. */
export type MapBlock = { id: string; name: string; blurb: string; lat: number; lng: number; radiusM: number; houses: number };

/** How often an open map refreshes its crowd meter. */
const CROWD_POLL_MS = 60_000;

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
      <span class="${styles.popCrowd}"><i style="background:${CROWD_LEVELS[crowdLevel(h.crowd)].color}"></i>${esc(crowdLine(h.crowd))}</span>
      <div class="${styles.popFoot}"><span class="${styles.popLikes}"><img src="/icons/3d/heart.webp" alt="" width="16" height="16" />${h.likes} verified ${h.likes === 1 ? 'like' : 'likes'}</span>${directions}</div>
      <a class="${styles.popCta}" href="/house/${encodeURIComponent(h.id)}#vote">Check in &amp; vote</a>
    </div>
  </div>`;
}

function pitstopHtml(p: MapPitstop) {
  const tier = TIERS[p.tier];
  return `<div class="${styles.pop}">
    <div class="${styles.popBody}">
      <span class="${styles.popTier}" style="background:${tier.color}">${esc(tier.label)}</span>
      <b class="${styles.popName}">${esc(p.name)}</b>
      <span class="${styles.popOffer}"><img src="/icons/3d/gift.webp" alt="" width="18" height="18" />${esc(p.offer)}</span>
      <span class="${styles.popMeta}">${esc(p.address)}</span>
      <span class="${styles.popMeta}">Scan the counter QR for ${BOOST_HOURS} hours of double XP. No purchase necessary.</span>
      <a class="${styles.popCta}" href="/pitstop/${encodeURIComponent(p.id)}">See the pitstop</a>
    </div>
  </div>`;
}

function blockHtml(b: MapBlock) {
  return `<div class="${styles.pop}">
    <div class="${styles.popBody}">
      <span class="${styles.popTier}" style="background:#ffd36b">Anchor block</span>
      <b class="${styles.popName}">${esc(b.name)}</b>
      <span class="${styles.popMeta}">${esc(b.blurb)}</span>
      <span class="${styles.popMeta}">${b.houses} ${b.houses === 1 ? 'house' : 'houses'} in the contest here</span>
      <a class="${styles.popCta}" href="/block/${encodeURIComponent(b.id)}">See the block</a>
    </div>
  </div>`;
}

export function HouseMap({ houses, pitstops = [], blocks = [], icon, seasonLabel, unplaced, seasonKey }: { houses: MapHouse[]; pitstops?: MapPitstop[]; blocks?: MapBlock[]; icon: Icon3DName; seasonLabel: string; unplaced: number; seasonKey: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!el.current) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;

    (async () => {
      const [maplibre, style] = await Promise.all([
        import('maplibre-gl').then((m) => m.default),
        fetch(STYLE_URL).then((r) => { if (!r.ok) throw new Error(`map style ${r.status}`); return r.json(); }),
      ]);
      if (cancelled || !el.current) return;
      const byId = new Map(houses.map((h) => [h.id, { ...h }]));
      const features = (): GeoJSON.FeatureCollection => ({
        type: 'FeatureCollection',
        features: [...byId.values()].map((h) => ({
          type: 'Feature',
          id: h.id,
          properties: { id: h.id, name: h.name, exact: h.exact, rank: h.rank, crowd: crowdLevel(h.crowd) },
          geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
        })),
      });

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

      const framed = houses.length > 0 ? houses : blocks.length > 0 ? blocks : pitstops;
      if (framed.length > 0) {
        const bounds = new maplibre.LngLatBounds();
        framed.forEach((h) => bounds.extend([h.lng, h.lat]));
        map.fitBounds(bounds, { padding: { top: 80, bottom: 40, left: 40, right: 60 }, maxZoom: 14, duration: 0 });
      }

      map.on('load', async () => {
        if (!map) return;
        try {
          const img = await (await fetch(`/icons/3d/${icon}.webp`)).blob().then(createImageBitmap);
          if (!map.hasImage('season')) map.addImage('season', img, { pixelRatio: 2 });
          if (pitstops.length > 0) {
            const gift = await (await fetch('/icons/3d/gift.webp')).blob().then(createImageBitmap);
            if (!map.hasImage('gift')) map.addImage('gift', gift, { pixelRatio: 2 });
          }
        } catch {
          // Without the icon the pins still show as glowing dots.
        }

        // Anchor blocks are soft glowing zones under everything else.
        const blockById = new Map(blocks.map((b) => [b.id, b]));
        if (blocks.length > 0) {
          map.addSource('blocks', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: blocks.map((b) => ({
                type: 'Feature', id: b.id, properties: { id: b.id, name: b.name },
                geometry: { type: 'Polygon', coordinates: [circleRing(b)] },
              })),
            },
          });
          map.addLayer({ id: 'block-fill', type: 'fill', source: 'blocks', paint: { 'fill-color': '#ffc93c', 'fill-opacity': 0.2 } });
          map.addLayer({ id: 'block-line', type: 'line', source: 'blocks', paint: { 'line-color': '#ffd36b', 'line-width': 2, 'line-dasharray': [2, 1.5], 'line-opacity': 0.85 } });
          map.addLayer({
            id: 'block-label', type: 'symbol', source: 'blocks', minzoom: 12,
            layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-transform': 'uppercase', 'text-letter-spacing': 0.12, 'text-optional': true },
            paint: { 'text-color': '#ffd36b', 'text-halo-color': '#14123a', 'text-halo-width': 2 },
          });
        }

        // Sponsor pitstops sit beneath the house layers: a tier-colored square-ish badge with a gift.
        const pitById = new Map(pitstops.map((p) => [p.id, p]));
        if (pitstops.length > 0) {
          map.addSource('pitstops', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: pitstops.map((p) => ({
                type: 'Feature', id: p.id,
                properties: { id: p.id, name: p.name, color: TIERS[p.tier].color, radius: TIERS[p.tier].radius },
                geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
              })),
            },
          });
          map.addLayer({
            id: 'pitstops', type: 'circle', source: 'pitstops',
            paint: { 'circle-color': ['get', 'color'], 'circle-stroke-color': '#14123a', 'circle-stroke-width': 2.5, 'circle-radius': ['get', 'radius'] },
          });
          if (map.hasImage('gift')) {
            map.addLayer({
              id: 'pitstop-icons', type: 'symbol', source: 'pitstops',
              layout: { 'icon-image': 'gift', 'icon-size': 0.2, 'icon-allow-overlap': true },
            });
          }
        }

        map.addSource('houses', {
          type: 'geojson',
          cluster: true,
          clusterRadius: 44,
          clusterMaxZoom: 13,
          data: features(),
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
        // Crowd meter: a colored ring around pins where people have checked in recently.
        map.addLayer({
          id: 'pin-crowd', type: 'circle', source: 'houses', filter: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'crowd'], 'quiet']],
          paint: {
            'circle-radius': 25, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 5,
            'circle-stroke-color': ['match', ['get', 'crowd'], 'packed', CROWD_LEVELS.packed.color, 'busy', CROWD_LEVELS.busy.color, CROWD_LEVELS.lively.color],
          },
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

        // Each house's title sits under its pin once you're zoomed in close enough to tell them apart.
        map.addLayer({
          id: 'pin-labels', type: 'symbol', source: 'houses', filter: ['!', ['has', 'point_count']], minzoom: 11,
          layout: {
            'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': 13, 'text-anchor': 'top', 'text-offset': [0, 1.9],
            'text-max-width': 10, 'text-optional': true,
          },
          paint: { 'text-color': '#fff4e4', 'text-halo-color': '#14123a', 'text-halo-width': 2 },
        });

        const popup = new maplibre.Popup({ offset: 20, maxWidth: '300px', className: styles.popWrap });
        // Hovering a pin shows just its title; clicking opens the full card.
        const tip = new maplibre.Popup({ offset: 22, closeButton: false, closeOnClick: false, className: styles.tipWrap });
        let tipId = '';
        const houseOf = (f?: MapGeoJSONFeature) => (f ? byId.get(String(f.properties.id)) : undefined);
        const openHouse = (f: MapGeoJSONFeature) => {
          const h = houseOf(f);
          if (!h || !map) return;
          tip.remove();
          popup.setLngLat([h.lng, h.lat]).setHTML(popupHtml(h, icon)).addTo(map);
        };
        const pitPopup = (id: string) => {
          const p = pitById.get(id);
          if (!p || !map) return;
          tip.remove();
          popup.setLngLat([p.lng, p.lat]).setHTML(pitstopHtml(p)).addTo(map);
        };
        if (blocks.length > 0) {
          map.on('click', 'block-fill', (e) => {
            // Pins and clusters drawn on top win the click.
            const above = ['pins', 'clusters', 'pitstops'].filter((l) => map!.getLayer(l));
            if (map!.queryRenderedFeatures(e.point, { layers: above }).length) return;
            const b = blockById.get(String(e.features?.[0]?.properties.id));
            if (b) { tip.remove(); popup.setLngLat(e.lngLat).setHTML(blockHtml(b)).addTo(map!); }
          });
        }
        for (const layer of ['pitstops', 'pitstop-icons']) {
          map.on('click', layer, (e) => {
            // A house pin drawn on top wins the click.
            if (map!.queryRenderedFeatures(e.point, { layers: ['pins'] }).length) return;
            const f = e.features?.[0];
            if (f) pitPopup(String(f.properties.id));
          });
          map.on('mouseenter', layer, () => { map!.getCanvas().style.cursor = 'pointer'; });
          map.on('mouseleave', layer, () => { map!.getCanvas().style.cursor = ''; });
        }
        for (const layer of ['pins', 'pin-icons']) {
          map.on('click', layer, (e) => e.features?.[0] && openHouse(e.features[0]));
          map.on('mousemove', layer, (e) => {
            const h = houseOf(e.features?.[0]);
            map!.getCanvas().style.cursor = 'pointer';
            if (!h || popup.isOpen() || (tip.isOpen() && tipId === h.id)) return;
            tipId = h.id;
            tip.setLngLat([h.lng, h.lat]).setHTML(`<b class="${styles.tipName}">${esc(h.name)}</b>`).addTo(map!);
          });
          map.on('mouseleave', layer, () => { map!.getCanvas().style.cursor = ''; tip.remove(); });
        }
        map.on('click', 'clusters', async (e) => {
          const f = e.features?.[0];
          if (!f || !map) return;
          const zoom = await (map.getSource('houses') as GeoJSONSource).getClusterExpansionZoom(f.properties.cluster_id);
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
        });
        poll = setInterval(async () => {
          if (document.hidden || !map) return;
          try {
            const counts: Record<string, number> = await (await fetch(`/api/crowd?season=${encodeURIComponent(seasonKey)}`, { cache: 'no-store' })).json();
            for (const h of byId.values()) h.crowd = counts[h.id] ?? 0;
            (map.getSource('houses') as GeoJSONSource | undefined)?.setData(features());
          } catch {
            // Keep showing the last reading; the next poll tries again.
          }
        }, CROWD_POLL_MS);
        map.on('mouseenter', 'clusters', () => { map!.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'clusters', () => { map!.getCanvas().style.cursor = ''; });
      });
    })().catch(() => setFailed(true));

    return () => {
      cancelled = true;
      clearInterval(poll);
      map?.remove();
    };
  }, [houses, pitstops, blocks, icon, seasonKey]);

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
      {houses.length > 0 && (
        <p className={styles.legend}>
          <b>Crowd meter</b>
          {(['lively', 'busy', 'packed'] as const).map((k) => <span key={k}><i style={{ background: CROWD_LEVELS[k].color }} />{CROWD_LEVELS[k].label}</span>)}
          <span className={styles.legendNote}>Rings show check-ins in the last 30 minutes, updated every minute.</span>
          {blocks.length > 0 && <span><i className={styles.legendBlock} />Anchor blocks</span>}
          {pitstops.length > 0 && <span><img src="/icons/3d/gift.webp" alt="" width={16} height={16} className={styles.legendGift} />Pitstops: scan for {BOOST_HOURS} h of double XP</span>}
        </p>
      )}
      {unplaced > 0 && (
        <p className={styles.unplaced}>{unplaced} more {unplaced === 1 ? 'house is' : 'houses are'} still placing {unplaced === 1 ? 'its pin' : 'their pins'}. You&rsquo;ll find {unplaced === 1 ? 'it' : 'them'} in the list below.</p>
      )}
    </>
  );
}
