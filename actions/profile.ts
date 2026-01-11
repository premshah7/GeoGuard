"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name?: string; password?: string }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.password && data.password.trim() !== "") {
            // In a real app, hash this password!
            // Assuming the existing app stores plain text or handles hashing elsewhere based on previous files.
            // Checking schema or auth.ts... auth.ts uses direct comparison?
            // "if (credentials.password !== user.password)" -> implies PLAIN TEXT for now.
            // I will stick to existing pattern (Plain Text) to avoid breaking login for now, 
            // but strongly advise hashing later.
            updateData.password = data.password;
        }

        await prisma.user.update({
            where: { email: session.user.email },
            data: updateData
        });

        revalidatePath("/admin/settings");
        revalidatePath("/faculty/settings");
        revalidatePath("/student/settings");

        return { success: true };
    } catch (error) {
        console.error("Profile update error:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

// Admin only action to update ANY user
export async function adminUpdateUser(userId: number, data: { name?: string; password?: string; email?: string }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: data
        });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update user" };
    }
}
