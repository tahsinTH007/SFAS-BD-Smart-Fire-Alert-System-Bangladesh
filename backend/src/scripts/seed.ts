import "dotenv/config";

import { connectDB, disconnectDB } from "../db/index.js";
import { logger } from "../lib/logger.js";
import { Station } from "../db/models/station.model.js";
import { Building } from "../db/models/building.model.js";
import { Device } from "../db/models/device.model.js";
import { generateApiKey } from "../modules/devices/device.util.js";

/**
 * Seeds the stations, buildings and devices the dashboard needs.
 * Idempotent: re-running updates existing records rather than duplicating them.
 *
 * Alerts are intentionally NOT seeded — run `npm run simulate` to generate them
 * through the real sensor pipeline.
 */

const STATIONS = [
  {
    stationCode: "DC-01",
    name: "Dhaka Central Fire Station",
    district: "Dhaka",
    division: "Dhaka" as const,
    address: "Kazi Alauddin Road, Dhaka 1000",
    contactNumber: "02-9555555",
    commanderName: "Cmdr. A. Rahman",
    coordinates: [90.4074, 23.7104] as [number, number],
  },
  {
    stationCode: "UTT-02",
    name: "Uttara Fire Station",
    district: "Dhaka",
    division: "Dhaka" as const,
    address: "Sector 7, Uttara, Dhaka 1230",
    contactNumber: "02-8991234",
    commanderName: "Cmdr. S. Islam",
    coordinates: [90.3983, 23.8746] as [number, number],
  },
  {
    stationCode: "GZ-03",
    name: "Gazipur Industrial Station",
    district: "Gazipur",
    division: "Dhaka" as const,
    address: "Board Bazar, Gazipur 1704",
    contactNumber: "02-9262111",
    commanderName: "Cmdr. M. Karim",
    coordinates: [90.3744, 23.9999] as [number, number],
  },
];

const BUILDINGS = [
  {
    stationCode: "UTT-02",
    name: "Rajlakshmi Complex",
    address: "Sector 7, Uttara, Dhaka",
    sector: "Sector 7",
    structureType: "Reinforced Concrete",
    floors: 8,
    estimatedPeople: 320,
    yearBuilt: 2012,
    occupancyType: "commercial" as const,
    ownerName: "Rajlakshmi Holdings",
    ownerContact: "+8801711000001",
    coordinates: [90.3985, 23.8742] as [number, number],
  },
  {
    stationCode: "UTT-02",
    name: "Uttara Girls' College",
    address: "Sector 10, Uttara, Dhaka",
    sector: "Sector 10",
    structureType: "Brick",
    floors: 5,
    estimatedPeople: 780,
    yearBuilt: 2005,
    occupancyType: "commercial" as const,
    ownerName: "Ministry of Education",
    ownerContact: "+8801711000002",
    coordinates: [90.3902, 23.8698] as [number, number],
  },
  {
    stationCode: "UTT-02",
    name: "Green Residency Tower",
    address: "Sector 4, Uttara, Dhaka",
    sector: "Sector 4",
    structureType: "Reinforced Concrete",
    floors: 12,
    estimatedPeople: 210,
    yearBuilt: 2018,
    occupancyType: "residential" as const,
    ownerName: "Green Developers Ltd.",
    ownerContact: "+8801711000003",
    coordinates: [90.4022, 23.8664] as [number, number],
  },
  {
    stationCode: "GZ-03",
    name: "Fahim Textile Warehouse",
    address: "Board Bazar, Gazipur",
    sector: "Industrial Zone A",
    structureType: "Steel Frame",
    floors: 3,
    estimatedPeople: 450,
    yearBuilt: 2009,
    occupancyType: "commercial" as const,
    ownerName: "Fahim Textiles",
    ownerContact: "+8801711000004",
    coordinates: [90.3760, 24.0021] as [number, number],
  },
  {
    stationCode: "DC-01",
    name: "Wari Storage Depot",
    address: "Wari, Dhaka South",
    sector: "Wari",
    structureType: "Brick",
    floors: 2,
    estimatedPeople: 60,
    yearBuilt: 1998,
    occupancyType: "commercial" as const,
    ownerName: "Wari Traders",
    ownerContact: "+8801711000005",
    coordinates: [90.4074, 23.7103] as [number, number],
  },
];

