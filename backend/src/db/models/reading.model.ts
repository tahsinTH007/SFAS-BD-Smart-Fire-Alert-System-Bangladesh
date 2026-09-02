import { model, Schema } from "mongoose";

/**
 * Raw multi-sensor telemetry from an OGNIBORMO unit.
 *
 * Every frame the Arduino sends is stored here, whether or not it crossed an
 * alert threshold. That gives the dashboard real trend lines (temperature rising
 * before flame is detected is exactly the early-warning signal the project is
 * about) instead of only showing the moments an alarm fired.
 *
 * Documents expire after 7 days so the collection stays bounded.
 */
const ReadingSchema = new Schema(
  {
    deviceCode: { type: String, required: true, index: true },

    buildingId: { type: Schema.Types.ObjectId, ref: "Building", default: null },
    stationId: { type: Schema.Types.ObjectId, ref: "Station", default: null },

    temperature: { type: Number, default: 0 },
    humidity: { type: Number, default: 0 },
    smoke: { type: Number, default: 0 },
    gas: { type: Number, default: 0 },
    gasType: { type: String, default: null },
    flame: { type: Number, default: 0 },

    /** 0-100 fused risk from the multi-sensor scoring function. */
    riskScore: { type: Number, default: 0 },
    riskFactors: { type: [String], default: [] },

    /** Set when this reading is what triggered an alert. */
    alertId: { type: Schema.Types.ObjectId, ref: "Alert", default: null },

    recordedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: "readings",
  },
);

ReadingSchema.index({ deviceCode: 1, recordedAt: -1 });

// TTL: drop readings older than 7 days.
ReadingSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

export const Reading = model("Reading", ReadingSchema);
