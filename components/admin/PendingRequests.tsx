import { prisma } from "@/lib/prisma";
import { Smartphone, RefreshCw, Loader2 } from "lucide-react";
import DeviceResetButton from "@/components/admin/DeviceResetButton";

export default async function PendingRequests() {
    // Fetch students with pending device reset requests
    const pendingRequests = await prisma.student.findMany({
        where: {
            isDeviceResetRequested: true,
        },
        include: {
            user: true,
        },
    });

    if (pendingRequests.length === 0) {
        return null;
    }

    return (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Smartphone className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-yellow-400">Pending Device Reset Requests</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRequests.map(student => (
                    <div key={student.id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <div className="font-bold">{student.user.name}</div>
                            <div className="text-xs text-gray-500">{student.rollNumber}</div>
                        </div>
                        <DeviceResetButton
                            studentId={student.id}
                            hasDevice={!!student.deviceHash}
                            isRequested={true}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
