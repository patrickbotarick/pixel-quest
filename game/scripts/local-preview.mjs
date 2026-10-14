// Portable preview supervisor. Never terminate an unrelated port owner.
import { spawn, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync, rmSync, closeSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const wrapper = join(root, "scripts/with-app-env.mjs");
const pidFile = join(root, ".grok/local-preview.pid");
const logFile = join(root, ".grok/local-preview.log");
const action = process.argv[2];
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const portInUse = () => new Promise((resolve) => {
  const socket = net.connect(8081, "127.0.0.1");
  socket.setTimeout(500);
  socket.once("connect", () => { socket.destroy(); resolve(true); });
  socket.once("error", () => resolve(false));
  socket.once("timeout", () => { socket.destroy(); resolve(false); });
});

function ownedProcess(pid) {
  if (!Number.isInteger(pid) || pid < 2) return false;
  try {
    const command = process.platform === "win32"
      ? execFileSync("powershell.exe", ["-NoProfile", "-Command", `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").CommandLine`], { encoding: "utf8", windowsHide: true })
      : readFileSync(`/proc/${pid}/cmdline`, "utf8").replaceAll("\0", " ");
    return command.includes(wrapper) && /\bpreview\b/.test(command);
  } catch { return false; }
}

async function stop() {
  if (!existsSync(pidFile)) return;
  const pid = Number(readFileSync(pidFile, "utf8").trim());
  if (ownedProcess(pid)) {
    if (process.platform === "win32") {
      execFileSync("taskkill.exe", ["/PID", String(pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGTERM");
    }
    for (let i = 0; i < 30 && await portInUse(); i++) await pause(100);
  }
  rmSync(pidFile, { force: true });
}

try {
  if (!["restart", "stop"].includes(action)) throw Error("Use: node scripts/local-preview.mjs restart|stop");
  await stop();
  if (action === "restart") {
    if (await portInUse()) throw Error("A porta 8081 está ocupada por outro processo; nenhum processo foi encerrado.");
    mkdirSync(dirname(logFile), { recursive: true });
    const log = openSync(logFile, "a");
    const child = spawn(process.execPath, [wrapper, "vite", "preview"], {
      cwd: root, detached: true, windowsHide: true, stdio: ["ignore", log, log],
    });
    closeSync(log);
    let failure;
    child.on("error", (error) => { failure = error; });
    child.on("exit", (code) => { failure = Error(`Preview encerrou com código ${code}. Veja .grok/local-preview.log`); });
    child.unref();
    writeFileSync(pidFile, `${child.pid}\n`);
    let ready = false;
    for (let i = 0; i < 180 && !failure; i++) {
      try {
        const response = await fetch("http://127.0.0.1:8081/", { signal: AbortSignal.timeout(1000) });
        if (response.ok) { ready = true; break; }
      } catch { /* Starting. */ }
      await pause(250);
    }
    if (!ready) { await stop(); throw failure ?? Error("Preview não iniciou; veja .grok/local-preview.log"); }
    console.log("Preview: http://127.0.0.1:8081/");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
