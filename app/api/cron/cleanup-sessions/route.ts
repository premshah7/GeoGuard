import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// Auto Session Cleanup Cron
//
// Triggered by Vercel Cron (defined in vercel.json) every minute.
// Closes any attendance session that has been active longer than the
// configured `sessionAutoEndMinutes` threshold (default: 60 min).
//
// Security: requests must include Authorization: Bearer <CRON_SECRET>.
// Vercel automatically injects this header when using vercel.json crons.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    try {
        // ── Auth ─────────────────────────────────────────────────────────────
        const authHeader = req.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret) {
            console.error("[Cron] CRON_SECRET environment variable is not set.");
            return NextResponse.json(
                { error: "Server misconfiguration: CRON_SECRET missing." },
                { status: 500 }
            );
        }

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ── Read configurable timeout from SystemSettings ─────────────────────
        // Falls back to 60 minutes if no settings row exists yet.
        const settings = await prisma.systemSettings.findFirst();
        const timeoutMinutes = settings?.sessionAutoEndMinutes ?? 60;

        if (timeoutMinutes <= 0) {
            return NextResponse.json({
                success: true,
                message: "Auto-end is disabled (timeout set to 0).",
                closed: 0,
            });
        }

        const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

        // ── Find and close stale sessions ─────────────────────────────────────
        // We fetch them first so we can return meaningful info in the response.
        const staleSessions = await prisma.session.findMany({
            where: {
                isActive: true,
                startTime: { lt: cutoff },
            },
            select: {
                id: true,
                startTime: true,
                subject: { select: { name: true } },
                event: { select: { name: true } },
            },
        });

        if (staleSessions.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No stale sessions found.",
                closed: 0,
            });
        }

        const staleIds = staleSessions.map((s) => s.id);

        await prisma.session.updateMany({
            where: { id: { in: staleIds } },
            data: {
                isActive: false,
                endTime: new Date(),
            },
        });

        const summary = staleSessions.map((s) => ({
            sessionId: s.id,
            name: s.subject?.name ?? s.event?.name ?? "Unknown",
            startedAt: s.startTime,
            autoClosedAfterMinutes: timeoutMinutes,
        }));

        console.log(
            `[Cron] Auto-closed ${staleSessions.length} session(s) after ${timeoutMinutes}min timeout:`,
            summary
        );

        return NextResponse.json({
            success: true,
            message: `Auto-closed ${staleSessions.length} session(s).`,
            closed: staleSessions.length,
            timeoutMinutes,
            sessions: summary,
        });
    } catch (error) {
        console.error("[Cron] Session cleanup error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
