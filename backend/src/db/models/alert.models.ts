import { Schema, model, Types } from "mongoose";

export type AlertPriority = "critical" | "important" | "info";
export type AlertStatus = "active" | "acknowledged" | "resolved";

const alertSchema = new Schema(
  {
    type: { type: String, required: true, index: true },

    priority: {
      type: String,
      enum: ["critical", "important", "info"],
      required: true,
      index: true,
    },

    title: { type: String, required: true },
    message: { type: String, required: true },

    location: { type: String },
    reportedBy: String,
    contactNumber: String,

    read: { type: Boolean, default: false, index: true },
    acknowledged: { type: Boolean, default: false },

    incident: { type: String, index: true },

    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },

    affectedArea: String,
    estimatedPeople: String,

    deviceId: { type: String, index: true },

    /**
     * Owning station. The console is deployed per fire station, so nearly every
     * read is scoped by this — an Uttara operator must never see Gazipur's
     * alerts.
     */
    stationId: {
      type: Types.ObjectId,
      ref: "Station",
      default: null,
      index: true,
    },

    buildingId: {
      type: Types.ObjectId,
      ref: "Building",
      default: null,
      index: true,
    },
    sector: { type: String, index: true },
    building: { type: String, index: true },
    floor: { type: String },
    room: { type: String },

    // ── Sensor readings at the moment the alert fired ────────────────────────
    temperature: String,
    humidity: { type: Number, default: null },
    smokeLevel: { type: Number, default: 0 },
    gas: { type: Number, default: 0 },
    gasType: String,
    flame: { type: Number, default: 0 },

    /** 0-100 fused multi-sensor confidence that this is a real fire event. */
    riskScore: { type: Number, default: 0, min: 0, max: 100, index: true },

    /** Which sensors contributed, e.g. ["flame", "smoke", "temperature"]. */
    riskFactors: { type: [String], default: [] },

    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
      index: true,
    },

    // Operator names (there is no User collection yet, so these are plain
    // strings rather than dangling ObjectId refs).
    acknowledgedBy: { type: String, default: null },
    acknowledgedAt: Date,
    resolvedBy: { type: String, default: null },
    resolvedAt: Date,
    resolutionNote: { type: String, default: null },

    /** Free-form operator activity log shown on the alert detail page. */
    comments: {
      type: [
        {
          author: { type: String, required: true },
          body: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

alertSchema.index({ status: 1, priority: 1 });
// Station-scoped feeds are the hot path.
alertSchema.index({ stationId: 1, createdAt: -1 });
alertSchema.index({ stationId: 1, status: 1, priority: 1 });
alertSchema.index({ sector: 1, building: 1, floor: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ deviceId: 1, createdAt: -1 });
// Text index powers the notifications search box.
alertSchema.index({ title: "text", message: "text", location: "text" });

export const Alert = model("Alert", alertSchema);
