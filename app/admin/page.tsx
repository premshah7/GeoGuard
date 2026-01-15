import { prisma } from "@/lib/prisma";
import { Users, GraduationCap, ShieldAlert, Activity } from "lucide-react";
import PendingRequests from "@/components/admin/PendingRequests";

async function getStats() {
    const [studentCount, facultyCount, proxyCount, activeSessions] = await Promise.all([
        prisma.student.count(),
        prisma.faculty.count(),
        prisma.proxyAttempt.count(),
        prisma.session.count({ where: { isActive: true } }),
    ]);

    return { studentCount, facultyCount, proxyCount, activeSessions };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">System Overview</h1>

            <PendingRequests />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Students"
                    value={stats.studentCount}
                    icon={GraduationCap}
                    color="blue"
                />
                <StatCard
                    title="Total Faculty"
                    value={stats.facultyCount}
                    icon={Users}
                    color="purple"
                />
                <StatCard
                    title="Active Sessions"
                    value={stats.activeSessions}
                    icon={Activity}
                    color="green"
                />
                <StatCard
                    title="Proxy Attempts"
                    value={stats.proxyCount}
                    icon={ShieldAlert}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Placeholder for Recent Proxy Attempts */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <h2 className="text-xl font-semibold mb-4">Recent Security Alerts</h2>
                    <div className="text-gray-400 text-sm">No recent alerts found.</div>
                </div>

                {/* Placeholder for Recent Activity */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <h2 className="text-xl font-semibold mb-4">System Status</h2>
                    <div className="flex items-center gap-2 text-green-400">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        System Operational
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    const colorClasses = {
        blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        green: "bg-green-500/10 text-green-400 border-green-500/20",
        red: "bg-red-500/10 text-red-400 border-red-500/20",
    }[color as string] || "bg-gray-800 text-white";

    return (
        <div className={`p-6 rounded-xl border ${colorClasses}`}>
            <div className="flex items-center justify-between mb-4">
                <Icon className="w-8 h-8" />
                <span className="text-3xl font-bold">{value}</span>
            </div>
            <h3 className="font-medium opacity-80">{title}</h3>
        </div>
    );
}
