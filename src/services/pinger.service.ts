import { performance } from "perf_hooks";
import { prisma } from "../db";
import { sendDiscordAlert } from "./alert.service";

export async function pingUrl(url: string, timeoutMs: number = 5000) {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "PulseGuard-Bot/1.0",
      },
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      isUp: response.ok,
      statusCode: response.status,
      latencyMs,
      error: null,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    return {
      isUp: false,
      statusCode: null,
      latencyMs,
      error: err.name === "AbortError" ? "Request Timed Out (>5s)" : err.message,
    };
  }
}

export async function checkSingleMonitor(monitorId: string) {
  // 1. Fetch monitor from database
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
  });

  if (!monitor) {
    throw new Error(`Monitor with ID ${monitorId} not found`);
  }

  // 2. Perform the ping
  const result = await pingUrl(monitor.url);

  // 3. Save the Heartbeat record into Neon Database
  const heartbeat = await prisma.heartbeat.create({
    data: {
      monitorId: monitor.id,
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
      isUp: result.isUp,
      error: result.error,
    },
  });

  // 4. Update consecutive fails & determine status
  const newConsecutiveFails = result.isUp ? 0 : monitor.consecutiveFails + 1;

  // If it failed 2+ times in a row -> DOWN. If failed 1 time -> DEGRADED. If success -> UP.
  let newStatus = "UP";
  if (!result.isUp) {
    newStatus = newConsecutiveFails >= 2 ? "DOWN" : "DEGRADED";
  }

  // 5. Trigger Discord Alerts only on state transitions (prevents alert spam!)
  if (newStatus === "DOWN" && monitor.status !== "DOWN") {
    await sendDiscordAlert({
      monitorName: monitor.name,
      url: monitor.url,
      status: "DOWN",
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
      error: result.error,
    });
  } else if (newStatus === "UP" && monitor.status === "DOWN") {
    await sendDiscordAlert({
      monitorName: monitor.name,
      url: monitor.url,
      status: "RECOVERED",
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
    });
  }

  // 6. Update the monitor in the database
  const updatedMonitor = await prisma.monitor.update({
    where: { id: monitor.id },
    data: {
      status: newStatus,
      consecutiveFails: newConsecutiveFails,
      lastCheckedAt: new Date(),
    },
  });

  return { updatedMonitor, heartbeat };
}