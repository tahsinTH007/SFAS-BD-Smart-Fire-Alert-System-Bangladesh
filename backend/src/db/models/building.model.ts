import { model, Schema, Types } from "mongoose";

const BuildingSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    sector: { type: String, trim: true },

    stationId: { type: Types.ObjectId, ref: "Station", required: true },

    structureType: { type: String, trim: true },

    floors: { type: Number, default: 1 },

    estimatedPeople: { type: Number, default: 0 },

    yearBuilt: { type: Number },

    occupancyType: {
      type: String,
      enum: ["residential", "commercial"],
      default: "residential",
    },

    ownerName: { type: String, trim: true },

    ownerContact: { type: String, trim: true },

    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true },
    },
  },
  {
    timestamps: true,
    collection: "buildings",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

BuildingSchema.index({ location: "2dsphere" });
BuildingSchema.index({ sector: 1 });
BuildingSchema.index({ occupancyType: 1 });
BuildingSchema.index({ stationId: 1 });

BuildingSchema.virtual("devices", {
  ref: "Device",
  localField: "_id",
  foreignField: "buildingId",
});

export const Building = model("Building", BuildingSchema);
