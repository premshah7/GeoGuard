"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSessionAttendees(sessionId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "FACULTY") {
        return { error: "Unauthorized" };
    }

    try {
        const attendees = await prisma.attendance.findMany({
            where: { sessionId },
            include: {
                student: {
                    include: { user: true }
                }
            },
            orderBy: { timestamp: 'desc' }
        });

        // Fetch Proxy Attempts
        const proxies = await prisma.proxyAttempt.findMany({
            where: { sessionId },
            include: {
                student: {
                    include: { user: true }
                }
            },
            orderBy: { timestamp: 'desc' }
        });

        // Transform for cleaner client consumption
        const attendeeList = attendees.map(record => ({
            id: record.id,
            rollNumber: record.student.rollNumber,
            enrollmentNo: record.student.enrollmentNo || "N/A",
            name: record.student.user.name,
            timestamp: record.timestamp
        }));

        const proxyList = proxies.map(record => ({
            id: record.id,
            rollNumber: record.student.rollNumber,
            name: record.student.user.name,
            timestamp: record.timestamp,
            attemptedHash: record.attemptedHash
        }));

        return { success: true, attendees: attendeeList, proxies: proxyList };
    } catch (error) {
        console.error("Failed to fetch attendees", error);
        return { error: "Failed to fetch attendees" };
    }
}
