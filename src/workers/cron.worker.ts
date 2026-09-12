import cron from "node-cron";
import { prisma } from "../db";
import { checkSingleMonitor } from "../services/pinger.service";

export function startCronWorker() {
  console.log("⏱️  PulseGuard: Background cron worker initiated.");

  // Runs every 60 seconds ("* * * * *")
  cron.schedule("* * * * *", async () => {
    const now = new Date().toLocaleTimeString();
    console.log(`\n[${now}] 🔄 Running scheduled checks for all monitors...`);

    try {
      // 1. Fetch all monitors from the database
      const monitors = await prisma.monitor.findMany();

      if (monitors.length === 0) {
        console.log("   No monitors found to check.");
        return;
      }

      console.log(`   Checking ${monitors.length} monitor(s)...`);

      // 2. Check all monitors concurrently
      const results = await Promise.allSettled(
        monitors.map((m) => checkSingleMonitor(m.id))
      );

      // 3. Print the results
      results.forEach((res, idx) => {
        const monitorName = monitors[idx].name;
        if (res.status === "fulfilled" && res.value) {
          const { updatedMonitor, heartbeat } = res.value;
          const badge = updatedMonitor.status === "UP" ? "✅ UP" : "❌ " + updatedMonitor.status;
          console.log(`   ${badge} | ${monitorName} - ${heartbeat.latencyMs}ms (HTTP: ${heartbeat.statusCode ?? "N/A"})`);
        } else if (res.status === "rejected") {
          console.error(`   ⚠️ Error checking ${monitorName}:`, res.reason);
        }
      });
    } catch (error) {
      console.error("❌ Error in background cycle:", error);
    }
  });
}