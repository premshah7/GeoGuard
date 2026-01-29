"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createSession(subjectId: number, batchIds?: number[]) {
    try {
        const userSession = await getServerSession(authOptions);
        if (userSession?.user.role !== "FACULTY") {
            return { error: "Unauthorized Access" };
        }
        const session = await prisma.session.create({
            data: {
                subjectId,
                isActive: true,
                batches: batchIds && batchIds.length > 0 ? {
                    connect: batchIds.map(id => ({ id }))
                } : undefined,
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
        const userSession = await getServerSession(authOptions);
        if (userSession?.user.role !== "FACULTY") {
            return { error: "Unauthorized Access" };
        }
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
    // Use sequential execution to prevent DB connection exhaustion
    const attendanceCount = await prisma.attendance.count({ where: { sessionId } });
    const proxyCount = await prisma.proxyAttempt.count({ where: { sessionId } });

    const recentAttendance = await prisma.attendance.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
            student: {
                include: { user: true }
            }
        }
    });

    const recentProxies = await prisma.proxyAttempt.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
            student: {
                include: { user: true }
            },
            deviceOwner: {
                include: { user: true }
            }
        }
    });

    return {
        attendanceCount,
        proxyCount,
        recentAttendance,
        recentProxies
    };
}

export async function getSessionAttendance(sessionId: number) {
    try {
        // 1. Fetch Session with Subject and Enrolled Students
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                subject: {
                    include: {
                        students: {
                            include: { user: true }
                        }
                    }
                },
                batches: true
            }
        });

        if (!session) {
            return { error: "Session not found" };
        }

        // 2. Fetch Present Students (Attendance Records)
        const attendance = await prisma.attendance.findMany({
            where: { sessionId },
            orderBy: { timestamp: 'asc' },
            include: {
                student: {
                    include: { user: true }
                }
            }
        });

        // 3. Calculate Absent Students
        // Get IDs of students who are present
        const presentStudentIds = new Set(attendance.map(a => a.studentId));
        const targetBatchIds = new Set(session.batches.map(b => b.id));

        // Filter enrolled students who are NOT in the present set AND match batch criteria
        const absentStudents = session.subject.students.filter(
            student => {
                const isPresent = presentStudentIds.has(student.id);
                if (isPresent) return false; // Already present, not absent

                // Check Batch Eligibility
                if (targetBatchIds.size === 0) return true; // No restriction
                return student.batchId && targetBatchIds.has(student.batchId);
            }
        ).map(student => ({
            rollNumber: student.rollNumber,
            name: student.user.name,
            email: student.user.email
        }));

        return {
            success: true,
            present: attendance,
            absent: absentStudents,
            subjectName: session.subject.name,
            date: session.startTime
        };
    } catch (error) {
        console.error("Error fetching session attendance:", error);
        return { error: "Failed to fetch attendance records" };
    }
}
