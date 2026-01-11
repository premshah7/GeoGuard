import { prisma } from "@/lib/prisma";
import { approveDeviceReset, rejectDeviceReset } from "@/actions/requests";
import { Check, X } from "lucide-react";

export default async function RequestsPage() {
    const requests = await prisma.student.findMany({
        where: { isDeviceResetRequested: true },
        include: { user: true }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Device Reset Requests</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                {requests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No pending requests.
                    </div>
                ) : (
                    <div className="divide-y dark:divide-gray-700">
                        {requests.map((student) => (
                            <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{student.user.name}</p>
                                    <p className="text-sm text-gray-500">{student.user.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">Roll: {student.rollNumber}</p>
                                </div>

                                <div className="flex gap-2">
                                    <form action={async () => {
                                        "use server";
                                        await approveDeviceReset(student.id);
                                    }}>
                                        <button className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                            <Check size={16} /> Approve
                                        </button>
                                    </form>

                                    <form action={async () => {
                                        "use server";
                                        await rejectDeviceReset(student.id);
                                    }}>
                                        <button className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                            <X size={16} /> Reject
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
