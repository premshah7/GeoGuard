"use server";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@/types";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createFaculty(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const batchIdsRaw = formData.get("batchIds") as string;
    const batchIds: number[] = batchIdsRaw ? JSON.parse(batchIdsRaw) : [];

    if (!name || !email || !password) {
        return { error: "All fields are required" };
    }

    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
        return { error: "Unauthorized Access" };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: UserRole.FACULTY,
                    status: "APPROVED",
                },
            });

            await tx.faculty.create({
                data: {
                    userId: user.id,
                    batches: {
                        connect: batchIds.map((id) => ({ id })),
                    },
                },
            });
        });

        revalidatePath("/admin/faculty");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating faculty:", error);
        if (error.code === "P2002") {
            return { error: "Email already exists" };
        }
        return { error: "Failed to create faculty" };
    }
}


export async function updateFaculty(facultyId: number, formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const batchIdsRaw = formData.get("batchIds") as string;
    const batchIds: number[] = batchIdsRaw ? JSON.parse(batchIdsRaw) : [];

    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
        return { error: "Unauthorized Access" };
    }

    try {
        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId },
            include: { user: true }
        });

        if (!faculty) return { error: "Faculty not found" };

        if (email !== faculty.user.email) {
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) return { error: "Email already in use" };
        }

        const userData: any = {
            name,
            email
        };

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(password, salt);
        }

        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: faculty.userId },
                data: userData
            });

            await tx.faculty.update({
                where: { id: facultyId },
                data: {
                    batches: {
                        set: batchIds.map(id => ({ id }))
                    }
                }
            });
        });

        revalidatePath("/admin/faculty");
        return { success: true };

    } catch (error) {
        console.error("Error updating faculty:", error);
        return { error: "Failed to update faculty" };
    }
}

export async function createStudent(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const rollNumber = formData.get("rollNumber") as string;
    const enrollmentNo = formData.get("enrollmentNo") as string;
    const batchId = formData.get("batchId") as string;
    const semester = formData.get("semester") as string;

    if (!name || !email || !password || !rollNumber || !enrollmentNo) {
        return { error: "All fields are required" };
    }

    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") {
        return { error: "Unauthorized Access" };
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: UserRole.STUDENT,
                    status: "APPROVED",
                },
            });

            await tx.student.create({
                data: {
                    userId: user.id,
                    rollNumber,
                    enrollmentNo,
                    batchId: batchId ? parseInt(batchId) : null,
                    semester: semester ? parseInt(semester) : 1,
                },
            });
        });

        revalidatePath("/admin/students");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating student:", error);
        if (error.code === "P2002") {
            return { error: "Email, Roll Number, or Enrollment No already exists" };
        }
        return { error: "Failed to create student" };
    }
}

export async function resetDevice(studentId: number) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user.role !== "ADMIN") {
            return { error: "Unauthorized Access" };
        }
        await prisma.student.update({
            where: { id: studentId },
            data: {
                deviceHash: null,
                deviceId: null,
                isDeviceResetRequested: false,
            },
        });
        revalidatePath("/admin/students");
        revalidatePath("/student");
        return { success: true };
    } catch (error) {
        console.error("Error resetting device:", error);
        return { error: "Failed to reset device" };
    }
}



export async function getGlobalAnalytics() {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch all finished sessions in last 30 days
    const sessions = await prisma.session.findMany({
        where: {
            startTime: { gte: thirtyDaysAgo },
            isActive: false
        },
        include: {
            _count: {
                select: { attendances: true }
            },
            subject: {
                select: { totalStudents: true }
            }
        },
        orderBy: { startTime: 'asc' }
    });

    // Group by date and calculate average attendance
    const dailyStats = new Map<string, { total: number; present: number }>();

    sessions.forEach(session => {
        const date = session.startTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!dailyStats.has(date)) {
            dailyStats.set(date, { total: 0, present: 0 });
        }
        const stat = dailyStats.get(date)!;
        stat.total += session.subject.totalStudents;
        stat.present += session._count.attendances;
    });

    const trend = Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
    }));

    return trend;
}

export async function getSecurityOverview() {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") return [];

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // 1. Daily Verified Count
    const attendances = await prisma.attendance.findMany({
        where: { timestamp: { gte: fourteenDaysAgo } },
        select: { timestamp: true }
    });

    const proxies = await prisma.proxyAttempt.findMany({
        where: { timestamp: { gte: fourteenDaysAgo } },
        select: { timestamp: true }
    });

    const dailyMap = new Map<string, { verified: number; suspicious: number }>();

    // Helper to init map entry
    const getDailyStatEntry = (date: string) => {
        if (!dailyMap.has(date)) dailyMap.set(date, { verified: 0, suspicious: 0 });
        return dailyMap.get(date)!;
    };

    attendances.forEach(attendance => {
        const date = attendance.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        getDailyStatEntry(date).verified++;
    });

    proxies.forEach(proxyAttempt => {
        const date = proxyAttempt.timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        getDailyStatEntry(date).suspicious++;
    });

    // Fill last 14 days
    const result = [];
    for (let i = 13; i >= 0; i--) {
        const dateObject = new Date();
        dateObject.setDate(dateObject.getDate() - i);
        const dateStr = dateObject.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const stats = dailyMap.get(dateStr) || { verified: 0, suspicious: 0 };
        result.push({ date: dateStr, ...stats });
    }

    return result;
}

export async function getActiveSessions() {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") return [];

    return await prisma.session.findMany({
        where: { isActive: true },
        include: {
            subject: {
                include: {
                    faculty: {
                        include: { user: true }
                    }
                }
            },
            _count: {
                select: { attendances: true, proxyAttempts: true }
            }
        },
    });
}

export async function approveStudent(userId: number) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user.role !== "ADMIN") {
            return { error: "Unauthorized Access" };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { status: "APPROVED" }
        });

        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Error approving student:", error);
        return { error: "Failed to approve student" };
    }
}

export async function rejectStudent(userId: number) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user.role !== "ADMIN") {
            return { error: "Unauthorized Access" };
        }

        // Update status to REJECTED
        await prisma.user.update({
            where: { id: userId },
            data: { status: "REJECTED" }
        });

        revalidatePath("/admin/students");
        return { success: true };
    } catch (error) {
        console.error("Error rejecting student:", error);
        return { error: "Failed to reject student" };
    }
}

export async function removeStudentFromBatch(studentId: number, batchId: number) {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user.role !== "ADMIN") {
            return { error: "Unauthorized Access" };
        }

        await prisma.student.update({
            where: { id: studentId },
            data: { batchId: null }
        });

        revalidatePath(`/admin/batches/${batchId}`);
        return { success: true };
    } catch (error) {
        console.error("Error removing student from batch:", error);
        return { error: "Failed to remove student from batch" };
    }
}

export async function getFacultyBatches(facultyId: number) {
    const session = await getServerSession(authOptions);
    if (session?.user.role !== "ADMIN") return { error: "Unauthorized" };

    try {
        const faculty = await prisma.faculty.findUnique({
            where: { id: facultyId },
            include: {
                batches: {
                    select: { id: true, name: true }
                }
            }
        });

        if (!faculty) {
            return { error: "Faculty not found" };
        }

        return { batches: faculty.batches };
    } catch (error) {
        console.error("Error fetching faculty batches:", error);
        return { error: "Failed to fetch batches" };
    }
}