
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { verifyQrToken } from "@/lib/crypto";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "STUDENT") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { qrToken, deviceHash } = body;

        if (!qrToken || !deviceHash) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 0. Network Security Check
        const settings = await prisma.systemSettings.findFirst();
        if (settings?.isIpCheckEnabled && settings.allowedIpPrefix) {
            const forwarded = request.headers.get("x-forwarded-for");
            const ip = forwarded ? forwarded.split(',')[0].trim() : "Unknown";

            // Bypass for localhost in development
            const isLocal = ip === "::1" || ip === "127.0.0.1";

            if (!ip.startsWith(settings.allowedIpPrefix) && !isLocal) {
                return NextResponse.json({
                    error: `Network Restricted. Please connect to the College Wi-Fi.`
                }, { status: 403 });
            }
        }

        // 1. Get Student Profile
        const student = await prisma.student.findUnique({
            where: { userId: parseInt(session.user.id) }
        });

        if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

        // 2. Verify QR Token
        const verification = verifyQrToken(qrToken);
        if (!verification.valid || !verification.sessionId) {
            return NextResponse.json({ error: verification.error || "Invalid Token" }, { status: 400 });
        }
        const sessionId = verification.sessionId;

        // 3. Device Fingerprint Check (Proxy Detection)
        if (student.deviceHash !== deviceHash) {
            console.warn(`Proxy Attempt Detected: Student ${student.id} used hash ${deviceHash} instead of ${student.deviceHash}`);

            // Log Proxy Attempt
            await prisma.proxyAttempt.create({
                data: {
                    studentId: student.id,
                    sessionId: sessionId,
                    attemptedHash: deviceHash,
                }
            });

            return NextResponse.json({ error: "Device Mismatch. Proxy attempt logged." }, { status: 403 });
        }

        // 4. Check Session Validity
        const activeSession = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { subject: true }
        });

        if (!activeSession) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (!activeSession.isActive) {
            return NextResponse.json({ error: "Session has ended" }, { status: 400 });
        }

        // 5. Check Duplicate Attendance
        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                studentId: student.id,
                sessionId: sessionId
            }
        });

        if (existingAttendance) {
            return NextResponse.json({
                success: true,
                message: "Attendance already marked",
                subject: activeSession.subject.name
            });
        }

        // 6. Mark Attendance
        await prisma.attendance.create({
            data: {
                studentId: student.id,
                sessionId: sessionId,
            }
        });

        return NextResponse.json({
            success: true,
            message: "Attendance Marked Successfully",
            subject: activeSession.subject.name
        });

    } catch (error) {
        console.error("Attendance Mark Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
