import Link from "next/link";
import { BookOpen, ShieldAlert, History } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import MobileSidebar from "@/components/MobileSidebar";

export default function FacultyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const SidebarContent = () => (
        <>
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">GeoGuard</span>
            </div>

            <nav className="flex-1 space-y-2">
                <Link
                    href="/faculty"
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors hover:text-white"
                >
                    <BookOpen className="w-5 h-5" />
                    My Subjects
                </Link>
                {/* Placeholder for future links like History */}
                <div className="px-4 py-3 text-gray-600 cursor-not-allowed flex items-center gap-3">
                    <History className="w-5 h-5" />
                    History (Soon)
                </div>
            </nav>

            <LogoutButton />
        </>
    );

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 hidden md:flex flex-col h-screen sticky top-0">
                <SidebarContent />
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
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
