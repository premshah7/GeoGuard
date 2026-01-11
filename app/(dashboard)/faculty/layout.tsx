import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function FacultyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "FACULTY") {
        redirect("/signin");
    }

    const faculty = await prisma.faculty.findUnique({
        where: { userId: parseInt(session.user.id) }
    });

    if (!faculty) {
        return <div className="flex h-screen items-center justify-center">Faculty profile not found. Contact Admin.</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden font-sans">
            <DashboardSidebar user={session.user} role="FACULTY" />
            <main className="flex-1 overflow-y-auto relative h-full w-full">
                <div className="p-4 pt-16 md:p-8 pb-32 max-w-7xl mx-auto h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
