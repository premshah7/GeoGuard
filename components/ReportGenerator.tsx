"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Loader2, FileText, FileSpreadsheet, File } from "lucide-react";

interface Subject {
    id: number;
    name: string;
}

interface ReportGeneratorProps {
    subjects: Subject[];
}

export default function ReportGenerator({ subjects }: ReportGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState("weekly"); // weekly, monthly, custom
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedSubject, setSelectedSubject] = useState(subjects.length > 0 ? subjects[0].id.toString() : "");

    const generateDates = (type: string) => {
        const end = new Date();
        const start = new Date();
        if (type === 'weekly') {
            start.setDate(end.getDate() - 7);
        } else if (type === 'monthly') {
            start.setMonth(end.getMonth() - 1);
        }
        return { start, end };
    };

    const fetchReportData = async () => {
        let start, end;
        if (range === 'custom') {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            const dates = generateDates(range);
            start = dates.start;
            end = dates.end;
        }

        const res = await fetch(`/api/reports?startDate=${start.toISOString()}&endDate=${end.toISOString()}&subjectId=${selectedSubject}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        return res.json();
    };

    const handleExport = async (format: 'pdf' | 'csv' | 'txt') => {
        setLoading(true);
        try {
            const data = await fetchReportData();
            if (data.length === 0) {
                alert("No data found for this range.");
                setLoading(false);
                return;
            }

            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `Report_${range}_${timestamp}`;

            if (format === 'pdf') {
                const doc = new jsPDF();
                doc.text(`Attendance Report (${range})`, 14, 15);
                doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

                const tableData = data.map((row: any) => [
                    row.student.rollNumber,
                    row.student.enrollmentNo,
                    row.student.user.name,
                    row.session.subject.name,
                    new Date(row.timestamp).toLocaleDateString(),
                    new Date(row.timestamp).toLocaleTimeString(),
                ]);

                autoTable(doc, {
                    head: [['Roll No', 'Enrollment', 'Name', 'Subject', 'Date', 'Time']],
                    body: tableData,
                    startY: 30,
                });

                doc.save(`${filename}.pdf`);
            } else if (format === 'csv') {
                const headers = ["Roll No,Enrollment No,Name,Subject,Date,Time"];
                const rows = data.map((row: any) => [
                    row.student.rollNumber,
                    row.student.enrollmentNo,
                    row.student.user.name,
                    row.session.subject.name,
                    new Date(row.timestamp).toLocaleDateString(),
                    new Date(row.timestamp).toLocaleTimeString(),
                ].map((f: any) => `"${f}"`).join(","));

                const blob = new Blob([[...headers, ...rows].join("\n")], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.csv`;
                a.click();
            } else if (format === 'txt') {
                const textContent = data.map((row: any) =>
                    `[${new Date(row.timestamp).toLocaleString()}] ${row.student.rollNumber} (${row.student.enrollmentNo}) - ${row.student.user.name} (${row.session.subject.name})`
                ).join("\n");

                const blob = new Blob([textContent], { type: "text/plain" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.txt`;
                a.click();
            }

        } catch (error) {
            console.error(error);
            alert("Error generating report");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border dark:border-gray-700 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generate Report</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Range</label>
                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                    >
                        <option value="weekly">Last 7 Days</option>
                        <option value="monthly">Last 30 Days</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>

                {range === 'custom' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                            <input type="date" className="w-full rounded-md border-gray-300 dark:bg-gray-700 text-sm" onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                            <input type="date" className="w-full rounded-md border-gray-300 dark:bg-gray-700 text-sm" onChange={e => setEndDate(e.target.value)} />
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm"
                    >
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                <button disabled={loading} onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                    Download PDF
                </button>
                <button disabled={loading} onClick={() => handleExport('csv')} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <FileSpreadsheet size={16} />
                    Download CSV
                </button>
                <button disabled={loading} onClick={() => handleExport('txt')} className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors">
                    <File size={16} />
                    Download TXT
                </button>
            </div>
        </div>
    );
}
