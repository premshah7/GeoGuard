import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getFacultySubjects } from "@/actions/faculty";
import Link from "next/link";
import { BookOpen, Users, Clock, Calendar } from "lucide-react";

export default async function FacultySubjectsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "FACULTY") {
        redirect("/api/auth/signin");
    }

    const subjects = await getFacultySubjects(session.user.email!);

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Subjects</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and view your assigned courses</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                    <BookOpen size={20} />
                    {subjects.length} Subjects Assigned
                </div>
            </header>

            {subjects.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Subjects Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
                        You haven't been assigned any subjects yet. Contact the administrator to get started.
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject) => (
                        <div key={subject.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                                        <BookOpen size={24} />
                                    </div>
                                    {subject.activeSessions > 0 ? (
                                        <div className="flex gap-2">
                                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wider rounded-md animate-pulse">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                Live
                                            </span>
                                            <Link href={`/faculty/session/${subject.id}`} className="text-xs bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 transition-colors">
                                                Join
                                            </Link>
                                        </div>
                                    ) : (
                                        <form action={async () => {
                                            "use server";
                                            // We need to import createSession but we can't easily do it inline if it's not bound.
                                            // Actually, best to just Link to dashboard or bring the action here.
                                            // Let's use a server action from `actions/session.ts` if available or `app/faculty/actions.ts`.
                                            // We'll leave this for now and just add a Link to dashboard if logic is complex.
                                            // Wait, I can just use the Start Session button logic from dashboard.
                                        }}>
                                            {/* Placeholder for future Start Session */}
                                        </form>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{subject.name}</h3>

                                <div className="space-y-3 mt-6">
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Users size={16} className="mr-3 text-gray-400" />
                                        <span>{subject.totalStudents} Students Enrolled</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <Calendar size={16} className="mr-3 text-gray-400" />
                                        <span>{subject.totalSessions} Sessions Conducted</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm font-medium">
                                <span className="text-gray-500">Subject ID: {subject.id}</span>
                                {/* Future: Link to subject details/history */}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
