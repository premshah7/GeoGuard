import { prisma } from "@/lib/prisma";
import { Users, BookOpen, QrCode } from "lucide-react";
import ReportGenerator from "@/components/ReportGenerator";

async function getStats() {
    const studentCount = await prisma.student.count();
    const facultyCount = await prisma.faculty.count();
    const subjectCount = await prisma.subject.count();
    const sessionCount = await prisma.session.count();

    return { studentCount, facultyCount, subjectCount, sessionCount };
}

export default async function AdminDashboard() {
    const stats = await getStats();
    const subjects = await prisma.subject.findMany({});

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>

            {/* Global Report Generator */}
            <ReportGenerator subjects={subjects} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={stats.studentCount}
                    icon={<Users className="text-blue-500" size={24} />}
                />
                <StatCard
                    title="Total Faculty"
                    value={stats.facultyCount}
                    icon={<Users className="text-green-500" size={24} />}
                />
                <StatCard
                    title="Active Subjects"
                    value={stats.subjectCount}
                    icon={<BookOpen className="text-purple-500" size={24} />}
                />
                <StatCard
                    title="Total Sessions"
                    value={stats.sessionCount}
                    icon={<QrCode className="text-orange-500" size={24} />}
                />
            </div>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {icon}
            </div>
        </div>
    );
}
