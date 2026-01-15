import { prisma } from "@/lib/prisma";
import AddStudentForm from "@/components/admin/AddStudentForm";
import DeviceResetButton from "@/components/admin/DeviceResetButton";
import { User, Smartphone } from "lucide-react";

import Search from "@/components/Search";

import PendingRequests from "@/components/admin/PendingRequests";

export default async function StudentManagementPage({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string;
    }>;
}) {
    const params = await searchParams;
    const query = params?.query || "";

    const students = await prisma.student.findMany({
        where: {
            OR: [
                { user: { name: { contains: query, mode: 'insensitive' } } },
                { rollNumber: { contains: query, mode: 'insensitive' } },
                { enrollmentNo: { contains: query, mode: 'insensitive' } }
            ]
        },
        include: {
            user: true,
        },
        orderBy: {
            rollNumber: 'asc'
        }
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold whitespace-nowrap">Student Management</h1>
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="w-full max-w-md">
                        <Search placeholder="Search students..." />
                    </div>
                    <AddStudentForm />
                </div>
            </div>

            <PendingRequests />

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-800 text-gray-400">
                        <tr>
                            <th className="p-4">Student</th>
                            <th className="p-4">IDs</th>
                            <th className="p-4">Device Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-800/50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                            <User className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{student.user.name}</div>
                                            <div className="text-xs text-gray-500">{student.user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm">
                                        <span className="text-gray-500">Roll:</span> {student.rollNumber}
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-gray-500">Enroll:</span> {student.enrollmentNo}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {student.deviceHash ? (
                                        <div className="flex items-center gap-2 text-green-400 text-sm">
                                            <Smartphone className="w-4 h-4" />
                                            Bound
                                            {student.isDeviceResetRequested && (
                                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full ml-2">
                                                    Reset Requested
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-sm">No Device</div>
                                    )}
                                </td>
                                <td className="p-4">
                                    <DeviceResetButton
                                        studentId={student.id}
                                        hasDevice={!!student.deviceHash}
                                        isRequested={student.isDeviceResetRequested}
                                    />
                                </td>
                            </tr>
                        ))}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No students found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
