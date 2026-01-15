"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSystemSettings(formData: FormData) {
    const allowedIpPrefix = formData.get("allowedIpPrefix") as string;
    const isIpCheckEnabled = formData.get("isIpCheckEnabled") === "on";

    try {
        // Upsert ensuring we only have one settings record (id: 1)
        await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: {
                allowedIpPrefix,
                isIpCheckEnabled,
            },
            create: {
                allowedIpPrefix,
                isIpCheckEnabled,
            },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Error updating settings:", error);
        return { error: "Failed to update settings" };
    }
}

export async function getSystemSettings() {
    const settings = await prisma.systemSettings.findFirst();
    return settings || { allowedIpPrefix: "", isIpCheckEnabled: false };
}
