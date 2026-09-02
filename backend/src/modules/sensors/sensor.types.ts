/**
 * One frame from an OGNIBORMO unit.
 *
 * Only `deviceCode` and the sensor readings are guaranteed. The location and
 * contact fields are optional: they are normally resolved from the Device and
 * Building records rather than sent on every frame, but a standalone unit can
 * still include them.
 */
export interface ISensorData {
  deviceCode: string;

  // ── Sensors ──────────────────────────────────────────────────────────────
  temp?: number;
  humidity?: number;
  smoke?: number;
  gas?: number;
  gasType?: string;
  /** 0 or 1 from the IR flame sensor. */
  fire?: number;

  // ── Optional identity / context ──────────────────────────────────────────
  apiKey?: string;
  buildingId?: string;
  stationId?: string;
  firmwareVersion?: string;
  ipAddress?: string;
  location?: string;
  /** "lat,lng" */
  coordinates?: string;
  reportedBy?: string;
  contactNumber?: string;
  affectedArea?: string;
  estimatedPeople?: number;
  sector?: string;
  building?: string;
  floor?: number;
  room?: string;
  type?: string;
}