const DEVICES = [
  { buildingName: "Rajlakshmi Complex", code: "OGB-UTT-001", floor: 3, room: "Server Room", label: "Server Room" },
  { buildingName: "Rajlakshmi Complex", code: "OGB-UTT-002", floor: 6, room: "Kitchen", label: "Food Court Kitchen" },
  { buildingName: "Uttara Girls' College", code: "OGB-UTT-003", floor: 2, room: "Lab 201", label: "Chemistry Lab" },
  { buildingName: "Uttara Girls' College", code: "OGB-UTT-004", floor: 4, room: "Library", label: "Library" },
  { buildingName: "Green Residency Tower", code: "OGB-UTT-005", floor: 1, room: "Generator", label: "Generator Room" },
  { buildingName: "Green Residency Tower", code: "OGB-UTT-006", floor: 9, room: "Corridor", label: "9F Corridor" },
  { buildingName: "Fahim Textile Warehouse", code: "OGB-GZ-001", floor: 1, room: "Bay 1", label: "Fabric Store Bay 1" },
  { buildingName: "Fahim Textile Warehouse", code: "OGB-GZ-002", floor: 2, room: "Dye Section", label: "Dyeing Section" },
  { buildingName: "Wari Storage Depot", code: "OGB-DC-001", floor: 1, room: "Main Hall", label: "Main Storage Hall" },
];

async function seed() {
  await connectDB();

  logger.info("Seeding stations…");
  const stationMap = new Map<string, string>();

  for (const s of STATIONS) {
    const doc = await Station.findOneAndUpdate(
      { stationCode: s.stationCode },
      {
        $set: {
          ...s,
          location: { type: "Point", coordinates: s.coordinates },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    stationMap.set(s.stationCode, String(doc._id));
  }
  logger.info(`  ${STATIONS.length} stations`);

  logger.info("Seeding buildings…");
  const buildingMap = new Map<string, string>();

  for (const b of BUILDINGS) {
    const stationId = stationMap.get(b.stationCode);
    if (!stationId) continue;

    const { stationCode, coordinates, ...rest } = b;
    const doc = await Building.findOneAndUpdate(
      { name: b.name, stationId },
      {
        $set: {
          ...rest,
          stationId,
          location: { type: "Point", coordinates },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    buildingMap.set(b.name, String(doc._id));
  }
  logger.info(`  ${BUILDINGS.length} buildings`);

  logger.info("Seeding devices…");
  const issued: { deviceCode: string; apiKey: string }[] = [];

  for (const d of DEVICES) {
    const buildingId = buildingMap.get(d.buildingName);
    if (!buildingId) continue;

    const building = BUILDINGS.find((b) => b.name === d.buildingName)!;
    const stationId = stationMap.get(building.stationCode)!;

    const existing = await Device.findOne({ deviceCode: d.code });
    if (existing) {
      existing.floor = d.floor;
      existing.room = d.room;
      existing.label = d.label;
      await existing.save();
      continue;
    }

    // Jitter each device a few metres off the building centroid so markers
    // don't stack perfectly on the map.
    const jitter = () => (Math.random() - 0.5) * 0.0008;
    const { apiKey, apiKeyHash } = await generateApiKey();

    await Device.create({
      deviceCode: d.code,
      apiKeyHash,
      buildingId,
      stationId,
      floor: d.floor,
      room: d.room,
      label: d.label,
      status: "active",
      firmwareVersion: "1.0.0",
      installedAt: new Date(),
      location: {
        type: "Point",
        coordinates: [
          building.coordinates[0] + jitter(),
          building.coordinates[1] + jitter(),
        ],
      },
    });

    issued.push({ deviceCode: d.code, apiKey });
  }
  logger.info(`  ${DEVICES.length} devices`);

  if (issued.length) {
    logger.info("New device API keys (shown once):");
    for (const i of issued) logger.info(`  ${i.deviceCode}  ${i.apiKey}`);
  }

  logger.info("Seed complete. Run `npm run simulate` to generate live alerts.");
  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  logger.error("Seed failed", err);
  process.exit(1);
});
