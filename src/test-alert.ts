import { sendDiscordAlert } from "./services/alert.service";

async function testAlerts() {
    console.log("Testing PulseGuard Alert Dispatcher...\n");

    // 1. Simulate a DOWN alert
    await sendDiscordAlert({
        monitorName: "Demo Payment Gateway API",
        url: "https://api.mypayment.com/charge",
        status: "DOWN",
        statusCode: 503,
        latencyMs: 2450,
        error: "Service Unavailable / Gateway Timeout",
    });

    // 2. Simulate a RECOVERY alert
    await sendDiscordAlert({
        monitorName: "Demo Payment Gateway API",
        url: "https://api.mypayment.com/charge",
        status: "RECOVERED",
        statusCode: 200,
        latencyMs: 180,
    });
}

testAlerts();