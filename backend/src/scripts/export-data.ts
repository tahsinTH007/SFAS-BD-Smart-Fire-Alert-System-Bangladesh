import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { EJSON } from "bson";
import mongoose from "mongoose";

import { connectDB, disconnectDB } from "../db/index.js";
import { logger } from "../lib/logger.js";

/**
 * Dumps every collection to a JSON file that MongoDB Compass can import.
 *
 *   npm run export:data                 # writes to ./data-export
 *   npm run export:data -- ./somewhere  # or a directory of your choosing
 *
 * Written as Extended JSON, not plain JSON.stringify. That matters: a plain
 * dump turns `_id` into a bare string and dates into ISO strings, so on import
 * every document gets a *string* primary key and none of the cross-collection
 * references resolve — devices lose their station, alerts lose their device.
 * Extended JSON preserves `$oid` and `$date`, and Compass reads it natively.
 *
 * Companion to import-data.ts, which restores these files without Compass.
 */

const outDir = path.resolve(
  process.argv.slice(2).find((a) => !a.startsWith("-")) ?? "data-export",
);

async function main(): Promise<void> {
  await connectDB();

  const db = mongoose.connection.db;
  if (!db) throw new Error("No database handle after connect");

  const collections = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."))
    .sort();

  if (collections.length === 0) {
    logger.warn("Database is empty — nothing to export. Run `npm run seed` first.");
    return;
  }

  await mkdir(outDir, { recursive: true });
  logger.info(`Exporting ${collections.length} collection(s) → ${outDir}`);

  let total = 0;

  for (const name of collections) {
    const docs = await db.collection(name).find({}).toArray();
    const file = path.join(outDir, `${name}.json`);

    // Compass accepts a top-level array; indenting keeps the files diffable.
    await writeFile(file, EJSON.stringify(docs, undefined, 2), "utf8");

    total += docs.length;
    logger.info(`  ${name.padEnd(14)} ${String(docs.length).padStart(6)} document(s)`);
  }

  logger.info(`Done — ${total} document(s) across ${collections.length} file(s).`);
  logger.info(`Copy the ${path.basename(outDir)} folder to the other machine.`);
}

main()
  .catch((err) => {
    logger.error("Export failed", err);
    process.exitCode = 1;
  })
  .finally(() => void disconnectDB());
