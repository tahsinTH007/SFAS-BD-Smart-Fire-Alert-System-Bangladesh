import "dotenv/config";

import { connectDB, disconnectDB } from "../db/index.js";
import { logger } from "../lib/logger.js";
import { Station } from "../db/models/station.model.js";
import { Unit } from "../db/models/unit.model.js";

/**
 * Seeds response units and their crews. Idempotent — re-running updates the
 * existing unit rather than creating a duplicate.
 */

type CrewSeed = {
  name: string;
  rank: string;
  role: "officer" | "driver" | "firefighter" | "paramedic" | "technician" | "rescuer";
  phone?: string;
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  certifications?: string[];
  yearsOfService?: number;
};

type UnitSeed = {
  stationCode: string;
  unitCode: string;
  name: string;
  type:
    | "engine"
    | "ladder"
    | "rescue"
    | "medic"
    | "foam"
    | "water_tender"
    | "command";
  registration: string;
  waterCapacityL?: number;
  ladderReachM?: number;
  status?: "available" | "maintenance" | "off_duty";
  note?: string;
  crew: CrewSeed[];
};

const UNITS: UnitSeed[] = [
  // ── Uttara (UTT-02) — the station this console is deployed for ────────────
  {
    stationCode: "UTT-02",
    unitCode: "UTT-E1",
    name: "Engine 1",
    type: "engine",
    registration: "DHA-GA-11-4021",
    waterCapacityL: 4000,
    crew: [
      { name: "Md. Shahinur Rahman", rank: "Sub Officer", role: "officer", phone: "+8801711200101", bloodGroup: "B+", certifications: ["Incident Command", "Breathing Apparatus"], yearsOfService: 14 },
      { name: "Abdul Karim", rank: "Leading Fireman", role: "driver", phone: "+8801711200102", bloodGroup: "O+", certifications: ["Heavy Vehicle", "Pump Operator"], yearsOfService: 9 },
      { name: "Rakibul Hasan", rank: "Firefighter", role: "firefighter", phone: "+8801711200103", bloodGroup: "A+", certifications: ["Breathing Apparatus"], yearsOfService: 5 },
      { name: "Jahangir Alam", rank: "Firefighter", role: "firefighter", phone: "+8801711200104", bloodGroup: "B-", certifications: ["Hazmat Awareness"], yearsOfService: 3 },
    ],
  },
  {
    stationCode: "UTT-02",
    unitCode: "UTT-E2",
    name: "Engine 2",
    type: "engine",
    registration: "DHA-GA-11-4022",
    waterCapacityL: 4000,
    crew: [
      { name: "Nurul Islam", rank: "Sub Officer", role: "officer", phone: "+8801711200111", bloodGroup: "O-", certifications: ["Incident Command"], yearsOfService: 11 },
      { name: "Sohel Rana", rank: "Leading Fireman", role: "driver", phone: "+8801711200112", bloodGroup: "A+", certifications: ["Heavy Vehicle"], yearsOfService: 7 },
      { name: "Mahfuzur Rahman", rank: "Firefighter", role: "firefighter", phone: "+8801711200113", bloodGroup: "B+", certifications: ["Breathing Apparatus"], yearsOfService: 4 },
    ],
  },
  {
    stationCode: "UTT-02",
    unitCode: "UTT-L1",
    name: "Ladder 1",
    type: "ladder",
    registration: "DHA-GA-11-4030",
    ladderReachM: 32,
    crew: [
      { name: "Kamrul Hasan", rank: "Sub Officer", role: "officer", phone: "+8801711200121", bloodGroup: "AB+", certifications: ["Aerial Operations", "Incident Command"], yearsOfService: 16 },
      { name: "Ripon Mia", rank: "Leading Fireman", role: "driver", phone: "+8801711200122", bloodGroup: "O+", certifications: ["Aerial Operations", "Heavy Vehicle"], yearsOfService: 10 },
      { name: "Tanvir Ahmed", rank: "Firefighter", role: "firefighter", phone: "+8801711200123", bloodGroup: "A-", certifications: ["Rope Rescue"], yearsOfService: 6 },
    ],
  },
  {
    stationCode: "UTT-02",
    unitCode: "UTT-R1",
    name: "Rescue Squad 1",
    type: "rescue",
    registration: "DHA-GA-11-4041",
    crew: [
      { name: "Faisal Mahmud", rank: "Station Officer", role: "officer", phone: "+8801711200131", bloodGroup: "B+", certifications: ["Technical Rescue", "Confined Space", "Incident Command"], yearsOfService: 18 },
      { name: "Delwar Hossain", rank: "Leading Fireman", role: "rescuer", phone: "+8801711200132", bloodGroup: "O+", certifications: ["Technical Rescue", "Rope Rescue"], yearsOfService: 12 },
      { name: "Shamim Reza", rank: "Firefighter", role: "rescuer", phone: "+8801711200133", bloodGroup: "A+", certifications: ["Confined Space", "Cutting Equipment"], yearsOfService: 8 },
      { name: "Arif Billah", rank: "Firefighter", role: "technician", phone: "+8801711200134", bloodGroup: "AB-", certifications: ["Hazmat Technician"], yearsOfService: 5 },
    ],
  },
  {
    stationCode: "UTT-02",
    unitCode: "UTT-M1",
    name: "Ambulance 1",
    type: "medic",
    registration: "DHA-GA-11-4051",
    crew: [
      { name: "Dr. Nasrin Sultana", rank: "Medical Officer", role: "paramedic", phone: "+8801711200141", bloodGroup: "O+", certifications: ["Advanced Life Support", "Trauma Care"], yearsOfService: 9 },
      { name: "Selina Akter", rank: "Paramedic", role: "paramedic", phone: "+8801711200142", bloodGroup: "B+", certifications: ["Basic Life Support", "Burn Care"], yearsOfService: 6 },
      { name: "Babul Akter", rank: "Driver", role: "driver", phone: "+8801711200143", bloodGroup: "A+", certifications: ["Emergency Driving"], yearsOfService: 11 },
    ],
  },
  {
    stationCode: "UTT-02",
    unitCode: "UTT-F1",
    name: "Foam Tender 1",
    type: "foam",
    registration: "DHA-GA-11-4061",
    waterCapacityL: 6000,
    status: "maintenance",
    note: "Foam proportioner service — back Thursday",
    crew: [
      { name: "Hafizur Rahman", rank: "Leading Fireman", role: "driver", phone: "+8801711200151", bloodGroup: "O-", certifications: ["Foam Operations", "Heavy Vehicle"], yearsOfService: 13 },
      { name: "Sabbir Ahmed", rank: "Firefighter", role: "firefighter", phone: "+8801711200152", bloodGroup: "B+", certifications: ["Foam Operations"], yearsOfService: 4 },
    ],
  },
  {
    stationCode: "UTT-02",
    unitCode: "UTT-C1",
    name: "Command Vehicle",
    type: "command",
    registration: "DHA-GA-11-4071",
    crew: [
      { name: "Cmdr. S. Islam", rank: "Station Commander", role: "officer", phone: "+8801711200161", bloodGroup: "A+", certifications: ["Incident Command", "Major Incident Coordination"], yearsOfService: 22 },
    ],
  },

  // ── Gazipur (GZ-03) ───────────────────────────────────────────────────────
  {
    stationCode: "GZ-03",
    unitCode: "GZ-E1",
    name: "Engine 1",
    type: "engine",
    registration: "GAZ-GA-12-2011",
    waterCapacityL: 4500,
    crew: [
      { name: "Mizanur Rahman", rank: "Sub Officer", role: "officer", phone: "+8801711200201", bloodGroup: "B+", certifications: ["Incident Command"], yearsOfService: 12 },
      { name: "Aminul Haque", rank: "Leading Fireman", role: "driver", phone: "+8801711200202", bloodGroup: "O+", certifications: ["Heavy Vehicle"], yearsOfService: 8 },
      { name: "Rubel Mia", rank: "Firefighter", role: "firefighter", phone: "+8801711200203", bloodGroup: "A+", certifications: ["Breathing Apparatus"], yearsOfService: 3 },
    ],
  },
  {
    stationCode: "GZ-03",
    unitCode: "GZ-F1",
    name: "Foam Tender 1",
    type: "foam",
    registration: "GAZ-GA-12-2021",
    waterCapacityL: 8000,
    crew: [
      { name: "Shafiqul Islam", rank: "Leading Fireman", role: "driver", phone: "+8801711200211", bloodGroup: "AB+", certifications: ["Foam Operations", "Industrial Fire"], yearsOfService: 15 },
      { name: "Nazmul Hoque", rank: "Firefighter", role: "firefighter", phone: "+8801711200212", bloodGroup: "B-", certifications: ["Industrial Fire"], yearsOfService: 6 },
    ],
  },

  // ── Dhaka Central (DC-01) ─────────────────────────────────────────────────
  {
    stationCode: "DC-01",
    unitCode: "DC-E1",
    name: "Engine 1",
    type: "engine",
    registration: "DHA-GA-10-1011",
    waterCapacityL: 4000,
    crew: [
      { name: "Anwar Hossain", rank: "Sub Officer", role: "officer", phone: "+8801711200301", bloodGroup: "O+", certifications: ["Incident Command"], yearsOfService: 17 },
      { name: "Jasim Uddin", rank: "Leading Fireman", role: "driver", phone: "+8801711200302", bloodGroup: "A+", certifications: ["Heavy Vehicle"], yearsOfService: 10 },
    ],
  },
];

