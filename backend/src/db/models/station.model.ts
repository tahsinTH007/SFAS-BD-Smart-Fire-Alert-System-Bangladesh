import { model, Schema } from "mongoose";

/**
 * Fire station / monitoring station.
 *
 * Building and Device both declare `stationId` with `ref: "Station"`, but no
 * Station model existed, so any `.populate("stationId")` threw
 * MissingSchemaError. This defines it.
 */
const StationSchema = new Schema(
  {
    stationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: { type: String, required: true, trim: true },

    district: { type: String, trim: true },

    division: {
      type: String,
      enum: [
        "Dhaka",
        "Chattogram",
        "Rajshahi",
        "Khulna",
        "Barishal",
        "Sylhet",
        "Rangpur",
        "Mymensingh",
      ],
    },

    address: { type: String, trim: true },

    contactNumber: { type: String, trim: true },

    email: { type: String, trim: true, lowercase: true },

    commanderName: { type: String, trim: true },

    status: {
      type: String,
      enum: ["operational", "limited", "offline"],
      default: "operational",
    },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
  },
  {
    timestamps: true,
    collection: "stations",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

StationSchema.index({ location: "2dsphere" });
StationSchema.index({ division: 1, district: 1 });

StationSchema.virtual("buildings", {
  ref: "Building",
  localField: "_id",
  foreignField: "stationId",
});

StationSchema.virtual("devices", {
  ref: "Device",
  localField: "_id",
  foreignField: "stationId",
});

export const Station = model("Station", StationSchema);
