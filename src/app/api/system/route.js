import os from "node:os";
import { connection } from "next/server";

/** Host hardware for the report's method section (the machine running Ollama and NLLB). */
export async function GET() {
  await connection();
  const cpus = os.cpus();
  return Response.json({
    platform: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: cpus[0]?.model ?? "unknown",
    cores: cpus.length,
    memoryGb: Math.round(os.totalmem() / 1024 ** 3),
    node: process.version,
  });
}
