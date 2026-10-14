import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { attackDamage } from "../logic/damage.ts";
import { PERFECT_DAMAGE } from "../logic/types.ts";
import {
  ASSET_BASE,
  MAP_NODES,
  NOT_APPROVED,
  attackPlans,
  enemyAnimCandidates,
  fitCard,
  heroAnimCandidates,
  layerIds,
  layerPlacement,
  layersJsonPath,
  parallaxAmplitude,
  parallaxBleed,
  pickAnim,
  readyIds,
  runtimeRequestedIds,
  sharedAssetIds,
  stageAssetIds,
  type CatalogManifest,
} from "./officialCatalog.ts";

const root = new URL("../../../public/assets/pixel_quest/", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("assets.manifest.json", root), "utf8")) as CatalogManifest;

describe("biblioteca oficial", () => {
  it("importa só o pacote aprovado", () => {
    assert.equal(manifest.assets.length, 183);
    assert.equal(manifest.assets.filter((asset) => asset.production_status !== "ready").length, 0);
    const ids = readyIds(manifest);
    for (const blocked of NOT_APPROVED) assert.equal(ids.has(blocked), false, blocked);
    assert.equal(ASSET_BASE, "/assets/pixel_quest/");
  });

  it("respeita as dimensões das spritesheets", () => {
    for (const asset of manifest.assets) {
      if (asset.type !== "spritesheet") continue;
      assert.equal(asset.frames >= 1, true, asset.id);
      assert.equal(asset.width, (asset.frame_width ?? 0) * asset.frames, asset.id);
      if (asset.id.startsWith("samuca.")) assert.equal(asset.frame_height, 128, asset.id);
      if (asset.id.startsWith("stone_guardian.")) assert.equal(asset.frame_height, 192, asset.id);
      if (asset.id.startsWith("shadow_dragon.")) assert.equal(asset.frame_height, 256, asset.id);
      const small = [
        "slime_green.",
        "slime_blue.",
        "mushroom.",
        "forest_bat.",
        "forest_spirit.",
        "crystal_creature.",
        "crystal_bat.",
        "crystal_sentinel.",
        "ghost.",
      ];
      if (small.some((prefix) => asset.id.startsWith(prefix)) && asset.frame_height) {
        assert.equal(asset.frame_height, 96, asset.id);
      }
    }
  });

  it("escolhe animações aprovadas e recusa ataques pendentes", () => {
    const ready = readyIds(manifest);
    assert.equal(pickAnim(heroAnimCandidates("idle"), ready), "samuca.idle");
    assert.equal(pickAnim(heroAnimCandidates("win"), ready), "samuca.victory");
    assert.equal(pickAnim(heroAnimCandidates("lose"), ready), "samuca.defeat");
    assert.equal(pickAnim(enemyAnimCandidates("mushroom", "atk", false), ready), "mushroom.attack");
    assert.equal(pickAnim(enemyAnimCandidates("bat", "atk", false), ready), "forest_bat.attack");
    assert.equal(pickAnim(enemyAnimCandidates("slimeGreen", "atk", false), ready), "slime_green.idle");
    assert.equal(pickAnim(enemyAnimCandidates("guardian", "atk", false), ready), "stone_guardian.ground_impact");
    assert.equal(pickAnim(enemyAnimCandidates("dragon", "idle", true), ready), "shadow_dragon.phase2_idle");
    assert.equal(pickAnim(enemyAnimCandidates("dragon", "atk", true), ready), "shadow_dragon.magic_attack");
    assert.equal(enemyAnimCandidates("dragon", "atk", true).includes("shadow_dragon.phase2_attack"), false);
    const plans = attackPlans(ready);
    for (const plan of plans) {
      if (plan.pending) assert.equal(ready.has(plan.pending), false, plan.pending);
      assert.ok(plan.played, `${plan.kind} fase2=${plan.phase2}`);
    }
  });

  it("monta cenários por bioma sem o trajeto pendente", () => {
    assert.deepEqual(layerIds("forest"), [
      "enchanted_forest.distant",
      "enchanted_forest.midground",
      "enchanted_forest.scenery",
      "enchanted_forest.ground",
      "enchanted_forest.foreground",
      "enchanted_forest.particles",
    ]);
    assert.equal(layersJsonPath("sanctuary"), "05_environments/crystal_sanctuary/metadata/layers.json");
    const map = JSON.parse(readFileSync(new URL("08_world/stage_map/stages.json", root), "utf8")) as {
      stages: { stage: number; x: number; y: number; boss: boolean }[];
    };
    assert.equal(map.stages.length, 10);
    assert.deepEqual(MAP_NODES, map.stages.map(({ stage, x, y, boss }) => ({ stage, x, y, boss })));
    const place = layerPlacement(472);
    const baselineY = place.y + (472 - 360) * place.scale;
    assert.equal(Math.round(baselineY), 448);
    assert.ok(parallaxAmplitude(1.08) < parallaxBleed());
  });

  it("carrega por fase e não pede recursos pendentes", () => {
    const ready = readyIds(manifest);
    const shared = sharedAssetIds(manifest);
    assert.ok(shared.includes("samuca.idle"));
    assert.ok(shared.includes("ui.card_back"));
    assert.ok(shared.includes("world.main_menu.background"));
    assert.equal(shared.includes("world.stage_map.path"), false);
    assert.equal(shared.includes("world.introduction.background"), false);
    const stage3 = stageAssetIds(manifest, 3);
    for (const layer of layerIds("forest")) assert.ok(stage3.includes(layer));
    assert.ok(stage3.includes("mushroom.attack"));
    assert.ok(stage3.includes("mushroom.idle"));
    const stage10 = stageAssetIds(manifest, 10);
    assert.ok(stage10.includes("shadow_dragon.phase2_idle"));
    assert.ok(stage10.includes("shadow_dragon.phase_transition"));
    assert.equal(stage10.includes("shadow_dragon.phase2_attack"), false);
    assert.ok(stage10.includes("crystal_sanctuary.ground"));
    const runtime = runtimeRequestedIds(manifest);
    for (const id of runtime) assert.equal(ready.has(id), true, id);
    for (const blocked of NOT_APPROVED) assert.equal(runtime.includes(blocked), false);
    assert.ok(runtime.length >= 120);
    assert.ok(runtime.length <= manifest.assets.length);
  });

  it("encaixa a carta oficial na célula da grade sem mudar o dano", () => {
    const fitted = fitCard(69, 69);
    assert.ok(fitted.w <= 69 && fitted.h <= 69);
    assert.ok(Math.abs(fitted.w / fitted.h - 68 / 84) < 0.02);
    assert.equal(attackDamage("perfect"), PERFECT_DAMAGE);
    assert.equal(attackDamage("perfect"), 20);
    assert.equal(attackDamage("partial"), 5);
    assert.equal(attackDamage("miss"), 0);
  });
});
