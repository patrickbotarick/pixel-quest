import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lockFingerprint, installExitCode } from "./dependency-lock.mjs";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const lockHash = lockFingerprint(readFileSync(join(root, "package-lock.json"), "utf8"));
const marker = join(root, "node_modules/.pixel-quest-lock-sha256");
const matches = existsSync(marker) && readFileSync(marker, "utf8").trim() === lockHash;
if (!matches || !existsSync(join(root, "node_modules/vite/bin/vite.js"))) {
  console.log("Instalando dependências do lockfile (npm ci)...");
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["ci", "--ignore-scripts", "--no-audit", "--no-fund"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (installExitCode(result)) {
    console.error("A instalação falhou. Encerre os servidores deste jogo antes de tentar novamente.");
    process.exit(1);
  }
  writeFileSync(marker, lockHash + "\n");
} else console.log("Dependências já instaladas para este lockfile.");
