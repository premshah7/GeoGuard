import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Download, Calendar, Clock } from "lucide-react";
import ReportGenerator from "@/components/ReportGenerator";

export default async function FacultyHistory() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const faculty = await prisma.faculty.findUnique({
        where: { userId: parseInt(session.user.id) },
        include: {
            subjects: {
                include: {
                    sessions: {
                        orderBy: { startTime: 'desc' },
                        include: {
                            _count: {
                                select: { attendances: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!faculty) return <div>Faculty profile not found.</div>;

    // Flatten all sessions
    const allSessions = faculty.subjects.flatMap(sub =>
        sub.sessions.map(s => ({
            id: s.id,
            subjectName: sub.name,
            totalStudents: sub.totalStudents,
            date: s.startTime,
            endTime: s.endTime,
            present: s._count.attendances,
            isActive: s.isActive
        }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold dark:text-white">Session History</h1>

            {/* Global Report Generator */}
            <ReportGenerator subjects={faculty.subjects} />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold dark:text-white">All Past Sessions</h2>
                    <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        Total: {allSessions.length}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3 font-medium">Subject</th>
                                <th className="px-6 py-3 font-medium">Date & Time</th>
                                <th className="px-6 py-3 font-medium">Attendance</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {allSessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {session.subjectName}
                                        {session.isActive && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <div className="flex flex-col">
                                            <span className="flex items-center gap-1">
                                                <Calendar size={14} />
                                                {new Date(session.date).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs mt-1">
                                                <Clock size={14} />
                                                {new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full max-w-[140px]">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-semibold text-gray-700 dark:text-gray-200">{session.present} / {session.totalStudents}</span>
                                                <span className="text-gray-500">{Math.round((session.present / session.totalStudents) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                                <div
                                                    className="bg-blue-600 h-1.5 rounded-full"
                                                    style={{ width: `${Math.min((session.present / session.totalStudents) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <a
                                                href={`/api/export/session/${session.id}`}
                                                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium"
                                            >
                                                <Download size={14} />
                                                CSV
                                            </a>
                                            <Link
                                                href={`/faculty/session/${session.id}`}
                                                className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs font-medium"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {allSessions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No session history found.
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
