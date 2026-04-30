import { Alert as AlertModel } from "../../db/models/alert.models.js";
import { Alert as AlertDomain } from "./alert.types.js";

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffMinutes < 1) return "Just now";

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  if (diffHours === 1) {
    return "1 hour ago";
  }

  const d = new Date(date);

  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return `Today, ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday, ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }) +
    " — " +
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function parseCoordinates(raw: any): [number, number] {
  if (!raw) return [0, 0];

  if (typeof raw === "object" && !Array.isArray(raw) && raw.lat !== undefined) {
    return [Number(raw.lat) || 0, Number(raw.lng) || 0];
  }

  if (typeof raw === "string") {
    const parts = raw.split(",").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    console.warn("⚠️ Invalid coordinate string:", raw);
    return [0, 0];
  }

  if (Array.isArray(raw) && raw.length === 2) {
    return [Number(raw[0]) || 0, Number(raw[1]) || 0];
  }

  console.warn("⚠️ Unrecognised coordinate shape:", raw);
  return [0, 0];
}

function hydrateAlert(doc: any): AlertDomain {
  return {
    id: doc._id.toString(),
    type: doc.type,
    priority: doc.priority,
    title: doc.title,
    message: doc.message,
    location: doc.location ?? null,
    reportedBy: doc.reportedBy ?? null,
    contactNumber: doc.contactNumber ?? null,
    coordinates: parseCoordinates(doc.coordinates),
    timestamp: doc.timestamp ? formatTimestamp(doc.timestamp) : null,
    read: doc.read,
    acknowledged: doc.acknowledged,
    smokeLevel: doc.smokeLevel ?? 0,
    gas: doc.gas ?? 0,
    gasType: doc.gasType ?? null,
    status: doc.status ?? "active",
    deviceId: doc.deviceId ?? null,
    sector: doc.sector ?? null,
    building: doc.building ?? null,
    floor: doc.floor ?? null,
    room: doc.room ?? null,
    incident: doc.incident,
    temperature: doc.temperature ?? null,
    affectedArea: doc.affectedArea ?? null,
    estimatedPeople: doc.estimatedPeople ?? null,
  };
}

/**
 * Parse incoming "lat,lng" coordinate string into the { lat, lng } shape
 * that the schema expects.
 */
function parseCoordStringToObject(raw: string | undefined): {
  lat: number;
  lng: number;
} {
  if (!raw) return { lat: 0, lng: 0 };
  const parts = raw.split(",").map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  console.warn("⚠️ Could not parse coordinate string:", raw);
  return { lat: 0, lng: 0 };
}

// ─── Repository functions ─────────────────────────────────────────────────────

export async function repoCreateAlert(params: any): Promise<AlertDomain> {
  // ✅ Always convert the incoming string to { lat, lng } before saving
  const coordinates =
    typeof params.coordinates === "string"
      ? parseCoordStringToObject(params.coordinates)
      : (params.coordinates ?? { lat: 0, lng: 0 });

  const doc = await AlertModel.create({
    type: params.type,
    priority: params.priority,
    title: params.title,
    message: params.message,

    deviceId: params.deviceId,
    sector: params.sector,
    building: params.building,
    floor: params.floor?.toString() ?? undefined,
    room: params.room,

    temperature: params.temperature?.toString() ?? undefined,
    smokeLevel: params.smokeLevel,
    gas: params.gas ?? 0,
    gasType: params.gasType ?? null,

    location: params.location,
    coordinates, // ✅ { lat, lng } object

    incident: params.incident,

    reportedBy: params.reportedBy,
    contactNumber: params.contactNumber,

    affectedArea: params.affectedArea,
    estimatedPeople: params.estimatedPeople?.toString() ?? undefined,

    status: params.status ?? "active",
    read: false,
    acknowledged: false,
    timestamp: params.timestamp ?? new Date(),
  });

  return hydrateAlert(doc);
}

export async function repoGetAllAlerts(): Promise<AlertDomain[]> {
  const results = await AlertModel.find().sort({ createdAt: -1 }).lean();
  return results.map(hydrateAlert);
}

export async function repoGetAlertById(
  id: string,
): Promise<AlertDomain | null> {
  const doc = await AlertModel.findById(id).lean();
  if (!doc) return null;
  return hydrateAlert(doc);
}

export async function repoGetAlertsByType(
  priority: string,
): Promise<AlertDomain[]> {
  const results = await AlertModel.find({ priority })
    .sort({ createdAt: -1 })
    .lean();
  return results.map(hydrateAlert);
}
