import assert from "node:assert/strict";
import test from "node:test";
import { lockFingerprint, installExitCode } from "./dependency-lock.mjs";

test("lock fingerprint survives Windows checkout line endings and formatting", () => {
  const lock = { lockfileVersion: 3, packages: { "node_modules/phaser": { version: "3.90.0" } } };
  const lf = JSON.stringify(lock, null, 2) + "\n";
  assert.equal(lockFingerprint(lf), lockFingerprint(lf.replaceAll("\n", "\r\n")));
  assert.equal(lockFingerprint(lf), lockFingerprint(JSON.stringify(lock)));
  lock.packages["node_modules/phaser"].version = "3.91.0";
  assert.notEqual(lockFingerprint(lf), lockFingerprint(JSON.stringify(lock)));
});

test("installation failures cannot wrap into Windows success", () => {
  assert.equal(installExitCode({ status: 0 }), 0);
  for (const status of [1, -4048, 4294963200, null]) {
    assert.equal(installExitCode({ status }), 1);
  }
  assert.equal(installExitCode({ status: 0, error: Error("spawn failed") }), 1);
});
