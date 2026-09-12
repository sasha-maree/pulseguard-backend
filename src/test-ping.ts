import { performance } from "perf_hooks";

interface PingResult {
  url: string;
  isUp: boolean;
  statusCode?: number;
  latencyMs: number;
  error?: string;
}

async function checkUrl(url: string, timeoutMs: number = 5000): Promise<PingResult> {
  const startTime = performance.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "PulseGuard-Uptime-Bot/1.0",
      },
    });

    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - startTime);

    return {
      url,
      isUp: response.ok, // true if status code is 200-299
      statusCode: response.status,
      latencyMs: latency,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - startTime);

    return {
      url,
      isUp: false,
      latencyMs: latency,
      error: err.name === "AbortError" ? "Request Timed Out (>5s)" : err.message,
    };
  }
}

async function runDemo() {
  console.log("🔍 PulseGuard: Running health checks...\n");

  const urlsToTest = [
    "https://api.github.com",               // 1. Rock solid live API (UP - 200)
    "https://httpbin.org/status/500",       // 2. Deliberately broken server (DOWN - 500)
    "https://httpbin.org/delay/7",          // 3. Deliberately slow server (TIMES OUT after 5s)
  ];

  for (const url of urlsToTest) {
    const result = await checkUrl(url);
    const badge = result.isUp ? "✅ UP" : "❌ DOWN";
    console.log(`${badge} | URL: ${result.url}`);
    console.log(`   Status Code: ${result.statusCode ?? "N/A"}`);
    console.log(`   Latency: ${result.latencyMs}ms`);
    if (result.error) console.log(`   Error: ${result.error}`);
    console.log("-------------------------------------------------");
  }
}

runDemo();