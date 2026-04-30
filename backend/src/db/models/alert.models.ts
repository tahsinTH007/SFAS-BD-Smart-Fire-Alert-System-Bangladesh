import { Schema, model, Types } from "mongoose";

export type AlertPriority = "critical" | "important" | "info";

export type AlertStatus = "active" | "acknowledged" | "resolved";

const alertSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      index: true,
    },

    priority: {
      type: String,
      enum: ["critical", "important", "info"],
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    location: {
      type: String,
    },

    reportedBy: String,

    contactNumber: String,

    temperature: String,

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    acknowledged: {
      type: Boolean,
      default: false,
    },

    incident: {
      type: String,
    },

    // ✅ Store as { lat, lng } object — avoids geo index conflicts with plain strings
    coordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },

    affectedArea: String,

    estimatedPeople: String,

    deviceId: {
      type: String,
      index: true,
    },

    sector: {
      type: String,
      index: true,
    },

    building: {
      type: String,
      index: true,
    },

    floor: {
      type: String,
    },

    room: {
      type: String,
    },

    gas: Number,

    gasType: String,

    smokeLevel: Number,

    status: {
      type: String,
      enum: ["active", "acknowledged", "resolved"],
      default: "active",
      index: true,
    },

    acknowledgedBy: {
      type: Types.ObjectId,
      ref: "User",
    },

    acknowledgedAt: Date,

    resolvedBy: {
      type: Types.ObjectId,
      ref: "User",
    },

    resolvedAt: Date,

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

alertSchema.index({ status: 1, priority: 1 });
alertSchema.index({ sector: 1, building: 1, floor: 1 });
alertSchema.index({ createdAt: -1 });

export const Alert = model("Alert", alertSchema);
