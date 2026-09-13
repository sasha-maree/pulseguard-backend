interface AlertPayload {
    monitorName: string;
    url: string;
    status: "DOWN" | "RECOVERED";
    statusCode?: number | null;
    error?: string | null;
    latencyMs?: number;
}

export async function sendDiscordAlert(payload: AlertPayload): Promise<void> {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    const isDown = payload.status === "DOWN";
    const title = isDown
        ? `🚨 Service Incident: ${payload.monitorName} is DOWN`
        : `✅ Service Recovery: ${payload.monitorName} is UP`;

    // 0xe74c3c = Red, 0x2ecc71 = Green
    const color = isDown ? 0xe74c3c : 0x2ecc71;

    const embed = {
        title,
        color,
        fields: [
            { name: "Target URL", value: payload.url, inline: false },
            { name: "Status", value: isDown ? "DOWN" : "OPERATIONAL", inline: true },
            {
                name: "HTTP Status",
                value: payload.statusCode ? `${payload.statusCode}` : "N/A",
                inline: true,
            },
            {
                name: "Latency",
                value: payload.latencyMs ? `${payload.latencyMs}ms` : "N/A",
                inline: true,
            },
            ...(payload.error
                ? [{ name: "Error Details", value: payload.error, inline: false }]
                : []),
        ],
        timestamp: new Date().toISOString(),
        footer: {
            text: "PulseGuard Autonomous Watchdog",
        },
    };

    // If no webhook URL is set in .env, simulate in console
    if (!webhookUrl) {
        console.log(`\n🔔 [ALERT SIMULATION - No Discord Webhook configured]`);
        console.log(`   ${title}`);
        console.log(`   URL: ${payload.url} | Details: ${payload.error ?? "HTTP " + payload.statusCode}\n`);
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: "PulseGuard Bot",
                avatar_url: "https://cdn-icons-png.flaticon.com/512/3602/3602145.png",
                embeds: [embed],
            }),
        });

        if (!response.ok) {
            console.error(`⚠️ Discord webhook responded with status ${response.status}`);
        } else {
            console.log(`📨 Alert successfully dispatched to Discord for ${payload.monitorName}!`);
        }
    } catch (err) {
        console.error("❌ Failed to send Discord alert:", err);
    }
}