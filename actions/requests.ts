"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requestDeviceReset() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "STUDENT") {
        return { error: "Unauthorized" };
    }

    const student = await prisma.student.findUnique({
        where: { userId: parseInt(session.user.id) }
    });

    if (!student) return { error: "Student profile not found" };

    await prisma.student.update({
        where: { id: student.id },
        data: { isDeviceResetRequested: true }
    });

    revalidatePath("/student");
    return { success: true, message: "Request sent to Admin." };
}

export async function approveDeviceReset(studentId: number) {
    console.log("Attempting to approve reset for student:", studentId);
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "ADMIN") {
            console.error("Unauthorized approval attempt");
            return { error: "Unauthorized" };
        }

        await prisma.student.update({
            where: { id: studentId },
            data: {
                deviceHash: null,
                isDeviceResetRequested: false
            }
        });

        console.log("Reset approved successfully");
        revalidatePath("/admin/requests");
        return { success: true };
    } catch (error) {
        console.error("Approve Device Reset Error:", error);
        return { error: "Failed to approve reset" };
    }
}

export async function rejectDeviceReset(studentId: number) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return { error: "Unauthorized" };

    await prisma.student.update({
        where: { id: studentId },
        data: {
            isDeviceResetRequested: false
        }
    });

    revalidatePath("/admin/requests");
    return { success: true };
}
