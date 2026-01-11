import { prisma } from "@/lib/prisma";
import AdminRequestsList from "@/components/AdminRequestsList";

export const dynamic = 'force-dynamic'; // Force no-cache for this page so we always fetch fresh data

export default async function RequestsPage() {
    const requests = await prisma.student.findMany({
        where: { isDeviceResetRequested: true },
        include: { user: true }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white flex items-center justify-between">
                Device Reset Requests
                <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                    Auto-refreshing
                </span>
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                <AdminRequestsList requests={requests} />
            </div>
        </div>
    );
}
