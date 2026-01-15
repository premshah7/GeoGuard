import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function validateIp() {
    const settings = await prisma.systemSettings.findFirst();

    if (!settings || !settings.isIpCheckEnabled) {
        return true; // IP check disabled
    }

    const headerList = await headers();
    // Get IP from common forward headers or fallback
    const ip = headerList.get("x-forwarded-for")?.split(",")[0] ||
        headerList.get("x-real-ip") ||
        "unknown";

    if (ip === "unknown") return false;

    // Simple prefix check
    // In production, use a CIDR library
    return ip.startsWith(settings.allowedIpPrefix);
}
