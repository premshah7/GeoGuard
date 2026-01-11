"use client";

import { useState } from "react";
import { Upload, FileText, Check, AlertTriangle, X, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { parsePdfAction, bulkCreateStudents, BulkStudentData } from "@/actions/admin";

export default function BulkStudentUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<BulkStudentData[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setParsedData([]);
            setResults(null);
            parseFile(e.target.files[0]);
        }
    };

    const parseFile = async (file: File) => {
        setLoading(true);
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const data = results.data.map((row: any) => ({
                        rollNumber: row['Roll Number'] || row['rollNumber'] || row['Roll'] || '',
                        enrollmentNo: row['Enrollment Number'] || row['enrollmentNo'] || row['Enrollment'] || '',
                        name: row['Name'] || row['name'] || '',
                        email: row['Email'] || row['email'] || '',
                    })).filter(s => s.rollNumber && s.email);
                    setParsedData(data);
                    setLoading(false);
                },
                error: (err) => {
                    alert("CSV Error: " + err.message);
                    setLoading(false);
                }
            });
        } else if (ext === 'txt') {
            const text = await file.text();
            extractDataFromText(text);
            setLoading(false);
        } else if (ext === 'pdf') {
            const formData = new FormData();
            formData.append("file", file);
            const res = await parsePdfAction(formData);
            if (res.text) {
                extractDataFromText(res.text);
            } else {
                alert("Failed to parse PDF");
            }
            setLoading(false);
        } else {
            alert("Unsupported format. Please use CSV, TXT, or PDF.");
            setLoading(false);
        }
    };

    const extractDataFromText = (text: string) => {
        // Strategy: Look for lines with alphanumeric patterns
        // Expecting: Roll, Enrollment, Name, Email (in some order or delimited)
        // Simple Regex for a structured line: "101  2023001  John Doe  john@example.com"

        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        const extracted: BulkStudentData[] = [];

        lines.forEach(line => {
            // Basic CSV-like split if comma exists, else space split
            const parts = line.includes(',') ? line.split(',') : line.split(/\s+/);

            // Heuristic mapping (This is fragile but works for structured inputs)
            // Assumed Order: Roll, Enrollment, Name, Email
            // If parts < 4, skip or try to merge name parts

            // Better Strategy: Find Email, Find Roll/Enrollment (digits), rest is Name
            const emailPart = parts.find(p => p.includes('@'));

            // Regex for Roll/Enrollment (digits/alphanumeric, usually > 2 chars)
            const numericParts = parts.filter(p => !p.includes('@') && /\d/.test(p));

            // Name is whatever is left
            const nameParts = parts.filter(p => !p.includes('@') && !/\d/.test(p));

            if (emailPart && numericParts.length >= 2) {
                extracted.push({
                    rollNumber: numericParts[0],
                    enrollmentNo: numericParts[1],
                    name: nameParts.join(' ').trim() || "Unknown",
                    email: emailPart.trim()
                });
            }
        });

        setParsedData(extracted);
    };

    const handleUpload = async () => {
        setUploading(true);
        const res = await bulkCreateStudents(parsedData);
        setResults(res);
        setUploading(false);
        setParsedData([]); // Clear preview
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
                <Upload size={18} /> Bulk Upload
            </button>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h2 className="text-xl font-bold dark:text-white">Bulk Student Upload</h2>
                    <button onClick={() => setIsOpen(false)} className="bg-gray-200 dark:bg-gray-700 p-1 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {!results ? (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition relative">
                                <input
                                    type="file"
                                    accept=".csv, .txt, .pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-3 text-blue-600 dark:text-blue-400">
                                    <FileText size={32} />
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {loading ? "Parsing..." : file ? file.name : "Click to Upload File"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Supports CSV, TXT, PDF. <br />
                                    <span className="text-xs">Format: Roll No, Enrollment No, Name, Email</span>
                                </p>
                            </div>

                            {file && !loading && parsedData.length === 0 && (
                                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-xl border border-yellow-100 dark:border-yellow-800">
                                    <p className="font-bold flex items-center justify-center gap-2">
                                        <AlertTriangle size={18} /> No Valid Data Found
                                    </p>
                                    <p className="text-sm mt-1">
                                        Check your file headers. Required: <br />
                                        <span className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">Roll Number</span>,
                                        <span className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">Enrollment Number</span>,
                                        <span className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">Name</span>,
                                        <span className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">Email</span>
                                    </p>
                                </div>
                            )}

                            {parsedData.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs uppercase font-bold text-gray-500">
                                        <span>Preview ({parsedData.length} Students)</span>
                                    </div>
                                    <div className="border dark:border-gray-700 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50 dark:bg-gray-700 font-medium text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-2">Roll</th>
                                                    <th className="px-4 py-2">Enrollment</th>
                                                    <th className="px-4 py-2">Name</th>
                                                    <th className="px-4 py-2">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {parsedData.map((s, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className="px-4 py-2 dark:text-gray-300">{s.rollNumber}</td>
                                                        <td className="px-4 py-2 dark:text-gray-300">{s.enrollmentNo}</td>
                                                        <td className="px-4 py-2 dark:text-gray-300">{s.name}</td>
                                                        <td className="px-4 py-2 dark:text-gray-300">{s.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                        Create {parsedData.length} Students
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                            <div className="bg-green-100 text-green-600 p-4 rounded-full">
                                <Check size={48} />
                            </div>
                            <h3 className="text-2xl font-bold dark:text-white">Upload Complete!</h3>
                            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <span className="block text-2xl font-bold text-green-600">{results.success}</span>
                                    <span className="text-xs text-green-500 font-bold uppercase">Success</span>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <span className="block text-2xl font-bold text-red-600">{results.failed}</span>
                                    <span className="text-xs text-red-500 font-bold uppercase">Failed</span>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="w-full text-left bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                                    <h4 className="font-bold text-red-700 flex items-center gap-2 mb-2">
                                        <AlertTriangle size={16} /> Errors
                                    </h4>
                                    <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                                        {results.errors.map((e, i) => <li key={i}>• {e}</li>)}
                                    </ul>
                                </div>
                            )}

                            <button onClick={() => { setIsOpen(false); setResults(null); }} className="bg-gray-100 px-6 py-2 rounded-lg font-medium">
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
