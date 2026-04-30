/**
 * Generates a Google Maps URL for given coordinates
 */
export const getGoogleMapsUrl = (lat: number, lng: number): string => {
  return `https://maps.google.com/?q=${lat},${lng}`;
};

export function formatCoordinates(coords: any): [number, number] | null {
  if (!coords) return null;

  if (Array.isArray(coords) && coords.length === 2) {
    const [lat, lng] = coords.map(Number);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }

  if (typeof coords === "object" && "lat" in coords && "lng" in coords) {
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }

  if (typeof coords === "string") {
    const degreePattern = /([0-9.]+)°([NS]),?\s*([0-9.]+)°([EW])/i;
    const degMatch = coords.match(degreePattern);
    if (degMatch) {
      let lat = parseFloat(degMatch[1]);
      let lng = parseFloat(degMatch[3]);
      if (degMatch[2].toUpperCase() === "S") lat = -lat;
      if (degMatch[4].toUpperCase() === "W") lng = -lng;
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }

    const parts = coords.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && parts.every((n) => !isNaN(n))) {
      return [parts[0], parts[1]];
    }
  }

  return null;
}
