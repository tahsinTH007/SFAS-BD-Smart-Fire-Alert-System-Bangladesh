/**
 * Runtime configuration.
 *
 * Next.js inlines `NEXT_PUBLIC_*` vars at build time; anything without that
 * prefix is server-only and reads as `undefined` in the browser. The previous
 * code used `process.env.PUBLIC_API_BASE_URL`, which was therefore always
 * undefined and always fell through to its hardcoded default.
 *
 * The console is opened from whichever machine is nearest — the host PC at
 * `localhost`, or a phone on the same WiFi at the host's LAN IP. A hardcoded
 * `localhost` broke that second case, and the LAN IP changes every time the
 * unit is moved to a different router, so it cannot be baked in either.
 *
 * So the backend host is taken from the address the page was actually served
 * from, and only the port is configured. Open the dashboard at
 * `http://192.168.0.101:3000` and it talks to `http://192.168.0.101:8080`
 * without anything being edited. An explicit NEXT_PUBLIC_* value still wins,
 * for the case where the API genuinely lives on another host.
 */

const API_PORT = process.env.NEXT_PUBLIC_API_PORT ?? "8080";

/** Same host the page came from, on the API port. */
export function backendOrigin(): string {
  if (typeof window === "undefined") return `http://localhost:${API_PORT}`;

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${API_PORT}`;
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? `${backendOrigin()}/api/v1`;

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? backendOrigin();

/** Name shown against operator actions until real auth exists. */
export const OPERATOR_NAME = "Control Room Operator";
