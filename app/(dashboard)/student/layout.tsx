import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, WifiOff } from "lucide-react";

import StudentBottomNav from "@/components/StudentBottomNav";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        redirect("/api/auth/signin");
    }

    // Network Security Check
    const settings = await prisma.systemSettings.findFirst();
    if (settings?.isIpCheckEnabled && settings.allowedIpPrefix) {
        const headersList = await headers();
        const forwarded = headersList.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(',')[0].trim() : "Unknown";

        // Bypass for localhost in development
        const isLocal = ip === "::1" || ip === "127.0.0.1";

        if (!ip.startsWith(settings.allowedIpPrefix) && !isLocal) {
            return (
                <div className="flex flex-col h-screen items-center justify-center bg-gray-900 text-white p-6 text-center">
                    <div className="bg-red-500/10 p-6 rounded-full border border-red-500/50 mb-6 animate-pulse">
                        <WifiOff size={64} className="text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Network Restricted</h1>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                        Access to the GeoGuard Dashboard is restricted to the University Wi-Fi (Sophos) network only.
                    </p>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 max-w-sm w-full">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Your IP Address</p>
                        <p className="font-mono text-xl font-bold text-blue-400 tracking-wider">{ip}</p>
                    </div>
                </div>
            );
        }
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar - Desktop Only */}
            <DashboardSidebar user={session.user} role="STUDENT" />

            {/* Main Content */}
            < main className="flex-1 overflow-y-auto h-full w-full relative" >
                <div className="p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main >

            {/* Bottom Nav - Mobile Only */}
            < StudentBottomNav />
        </div >
    );
}
