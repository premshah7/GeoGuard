import { prisma } from "@/lib/prisma";
import { AlertTriangle, ShieldAlert } from "lucide-react";

export default async function ProxiesPage() {
    const proxies = await prisma.proxyAttempt.findMany({
        include: {
            student: { include: { user: true } },
            session: { include: { subject: true } }
        },
        orderBy: { timestamp: 'desc' }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                <ShieldAlert className="text-red-500" />
                Security Incidents (Proxy Attempts)
            </h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                {proxies.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-lg font-medium text-green-600">All Clear</p>
                        <p>No proxy attempts recorded.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Time</th>
                                    <th className="px-6 py-3 font-medium">Student</th>
                                    <th className="px-6 py-3 font-medium">Subject</th>
                                    <th className="px-6 py-3 font-medium">Hash Mismatch</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {proxies.map((record) => (
                                    <tr key={record.id} className="hover:bg-red-50 dark:hover:bg-red-900/10">
                                        <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                            {new Date(record.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{record.student.user.name}</div>
                                            <div className="text-xs text-gray-400">{record.student.rollNumber}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                                {record.session.subject.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600 w-16">Registered:</span>
                                                <span className="text-gray-500" title={record.student.deviceHash || 'None'}>
                                                    {record.student.deviceHash?.substring(0, 10)}...
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-500 w-16">Attempted:</span>
                                                <span className="font-bold text-gray-700 dark:text-gray-300" title={record.attemptedHash}>
                                                    {record.attemptedHash.substring(0, 10)}...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
