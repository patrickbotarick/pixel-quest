// Read-only integration audit: official approval, bytes, geometry and metadata.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { runtimeRequestedIds, NOT_APPROVED, attackPlans, readyIds } from "../src/game/art/officialCatalog.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const factory = resolve(root, "assets");
const runtime = resolve(root, "game/public/assets/pixel_quest");
const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const official = load(resolve(factory, "10_manifests/assets.manifest.json"));
const manifest = load(resolve(runtime, "assets.manifest.json"));
const review = load(resolve(factory, "10_manifests/visual_review.json"));
const byId = new Map(official.assets.map((asset) => [asset.id, asset]));
const ids = readyIds(manifest);
assert.equal(ids.size, manifest.assets.length, "Duplicate runtime IDs");
const checkedPath = (base, relative) => {
  assert(!relative.includes("\\") && !relative.includes(":"), `Nonportable path: ${relative}`);
  const path = resolve(base, relative);
  assert(path.startsWith(base + sep) && existsSync(path), `Missing/escaping: ${relative}`);
  return path;
};
let files = 0;
for (const asset of manifest.assets) {
  const source = byId.get(asset.id);
  assert(source && source.production_status === "ready", `Not officially approved: ${asset.id}`);
  assert.equal(asset.production_status, "ready");
  for (const key of ["path", "type", "width", "height", "frames", "frame_width", "frame_height", "fps", "loop", "origin", "dependencies", "metadata_path", "individual_frames"]) {
    assert.deepEqual(asset[key], source[key], `${asset.id}: ${key}`);
  }
  for (const path of [asset.path, ...(asset.individual_frames ?? []), ...(asset.metadata_path ? [asset.metadata_path] : [])]) {
    assert(readFileSync(checkedPath(runtime, path)).equals(readFileSync(checkedPath(factory, path))), `Different bytes: ${path}`);
    files++;
  }
  const png = readFileSync(checkedPath(runtime, asset.path));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.equal(png.readUInt32BE(16), asset.width, asset.id);
  assert.equal(png.readUInt32BE(20), asset.height, asset.id);
  assert.equal(createHash("sha256").update(png).digest("hex"), review.approved_hashes[asset.id], asset.id);
  if (asset.type === "spritesheet") {
    assert.equal(asset.width, asset.frame_width * asset.frames, asset.id);
    assert.equal(asset.height, asset.frame_height, asset.id);
    assert(asset.fps > 0 && asset.frames > 0);
  }
}
const requested = runtimeRequestedIds(manifest);
for (const id of requested) assert(ids.has(id) && !NOT_APPROVED.includes(id), `Unavailable runtime ID: ${id}`);
for (const biome of ["enchanted_forest", "forest_ruins", "crystal_cave", "crystal_sanctuary"]) {
  const rel = `05_environments/${biome}/metadata/layers.json`;
  assert.deepEqual(load(checkedPath(runtime, rel)), load(checkedPath(factory, rel)));
}
const stages = "08_world/stage_map/stages.json";
assert.deepEqual(load(checkedPath(runtime, stages)), load(checkedPath(factory, stages)));
console.log(JSON.stringify({ official: official.assets.length, approved: official.assets.filter((a) => a.production_status === "ready").length, review: official.assets.filter((a) => a.production_status === "needs_review").length, runtimeManifest: manifest.assets.length, requested: requested.length, filesVerified: files, unusedApprovedIds: [...ids].filter((id) => !requested.includes(id)), fallbacks: attackPlans(ids).filter((plan) => plan.pending), missing: 0, different: 0 }, null, 2));
