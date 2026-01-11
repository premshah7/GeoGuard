import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSession } from "./actions";
import Link from "next/link";
import { BookOpen, Radio, Download, BarChart3 } from "lucide-react";
import AttendanceChart from "@/components/AttendanceChart";
import ReportGenerator from "@/components/ReportGenerator";

export default async function FacultyDashboard() {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const faculty = await prisma.faculty.findUnique({
        where: { userId: parseInt(session.user.id) },
        include: {
            subjects: {
                include: {
                    sessions: {
                        orderBy: { startTime: 'desc' },
                        take: 5, // Get recent sessions for analytics/list
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

    // Transform data for chart: Flat list of recent sessions across all subjects
    const allSessions = faculty.subjects.flatMap(sub =>
        sub.sessions.map(s => ({
            id: s.id,
            subjectName: sub.name,
            totalStudents: sub.totalStudents,
            date: s.startTime,
            present: s._count.attendances,
            isActive: s.isActive
        }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const recentSessions = allSessions.slice(0, 5); // Just top 5 overall

    // Chart Data (Older to Newer)
    const chartData = [...recentSessions].reverse().map(s => ({
        name: new Date(s.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        present: s.present,
        total: s.totalStudents
    }));

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold dark:text-white">Faculty Dashboard</h1>
                <p className="text-gray-500 text-sm">Overview of student attendance and performance</p>
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Attendance Trend (Left - Wider) */}
                <div className="lg:col-span-2 space-y-6">
                    {chartData.length > 0 ? (
                        <AttendanceChart data={chartData} />
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border dark:border-gray-700 text-center text-gray-500">
                            No attendance data available yet.
                        </div>
                    )}

                    {/* Quick Active Session Access (Minimal) */}
                    {faculty.subjects.some(s => s.sessions.some(sess => sess.isActive)) && (
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <div>
                                    <h3 className="font-semibold text-green-900 dark:text-green-100">Active Session in Progress</h3>
                                    <p className="text-xs text-green-700 dark:text-green-300">You have a class currently running.</p>
                                </div>
                            </div>
                            <Link href="/faculty/subjects" className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto text-center">
                                View Sessions
                            </Link>
                        </div>
                    )}
                </div>

                {/* 2. Low Attendance / Defaulters (Right - Narrower) */}
                <div className="lg:col-span-1">
                    <DefaultersList email={session.user.email!} />
                </div>
            </div>

            {/* 3. Start Class Session (Cards) */}
            <div>
                <h2 className="text-xl font-bold dark:text-white mb-4">Take Attendance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {faculty.subjects.map((subject) => {
                        const activeSession = subject.sessions.find(s => s.isActive);
                        return (
                            <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg dark:text-white leading-tight">{subject.name}</h3>
                                            <p className="text-xs text-gray-500">{subject.totalStudents} Students</p>
                                        </div>
                                    </div>

                                    {activeSession ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider">
                                            <Radio className="animate-pulse" size={12} />
                                            Session Active
                                        </div>
                                    ) : (
                                        <div className="h-6"></div> // Spacer
                                    )}
                                </div>

                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700">
                                    {activeSession ? (
                                        <Link
                                            href={`/faculty/session/${activeSession.id}`}
                                            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                                        >
                                            Return to Session
                                        </Link>
                                    ) : (
                                        <form action={createSession.bind(null, subject.id)}>
                                            <button type="submit" className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-blue-900/20 shadow-lg">
                                                <Radio size={16} />
                                                Start Session
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Separate component for Defaulters to keep main code clean
async function DefaultersList({ email }: { email: string }) {
    const { getFacultyDefaulters } = await import("@/actions/faculty");
    const defaulters = await getFacultyDefaulters(email);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 dark:text-red-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Attention Needed</h3>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                    {'<'}{75}% Attendance
                </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 overflow-y-auto max-h-[500px] flex-1">
                {defaulters.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        <p>No students below 75%.</p>
                        <p className="text-xs mt-1">Great job!</p>
                    </div>
                ) : (
                    defaulters.map((student, idx) => (
                        <div key={idx} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{student.studentName}</h4>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${student.percentage < 50 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {student.percentage}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{student.rollNumber}</span>
                                <span>{student.subjectName}</span>
                            </div>
                            <div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${student.percentage < 50 ? 'bg-red-500' : 'bg-yellow-500'}`}
                                    style={{ width: `${student.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
