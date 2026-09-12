import { prisma } from "./db";
import { checkSingleMonitor } from "./services/pinger.service";

async function main() {
  console.log("💾 Connecting to Neon PostgreSQL and setting up monitor...\n");

  // 1. Create a monitor in the database (or find it if already created)
  let monitor = await prisma.monitor.findFirst({
    where: { url: "https://api.github.com" },
  });

  if (!monitor) {
    monitor = await prisma.monitor.create({
      data: {
        name: "GitHub API",
        url: "https://api.github.com",
        intervalSeconds: 60,
      },
    });
    console.log(`✨ Created monitor in Neon DB: ${monitor.name} (ID: ${monitor.id})`);
  } else {
    console.log(`📌 Found existing monitor in Neon DB: ${monitor.name} (ID: ${monitor.id})`);
  }

  // 2. Perform a check and save heartbeat to database
  console.log("\n⚡ Pinging endpoint and recording heartbeat into Neon DB...");
  const { updatedMonitor, heartbeat } = await checkSingleMonitor(monitor.id);

  console.log("\n📊 DATABASE RECORD CREATED:");
  console.log(`   Monitor Status: [${updatedMonitor.status}]`);
  console.log(`   Consecutive Fails: ${updatedMonitor.consecutiveFails}`);
  console.log(`   Heartbeat ID: ${heartbeat.id}`);
  console.log(`   Latency: ${heartbeat.latencyMs}ms`);
  console.log(`   Status Code: ${heartbeat.statusCode}`);
  console.log(`   Recorded At: ${heartbeat.createdAt.toISOString()}`);
  console.log("\n🎉 Success! Real data written to your cloud PostgreSQL database!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });