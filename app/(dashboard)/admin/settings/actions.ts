"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSystemSettings() {
    let settings = await prisma.systemSettings.findFirst();
    if (!settings) {
        settings = await prisma.systemSettings.create({
            data: { allowedIpPrefix: "", isIpCheckEnabled: false }
        });
    }
    return settings;
}

export async function updateSystemSettings(allowedIpPrefix: string, isIpCheckEnabled: boolean) {
    const settings = await getSystemSettings();
    await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { allowedIpPrefix, isIpCheckEnabled }
    });
    revalidatePath("/admin/settings");
    return { success: true };
}
