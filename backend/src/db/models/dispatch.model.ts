import { model, Schema, Types } from "mongoose";

/**
 * One unit assigned to one incident.
 *
 * Kept as its own collection rather than an array on the alert, because the
 * dispatch is the thing with a lifecycle (assigned → en route → on scene →
 * cleared) and the thing you want to report on later: response times per unit,
 * per type, per area.
 */
export const DISPATCH_STATUSES = [
  "assigned",
  "en_route",
  "on_scene",
  "cleared",
  "cancelled",
] as const;

const DispatchSchema = new Schema(
  {
    alertId: {
      type: Types.ObjectId,
      ref: "Alert",
      required: true,
      index: true,
    },

    unitId: { type: Types.ObjectId, ref: "Unit", required: true, index: true },

    stationId: {
      type: Types.ObjectId,
      ref: "Station",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: DISPATCH_STATUSES,
      default: "assigned",
      index: true,
    },

    dispatchedBy: { type: String, default: "Operator" },

    // ── Route estimate at the moment of dispatch ─────────────────────────────
    /** Road distance in km (straight-line × road factor, or provider route). */
    distanceKm: { type: Number, default: null },
    /** Estimated minutes to arrive, including traffic profile. */
    etaMinutes: { type: Number, default: null },
    /** How the estimate was produced, so the UI can be honest about it. */
    routeSource: {
      type: String,
      enum: ["estimate", "osrm"],
      default: "estimate",
    },
    /** [lng, lat] pairs for drawing the route on the map. */
    routeGeometry: { type: [[Number]], default: [] },

    // ── Timeline ─────────────────────────────────────────────────────────────
    assignedAt: { type: Date, default: Date.now },
    enRouteAt: { type: Date, default: null },
    arrivedAt: { type: Date, default: null },
    clearedAt: { type: Date, default: null },

    note: { type: String, trim: true, default: null },
  },
  { timestamps: true, collection: "dispatches" },
);

// One live dispatch per unit per alert; cleared/cancelled ones may repeat.
DispatchSchema.index({ alertId: 1, unitId: 1, status: 1 });
DispatchSchema.index({ stationId: 1, assignedAt: -1 });

export const Dispatch = model("Dispatch", DispatchSchema);
