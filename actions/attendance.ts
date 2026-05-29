"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Upsert a proxy-attempt record for a (student, session) pair.
// We intentionally update on repeat so the admin sees the latest attempted hash.
// ─────────────────────────────────────────────────────────────────────────────
async function logProxyAttempt(
    studentId: number,
    sessionId: number,
    attemptedHash: string,
    deviceOwnerId?: number
) {
    try {
        const existing = await prisma.proxyAttempt.findFirst({
            where: { studentId, sessionId },
        });

        if (existing) {
            await prisma.proxyAttempt.update({
                where: { id: existing.id },
                data: {
                    attemptedHash,
                    deviceOwnerId: deviceOwnerId ?? existing.deviceOwnerId,
                    timestamp: new Date(),
                },
            });
        } else {
            await prisma.proxyAttempt.create({
                data: { studentId, sessionId, attemptedHash, deviceOwnerId },
            });
        }
    } catch (e) {
        // Logging failure must never block attendance flow — just warn.
        console.warn("[ProxyLog] Failed to write proxy attempt:", e);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// markAttendance
// Called by the student QR scanner (Scanner.tsx) with:
//   token      – signed JWT (or legacy "sessionId:timestamp") from the QR code
//   deviceHash – FingerprintJS visitorId computed on the client
//   userAgent  – navigator.userAgent from the client
//
// The HttpOnly "device_id" sticky cookie is read SERVER-SIDE — the client
// never sees or supplies it, so it cannot be tampered with via JS.
// ─────────────────────────────────────────────────────────────────────────────
export async function markAttendance(token: string, deviceHash: string, userAgent: string) {
    // ── Gate 0: Sticky device cookie ──────────────────────────────────────────
    const cookieStore = await cookies();
    const deviceId = cookieStore.get("device_id")?.value;

    if (!deviceId) {
        return { error: "Device Identity Missing. Please refresh the page." };
    }

    // ── Gate 1: Auth ──────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "STUDENT" && session.user.role !== "GUEST")) {
        return { error: "Unauthorized" };
    }

    const isGuest = session.user.role === "GUEST";
    const studentId = parseInt(session.user.id);

    // ── Gate 2: Parse QR Token ────────────────────────────────────────────────
    // QR_SECRET must NOT be NEXT_PUBLIC_ — read the server-only variable first,
    // fall back to the public one only for backward compat during migration.
    const QR_SECRET =
        process.env.QR_SECRET ||
        process.env.NEXT_PUBLIC_QR_SECRET ||
        "fallback_secret";

    let sessionId: number;
    let timestamp: number;

    if (token.includes(":") && !token.includes(".")) {
        // Legacy format: "sessionId:timestamp"
        const parts = token.split(":");
        sessionId = parseInt(parts[0]);
        timestamp = parseInt(parts[1]);
    } else {
        // Signed JWT format
        try {
            const decoded = jwt.verify(token, QR_SECRET) as {
                sessionId: number;
                timestamp: number;
            };
            sessionId = decoded.sessionId;
            timestamp = decoded.timestamp;

            if (
                typeof sessionId !== "number" ||
                typeof timestamp !== "number" ||
                !Number.isFinite(sessionId) ||
                !Number.isFinite(timestamp)
            ) {
                return { error: "Invalid QR Token Payload" };
            }
        } catch {
            return { error: "Invalid QR Code" };
        }
    }

    if (isNaN(sessionId) || isNaN(timestamp)) {
        return { error: "Invalid QR Code" };
    }

    // ── Gate 3: QR Expiry (4 seconds) ─────────────────────────────────────────
    if (Date.now() - timestamp > 4000) {
        return { error: "QR Code Expired! Please scan the dynamic code immediately." };
    }

    // ── Collect IP ────────────────────────────────────────────────────────────
    // On Vercel, x-forwarded-for is set by Vercel's edge and cannot be
    // spoofed by the end-user, so this is safe.
    const headerList = await headers();
    const ip =
        headerList.get("x-forwarded-for")?.split(",")[0].trim() ||
        headerList.get("x-real-ip") ||
        "unknown";

    // ── Fetch DB records in parallel ──────────────────────────────────────────
    const [dbSession, student] = await Promise.all([
        prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                batches: true,
                subject: { select: { name: true } },
                event: { select: { name: true } },
            },
        }),
        prisma.student.findUnique({
            where: { userId: studentId },
            include: { user: true },
        }),
    ]);

    if (!dbSession || !dbSession.isActive) {
        return { error: "Session is not active" };
    }

    if (!student) {
        return { error: "Student record not found" };
    }

    // ── Gate 4: Event Registration ────────────────────────────────────────────
    if (dbSession.eventId) {
        const registration = await prisma.eventRegistration.findFirst({
            where: { eventId: dbSession.eventId, userId: studentId },
        });
        if (!registration || registration.status !== "APPROVED") {
            return { error: "You are not approved for this event. Contact the organizer." };
        }
    }

    // ── Gate 5: Account Status ────────────────────────────────────────────────
    if (student.user.status !== "APPROVED") {
        if (student.user.status === "PENDING") {
            return { error: "Your registration is pending approval. Please contact the organizer." };
        }
        if (student.user.status === "REJECTED") {
            return { error: "Your registration has been rejected." };
        }
        return { error: "Account is not active." };
    }

    // ── Gate 6: Batch Restriction ─────────────────────────────────────────────
    if (dbSession.batches && dbSession.batches.length > 0) {
        const allowedBatchIds = new Set(dbSession.batches.map((b) => b.id));
        if (!student.batchId || !allowedBatchIds.has(student.batchId)) {
            const names = dbSession.batches.map((b) => b.name).join(", ");
            return {
                error: `This session is restricted to batches: ${names}. You are not in an eligible batch.`,
            };
        }
    }

    // ── Gate 7: IP Checks ─────────────────────────────────────────────────────
    const settings = await prisma.systemSettings.findFirst();
    const allowedPrefix = settings?.allowedIpPrefix || "";
    const isIpCheckEnabled = settings?.isIpCheckEnabled || false;
    const isCampusIp = allowedPrefix && ip.startsWith(allowedPrefix);

    // 7A. Strict campus enforcement (admin toggle)
    if (isIpCheckEnabled && allowedPrefix && !isCampusIp) {
        return { error: "You are not connected to the Campus Network." };
    }

    // 7B. Non-campus IP: enforce 1-student-per-IP-per-session.
    //     Prevents "mobile hotspot sharing" proxy attacks where student A shares
    //     their hotspot so student B can appear to be in the same location.
    if (!isCampusIp && ip !== "unknown" && !isGuest) {
        const ipUsedByOther = await prisma.attendance.findFirst({
            where: {
                sessionId,
                ipAddress: ip,
                studentId: { not: student.id },
            },
            select: { id: true, studentId: true },
        });

        if (ipUsedByOther) {
            await logProxyAttempt(student.id, sessionId, `IP_CONFLICT | ip=${ip}`, ipUsedByOther.studentId);
            return {
                error:
                    "Network Conflict: This IP address is already associated with another student. " +
                    "If you are sharing a mobile hotspot or VPN, please disable it.",
            };
        }
    }

    // ── Gate 8: Anti-Proxy Device Verification ────────────────────────────────
    // Guests are exempt — they are event visitors without a registered device.
    if (!isGuest) {
        // 8.0 Ensure the client actually sent a fingerprint
        if (!deviceHash || deviceHash.trim() === "") {
            return { error: "Device fingerprint missing. Please refresh the page and try again." };
        }

        // 8.1 GLOBAL OWNERSHIP CHECK
        //     Blocks a device (by hardware hash OR sticky cookie ID) that is already
        //     registered to a *different* student.  This catches:
        //       – Friend's phone: same deviceHash → blocked
        //       – Shared browser session: same device_id cookie → blocked
        const deviceOwner = await prisma.student.findFirst({
            where: {
                OR: [
                    { deviceHash: deviceHash },
                    { deviceId: deviceId },
                ],
                id: { not: student.id },
            },
            select: { id: true, deviceId: true, user: { select: { email: true } } },
        });

        if (deviceOwner) {
            const matchType = deviceOwner.deviceId === deviceId
                ? `STICKY_ID:${deviceId}`
                : `HW_HASH:${deviceHash.slice(0, 8)}...`;

            console.warn(
                `[Proxy] Student ${student.user.email} using device owned by` +
                ` ${deviceOwner.user.email} — match: ${matchType}`
            );

            await logProxyAttempt(student.id, sessionId, matchType, deviceOwner.id);
            return { error: "Device Verification Failed! This device is linked to another account." };
        }

        // 8.2 PER-STUDENT DEVICE BINDING
        //     First time the student marks attendance → atomically bind their device.
        //     Using deviceHash as the primary key for binding (hardware fingerprint
        //     is more stable than a cookie that can be cleared).
        let storedHash = student.deviceHash;
        let storedId = student.deviceId;

        if (!storedHash) {
            // Attempt atomic bind to prevent two simultaneous scans from double-binding.
            const result = await prisma.student.updateMany({
                where: { id: student.id, deviceHash: null },
                data: { deviceHash, deviceId },
            });

            if (result.count === 1) {
                // Successfully bound — use the values we just wrote.
                storedHash = deviceHash;
                storedId = deviceId;
            } else {
                // Race: another request beat us to it — re-read the winner's values.
                const refreshed = await prisma.student.findUnique({
                    where: { id: student.id },
                });
                if (refreshed) {
                    storedHash = refreshed.deviceHash;
                    storedId = refreshed.deviceId;
                }
            }
        }

        // 8.3 MISMATCH CHECK
        //     Hardware fingerprint is the decisive signal.
        //     A mismatched hash means the student is on a different physical device → proxy.
        if (storedHash && storedHash !== deviceHash) {
            const logHash =
                `HASH_MISMATCH | expected=${storedHash.slice(0, 8)}... ` +
                `got=${deviceHash.slice(0, 8)}...`;

            console.warn(`[Proxy] ${student.user.email}: ${logHash}`);
            await logProxyAttempt(student.id, sessionId, logHash);
            return {
                error: "Device Verification Failed! Please use your registered device and browser.",
            };
        }

        // 8.4 COOKIE RE-SYNC
        //     If the hardware hash matches but the cookie ID changed (student cleared
        //     browser data), silently update the stored ID — no proxy block.
        //     This avoids locking students out for a harmless cache clear.
        if (storedId && storedId !== deviceId && storedHash === deviceHash) {
            await prisma.student.update({
                where: { id: student.id },
                data: { deviceId },
            });
        }
    }

    // ── Gate 9: Duplicate Attendance ──────────────────────────────────────────
    const existingAttendance = await prisma.attendance.findFirst({
        where: { studentId: student.id, sessionId },
    });

    if (existingAttendance) {
        return { error: "Attendance already marked", success: true };
    }

    // ── Write: Mark Attendance ────────────────────────────────────────────────
    await prisma.attendance.create({
        data: {
            studentId: student.id,
            sessionId,
            userAgent,
            ipAddress: ip,
        },
    });

    revalidatePath("/student");
    const name = dbSession.subject?.name || dbSession.event?.name || "Unknown Session";
    return { success: true, name };
}

// ─────────────────────────────────────────────────────────────────────────────
// getSessionAttendance
// Used by faculty/admin to pull the full attendance list for a session.
// ─────────────────────────────────────────────────────────────────────────────
export async function getSessionAttendance(sessionId: number) {
    const session = await getServerSession(authOptions);
    if (
        !session ||
        (session.user.role !== "ADMIN" && session.user.role !== "FACULTY")
    ) {
        return { error: "Unauthorized" };
    }

    const attendances = await prisma.attendance.findMany({
        where: { sessionId },
        include: {
            student: {
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            username: true,
                        },
                    },
                },
            },
        },
        orderBy: { timestamp: "desc" },
    });

    return { success: true, attendances };
}
