import "dotenv/config";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { EJSON } from "bson";
import mongoose from "mongoose";

import { connectDB, disconnectDB } from "../db/index.js";
import { logger } from "../lib/logger.js";

/**
 * Restores the files written by export-data.ts.
 *
 *   npm run import:data                    # reads ./data-export, skips duplicates
 *   npm run import:data -- ./somewhere     # from another directory
 *   npm run import:data -- --replace       # wipe each collection first
 *
 * Use this instead of Compass when there are several collections to move —
 * Compass imports one collection at a time and cannot create the database for
 * you, so a full transfer through the UI is a lot of repeated clicking.
 *
 * Documents keep their original `_id`, so re-running is safe: existing rows are
 * skipped rather than duplicated, and every cross-collection reference survives.
 */

const args = process.argv.slice(2);
const replace = args.includes("--replace");
const inDir = path.resolve(args.find((a) => !a.startsWith("-")) ?? "data-export");

async function main(): Promise<void> {
  const files = (await readdir(inDir)).filter((f) => f.endsWith(".json")).sort();

  if (files.length === 0) {
    logger.warn(`No .json files in ${inDir} — nothing to import.`);
    return;
  }

  await connectDB();

  const db = mongoose.connection.db;
  if (!db) throw new Error("No database handle after connect");

  logger.info(`Importing ${files.length} file(s) from ${inDir}`);
  if (replace) logger.warn("--replace: existing documents will be deleted first");

  let inserted = 0;
  let skipped = 0;

  for (const file of files) {
    const name = path.basename(file, ".json");
    const raw = await readFile(path.join(inDir, file), "utf8");
    const docs = EJSON.parse(raw) as Record<string, unknown>[];

    if (!Array.isArray(docs) || docs.length === 0) {
      logger.info(`  ${name.padEnd(14)} empty, skipped`);
      continue;
    }

    const coll = db.collection(name);
    if (replace) await coll.deleteMany({});

    // ordered:false so one duplicate _id does not abort the rest of the batch.
    try {
      const res = await coll.insertMany(docs, { ordered: false });
      inserted += res.insertedCount;
      logger.info(`  ${name.padEnd(14)} ${String(res.insertedCount).padStart(6)} inserted`);
    } catch (err) {
      const e = err as { insertedCount?: number; writeErrors?: unknown[] };
      const ok = e.insertedCount ?? 0;
      const dupes = e.writeErrors?.length ?? 0;
      inserted += ok;
      skipped += dupes;
      logger.info(
        `  ${name.padEnd(14)} ${String(ok).padStart(6)} inserted, ${dupes} already present`,
      );
    }
  }

  logger.info(`Done — ${inserted} inserted, ${skipped} already present.`);
}

main()
  .catch((err) => {
    logger.error("Import failed", err);
    process.exitCode = 1;
  })
  .finally(() => void disconnectDB());
