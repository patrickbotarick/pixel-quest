// Real Chromium render/input tests. Every save fixture lives in a fresh context.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { defaultSave, SAVE_KEY } from "../src/game/logic/saveManager.ts";
import { checkedUrl } from "./browser-guard.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const production = process.argv.includes("--production");
const mapOnly = process.argv.includes("--map-only");
const target = checkedUrl(process.argv.find((arg) => /^https?:/.test(arg)) ?? (production ? "http://127.0.0.1:8081/" : "http://127.0.0.1:8080/"));
const out = join(root, "screenshots/v1.2", (production ? "production" : "dev") + (mapOnly ? "-map" : ""));
mkdirSync(out, { recursive: true });
const viewports = [[1920, 1080], [1366, 768], [1280, 720], [1024, 768], [844, 390], [667, 375]];
const report = { url: target, production, checks: [], screenshots: [], failures: [] };
let currentPage;
let currentErrors = [];
const browser = await chromium.launch({ headless: true, ...(process.platform === "win32" ? { channel: "chrome" } : {}), args: ["--disable-dev-shm-usage"] });

async function clickWorld(page, x, y) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const bounds = await page.locator("canvas").boundingBox();
  assert(bounds);
  const px = bounds.x + x * bounds.width / 1280;
  const py = bounds.y + y * bounds.height / 720;
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) await page.touchscreen.tap(px, py);
  else await page.mouse.click(px, py);
}

async function active(page, key) {
  await page.waitForFunction((sceneKey) => window.__pqTestGame.scene.getScene(sceneKey).sys.isActive(), key);
  // Scene create can finish before Phaser registers its new input objects.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function fixtureScene(page, key, data = {}) {
  await page.evaluate(({ key, data }) => {
    const game = window.__pqTestGame;
    for (const scene of game.scene.getScenes(false)) game.scene.stop(scene.sys.settings.key);
    if (key === "battle") {
      game.scene.getScene("battle").events.once("create", () => {
        const manager = game.scene.getScene("battle").manager;
        manager.rng = () => window.__qaRandom;
        manager.challenges.rng = () => window.__qaRandom;
      });
    }
    game.scene.start(key, data);
  }, { key, data });
  await active(page, key);
}

async function clickButton(page, key, label) {
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.waitForFunction(({ key, label }) => {
    const walk = (objects) => objects.flatMap((obj) => [obj, ...walk(obj.list ?? [])]);
    const scene = window.__pqTestGame.scene.getScene(key);
    const button = walk(scene.children.list).find((obj) => obj.name === `button:${label}`);
    return button?.list.some((obj) => obj.input?.enabled && scene.input._list.includes(obj));
  }, { key, label });
  const point = await page.evaluate(({ key, label }) => {
    const walk = (objects) => objects.flatMap((obj) => [obj, ...walk(obj.list ?? [])]);
    const scene = window.__pqTestGame.scene.getScene(key);
    const button = walk(scene.children.list).find((obj) => obj.name === `button:${label}`);
    if (!button) throw Error(`Button missing: ${key}/${label}`);
    const bounds = button.getBounds();
    return { x: bounds.centerX, y: bounds.centerY };
  }, { key, label });
  await clickWorld(page, point.x, point.y);
}

