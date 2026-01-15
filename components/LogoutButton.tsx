"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
    className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className={`flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full ${className || ""}`}
        >
            <LogOut className="w-5 h-5" />
            Sign Out
        </button>
    );
}
