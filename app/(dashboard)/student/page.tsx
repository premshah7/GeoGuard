import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DeviceRegistration from "@/components/DeviceRegistration";
import Link from "next/link";
import { QrCode } from "lucide-react";

export default async function StudentDashboard() {
    const session = await getServerSession(authOptions);

    // We know session exists and is student from layout check, but safe access:
    if (!session) return null;

    const student = await prisma.student.findUnique({
        where: { userId: parseInt(session.user.id) },
        include: { user: true }
    });

    if (!student) return <div>Student profile not found.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Student Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Profile Information</h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.user.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Roll Number</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.rollNumber}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Enrollment No</p>
                            <p className="font-medium text-gray-900 dark:text-white">{student.enrollmentNo}</p>
                        </div>
                    </div>
                </div>

                <DeviceRegistration
                    existingHash={student.deviceHash}
                    isResetRequested={student.isDeviceResetRequested}
                />
            </div>

            {/* Quick Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Only show Scan button if device is registered (we can check student.deviceHash)
                     Actually, even if registered, we rely on client fingerprint matching.
                     We can just show the button and let the Scan page handle errors.
                  */}
                {student.deviceHash && (
                    <Link href="/student/scan" className="hover:scale-[1.02] transition-transform">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white flex flex-col items-center justify-center gap-4 min-h-[160px] cursor-pointer">
                            <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                                <QrCode size={40} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold">Mark Attendance</h3>
                                <p className="text-blue-100 text-sm">Scan QR Code</p>
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            {/* Attendance History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Recent Attendance</h2>

                {/* We need to fetch attendance logic here. 
                    Ideally valid to fetch at top level. 
                */}
                <AttendanceList studentId={student.id} />
            </div>
        </div>
    );
}

async function AttendanceList({ studentId }: { studentId: number }) {
    const history = await prisma.attendance.findMany({
        where: { studentId },
        include: {
            session: {
                include: { subject: true }
            }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
    });

    if (history.length === 0) {
        return <p className="text-gray-500 text-sm">No attendance records found.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                        <th className="px-6 py-3">Subject</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Time</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {history.map((record) => (
                        <tr key={record.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                {record.session.subject.name}
                            </td>
                            <td className="px-6 py-4 text-gray-500">
                                {new Date(record.timestamp).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-gray-500 font-mono">
                                {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                                    Present
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
