"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function registerDevice(fingerprint: string) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        return { error: "Unauthorized" };
    }

    try {
        const student = await prisma.student.findUnique({
            where: { userId: parseInt(session.user.id) },
        });

        if (!student) {
            return { error: "Student profile not found" };
        }

        if (student.deviceHash) {
            if (student.deviceHash === fingerprint) {
                return { success: true, message: "Device already registered" };
            }
            return { error: "Device mismatch. You can only use one registered device." };
        }

        // Register the device
        await prisma.student.update({
            where: { id: student.id },
            data: { deviceHash: fingerprint },
        });

        return { success: true, message: "Device registered successfully" };
    } catch (error) {
        console.error("Device Registration Error:", error);
        return { error: "Failed to register device" };
    }
}
