"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Loader2, User, AlertTriangle } from "lucide-react";
import { getSessionAttendees } from "@/actions/session";

// Add isActive prop and update types
export default function SessionScreen({ sessionId, isActive = true }: { sessionId: number, isActive?: boolean }) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(10);
    const [attendees, setAttendees] = useState<{ id: number, rollNumber: string, enrollmentNo?: string, name: string, timestamp: Date }[]>([]);
    const [proxies, setProxies] = useState<{ id: number, rollNumber: string, name: string, timestamp: Date, attemptedHash: string }[]>([]);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await fetch(`/api/session/${sessionId}/qr`);
                const data = await res.json();
                if (data.token) {
                    setToken(data.token);
                    setTimeLeft(10);
                }
            } catch (error) {
                console.error("Failed to fetch QR token", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchAttendees = async () => {
            const res = await getSessionAttendees(sessionId);
            if (res.success) {
                if (res.attendees) setAttendees(res.attendees);
                if (res.proxies) setProxies(res.proxies);
            }
        };

        fetchToken(); // Initial fetch
        fetchAttendees();

        const interval = setInterval(fetchToken, 10000); // 10s refresh
        const countdown = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        const attendeeInterval = setInterval(fetchAttendees, 3000); // 3s refresh for live feel

        return () => {
            clearInterval(interval);
            clearInterval(countdown);
            clearInterval(attendeeInterval);
        };
    }, [sessionId]);

    if (!isActive) {
        return (
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User size={18} />
                        Session Attendance Record
                    </h3>
                    <span className="bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded-full">
                        Total Present: {attendees.length}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300">
                            <tr>
                                <th className="px-6 py-3 font-medium">Roll No</th>
                                <th className="px-6 py-3 font-medium">Enrollment No</th>
                                <th className="px-6 py-3 font-medium">Name</th>
                                <th className="px-6 py-3 font-medium">Time In</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {attendees.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{student.rollNumber}</td>
                                    <td className="px-6 py-4 text-gray-500">{student.enrollmentNo || "N/A"}</td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{student.name}</td>
                                    <td className="px-6 py-4 text-gray-500 font-mono">
                                        {new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                            Present
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {attendees.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No attendance recorded for this session.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
            {/* Left: QR Code Scanner */}
            <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[50vh] space-y-8 p-4">

                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold dark:text-white">Scan to Mark Attendance</h2>
                    <p className="text-gray-500">QR Code refreshes every 10s</p>
                </div>

                <div className="p-6 bg-white rounded-2xl shadow-xl border-2 border-gray-100 dark:border-gray-700 relative aspect-square w-full max-w-[400px] flex items-center justify-center">
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500" size={48} />
                        </div>
                    ) : !token ? (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                            <div className="bg-gray-100 rounded-full p-4 mb-3 dark:bg-gray-700">
                                <QRCode value="Session Ended" size={64} fgColor="#9CA3AF" />
                            </div>
                            <p className="font-medium">Session Ended</p>
                            <p className="text-xs">QR Code no longer active</p>
                        </div>
                    ) : (
                        <div className="w-full h-full">
                            <QRCode value={token} size={256} style={{ height: "100%", maxWidth: "100%", width: "100%" }} viewBox={`0 0 256 256`} />
                        </div>
                    )}
                </div>

                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>Refreshing...</span>
                        <span>{timeLeft}s</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeLeft / 10) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Right: Live Attendee List */}
            <div className="w-full lg:w-96 bg-white dark:bg-gray-800 border-l dark:border-gray-700 h-full overflow-hidden flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User size={18} />
                        Live Attendees
                        <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                            {attendees.length}
                        </span>
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Proxies Section */}
                    {proxies.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                <AlertTriangle size={12} /> Suspicious ({proxies.length})
                            </h4>
                            {proxies.map(p => (
                                <div key={p.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-pulse">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-red-700 dark:text-red-300">{p.rollNumber}</p>
                                            <p className="text-xs text-red-600 dark:text-red-400 truncate max-w-[120px]">{p.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] font-bold bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 px-1.5 py-0.5 rounded mb-1">
                                                PROXY
                                            </span>
                                            <span className="text-[10px] text-red-400">
                                                {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Valid Attendees */}
                    {attendees.length > 0 && proxies.length === 0 ? null : (
                        attendees.length > 0 && <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Present ({attendees.length})</h4>
                    )}

                    {attendees.length === 0 && proxies.length === 0 ? (
                        <div className="text-center text-gray-500 py-10">
                            <p>No students yet.</p>
                            <p className="text-sm mt-1">Waiting for scans...</p>
                        </div>
                    ) : (
                        attendees.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg animate-in slide-in-from-top-2">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{student.rollNumber}</p>
                                    <p className="text-xs text-gray-500 truncate max-w-[150px]">{student.name}</p>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">
                                    {new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} {/* Replaced logic in next step after checking action */ }