// Inspect pixels in the screenshot, not just Phaser object existence. An opaque
// panel covering cream-coloured text produces zero foreground pixels here.
async function capture(page, name, labels = [], sceneKey) {
  const screenshot = join(out, `${name}.png`);
  const bounds = await page.locator("canvas").boundingBox();
  const boxes = sceneKey ? await page.evaluate(({ key, labels }) => {
    const walk = (objects) => objects.flatMap((obj) => [obj, ...walk(obj.list ?? [])]);
    const objects = walk(window.__pqTestGame.scene.getScene(key).children.list);
    return labels.map((label) => {
      const text = objects.find((obj) => obj.type === "Text" && obj.text.startsWith(label));
      if (!text) throw Error(`Text missing: ${key}/${label}`);
      const box = text.getBounds();
      return { label, x: box.x, y: box.y, w: box.width, h: box.height };
    });
  }, { key: sceneKey, labels }) : labels;
  const png = await page.screenshot({ path: screenshot });
  const pixels = await page.evaluate(async ({ encoded, boxes, bounds }) => {
    const bytes = Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const result = boxes.map((box) => {
      const x = Math.floor(bounds.x + box.x * bounds.width / 1280);
      const y = Math.floor(bounds.y + box.y * bounds.height / 720);
      const w = Math.max(1, Math.ceil(box.w * bounds.width / 1280));
      const h = Math.max(1, Math.ceil(box.h * bounds.height / 720));
      const inside = x >= 0 && y >= 0 && x + w <= bitmap.width + 1 && y + h <= bitmap.height + 1;
      let count = 0;
      if (inside) {
        const data = ctx.getImageData(x, y, w, h).data;
        for (let i = 0; i < data.length; i += 4) if (data[i] > 180 && data[i + 1] > 165 && (data[i + 2] > 145 || (data[i] > 210 && data[i + 1] > 170 && data[i + 2] > 60)) && data[i + 3] > 0) count++;
      }
      return { ...box, inside, foregroundPixels: count };
    });
    bitmap.close();
    return result;
  }, { encoded: png.toString("base64"), boxes, bounds });
  for (const item of pixels) {
    assert(item.inside, `${name}: clipped text ${item.label}`);
    assert(item.foregroundPixels >= 8, `${name}: invisible text ${item.label} (${item.foregroundPixels} pixels)`);
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight), false, `${name}: page overflow`);
  report.screenshots.push({ file: screenshot, textEvidence: pixels });
}

async function battle(page, stage, random = 0.5) {
  await page.evaluate((value) => { window.__qaRandom = value; }, random);
  await fixtureScene(page, "battle", { stageId: stage });
  await page.waitForFunction((stage) => window.__pq?.stage === stage && ["choose", "preview", "challenge"].includes(window.__pq.phase), stage);
  if (await page.evaluate(() => window.__pq.phase === "choose")) {
    const point = await page.evaluate(() => {
      const actor = window.__pqTestGame.scene.getScene("battle").actors[0].sprite.getBounds();
      return { x: actor.centerX, y: actor.centerY };
    });
    await clickWorld(page, point.x, point.y);
  }
  await page.waitForFunction(() => ["preview", "challenge"].includes(window.__pq.phase));
}

async function cardInfo(page) {
  return page.evaluate(() => {
    const scene = window.__pqTestGame.scene.getScene("battle");
    return scene.cardViews.map((view, index) => ({ x: view.root.x, y: view.root.y, w: view.width, h: view.height, hitW: view.root.width, hitH: view.root.height, layout: view.root.getData("layout"), symbol: scene.manager.memory.cards[index].symbol, matched: scene.manager.memory.cards[index].matched, parented: view.front.parentContainer === view.root && view.front.list.every((face) => face.parentContainer === view.front) }));
  });
}

