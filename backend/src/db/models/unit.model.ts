import { model, Schema, Types } from "mongoose";

/**
 * A response unit belonging to a fire station — an engine, ladder, rescue
 * squad, ambulance and so on — together with the crew riding it.
 *
 * `status` is the dispatch state the station officer reads at a glance:
 *   available  — at station, ready to be assigned
 *   dispatched — assigned and travelling to an incident
 *   on_scene   — arrived and working
 *   returning  — cleared the scene, heading back
 *   maintenance / off_duty — not assignable
 */
export const UNIT_TYPES = [
  "engine",
  "ladder",
  "rescue",
  "medic",
  "foam",
  "water_tender",
  "command",
] as const;

export const UNIT_STATUSES = [
  "available",
  "dispatched",
  "on_scene",
  "returning",
  "maintenance",
  "off_duty",
] as const;

const CrewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    rank: { type: String, trim: true, default: "Firefighter" },
    role: {
      type: String,
      enum: [
        "officer",
        "driver",
        "firefighter",
        "paramedic",
        "technician",
        "rescuer",
      ],
      default: "firefighter",
    },
    phone: { type: String, trim: true, default: null },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
      default: null,
    },
    certifications: { type: [String], default: [] },
    yearsOfService: { type: Number, default: 0, min: 0 },
    onDuty: { type: Boolean, default: true },
  },
  { _id: true },
);

const UnitSchema = new Schema(
  {
    unitCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: { type: String, required: true, trim: true },

    type: { type: String, enum: UNIT_TYPES, required: true, index: true },

    stationId: {
      type: Types.ObjectId,
      ref: "Station",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: UNIT_STATUSES,
      default: "available",
      index: true,
    },

    crew: { type: [CrewSchema], default: [] },

    // ── Vehicle ──────────────────────────────────────────────────────────────
    registration: { type: String, trim: true, default: null },
    /** Litres of water carried; 0 for units that carry none (medic, command). */
    waterCapacityL: { type: Number, default: 0, min: 0 },
    /** Metres of ladder reach; 0 where not applicable. */
    ladderReachM: { type: Number, default: 0, min: 0 },

    /** Current position — station yard when idle, en route otherwise. */
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },

    // ── Live assignment ──────────────────────────────────────────────────────
    currentAlertId: { type: Types.ObjectId, ref: "Alert", default: null },
    dispatchedAt: { type: Date, default: null },
    /** Free-text note the officer can leave, e.g. "pump fault, low pressure". */
    note: { type: String, trim: true, default: null },
  },
  {
    timestamps: true,
    collection: "units",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

UnitSchema.index({ location: "2dsphere" });
UnitSchema.index({ stationId: 1, status: 1 });

/** Crew actually riding today — the number that matters for dispatch. */
UnitSchema.virtual("crewOnDuty").get(function () {
  return (this.crew ?? []).filter((c: { onDuty: boolean }) => c.onDuty).length;
});

UnitSchema.virtual("assignable").get(function () {
  return this.status === "available";
});

export const Unit = model("Unit", UnitSchema);
