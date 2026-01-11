"use client";

import Link from "next/link";
import { LayoutDashboard, Home, Scan, Settings, LogOut, QrCode } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

export default function StudentBottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push("/signin");
    };

    const isActive = (path: string) => pathname === path;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 pb-2 z-50">
            <div className="flex justify-around items-center h-16">
                <Link
                    href="/student"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive("/student") ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                        }`}
                >
                    <LayoutDashboard size={24} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>

                <Link
                    href="/student/scan"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive("/student/scan") ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                        }`}
                >
                    <div className="bg-blue-600 text-white p-3 rounded-full -mt-6 shadow-lg border-4 border-gray-100 dark:border-gray-900">
                        <QrCode size={24} />
                    </div>
                    <span className="text-[10px] font-medium">Scan</span>
                </Link>

                <button
                    onClick={handleSignOut}
                    className="flex flex-col items-center justify-center w-full h-full text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut size={20} className="mb-1" />
                    <span className="text-[10px] font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
