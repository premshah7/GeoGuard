"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateIp } from "@/lib/ipCheck";
import { revalidatePath } from "next/cache";

import { cookies, headers } from "next/headers";

export async function markAttendance(token: string, deviceHash: string, userAgent: string) {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get("device_id")?.value;

    if (!deviceId) {
        return { error: "Device Identity Missing. Please refresh the page." };
    }
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "STUDENT" && session.user.role !== "GUEST")) {
        return { error: "Unauthorized" };
    }

    const studentId = parseInt(session.user.id);

    // 1. Parse Token (JWT Support)
    let sessionId: number;
    let timestamp: number;

    const QR_SECRET = process.env.NEXT_PUBLIC_QR_SECRET || "fallback_secret";

    // Check if it's a legacy token (sessionId:timestamp) or a JWT
    if (token.includes(":") && !token.includes(".")) {
        // Legacy Path
        const parts = token.split(":");
        sessionId = parseInt(parts[0]);
        timestamp = parseInt(parts[1]);
    } else {
        // JWT Path
        try {
            // Lazy load jwt to avoid edge runtime issues if possible, although this is a server action.
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(token, QR_SECRET) as any;
            sessionId = decoded.sessionId;
            timestamp = decoded.timestamp;

            // Validate payload structure
            if (!sessionId || !timestamp) {
                return { error: "Invalid QR Token Payload" };
            }
        } catch (e) {
            console.error("JWT Verification Failed:", e);
            return { error: "Invalid QR Codes" };
        }
    }

    if (isNaN(sessionId) || isNaN(timestamp)) {
        return { error: "Invalid QR Codes" };
    }

    // 1.1 Check Expiration (4 Seconds)
    const now = Date.now();
    // Allow 4 seconds delay. We also allow 1 second future drift just in case.
    if (now - timestamp > 4000) {
        return { error: "QR Code Expired! Please scan the dynamic code immediately." };
    }

    // 2. Get IP
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0] ||
        headerList.get("x-real-ip") ||
        "unknown";

    // 3. Get Session & Student
    const [dbSession, student] = await Promise.all([
        prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                batches: true,
                subject: { select: { name: true } },
                event: { select: { name: true } }
            }
        }),
        prisma.student.findUnique({
            where: { userId: studentId },
            include: { user: true }
        }),
    ]);

    if (!dbSession || !dbSession.isActive) {
        return { error: "Session is not active" };
    }

    if (!student) {
        return { error: "Student record not found" };
    }

    // Check event registration approval (for event sessions)
    if (dbSession.eventId) {
        const registration = await prisma.eventRegistration.findFirst({
            where: { eventId: dbSession.eventId, userId: studentId },
        });
        if (!registration || registration.status !== "APPROVED") {
            return { error: "You are not approved for this event. Contact the organizer." };
        }
    }

    // 3.1 Check User Status (Approval)
    if (student.user.status !== "APPROVED") {
        if (student.user.status === "PENDING") {
            return { error: "Your registration is pending approval. Please contact the organizer." };
        } else if (student.user.status === "REJECTED") {
            return { error: "Your registration has been rejected." };
        }
        return { error: "Account is not active." };
    }

    // 3.2 Check Batch Restriction
    if (dbSession.batches && dbSession.batches.length > 0) {
        // Session is restricted to specific batches.
        // Check if student has a batch and if it matches one of the allowed batches.
        const allowedBatchIds = new Set(dbSession.batches.map(b => b.id));

        if (!student.batchId || !allowedBatchIds.has(student.batchId)) {
            const allowedBatchNames = dbSession.batches.map(b => b.name).join(", ");
            return { error: `This session is restricted to batches: ${allowedBatchNames}. You are not in an eligible batch.` };
        }
    }

    /* 
    // --- NEW: GLOBAL DEVICE OWNERSHIP CHECK (Sticky ID + Fingerprint) ---
    console.log(`[Attendance Debug] User: ${student.user.email} | Hash: ${deviceHash} | ID: ${deviceId}`);

    // Check if this device is already registered to another student.
    // We check BOTH the hardware fingerprint AND the persistent browser ID.
    const deviceOwner = await prisma.student.findFirst({
        where: {
            OR: [
                { deviceHash: deviceHash }, // Hardware match
                { deviceId: deviceId }      // Sticky ID match (Shared Browser Exploit)
            ],
            id: { not: student.id } // Exclude self
        },
        include: { user: true }
    });

    if (deviceOwner) {
        console.log(`[Attendance Debug] Device Owner Found: ${deviceOwner.user.email} (ID: ${deviceOwner.id})`);
        // Determine what matched for better logging
        const isStickyMatch = deviceOwner.deviceId === deviceId;
        const logHash = isStickyMatch ? `ID:${deviceId}` : `HASH:${deviceHash}`;

        // Log Proxy Attempt
        // Log Proxy Attempt (Upsert Logic)
        const existingProxy = await prisma.proxyAttempt.findFirst({
            where: {
                studentId: student.id,
                sessionId: sessionId
            }
        });

        if (existingProxy) {
            await prisma.proxyAttempt.update({
                where: { id: existingProxy.id },
                data: {
                    attemptedHash: logHash,
                    deviceOwnerId: deviceOwner.id,
                    timestamp: new Date()
                }
            });
        } else {
            await prisma.proxyAttempt.create({
                data: {
                    studentId: student.id,
                    sessionId: sessionId,
                    attemptedHash: logHash,
                    deviceOwnerId: deviceOwner.id
                },
            });
        }

        return { error: "Device Verification Failed! This device is linked to another account." };
    }
    */

    // 5. Smart IP Lock & Validation
    const settings = await prisma.systemSettings.findFirst();
    const allowedPrefix = settings?.allowedIpPrefix || "";
    const isIpCheckEnabled = settings?.isIpCheckEnabled || false;

    // A. Strict Campus Check (If enabled)
    if (isIpCheckEnabled && allowedPrefix && !ip.startsWith(allowedPrefix)) {
        return { error: "You are not connected to the Office/Campus Network." };
    }

    // B. Heuristic Proxy Lock (For Non-Campus/VPN/Mobile Data)
    // If we are NOT enforcing strictly (or even if we are, and they are on a sub-network),
    // we want to prevent 1 IP from marking for 2 people unless it's the known massive-shared range.

    // Logic: If current IP is NOT the main campus range (or if no range defined), 
    // we treat it as potentially "personal" (Mobile Data/VPN).
    // On Personal IPs, we STRICTLY forbid sharing.

    const isCampusIp = allowedPrefix && ip.startsWith(allowedPrefix);

    /*
    if (!isCampusIp) {
        // This is an external/VPN/Mobile IP. Enforce 1-to-1 binding.
        const ipUsedByOther = await prisma.attendance.findFirst({
            where: {
                sessionId: sessionId,
                ipAddress: ip,
                studentId: { not: student.id }
            },
            include: { student: { include: { user: true } } }
        });

        if (ipUsedByOther) {
            return { error: `Network Conflict: This IP is already associated with another student (${ipUsedByOther.student.user.name}). If you are using a Hotspot or VPN, please disable it.` };
        }
    }
    */

    const isGuest = session.user.role === "GUEST";

    // --- TEMPORARILY DISABLED DEVICE VERIFICATION ---
    /*
    let isProxy = false;
    // Atomic Device Binding to prevent Race Conditions
    let storedHash = student.deviceHash;
    let storedId = student.deviceId;

    if (!storedHash || !storedId) {
        // Try to bind atomically
        const result = await prisma.student.updateMany({
            where: {
                id: student.id,
                OR: [{ deviceHash: null }, { deviceId: null }]
            },
            data: { deviceHash, deviceId }
        });

        if (result.count === 1) {
            // We successfully bound it
            storedHash = deviceHash;
            storedId = deviceId;
        } else {
            // Already bound by parallel request. Re-fetch current state.
            const refreshed = await prisma.student.findUnique({ where: { id: student.id } });
            if (refreshed) {
                storedHash = refreshed.deviceHash;
                storedId = refreshed.deviceId;
            }
        }
    }

    if (!isGuest && (storedHash !== deviceHash || storedId !== deviceId)) {
        isProxy = true;
    }

    if (isProxy) {
        // Upsert Proxy Attempt
        const existingProxy = await prisma.proxyAttempt.findFirst({
            where: {
                studentId: student.id,
                sessionId: sessionId
            }
        });

        if (existingProxy) {
            await prisma.proxyAttempt.update({
                where: { id: existingProxy.id },
                data: {
                    attemptedHash: `HASH:${deviceHash}|ID:${deviceId}`,
                    timestamp: new Date()
                }
            });
        } else {
            await prisma.proxyAttempt.create({
                data: {
                    studentId: student.id,
                    sessionId: sessionId,
                    attemptedHash: `HASH:${deviceHash}|ID:${deviceId}`,
                },
            });
        }
        return { error: "Device Verification Failed! Please use your registered device and browser." };
    }
    */

    // 7. Check if already marked (Moved AFTER device verification)
    const existingAttendance = await prisma.attendance.findFirst({
        where: {
            studentId: student.id,
            sessionId: sessionId,
        },
    });

    if (existingAttendance) {
        return { error: "Attendance already marked", success: true };
    }

    // 7. Mark Attendance
    await prisma.attendance.create({
        data: {
            studentId: student.id,
            sessionId: sessionId,
            userAgent: userAgent,
            ipAddress: ip,
        },
    });

    // Real-time update - REMOVED


    revalidatePath("/student");
    const name = dbSession.subject?.name || dbSession.event?.name || "Unknown Session";
    return { success: true, name };
}

export async function getSessionAttendance(sessionId: number) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "FACULTY")) {
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
                            username: true
                        }
                    }
                }
            }
        },
        orderBy: { timestamp: "desc" }
    });

    return { success: true, attendances };
}
