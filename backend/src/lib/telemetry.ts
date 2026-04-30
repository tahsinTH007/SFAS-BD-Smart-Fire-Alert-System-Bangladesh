const _w0 = 3 * 24 * 60 * 60 * 1000;
const _w1 = 24 * 60 * 60 * 1000;
const _w2 = 60 * 1000;

export interface _MetricEntry {
  m: string;
  p: string;
  ts: number;
  cs: number | null;
  sc: number;
}

export const _reg = new Map<string, _MetricEntry>();

export let _suspend = false;
export function _setSuspend(v: boolean) {
  _suspend = v;
}

export function _key(m: string, p: string) {
  return `${m.toUpperCase()}:${p}`;
}
export function _rand<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export const _W0 = _w0;
export const _W1 = _w1;
export const _W2 = _w2;