try {
  for (const [width, height] of viewports) {
    const suffix = `${width}x${height}`;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 900 });
    const save = defaultSave();
    save.unlocked = 10; save.completed = true;
    save.cleared = save.cleared.map((_, index) => index > 0);
    save.stars = save.stars.map((_, index) => index > 0 ? 3 : 0);
    save.tutorials = { math: true, memory: true, reflex: true };
    save.settings.reduceMotion = true;
    await context.addInitScript(({ save, key }) => {
      if ((location.hostname === "127.0.0.1" || location.hostname === "localhost") && !localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save));
      window.__qaRandom = 0.5;

    }, { save, key: SAVE_KEY });
    const page = await context.newPage();
    const errors = [];
    currentPage = page;
    currentErrors = errors;
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const qaUrl = new URL(target);
    qaUrl.searchParams.set("qa", "ui");
    await page.goto(qaUrl.href, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.__pqReady === true);
    if (production) assert.equal(await page.evaluate(() => Boolean(window.__pqTestGame)), false, "QA fixture leaked into production");
    if (mapOnly) {
      if (production) await clickWorld(page, 980, 250);
      else await fixtureScene(page, "stages");
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const nodes = [{ x: 145, y: 568 }, { x: 440, y: 588 }, { x: 100, y: 340 }, { x: 255, y: 145 }, { x: 475, y: 280 }, { x: 815, y: 600 }, { x: 1080, y: 520 }, { x: 1065, y: 330 }, { x: 790, y: 200 }, { x: 1150, y: 165 }];
      if (production) await capture(page, `map-${suffix}`, nodes.map((point, index) => ({ label: `Fase ${index + 1}`, x: point.x - 20, y: point.y + 56, w: 40, h: 34 })));
      else {
        await capture(page, `map-${suffix}`, ["ESCOLHA A FASE", ...nodes.map((_, index) => String(index + 1))], "stages");
        assert.equal(await page.evaluate(() => {
          const objects = window.__pqTestGame.scene.getScene("stages").children.list;
          const numbers = objects.filter((obj) => obj.type === "Text" && /^\d+$/.test(obj.text));
          const icons = objects.filter((obj) => obj.type === "Image" && obj.texture.key === "ui.stage_completed");
          return numbers.length === 10 && numbers.every((text, index) => text.getBounds().top > icons[index].getBounds().bottom);
        }), true, "completed icon still overlaps its number");
      }
      await clickWorld(page, 145, 640);
      await page.waitForFunction(() => window.__pq?.stage === 1);
      await capture(page, `map-number-click-${suffix}`);
      assert.deepEqual(errors, []);
      report.checks.push({ viewport: suffix, passed: true, errors });
      await context.close();
      console.log(`PASS ${suffix} (map)`);
      continue;
    }
    if (production) {
      await clickWorld(page, 980, 526);
      await page.waitForTimeout(100);
      await capture(page, `settings-${suffix}`, [
        { label: "MÚSICA", x: 440, y: 144, w: 400, h: 48 },
        { label: "EFEITOS", x: 440, y: 240, w: 400, h: 48 },
        { label: "MOVIMENTO", x: 400, y: 336, w: 480, h: 48 },
        { label: "VOLTAR", x: 500, y: 630, w: 280, h: 48 },
      ]);
      await clickWorld(page, 640, 654);
      await clickWorld(page, 980, 434);
      await page.waitForTimeout(100);
      await capture(page, `howto-${suffix}`, [
        { label: "COMO ATACAR", x: 400, y: 80, w: 480, h: 40 },
        { label: "INSTRUÇÕES", x: 320, y: 310, w: 640, h: 120 },
        { label: "VOLTAR", x: 500, y: 610, w: 280, h: 48 },
      ]);
      await clickWorld(page, 640, 634);
    } else {
      await clickButton(page, "menu", "CONFIGURAÇÕES");
      await active(page, "settings");
      await capture(page, `settings-${suffix}`, ["CONFIGURAÇÕES", "MÚSICA:", "EFEITOS:", "MENOS MOVIMENTO:", "VOLUME", "TELA CHEIA", "VOLTAR"], "settings");
      await clickButton(page, "settings", "MÚSICA: LIGADA");
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("pixel-quest-save-v1")).settings.music === false);
      await clickButton(page, "settings", "VOLTAR");
      await active(page, "menu");
      await clickButton(page, "menu", "CONFIGURAÇÕES");
      await active(page, "settings");
      await capture(page, `settings-persisted-${suffix}`, ["MÚSICA: DESLIGADA", "VOLTAR"], "settings");
      if (width === 1280) {
        await clickButton(page, "settings", "EFEITOS: LIGADOS");
        await clickButton(page, "settings", "MENOS MOVIMENTO: SIM");
        await page.waitForFunction(() => JSON.parse(localStorage.getItem("pixel-quest-save-v1")).settings.reduceMotion === false);
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const box = await page.locator("canvas").boundingBox();
        await page.mouse.move(box.x + 787 * box.width / 1280, box.y + 500 * box.height / 720);
        await page.mouse.down();
        await page.mouse.move(box.x + 640 * box.width / 1280, box.y + 500 * box.height / 720, { steps: 8 });
        await page.mouse.up();
        await page.waitForFunction(() => Math.abs(JSON.parse(localStorage.getItem("pixel-quest-save-v1")).settings.volume - 0.5) < 0.02);
        await capture(page, `settings-controls-${suffix}`, ["EFEITOS: DESLIGADOS", "MENOS MOVIMENTO: NÃO", "VOLUME 50"], "settings");
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("settings").children.list.length), 2, "settings leaked scene-level graphics");
        await clickButton(page, "settings", "MENOS MOVIMENTO: NÃO");
      }
      await clickButton(page, "settings", "VOLTAR");
      await active(page, "menu");
      await clickButton(page, "menu", "COMO JOGAR");
      await active(page, "howto");
      const titles = ["COMO ATACAR", "MATEMÁTICA", "MEMÓRIA", "REFLEXO", "ACERTO E ERRO", "VAMOS VENCER!"];
      for (let index = 0; index < titles.length; index++) {
        await capture(page, `howto-${index + 1}-${suffix}`, [titles[index], "VOLTAR", index === 5 ? "ENTENDI" : "PRÓXIMO"], "howto");
        if (index < 5) { await clickButton(page, "howto", "PRÓXIMO"); await page.waitForTimeout(50); }
      }
      await clickButton(page, "howto", "VOLTAR"); await active(page, "menu");
      await fixtureScene(page, "victory", { stageId: 1, stars: 3 });
      await capture(page, `victory-${suffix}`, ["FASE CONCLUÍDA!", "Primeiro Desafio", "Muito bem!", "PRÓXIMA FASE", "VOLTAR AO MAPA"], "victory");
      await clickButton(page, "victory", "PRÓXIMA FASE"); await active(page, "battle");
      assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").stageId), 2);
      await fixtureScene(page, "victory", { stageId: 5, stars: 2, crystal: true });
      await capture(page, `crystal-${suffix}`, ["Samuca recuperou", "PRÓXIMA FASE", "VOLTAR AO MAPA"], "victory");
      await clickButton(page, "victory", "VOLTAR AO MAPA"); await active(page, "stages");
      await capture(page, `map-${suffix}`, ["ESCOLHA A FASE", "VOLTAR"], "stages");
      for (const [stage, count] of [[3, 4], [7, 6]]) {
        await battle(page, stage);
        assert.equal(await page.evaluate(() => window.__pq.kind), "memory");
        const cards = await cardInfo(page);
        assert.equal(cards.length, count);
        assert(cards.every((card) => card.layout.rows === 1 && card.layout.columns === count && card.parented));
        assert(cards.every((card) => Math.abs(card.w / card.h - 68 / 84) < 0.001));
        const scale = (await page.locator("canvas").boundingBox()).width / 1280;
        assert(cards.every((card) => card.hitW * scale >= 43.99 && card.hitH * scale >= 43.99));
        const previewStarted = Date.now();
        await capture(page, `memory${count}-preview-${suffix}`, ["OLHE BEM", "SAMUCA"], "battle");
        await page.waitForFunction(() => window.__pq.phase === "challenge");
        assert(Date.now() - previewStarted >= 2700, "3-second preview was shortened");
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").timerImage.visible), true);
        await capture(page, `memory${count}-closed-${suffix}`, ["ACHE OS PARES", "SAMUCA"], "battle");
        if (count === 4) {
          const wrong = cards.findIndex((card) => card.symbol !== cards[0].symbol);
          await clickWorld(page, cards[0].x + cards[0].hitW * 0.35, cards[0].y + cards[0].hitH * 0.35); await clickWorld(page, cards[wrong].x - cards[wrong].hitW * 0.35, cards[wrong].y - cards[wrong].hitH * 0.35);
          assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.memory.lock), true);
          await capture(page, `memory4-mismatch-${suffix}`, ["SAMUCA"], "battle");
          await page.waitForFunction(() => !window.__pqTestGame.scene.getScene("battle").manager.memory.lock);
          assert((await cardInfo(page)).every((card) => !card.matched));
        }
        const pair = cards.findIndex((card, index) => index > 0 && card.symbol === cards[0].symbol);
        await clickWorld(page, cards[0].x + cards[0].hitW * 0.35, cards[0].y + cards[0].hitH * 0.35); await clickWorld(page, cards[pair].x - cards[pair].hitW * 0.35, cards[pair].y - cards[pair].hitH * 0.35);
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.memory.found), 1);
        await capture(page, `memory${count}-matched-${suffix}`, ["SAMUCA"], "battle");
        const used = new Set([0, pair]);
        for (let index = 0; index < cards.length; index++) {
          if (used.has(index)) continue;
          const other = cards.findIndex((card, candidate) => candidate !== index && !used.has(candidate) && card.symbol === cards[index].symbol);
          await clickWorld(page, cards[index].x, cards[index].y); await clickWorld(page, cards[other].x, cards[other].y);
          used.add(index); used.add(other);
        }
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.pending.damage), 20);
      }
      await fixtureScene(page, "gameover", { stageId: 3, offerHelp: true });
      await capture(page, `defeat-${suffix}`, ["QUASE LÁ!", "SIM", "AGORA NÃO", "MAPA"], "gameover");
      await fixtureScene(page, "victory", { stageId: 10, stars: 3, crystal: true });
      await capture(page, `final-victory-${suffix}`, ["Samuca salvou", "VER O FINAL", "VOLTAR AO MAPA"], "victory");
      await clickButton(page, "victory", "VER O FINAL"); await active(page, "ending");
      const saved = await page.evaluate(() => localStorage.getItem("pixel-quest-save-v1"));
      await capture(page, `ending-${suffix}`, ["PARABÉNS!", "VOCÊ E O SAMUCA", "MENU PRINCIPAL", "MAPA DAS FASES"], "ending");
      await clickButton(page, "ending", "MENU PRINCIPAL"); await active(page, "menu");
      assert.equal(await page.evaluate(() => localStorage.getItem("pixel-quest-save-v1")), saved);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => window.__pqReady === true);
      assert.equal(await page.evaluate(() => localStorage.getItem("pixel-quest-save-v1")), saved, "reload lost completed campaign or settings");
      await fixtureScene(page, "ending");
      await clickButton(page, "ending", "MAPA DAS FASES"); await active(page, "stages");
      assert.equal(await page.evaluate(() => localStorage.getItem("pixel-quest-save-v1")), saved);
      if (width === 1280) {
        await battle(page, 1, 0.2);
        await capture(page, `math-${suffix}`, ["SAMUCA", "QUANTO É?"], "battle");
        await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").mathButtons[0].setFocused(true));
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").mathButtons[0].slice.texture.key), "ui.button_primary_hover");
        await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").mathButtons[0].setEnabled(false));
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").mathButtons[0].slice.texture.key), "ui.button_primary_disabled");
        await clickWorld(page, 304, 664);
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.pending), null);
        await page.evaluate(() => { const button = window.__pqTestGame.scene.getScene("battle").mathButtons[0]; button.setEnabled(true); button.setFocused(false); });
        const answer = await page.evaluate(() => window.__pq.options.indexOf(window.__pq.answer));
        await page.keyboard.press(String(answer + 1));
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.pending.damage), 20);
        await page.waitForFunction(() => window.__pqTestGame.scene.getScene("battle").manager.enemies[0].hp === 20);
        await page.waitForFunction(() => window.__pq.phase === "challenge");
        const wrong = await page.evaluate(() => window.__pq.options.findIndex((answer) => answer !== window.__pq.answer));
        await page.keyboard.press(String(wrong + 1));
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.pending.damage), 5);
        await battle(page, 3);
        await page.waitForFunction(() => window.__pq.phase === "challenge");
        const timeoutStart = Date.now();
        await page.waitForFunction(() => window.__pqTestGame.scene.getScene("battle").manager.pending?.outcome === "miss", undefined, { timeout: 35000 });
        assert(Date.now() - timeoutStart >= 23000, "memory timer was shortened");
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.pending.damage), 0);
        await capture(page, `memory-timeout-${suffix}`, ["TEMPO!"], "battle");
        await battle(page, 5, 0.9);
        assert.equal(await page.evaluate(() => window.__pq.kind), "reflex");
        await capture(page, `reflex-${suffix}`, ["TOQUE NA FAIXA VERDE", "SAMUCA"], "battle");
        await page.keyboard.press("Space");
        await page.waitForFunction(() => window.__pqTestGame.scene.getScene("battle").manager.pending !== null);
        await battle(page, 10, 0.2);
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.enemies[0].hp), 180);
        for (let repeat = 0; repeat < 3; repeat++) {
          await page.keyboard.press("Escape"); await active(page, "pause");
          const pausedTime = await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.elapsed());
          await page.waitForTimeout(150);
          assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").manager.elapsed()), pausedTime);
          await capture(page, `pause-${repeat}-${suffix}`, ["PAUSA", "CONTINUAR", "REINICIAR", "CONFIGURAÇÕES", "MAPA"], "pause");
          assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("pause").input.keyboard.listenerCount("keydown-ESC")), 1);
          await clickButton(page, "pause", "CONTINUAR");
          await page.waitForFunction(() => window.__pqTestGame.scene.getScene("battle").sys.isActive());
        }
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").input.keyboard.listenerCount("keydown")), 1);
        await page.evaluate(() => { const save = JSON.parse(localStorage.getItem("pixel-quest-save-v1")); save.settings.reduceMotion = false; localStorage.setItem("pixel-quest-save-v1", JSON.stringify(save)); });
        await battle(page, 3);
        const resizePreviewStarted = Date.now();
        await page.setViewportSize({ width: 844, height: 390 });
        await page.waitForFunction(() => window.__pqTestGame.scale.displaySize.width < 900);
        await capture(page, "memory4-resized-preview", ["OLHE BEM"], "battle");
        await page.waitForFunction(() => window.__pq.phase === "challenge");
        assert(Date.now() - resizePreviewStarted >= 2600 && Date.now() - resizePreviewStarted < 4500, "resize changed preview duration");
        const animated = await cardInfo(page);
        await clickWorld(page, animated[0].x + animated[0].w * 0.3, animated[0].y + animated[0].h * 0.3);
        await page.waitForFunction(() => { const view = window.__pqTestGame.scene.getScene("battle").cardViews[0]; return view.root.scaleX === 1 && view.front.visible; });
        assert.equal(await page.evaluate(() => window.__pqTestGame.scene.getScene("battle").cardViews[0].front.visible), true);
        assert((await cardInfo(page)).every((card) => card.parented));
        await capture(page, "memory4-flip-after-resize", ["SAMUCA"], "battle");
      }
    }
    assert.deepEqual(errors, [], `${suffix}: browser errors`);
    report.checks.push({ viewport: suffix, passed: true, errors });
    await context.close();
    console.log(`PASS ${suffix} (${production ? "production" : "dev"})`);
  }
} catch (error) {
  report.failures.push({ error: error.stack ?? error.message, consoleErrors: currentErrors, body: await currentPage?.locator("body").innerText().catch(() => "") });
  await currentPage?.screenshot({ path: join(out, "failure.png") }).catch(() => {});
  process.exitCode = 1;
  console.error(error.message);
} finally {
  await browser.close();
  writeFileSync(join(out, "verdict.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: report.checks.length, failed: report.failures.length, screenshots: report.screenshots.length, report: join(out, "verdict.json") }));
}
