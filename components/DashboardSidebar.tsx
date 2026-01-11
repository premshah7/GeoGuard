"use client";

import { useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    CalendarCheck,
    BookOpen,
    LogOut,
    ShieldCheck,
    User,
    Users,
    HelpCircle,
    ShieldAlert,
    Settings,
    WifiOff,
    Menu,
    X
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
        role?: string | null; // Pass role explicitly or derive? Better pass explicitly if possible, or just generic user.
    };
    role: "ADMIN" | "FACULTY" | "STUDENT";
}

export default function DashboardSidebar({ user, role }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        router.push("/signin");
    };

    let menuItems = [];
    let portalLabel = "";

    switch (role) {
        case "ADMIN":
            portalLabel = "Admin Portal";
            menuItems = [
                { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
                { href: "/admin/students", label: "Students", icon: Users },
                { href: "/admin/faculty", label: "Faculty", icon: Users },
                { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
                { href: "/admin/requests", label: "Requests", icon: HelpCircle },
                { href: "/admin/proxies", label: "Security Incidents", icon: ShieldAlert },
                { href: "/admin/settings", label: "Settings", icon: Settings },
            ];
            break;
        case "FACULTY":
            portalLabel = "Faculty Portal";
            menuItems = [
                { href: "/faculty", label: "Dashboard", icon: LayoutDashboard },
                { href: "/faculty/history", label: "Attendance", icon: CalendarCheck },
                { href: "/faculty/subjects", label: "My Subjects", icon: BookOpen },
                { href: "/faculty/settings", label: "Settings", icon: Settings },
            ];
            break;
        case "STUDENT":
            portalLabel = "Student Portal";
            menuItems = [
                { href: "/student", label: "Dashboard", icon: LayoutDashboard },
                { href: "/student/settings", label: "Settings", icon: Settings },
            ];
            break;
    }

    const toggleSidebar = () => setIsOpen(!isOpen);

    const SidebarContent = () => (
        <>
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-slate-900 to-slate-900 pointer-events-none" />

            {/* Header */}
            <div className="p-8 pb-4 relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-900/40">
                        <ShieldCheck size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">GeoGuard</h1>
                        <p className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold opacity-80">{portalLabel}</p>
                    </div>
                </div>
                {/* Mobile Close Button */}
                <button
                    onClick={toggleSidebar}
                    className="md:hidden p-2 text-slate-400 hover:text-white"
                >
                    <X size={24} />
                </button>
            </div>

            {/* User Profile (moved to top) */}
            <div className="p-4 relative z-10">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group backdrop-blur-sm">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
                        <User size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-slate-200 group-hover:text-white transition-colors">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">{user.email}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 relative z-10 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)} // Close on navigation
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive
                                ? "bg-blue-600/90 text-white shadow-lg shadow-blue-900/30"
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                }`}
                        >
                            {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-transparent pointer-events-none" />}
                            <Icon size={20} className={isActive ? "text-blue-50" : "text-slate-500 group-hover:text-blue-400 transition-colors"} />
                            <span className="font-medium text-sm tracking-wide">{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse"></div>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <div className="md:hidden fixed top-4 left-4 z-40 bg-slate-900 p-2 rounded-xl shadow-lg border border-slate-800">
                <button onClick={toggleSidebar}>
                    <Menu className="text-white" />
                </button>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`
                    fixed md:relative top-0 left-0 h-full md:h-[calc(100vh-2rem)] w-72 
                    bg-slate-900 text-white shadow-2xl overflow-hidden
                    md:m-4 md:rounded-3xl border-r md:border border-white/10
                    transform transition-transform duration-300 ease-in-out z-50
                    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                `}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
