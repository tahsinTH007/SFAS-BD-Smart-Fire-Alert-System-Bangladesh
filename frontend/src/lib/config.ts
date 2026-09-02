/**
 * Runtime configuration.
 *
 * Next.js inlines `NEXT_PUBLIC_*` vars at build time; anything without that
 * prefix is server-only and reads as `undefined` in the browser. The previous
 * code used `process.env.PUBLIC_API_BASE_URL`, which was therefore always
 * undefined and always fell through to its hardcoded default.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8080";

/** Name shown against operator actions until real auth exists. */
export const OPERATOR_NAME = "Control Room Operator";
