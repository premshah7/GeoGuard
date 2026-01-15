import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QrCode, History, CheckCircle, Smartphone } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import RequestResetButton from "@/components/student/RequestResetButton";
import DeviceStatus from "@/components/student/DeviceStatus";

export default async function StudentDashboard() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
        redirect("/auth/login");
    }

    const student = await prisma.student.findUnique({
        where: { userId: Number(session.user.id) },
        include: {
            attendances: {
                include: {
                    session: {
                        include: { subject: true }
                    }
                },
                orderBy: { timestamp: 'desc' },
                take: 20
            },
            user: true
        }
    });

    if (!student) {
        return <div className="p-8 text-white">Student record not found.</div>;
    }

    // Calc stats
    // For total classes, we'd need to know how many sessions happened for their subjects.
    // For now simple count.
    const attendanceCount = student.attendances.length;

    return (
        <div className="min-h-screen bg-gray-950 p-6 text-white pb-24">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Welcome, {student.user.name.split(' ')[0]}</h1>
                    <p className="text-gray-400 text-sm">Track your attendance</p>
                </div>
                <div className="flex items-center gap-4">
                    <LogoutButton />
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="font-bold text-blue-400">{student.user.name[0]}</span>
                    </div>
                </div>
            </div>

            {/* Action Card */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 mb-8 shadow-lg shadow-blue-900/20 relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-xl font-bold mb-1">Mark Attendance</h2>
                    <p className="text-blue-100 mb-6 text-sm">Scan the QR code projected in class</p>
                    <Link
                        href="/student/scan"
                        className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                    >
                        <QrCode className="w-5 h-5" />
                        Scan Now
                    </Link>
                </div>
                <QrCode className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
            </div>

            {/* Device Status */}
            <div className="mb-8">
                <h3 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wider">Device Status</h3>
                <DeviceStatus
                    initialDeviceHash={student.deviceHash}
                    initialIsRequested={student.isDeviceResetRequested}
                />
            </div>

            {/* History */}
            <div>
                <h3 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wider">Recent History</h3>
                <div className="space-y-3">
                    {student.attendances.map((record) => (
                        <div key={record.id} className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <div className="font-semibold">{record.session.subject.name}</div>
                                <div className="text-xs text-gray-500">{new Date(record.timestamp).toLocaleString()}</div>
                            </div>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                    ))}
                    {attendanceCount === 0 && (
                        <div className="text-center py-8 text-gray-500">No attendance records yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
