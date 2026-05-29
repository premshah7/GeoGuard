"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ShieldAlert, FileText, Download, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getSessionAttendance } from "@/actions/session";

type SessionReportProps = {
    sessionId: number;
    subjectName: string;
    startTime: Date;
    endTime: Date | null;
    attendees: any[];
    proxies: any[];
};

export default function SessionReport({
    sessionId,
    subjectName,
    startTime,
    endTime,
    attendees,
    proxies
}: SessionReportProps) {
    const router = useRouter();

    // Sort combined logs by time
    const logs = [
        ...attendees.map(a => ({ ...a, type: 'attendance' })),
        ...proxies.map(p => ({ ...p, type: 'proxy' }))
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const handleDownloadPDF = async () => {
        try {
            const result = await getSessionAttendance(sessionId);
            if (!result.success || !result.present) {
                alert("Failed to fetch full attendance data");
                return;
            }

            const doc = new jsPDF();

            // Header
            doc.setFontSize(18);
            doc.text(`${subjectName} - Attendance Report`, 14, 22);
            doc.setFontSize(11);
            doc.text(`Date: ${new Date(startTime).toLocaleDateString("en-GB")}`, 14, 30);
            doc.text(`Time: ${new Date(startTime).toLocaleTimeString()} - ${endTime ? new Date(endTime).toLocaleTimeString() : 'Ongoing'}`, 14, 36);

            doc.text(`Present: ${result.present.length}`, 14, 44);
            doc.text(`Absent: ${result.absent?.length || 0}`, 50, 44);

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
                    headStyles: { fillColor: [22, 163, 74] },
                });

                finalY = (doc as any).lastAutoTable.finalY + 15;
            }

            // --- ABSENT TABLE (Grouped by Batch) ---
            if (result.absent && result.absent.length > 0) {
                doc.setFontSize(14);
                doc.setTextColor(220, 38, 38); // Red
                doc.text("Absent Students", 14, finalY);
                finalY += 5;

                // Group by Batch
                const absentByBatch: Record<string, any[]> = {};
                result.absent.forEach((student: any) => {
                    const batch = student.batchName || "Unassigned";
                    if (!absentByBatch[batch]) absentByBatch[batch] = [];
                    absentByBatch[batch].push(student);
                });

                // Iterate over batches
                Object.entries(absentByBatch).sort().forEach(([batchName, students]) => {
                    // Check if we need a new page
                    if (finalY > 270) {
                        doc.addPage();
                        finalY = 20;
                    }

                    doc.setFontSize(12);
                    doc.setTextColor(100, 100, 100); // Gray
                    doc.text(`${batchName} (${students.length})`, 14, finalY + 5);

                    const batchData = students.map((student: any) => [
                        student.rollNumber,
                        student.name,
                        "ABSENT",
                        "-"
                    ]);

                    autoTable(doc, {
                        startY: finalY + 7,
                        head: [['Roll No', 'Name', 'Status', 'Device']],
                        body: batchData,
                        theme: 'grid',
                        headStyles: { fillColor: [220, 38, 38] },
                        margin: { left: 14 },
                    });

                    finalY = (doc as any).lastAutoTable.finalY + 5;
                });
            }

            doc.save(`${subjectName}_${new Date(startTime).toISOString().split('T')[0]}.pdf`);
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

            let content = `SUBJECT: ${subjectName}\nDATE: ${new Date(startTime).toLocaleDateString("en-GB")}\n`;
            content += `TIME: ${new Date(startTime).toLocaleTimeString()}\n\n`;

            content += `--- PRESENT (${result.present.length}) ---\n`;

            content += result.present
                .map((record: any) => record.student.rollNumber)
                .join('\n');

            if (result.absent && result.absent.length > 0) {
                content += `\n\n--- ABSENT (${result.absent.length}) ---\n`;

                // Group by Batch
                const absentByBatch: Record<string, any[]> = {};
                result.absent.forEach((student: any) => {
                    const batch = student.batchName || "Unassigned";
                    if (!absentByBatch[batch]) absentByBatch[batch] = [];
                    absentByBatch[batch].push(student);
                });

                Object.entries(absentByBatch).sort().forEach(([batchName, students]) => {
                    content += `\n[ ${batchName} - ${students.length} ]\n`;
                    content += students
                        .map((student: any) => student.rollNumber)
                        .join('\n');
                    content += `\n`;
                });
            }

            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${subjectName}_Attendance_${new Date(startTime).toISOString().split('T')[0]}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("TXT generation failed:", error);
            alert("Failed to generate TXT");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to History
            </button>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">{subjectName}</h1>
                        <p className="text-gray-400">
                            {new Date(startTime).toLocaleDateString("en-GB")} • {new Date(startTime).toLocaleTimeString()} - {endTime ? new Date(endTime).toLocaleTimeString() : 'Ongoing'}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownloadPDF}
                            disabled={attendees.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/50 text-red-500 rounded-lg hover:bg-red-600/20 disabled:opacity-50 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            PDF
                        </button>
                        <button
                            onClick={handleDownloadTXT}
                            disabled={attendees.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-600/50 text-blue-500 rounded-lg hover:bg-blue-600/20 disabled:opacity-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            TXT
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-2 text-green-400 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Present</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{attendees.length}</div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-2 text-red-400 mb-1">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-sm font-medium">Proxies Attempted</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{proxies.length}</div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white mb-4">Detailed Log</h3>
                    {logs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 italic">No attendance records found.</div>
                    ) : (
                        logs.map((log: any) => (
                            <div
                                key={`${log.type}-${log.id}`}
                                className={`p-4 rounded-lg border flex items-center justify-between ${log.type === 'proxy'
                                    ? 'bg-red-500/5 border-red-500/10'
                                    : 'bg-gray-800/30 border-gray-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="font-mono text-gray-500 text-sm w-8">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-200">
                                            {log.student.user.name}
                                        </div>
                                        <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                                            <span>{log.student.rollNumber}</span>
                                            {log.type === 'proxy' && log.deviceOwner?.user?.name && (
                                                <span className="text-red-400 font-semibold text-[11px] mt-0.5">
                                                    Using {log.deviceOwner.user.name}'s Device ({log.deviceOwner.rollNumber})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {log.type === 'proxy' ? (
                                        <span className="text-xs font-bold text-red-500 px-2 py-1 bg-red-500/10 rounded">PROXY</span>
                                    ) : (
                                        <span className="text-xs font-bold text-green-500 px-2 py-1 bg-green-500/10 rounded">VERIFIED</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
