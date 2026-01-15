import { prisma } from "@/lib/prisma";
import { CheckCircle, AlertTriangle } from "lucide-react";

export default async function AttendanceLogsPage() {
    const [attendanceLogs, proxyLogs] = await Promise.all([
        prisma.attendance.findMany({
            take: 50,
            orderBy: { timestamp: "desc" },
            include: {
                student: { include: { user: true } },
                session: { include: { subject: true } },
            },
        }),
        prisma.proxyAttempt.findMany({
            take: 50,
            orderBy: { timestamp: "desc" },
            include: {
                student: { include: { user: true } },
                session: { include: { subject: true } },
            },
        }),
    ]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-6">Security & Attendance Logs</h1>
            </div>

            {/* Proxy Attempts Section */}
            <div className="bg-gray-900 rounded-xl border border-red-900/30 overflow-hidden">
                <div className="p-4 bg-red-900/10 border-b border-red-900/30 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-semibold text-red-200">Recent Proxy Attempts</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/50 text-gray-400">
                            <tr>
                                <th className="p-4">Student</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {proxyLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-800/30">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{log.student.user.name}</div>
                                        <div className="text-xs text-gray-500">{log.student.rollNumber}</div>
                                    </td>
                                    <td className="p-4 text-gray-300">{log.session.subject.name}</td>
                                    <td className="p-4 text-gray-400">{log.timestamp.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-red-400">Device Hash Mismatch</td>
                                </tr>
                            ))}
                            {proxyLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No suspicious activity recorded.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Attendance Logs Section */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 bg-gray-800/50 border-b border-gray-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h2 className="text-lg font-semibold text-white">Recent Attendance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800 text-gray-400">
                            <tr>
                                <th className="p-4">Student</th>
                                <th className="p-4">Subject</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {attendanceLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-800/50">
                                    <td className="p-4">
                                        <div className="font-medium text-white">{log.student.user.name}</div>
                                        <div className="text-xs text-gray-500">{log.student.rollNumber}</div>
                                    </td>
                                    <td className="p-4 text-gray-300">{log.session.subject.name}</td>
                                    <td className="p-4 text-gray-400">{log.timestamp.toLocaleString()}</td>
                                    <td className="p-4 text-sm text-green-400">Verified</td>
                                </tr>
                            ))}
                            {attendanceLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No attendance records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
