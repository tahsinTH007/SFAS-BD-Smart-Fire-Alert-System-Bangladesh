import "dotenv/config";

import { connectDB, disconnectDB } from "../db/index.js";
import { logger } from "../lib/logger.js";
import { Alert } from "../db/models/alert.models.js";
import { Device } from "../db/models/device.model.js";
import { Building } from "../db/models/building.model.js";
import { Station } from "../db/models/station.model.js";

/**
 * Backfills `stationId` / `buildingId` on alerts created before the console
 * became station-scoped.
 *
 * Resolution order: the alert's device → that device's station; failing that,
 * the building name recorded on the alert; failing that, the fallback station
 * passed as an argument (default: the busiest station).
 *
 *   npm run backfill:station            # infer, fall back to busiest station
 *   npm run backfill:station -- UTT-02  # fall back to Uttara explicitly
 */
async function main() {
  await connectDB();

  const fallbackCode = process.argv[2];

  const devices = await Device.find({}, "deviceCode stationId buildingId").lean();
  const byDevice = new Map(
    devices.map((d) => [
      d.deviceCode,
      { stationId: d.stationId, buildingId: d.buildingId },
    ]),
  );

  const buildings = await Building.find({}, "name stationId").lean();
  const byBuilding = new Map(
    buildings.map((b) => [b.name, { stationId: b.stationId, buildingId: b._id }]),
  );

  let fallback = null;
  if (fallbackCode) {
    fallback = await Station.findOne({
      stationCode: fallbackCode.toUpperCase(),
    }).lean();
    if (!fallback) {
      logger.error(`No station with code ${fallbackCode}`);
      process.exit(1);
    }
  } else {
    // Busiest station = the one owning the most devices.
    const counts = await Device.aggregate([
      { $group: { _id: "$stationId", n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 1 },
    ]);
    if (counts[0]?._id) {
      fallback = await Station.findById(counts[0]._id).lean();
    }
  }

  logger.info(
    `Fallback station: ${fallback ? `${fallback.stationCode} (${fallback.name})` : "none"}`,
  );

  const orphans = await Alert.find({
    $or: [{ stationId: null }, { stationId: { $exists: false } }],
  }).lean();

  logger.info(`${orphans.length} alert(s) without a station`);

  let viaDevice = 0;
  let viaBuilding = 0;
  let viaFallback = 0;
  let skipped = 0;

  const ops = [];

  for (const a of orphans) {
    let stationId = null;
    let buildingId = null;

    const dev = a.deviceId ? byDevice.get(a.deviceId) : undefined;
    if (dev?.stationId) {
      stationId = dev.stationId;
      buildingId = dev.buildingId ?? null;
      viaDevice += 1;
    } else {
      const bld = a.building ? byBuilding.get(a.building) : undefined;
      if (bld?.stationId) {
        stationId = bld.stationId;
        buildingId = bld.buildingId;
        viaBuilding += 1;
      } else if (fallback) {
        stationId = fallback._id;
        viaFallback += 1;
      } else {
        skipped += 1;
        continue;
      }
    }

    ops.push({
      updateOne: {
        filter: { _id: a._id },
        update: { $set: { stationId, buildingId } },
      },
    });
  }

  if (ops.length) {
    const res = await Alert.bulkWrite(ops);
    logger.info(`Updated ${res.modifiedCount} alert(s)`);
  }

  logger.info(
    `  via device: ${viaDevice} · via building: ${viaBuilding} · via fallback: ${viaFallback} · skipped: ${skipped}`,
  );

  // Report the resulting distribution.
  const dist = await Alert.aggregate([
    { $group: { _id: "$stationId", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
  ]);
  for (const row of dist) {
    const st = row._id ? await Station.findById(row._id).lean() : null;
    logger.info(`  ${st ? st.stationCode : "(unassigned)"} → ${row.n} alert(s)`);
  }

  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  logger.error("Backfill failed", err);
  process.exit(1);
});
