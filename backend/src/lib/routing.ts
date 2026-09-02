import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Route and ETA estimation for dispatching a unit to an incident.
 *
 * Two modes:
 *
 *  - **osrm** — if ROUTING_OSRM_URL is set, a real road route is fetched and
 *    used for distance, duration and the map polyline.
 *  - **estimate** — the default. Straight-line distance is multiplied by a road
 *    circuity factor and divided by a speed that varies with the time of day,
 *    because Dhaka traffic is the dominant term in any real response time.
 *
 * The estimate is deliberately conservative and always labelled as an estimate
 * in the API, so an officer is never shown a made-up precise figure.
 */

export type LatLng = { lat: number; lng: number };

export interface RouteResult {
  distanceKm: number;
  etaMinutes: number;
  source: "estimate" | "osrm";
  /** [lng, lat] pairs for map rendering. Two points when estimated. */
  geometry: [number, number][];
  /** Human note explaining the traffic assumption used. */
  basis: string;
}

const EARTH_RADIUS_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Dhaka road speeds for an emergency vehicle running lights and siren, by hour.
 * Rush hours are genuinely crippling here, which is exactly why the ETA must
 * not be a flat average.
 */
function speedKmhForHour(hour: number): { kmh: number; label: string } {
  if (hour >= 7 && hour < 11) return { kmh: 14, label: "morning rush" };
  if (hour >= 11 && hour < 16) return { kmh: 20, label: "midday traffic" };
  if (hour >= 16 && hour < 21) return { kmh: 12, label: "evening rush" };
  if (hour >= 21 || hour < 1) return { kmh: 26, label: "evening, lighter" };
  return { kmh: 34, label: "overnight, clear roads" };
}

/**
 * Straight line under-states real driving distance. 1.4 is a reasonable
 * circuity factor for a dense, irregular street grid like Uttara/Dhaka.
 */
const ROAD_CIRCUITY = 1.4;

/** Time from alarm to wheels rolling. */
const TURNOUT_MINUTES = 1.5;

function estimateRoute(from: LatLng, to: LatLng, at = new Date()): RouteResult {
  const straight = haversineKm(from, to);
  const distanceKm = +(straight * ROAD_CIRCUITY).toFixed(2);

  const { kmh, label } = speedKmhForHour(at.getHours());
  const driveMinutes = (distanceKm / kmh) * 60;
  const etaMinutes = Math.max(1, Math.round(driveMinutes + TURNOUT_MINUTES));

  return {
    distanceKm,
    etaMinutes,
    source: "estimate",
    geometry: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
    basis: `${kmh} km/h assumed (${label}) + ${TURNOUT_MINUTES} min turnout`,
  };
}

interface OsrmResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry?: { coordinates: [number, number][] };
  }[];
}

/** Fetches a real road route. Returns null on any failure so callers fall back. */
async function osrmRoute(
  from: LatLng,
  to: LatLng,
): Promise<RouteResult | null> {
  const base = env.ROUTING_OSRM_URL;
  if (!base) return null;

  const url =
    `${base.replace(/\/$/, "")}/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return null;
    const body = (await res.json()) as OsrmResponse;
    const route = body.routes?.[0];
    if (body.code !== "Ok" || !route) return null;

    const distanceKm = +(route.distance / 1000).toFixed(2);
    // OSRM durations assume ordinary traffic; an emergency vehicle is faster.
    const etaMinutes = Math.max(
      1,
      Math.round((route.duration / 60) * 0.75 + TURNOUT_MINUTES),
    );

    return {
      distanceKm,
      etaMinutes,
      source: "osrm",
      geometry: route.geometry?.coordinates ?? [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
      basis: "Road route from OSRM, ×0.75 for emergency running",
    };
  } catch (err) {
    logger.debug(
      `OSRM route failed, using estimate: ${(err as Error).message}`,
    );
    return null;
  }
}

export async function computeRoute(
  from: LatLng,
  to: LatLng,
  at = new Date(),
): Promise<RouteResult> {
  return (await osrmRoute(from, to)) ?? estimateRoute(from, to, at);
}

/**
 * Ranks candidate units by how quickly they can reach the incident.
 *
 * Nearest-by-ETA rather than nearest-by-distance: a unit 3 km away across a
 * rush-hour arterial can lose to one 5 km away on clear roads.
 */
export async function rankByEta<
  T extends { location?: { coordinates: number[] } | null },
>(
  units: T[],
  destination: LatLng,
  at = new Date(),
): Promise<(T & { route: RouteResult | null })[]> {
  const scored = await Promise.all(
    units.map(async (u) => {
      const coords = u.location?.coordinates;
      if (!coords || coords.length !== 2) {
        return { ...u, route: null };
      }
      const route = await computeRoute(
        { lng: coords[0], lat: coords[1] },
        destination,
        at,
      );
      return { ...u, route };
    }),
  );

  return scored.sort((a, b) => {
    if (!a.route) return 1;
    if (!b.route) return -1;
    return a.route.etaMinutes - b.route.etaMinutes;
  });
}
