import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/api/auth/signin");
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
            <DashboardSidebar user={session.user} role="ADMIN" />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 h-full">
                {children}
            </main>
        </div >
    );
}
