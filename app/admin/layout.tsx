import Link from "next/link";
import { LayoutDashboard, Users, GraduationCap, Settings, ShieldAlert } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import MobileSidebar from "@/components/MobileSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const SidebarContent = () => (
        <>
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">GeoGuard</span>
            </div>

            <nav className="flex-1 space-y-2">
                <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:text-white"
                >
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                </Link>
                <Link
                    href="/admin/faculty"
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:text-white"
                >
                    <Users className="w-5 h-5" />
                    Faculty
                </Link>
                <Link
                    href="/admin/students"
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:text-white"
                >
                    <GraduationCap className="w-5 h-5" />
                    Students
                </Link>
                <Link
                    href="/admin/attendance"
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:text-white"
                >
                    <ShieldAlert className="w-5 h-5" />
                    Logs
                </Link>
                <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:text-white"
                >
                    <Settings className="w-5 h-5" />
                    Settings
                </Link>
            </nav>

            <LogoutButton />
        </>
    );

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 hidden md:flex flex-col h-screen sticky top-0">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">GeoGuard</span>
                </div>
                <MobileSidebar>
                    <div className="pt-6 h-full flex flex-col">
                        <SidebarContent />
                    </div>
                </MobileSidebar>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 text-white overflow-y-auto w-full">
                {children}
            </main>
        </div>
    );
}
