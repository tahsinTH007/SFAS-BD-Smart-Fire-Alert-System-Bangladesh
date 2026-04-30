import crypto from "crypto";

export function createCacheKey(prefix: string, params: object): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = (params as any)[key];
      return acc;
    }, {});

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(sorted))
    .digest("hex");

  return `${prefix}:${hash}`;
}
