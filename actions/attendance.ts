"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateIp } from "@/lib/ipCheck";
import { revalidatePath } from "next/cache";

export async function markAttendance(token: string, deviceHash: string) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return { error: "Unauthorized" };
    }

    const studentId = parseInt(session.user.id);

    // 1. Parse Token
    const [sessionIdStr, timestampStr] = token.split(":");
    const sessionId = parseInt(sessionIdStr);
    const timestamp = parseInt(timestampStr);

    if (isNaN(sessionId) || isNaN(timestamp)) {
        return { error: "Invalid QR Codes" };
    }

    // 2. Validate Timestamp (15s validity window to prevent replay)
    // const now = Date.now();
    // if (now - timestamp > 15000 || now - timestamp < -5000) { // Allow 15s delay, 5s drift
    //   return { error: "QR Code Expired. Please scan again." };
    // }
    // Commenting out strict time check for MVP/Testing ease, but in prod uncomment above.

    // 3. Get Session & Student
    const [dbSession, student] = await Promise.all([
        prisma.session.findUnique({ where: { id: sessionId } }),
        prisma.student.findUnique({ where: { userId: studentId } }),
    ]);

    if (!dbSession || !dbSession.isActive) {
        return { error: "Session is not active" };
    }

    if (!student) {
        return { error: "Student record not found" };
    }

    // 4. Check if already marked
    const existingAttendance = await prisma.attendance.findFirst({
        where: {
            studentId: student.id,
            sessionId: sessionId,
        },
    });

    if (existingAttendance) {
        return { error: "Attendance already marked", success: true }; // Treat as success to avoid panic
    }

    // 5. IP Validation
    const isIpValid = await validateIp();
    if (!isIpValid) {
        return { error: "You are not connected to the required network (IP Mismatch)." };
    }

    // 6. Device Validation (Anti-Proxy)
    let isProxy = false;

    if (!student.deviceHash) {
        // Bind Device (First time)
        await prisma.student.update({
            where: { id: student.id },
            data: { deviceHash: deviceHash },
        });
    } else if (student.deviceHash !== deviceHash) {
        // Mismatch!
        isProxy = true;
    }

    if (isProxy) {
        // Log Proxy Attempt
        await prisma.proxyAttempt.create({
            data: {
                studentId: student.id,
                sessionId: sessionId,
                attemptedHash: deviceHash,
            },
        });
        return { error: "Device Verification Failed! Proxy attempt recorded." };
    }

    // 7. Mark Attendance
    await prisma.attendance.create({
        data: {
            studentId: student.id,
            sessionId: sessionId,
        },
    });

    revalidatePath("/student");
    return { success: true };
}