async function seed() {
  await connectDB();

  const stations = await Station.find({}, "stationCode location").lean();
  const byCode = new Map(
    stations.map((s) => [s.stationCode, s]),
  );

  let created = 0;
  let updated = 0;

  for (const u of UNITS) {
    const station = byCode.get(u.stationCode);
    if (!station) {
      logger.warn(`  no station ${u.stationCode}, skipping ${u.unitCode}`);
      continue;
    }

    // Idle units sit in the station yard, jittered so markers don't stack.
    const base = station.location?.coordinates ?? [90.4074, 23.7104];
    const jitter = () => (Math.random() - 0.5) * 0.0012;

    const existing = await Unit.findOne({ unitCode: u.unitCode });

    if (existing) {
      existing.name = u.name;
      existing.type = u.type;
      existing.registration = u.registration;
      existing.waterCapacityL = u.waterCapacityL ?? 0;
      existing.ladderReachM = u.ladderReachM ?? 0;
      if (u.note) existing.note = u.note;
      await existing.save();
      updated += 1;
      continue;
    }

    await Unit.create({
      unitCode: u.unitCode,
      name: u.name,
      type: u.type,
      stationId: station._id,
      status: u.status ?? "available",
      registration: u.registration,
      waterCapacityL: u.waterCapacityL ?? 0,
      ladderReachM: u.ladderReachM ?? 0,
      note: u.note ?? null,
      crew: u.crew.map((c) => ({ ...c, onDuty: true })),
      location: {
        type: "Point",
        coordinates: [base[0] + jitter(), base[1] + jitter()],
      },
    });
    created += 1;
  }

  const totalCrew = UNITS.reduce((n, u) => n + u.crew.length, 0);
  logger.info(
    `Units: ${created} created, ${updated} updated — ${totalCrew} crew across ${UNITS.length} units`,
  );

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  logger.error("Unit seed failed", err);
  process.exit(1);
});
