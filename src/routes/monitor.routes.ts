import { Router, Request, Response } from "express";
import { prisma } from "../db";
import { checkSingleMonitor } from "../services/pinger.service";

const router = Router();

// 1. GET /api/monitors - Get all monitors with their latest heartbeat
router.get("/", async (_req: Request, res: Response) => {
    try {
        const monitors = await prisma.monitor.findMany({
            include: {
                heartbeats: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json({ success: true, count: monitors.length, data: monitors });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. POST /api/monitors - Add a new monitor
router.post("/", async (req: Request, res: Response) => {
    try {
        const { name, url, intervalSeconds } = req.body;

        if (!name || !url) {
            return res.status(400).json({ success: false, error: "Name and URL are required." });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return res.status(400).json({ success: false, error: "Invalid URL format (must start with http or https)." });
        }

        // Create monitor in database
        const monitor = await prisma.monitor.create({
            data: {
                name,
                url,
                intervalSeconds: intervalSeconds ? Number(intervalSeconds) : 60,
            },
        });

        // Run an immediate check so user gets instant status
        const checkResult = await checkSingleMonitor(monitor.id);

        res.status(201).json({
            success: true,
            message: "Monitor created and checked successfully!",
            data: checkResult?.updatedMonitor ?? monitor,
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. GET /api/monitors/:id/heartbeats - Get recent heartbeats for charts
router.get("/:id/heartbeats", async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const heartbeats = await prisma.heartbeat.findMany({
            where: { monitorId: id },
            take: 50,
            orderBy: { createdAt: "desc" },
        });

        // Return chronological order (oldest to newest) for graphing
        res.json({ success: true, data: heartbeats.reverse() });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. DELETE /api/monitors/:id - Delete a monitor
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        await prisma.monitor.delete({
            where: { id },
        });

        res.json({ success: true, message: "Monitor deleted successfully." });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;