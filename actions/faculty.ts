"use server";

import { prisma } from "@/lib/prisma";

export type Defaulter = {
    studentName: string;
    rollNumber: string;
    subjectName: string;
    percentage: number;
    sessionsAttended: number;
    totalSessions: number;
};

export async function getFacultyDefaulters(email: string): Promise<Defaulter[]> {
    if (!email) return [];

    const faculty = await prisma.faculty.findFirst({
        where: { user: { email } },
        include: {
            subjects: {
                include: {
                    sessions: {
                        where: { isActive: false }
                    }
                }
            }
        }
    });

    if (!faculty) return [];

    const allStudents = await prisma.student.findMany({
        include: { user: true, attendances: true }
    });

    const defaulters: Defaulter[] = [];

    for (const subject of faculty.subjects) {
        const totalSessions = subject.sessions.length;
        if (totalSessions === 0) continue;

        for (const student of allStudents) {
            const attendedCount = student.attendances.filter(a =>
                subject.sessions.some(s => s.id === a.sessionId)
            ).length;

            const percentage = (attendedCount / totalSessions) * 100;

            if (percentage < 75) {
                defaulters.push({
                    studentName: student.user.name,
                    rollNumber: student.rollNumber,
                    subjectName: subject.name,
                    percentage: parseFloat(percentage.toFixed(1)),
                    sessionsAttended: attendedCount,
                    totalSessions: totalSessions
                });
            }
        }
    }

    return defaulters;
}

export async function getFacultySubjects(email: string) {
    if (!email) return [];

    const faculty = await prisma.faculty.findFirst({
        where: { user: { email } },
        include: {
            subjects: {
                include: {
                    sessions: {
                        where: { isActive: true }
                    },
                    _count: {
                        select: { sessions: true }
                    }
                }
            }
        }
    });

    if (!faculty) return [];

    return faculty.subjects.map(sub => ({
        id: sub.id,
        name: sub.name,
        totalStudents: sub.totalStudents,
        totalSessions: sub._count.sessions,
        activeSessions: sub.sessions.length
    }));
}
