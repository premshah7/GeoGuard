"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { endSession, getSessionStats, getSessionAttendance } from "@/actions/session";
import { useRouter } from "next/navigation";
import { Loader2, StopCircle, RefreshCw, Users, ShieldAlert } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, FileText } from "lucide-react";

export default function SessionView({ sessionId, subjectName, subjectId }: { sessionId: number; subjectName: string; subjectId: number }) {


    const router = useRouter();
    const [token, setToken] = useState("");
    const [sessionStatistics, setSessionStatistics] = useState<{
        attendanceCount: number;
        proxyCount: number;
        recentAttendance: any[];
        recentProxies: any[];
    }>({ attendanceCount: 0, proxyCount: 0, recentAttendance: [], recentProxies: [] });
    const [loading, setLoading] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    // Auto-End session on unmount - REMOVED to prevent sessions ending on refresh
    // Faculty must explicitly click "End Session"
    /*
    useEffect(() => {
        return () => {
            const blob = new Blob([JSON.stringify({ sessionId })], { type: 'application/json' });
            navigator.sendBeacon(`/api/session/${sessionId}/end`, blob);
        };
    }, [sessionId]);
    */

    useEffect(() => {
        const updateToken = () => {
            const timestamp = Date.now();
            setToken(`${sessionId}:${timestamp}`);
        };

        updateToken();
        const interval = setInterval(updateToken, 5000);
        return () => clearInterval(interval);
    }, [sessionId]);

    useEffect(() => {
        const fetchStats = async () => {
            const newStats = await getSessionStats(sessionId);
            setSessionStatistics(newStats);
        };

        fetchStats();
        const interval = setInterval(() => {
            if (document.visibilityState === "visible") {
                fetchStats();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [sessionId]);

    const handleEndSession = async () => {
        if (loading) return; // Prevent double clicks
        setLoading(true);
        try {
            await endSession(sessionId);
            router.push("/faculty");
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const result = await getSessionAttendance(sessionId);
            if (!result.success || !result.present) {
                alert("Failed to fetch attendance data");
                return;
            }

            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text(`${subjectName} - Attendance`, 14, 22);
            doc.setFontSize(11);
            doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

            // Stats
            doc.text(`Total Present: ${result.present.length}`, 14, 38);
            doc.text(`Total Absent: ${result.absent?.length || 0}`, 14, 44);

            let finalY = 50;

            // --- PRESENT TABLE ---
            if (result.present.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(22, 163, 74); // Green
                doc.text("Present Students", 14, finalY);

                const tableData = result.present.map((record: any) => [
                    record.student.rollNumber,
                    record.student.user.name,
                    new Date(record.timestamp).toLocaleTimeString(),
                    record.student.deviceHash ? "Verified" : "N/A"
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Roll No', 'Name', 'Time', 'Device Status']],
                    body: tableData,
                    theme: 'grid',
                    headStyles: { fillColor: [22, 163, 74] }, // Green header
                });

                finalY = (doc as any).lastAutoTable.finalY + 15;
            }

            // --- ABSENT TABLE ---
            if (result.absent && result.absent.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(220, 38, 38); // Red
                doc.text("Absent Students", 14, finalY);

                const absentData = result.absent.map((student: any) => [
                    student.rollNumber,
                    student.name,
                    "ABSENT",
                    "-"
                ]);

                autoTable(doc, {
                    startY: finalY + 5,
                    head: [['Roll No', 'Name', 'Status', 'Device']],
                    body: absentData,
                    theme: 'grid',
                    headStyles: { fillColor: [220, 38, 38] }, // Red header
                });
            }

            doc.save(`${subjectName}_Attendance_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("Failed to generate PDF");
        }
    };

    const handleDownloadTXT = async () => {
        try {
            const result = await getSessionAttendance(sessionId);
            if (!result.success || !result.present) {
                alert("Failed to fetch attendance data");
                return;
            }

            let content = `SUBJECT: ${subjectName}\nDATE: ${new Date().toLocaleDateString()}\n\n`;

            content += `--- PRESENT (${result.present.length}) ---\n`;
            content += result.present
                .map((record: any) => record.student.rollNumber)
                .join('\n');

            if (result.absent && result.absent.length > 0) {
                content += `\n\n--- ABSENT (${result.absent.length}) ---\n`;
                content += result.absent
                    .map((student: any) => student.rollNumber)
                    .join('\n');
            }

            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${subjectName}_Attendance_${new Date().toISOString().split('T')[0]}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("TXT generation failed:", error);
            alert("Failed to generate TXT");
        }
    };

    // Merge and sort logs
    const activityLogs = [
        ...sessionStatistics.recentAttendance.map(attendanceRecord => ({ ...attendanceRecord, type: 'attendance' })),
        ...sessionStatistics.recentProxies.map(proxyRecord => ({ ...proxyRecord, type: 'proxy' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)]">
            {/* Left: QR Code Section */}
            <div className="bg-card rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl lg:sticky lg:top-4 lg:self-start lg:h-fit overflow-hidden">
                <h2 className="text-2xl font-bold text-foreground mb-2">{subjectName}</h2>
                <p className="text-muted-foreground mb-8">Scan to mark attendance</p>

                <div className="p-4 bg-white border-4 border-foreground rounded-xl relative ">
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
                    <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-green-600">
                            <Users className="w-5 h-5" />
                            <span className="font-medium">Present</span>
                        </div>
                        <div className="text-4xl font-bold text-foreground">{sessionStatistics.attendanceCount}</div>
                    </div>
                    <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3 mb-2 text-red-600">
                            <ShieldAlert className="w-5 h-5" />
                            <span className="font-medium">Proxies</span>
                        </div>
                        <div className="text-4xl font-bold text-foreground">{sessionStatistics.proxyCount}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={sessionStatistics.attendanceCount === 0}
                        className="flex items-center justify-center gap-2 p-3 bg-red-600/10 border border-red-600/50 text-red-500 rounded-lg hover:bg-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="text-sm font-medium">Export PDF</span>
                    </button>
                    <button
                        onClick={handleDownloadTXT}
                        disabled={sessionStatistics.attendanceCount === 0}
                        className="flex items-center justify-center gap-2 p-3 bg-blue-600/10 border border-blue-600/50 text-blue-500 rounded-lg hover:bg-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span className="text-sm font-medium">Export TXT</span>
                    </button>
                </div>

                <div className="flex-1 bg-card border border-border rounded-xl p-6 overflow-hidden flex flex-col shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4">Live Activity</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        {activityLogs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                Waiting for activity...
                            </div>
                        ) : (
                            activityLogs.map((log: any) => (
                                <div
                                    key={`${log.type}-${log.id}`}
                                    className={`p-3 rounded-lg border flex items-center justify-between ${log.type === 'proxy'
                                        ? 'bg-destructive/10 border-destructive/20'
                                        : 'bg-muted/50 border-border'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.type === 'proxy' ? 'bg-red-100' : 'bg-blue-100'
                                            }`}>
                                            {log.type === 'proxy' ? (
                                                <ShieldAlert className="w-4 h-4 text-red-600" />
                                            ) : (
                                                <Users className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground text-sm">
                                                {log.student.user.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {log.student.rollNumber}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400">
                                            {new Date(log.timestamp).toLocaleTimeString()}
                                        </div>
                                        <div className="mt-1 flex justify-end">
                                            {log.type === 'proxy' ? (
                                                <div className="flex flex-col items-end w-full">
                                                    {log.deviceOwner ? (
                                                        <span className="text-red-500 font-semibold bg-red-100 px-2 py-0.5 rounded text-xs whitespace-nowrap mb-1">
                                                            Using {log.deviceOwner.user.name.split(' ')[0]}'s Device
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-500/70 max-w-[150px] truncate">
                                                            Hash: {log.attemptedHash?.substring(0, 8)}...
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 max-w-[150px] truncate block">
                                                    ID: {log.student.deviceHash?.substring(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                        {log.type === 'proxy' && (
                                            <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">
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
