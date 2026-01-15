"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSession(subjectId: number) {
    try {
        const session = await prisma.session.create({
            data: {
                subjectId,
                isActive: true,
            },
        });
        revalidatePath("/faculty");
        return { success: true, sessionId: session.id };
    } catch (error) {
        console.error("Error creating session:", error);
        return { error: "Failed to create session" };
    }
}

export async function endSession(sessionId: number) {
    try {
        await prisma.session.update({
            where: { id: sessionId },
            data: {
                isActive: false,
                endTime: new Date(),
            },
        });
        revalidatePath(`/faculty/session/${sessionId}`);
        revalidatePath("/faculty");
        return { success: true };
    } catch (error) {
        console.error("Error ending session:", error);
        return { error: "Failed to end session" };
    }
}

export async function getSessionStats(sessionId: number) {
    const [attendanceCount, proxyCount, recentAttendance, recentProxies] = await Promise.all([
        prisma.attendance.count({ where: { sessionId } }),
        prisma.proxyAttempt.count({ where: { sessionId } }),
        prisma.attendance.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'desc' },
            take: 50,
            include: {
                student: {
                    include: { user: true }
                }
            }
        }),
        prisma.proxyAttempt.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'desc' },
            take: 50,
            include: {
                student: {
                    include: { user: true }
                }
            }
        })
    ]);

    return {
        attendanceCount,
        proxyCount,
        recentAttendance,
        recentProxies
    };
}
