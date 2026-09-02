import { model, Schema } from "mongoose";

export const DeviceSchema = new Schema(
  {
    deviceCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    apiKeyHash: {
      type: String,
      required: true,
      select: false,
    },

    buildingId: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },

    floor: { type: Number, required: true },

    room: { type: String, default: null },

    stationId: {
      type: Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "maintenance", "compromised"],
      default: "active",
    },

    firmwareVersion: {
      type: String,
      default: "1.0.0",
    },

    lastSeenAt: {
      type: Date,
    },

    lastHeartbeatAt: {
      type: Date,
    },

    lastSensorData: {
      temperature: { type: Number, default: 0 },
      humidity: { type: Number, default: 0 },
      smokeLevel: { type: Number, default: 0 },
      gasLevel: { type: Number, default: 0 },
      flame: { type: Number, default: 0 },
      riskScore: { type: Number, default: 0 },
      readAt: { type: Date, default: null },
    },

    /** Human label for the monitored area, e.g. "Server Room", "Kitchen". */
    label: { type: String, trim: true, default: null },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    ipAddress: {
      type: String,
      default: null,
    },

    installedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "devices",
  },
);

DeviceSchema.index({ buildingId: 1 });
DeviceSchema.index({ stationId: 1 });
DeviceSchema.index({ status: 1 });
DeviceSchema.index({ "location.coordinates": "2dsphere" });

export const Device = model("Device", DeviceSchema);
