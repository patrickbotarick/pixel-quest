import { createHash } from "node:crypto";

// Git can change LF/CRLF during checkout without changing dependencies.
export function lockFingerprint(text) {
  return createHash("sha256").update(JSON.stringify(JSON.parse(text))).digest("hex");
}

// Windows commands may return large errno-based exit codes. Passing them to
// process.exit can wrap to zero; install failures must always become exit 1.
export function installExitCode(result) {
  return !result.error && result.status === 0 ? 0 : 1;
}
