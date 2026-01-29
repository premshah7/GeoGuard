"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Papa from "papaparse";
import { toast } from "sonner";
import { Loader2, Upload, FileSpreadsheet, FileText, CheckCircle, AlertCircle } from "lucide-react";
import ColumnMappingStep from "./ColumnMappingStep";
import { parsePdfPreview, uploadBulkUsers } from "@/actions/bulk";
import { useRouter } from "next/navigation";

interface FlexibleUploadModalProps {
    userType: "STUDENT" | "FACULTY";
}

export default function FlexibleUploadModal({ userType }: FlexibleUploadModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"UPLOAD" | "MAPPING" | "PROCESSING">("UPLOAD");
    const [rawHeaders, setRawHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<string[][]>([]); // Excludes header row
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const router = useRouter();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);

        if (file.type === "application/pdf") {
            // Server-side PDF parsing
            const formData = new FormData();
            formData.append("file", file);

            const result = await parsePdfPreview(formData);
            if (result.error || !result.headers) {
                toast.error(result.error || "Failed to parse PDF");
                setLoading(false);
                return;
            }

            setRawHeaders(result.headers);
            setRawRows(result.rows || []);
            setStep("MAPPING");
        } else {
            // Client-side CSV parsing
            Papa.parse(file, {
                complete: (results) => {
                    if (results.data && results.data.length > 0) {
                        const rows = results.data as string[][];
                        setRawHeaders(rows[0]);
                        setRawRows(rows.slice(1));
                        setStep("MAPPING");
                    }
                },
                error: (err) => {
                    toast.error("Failed to parse CSV: " + err.message);
                },
                skipEmptyLines: true
            });
        }
        setLoading(false);
    };

    const handleUpload = async () => {
        if (!mapping["name"] || !mapping["email"]) {
            toast.error("Name and Email are required fields.");
            return;
        }

        setLoading(true);
        setStep("PROCESSING");

        // Transform data based on mapping
        const mappedData = rawRows.map(row => {
            const getVal = (key: string) => {
                const headerName = mapping[key];
                if (!headerName) return null;
                const index = rawHeaders.indexOf(headerName);
                if (index === -1) return null;
                return row[index]?.trim();
            };

            return {
                name: getVal("name") || "",
                email: getVal("email") || "",
                roll: userType === "STUDENT" ? (getVal("roll") || undefined) : undefined,
                enrollment: userType === "STUDENT" ? (getVal("enrollment") || undefined) : undefined,
                batch: userType === "STUDENT" ? (getVal("batch") || undefined) : undefined
            };
        }).filter(d => d.name && d.email);

        try {
            const result = await uploadBulkUsers(mappedData, userType);
            if (result.success) {
                setStats(result.stats);
                toast.success("Upload completed!");
                router.refresh();
            } else {
                toast.error(result.error || "Upload failed");
                setStep("MAPPING"); // Go back on failure
            }
        } catch (e) {
            toast.error("An unexpected error occurred");
            setStep("MAPPING");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep("UPLOAD");
        setRawHeaders([]);
        setRawRows([]);
        setMapping({});
        setStats(null);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) reset();
            setOpen(val);
        }}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload {userType === "STUDENT" ? "Students" : "Faculty"}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-xl">Bulk Upload {userType === "STUDENT" ? "Students" : "Faculty"}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Upload a CSV or PDF file and map the columns to system fields.
                    </DialogDescription>
                </DialogHeader>

                {step === "UPLOAD" && (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-zinc-800 bg-zinc-900/50 rounded-xl space-y-6 hover:bg-zinc-900/80 transition-colors">
                        <div className="flex space-x-6 text-zinc-500">
                            <FileSpreadsheet size={64} strokeWidth={1} />
                            <FileText size={64} strokeWidth={1} />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-zinc-200">
                                Drag and drop or click to upload
                            </p>
                            <p className="text-sm text-zinc-500">
                                Supports CSV and PDF (Table format)
                            </p>
                        </div>
                        <Input
                            type="file"
                            accept=".csv, .pdf"
                            onChange={handleFileChange}
                            disabled={loading}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-lg shadow-blue-900/20 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Select File"}
                        </label>
                    </div>
                )}

                {step === "MAPPING" && (
                    <div className="space-y-6">
                        <ColumnMappingStep
                            data={[rawHeaders, ...rawRows]}
                            onMap={setMapping}
                            userType={userType}
                        />
                        <div className="flex justify-end space-x-3 pt-6 border-t border-zinc-800">
                            <Button variant="outline" onClick={reset} className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                                Cancel
                            </Button>
                            <Button onClick={handleUpload} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Confirm & Upload"}
                            </Button>
                        </div>
                    </div>
                )}

                {step === "PROCESSING" && stats && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-8 animate-in fade-in zoom-in duration-300">

                        {/* Success Icon with Pulse Effect */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                            <div className="relative w-24 h-24 bg-gradient-to-tr from-emerald-950 to-emerald-900 rounded-full flex items-center justify-center border border-emerald-800 shadow-2xl">
                                <CheckCircle className="w-12 h-12 text-emerald-500" strokeWidth={2.5} />
                            </div>
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold text-white">Upload Successful</h3>
                            <p className="text-zinc-400 max-w-xs mx-auto">
                                Your data has been processed and saved to the database.
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                            <div className="flex flex-col items-center p-5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                                <span className="text-3xl font-bold text-emerald-500">{stats.success}</span>
                                <span className="text-xs font-medium text-emerald-500/70 uppercase tracking-wider mt-2">Success</span>
                            </div>
                            <div className="flex flex-col items-center p-5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                                <span className="text-3xl font-bold text-red-500">{stats.failed}</span>
                                <span className="text-xs font-medium text-red-500/70 uppercase tracking-wider mt-2">Failed</span>
                            </div>
                            <div className="flex flex-col items-center p-5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                                <span className="text-3xl font-bold text-zinc-100">{stats.success + stats.failed}</span>
                                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mt-2">Total</span>
                            </div>
                        </div>

                        {/* Error Log */}
                        {stats.errors?.length > 0 && (
                            <div className="w-full max-w-lg mt-2">
                                <div className="bg-red-950/20 border border-red-900/30 rounded-lg max-h-48 overflow-y-auto custom-scrollbar">
                                    <div className="px-4 py-3 border-b border-red-900/30 sticky top-0 bg-[#1a0505] backdrop-blur-sm flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        <h4 className="text-sm font-semibold text-red-400">Error Log</h4>
                                    </div>
                                    <ul className="p-4 space-y-2 text-sm text-red-300/80 font-mono">
                                        {stats.errors.map((e: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <span className="text-red-500 mt-1 text-[10px]">●</span>
                                                <span className="break-all">{e}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 w-full max-w-lg pt-4">
                            <Button variant="outline" className="flex-1 h-11 border-zinc-700 hover:bg-zinc-800 text-zinc-300" onClick={reset}>
                                Upload Another
                            </Button>
                            <Button className="flex-1 h-11 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20" onClick={() => setOpen(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
