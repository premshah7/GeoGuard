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

    try {
        await prisma.student.update({
            where: { userId: Number(session.user.id) },
            data: {
                isDeviceResetRequested: true,
            },
        });

        revalidatePath("/student");
        return { success: true };
    } catch (error) {
        console.error("Error requesting device reset:", error);
        return { error: "Failed to request device reset" };
    }
}

export async function getStudentStatus() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return null;
    }

    try {
        const student = await prisma.student.findUnique({
            where: { userId: Number(session.user.id) },
            select: {
                deviceHash: true,
                isDeviceResetRequested: true,
            },
        });

        return student;
    } catch (error) {
        console.error("Error fetching student status:", error);
        return null;
    }
}
