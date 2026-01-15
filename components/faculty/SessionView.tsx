"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { endSession, getSessionStats } from "@/actions/session";
import { useRouter } from "next/navigation";
import { Loader2, StopCircle, RefreshCw, Users, ShieldAlert } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function SessionView({ sessionId, subjectName, subjectId }: { sessionId: number; subjectName: string; subjectId: number }) {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [stats, setStats] = useState<{
        attendanceCount: number;
        proxyCount: number;
        recentAttendance: any[];
        recentProxies: any[];
    }>({ attendanceCount: 0, proxyCount: 0, recentAttendance: [], recentProxies: [] });
    const [loading, setLoading] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    // Rotate QR Token every 5 seconds
    useEffect(() => {
        const updateToken = () => {
            // Format: sessionID : timestamp
            // Server will validate timestamp to prevent replay attacks (allow 10-15s window)
            const timestamp = Date.now();
            setToken(`${sessionId}:${timestamp}`);
        };

        updateToken();
        const interval = setInterval(updateToken, 5000);
        return () => clearInterval(interval);
    }, [sessionId]);

    // Poll for stats every 10 seconds
    useEffect(() => {
        const fetchStats = async () => {
            const newStats = await getSessionStats(sessionId);
            setStats(newStats);
        };

        fetchStats();
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchStats();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [sessionId]);

    const handleEndSession = async () => {
        setLoading(true);
        await endSession(sessionId);
        router.push("/faculty");
    };

    // Merge and sort logs
    const logs = [
        ...stats.recentAttendance.map(a => ({ ...a, type: 'attendance' })),
        ...stats.recentProxies.map(p => ({ ...p, type: 'proxy' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
            {/* Left: QR Code Section */}
            <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{subjectName}</h2>
                <p className="text-gray-500 mb-8">Scan to mark attendance</p>

                <div className="p-4 bg-white border-4 border-gray-900 rounded-xl relative">
                    <QRCode value={token} size={256} />
                    {/* Corner Markers for visual flair */}
                    <div className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-blue-600"></div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-blue-600"></div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-blue-600"></div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-blue-600"></div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spinish" />
                    Code refreshes automatically
                </div>
            </div>

            {/* Right: Stats & Controls */}
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-2 text-green-400">
                            <Users className="w-5 h-5" />
                            <span className="font-medium">Present</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats.attendanceCount}</div>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-2 text-red-400">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="font-medium">Proxies</span>
                        </div>
                        <div className="text-4xl font-bold text-white">{stats.proxyCount}</div>
                    </div>
                </div>

                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-hidden flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4">Live Activity</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {logs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                                Waiting for activity...
                            </div>
                        ) : (
                            logs.map((log: any) => (
                                <div
                                    key={`${log.type}-${log.id}`}
                                    className={`p-3 rounded-lg border flex items-center justify-between ${log.type === 'proxy'
                                        ? 'bg-red-500/10 border-red-500/20'
                                        : 'bg-gray-800/50 border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.type === 'proxy' ? 'bg-red-500/20' : 'bg-blue-500/20'
                                            }`}>
                                            {log.type === 'proxy' ? (
                                                <ShieldAlert className="w-4 h-4 text-red-400" />
                                            ) : (
                                                <Users className="w-4 h-4 text-blue-400" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white text-sm">
                                                {log.student.user.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {log.student.rollNumber}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </div>
                                        {log.type === 'proxy' && (
                                            <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                                                Proxy Attempt
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setShowEndConfirm(true)}
                    disabled={loading}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <StopCircle className="w-5 h-5" />}
                    End Session
                </button>
            </div>

            <ConfirmDialog
                isOpen={showEndConfirm}
                onClose={() => setShowEndConfirm(false)}
                onConfirm={handleEndSession}
                title="End Session"
                description="Are you sure you want to end this session? Students will no longer be able to mark attendance."
                confirmText="End Session"
                variant="danger"
                loading={loading}
            />
        </div>
    );
}
