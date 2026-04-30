import { Schema, model, Types } from "mongoose";

const alertSchema = new Schema(
  {
    type: { type: String, required: true },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low", "important", "info"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    location: { type: String },
    reportedBy: { type: String },
    contactNumber: { type: String },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    acknowledged: { type: Boolean, default: false },
    incident: { type: Types.ObjectId, ref: "Incident" },
  },
  {
    timestamps: true,
  },
);

export const Alert = model("Alert", alertSchema);
