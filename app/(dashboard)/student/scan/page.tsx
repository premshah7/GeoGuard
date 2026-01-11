"use client";

import { useState, useEffect } from "react";
import QRScanner from "@/components/QRScanner";
import { useFingerprint } from "@/components/FingerprintProvider";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

type ScanStatus = "scanning" | "processing" | "success" | "error";

export default function StudentScanPage() {
    const router = useRouter();
    const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
    const [status, setStatus] = useState<ScanStatus>("scanning");
    const [message, setMessage] = useState("");
    const [subjectName, setSubjectName] = useState("");

    const handleScan = async (token: string) => {
        setStatus("processing");
        setMessage("");

        try {
            const response = await fetch("/api/attendance/mark", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    qrToken: token,
                    deviceHash: fingerprint
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage(data.message);
                setSubjectName(data.subject);
            } else {
                setStatus("error");
                setMessage(data.error || "Failed to mark attendance");
            }
        } catch (error) {
            setStatus("error");
            setMessage("Network error. Please try again.");
        }
    };

    const testCamera = async () => {
        try {
            setMessage("Requesting raw camera access...");
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setMessage("Success! Camera access granted. " + stream.id);
            // Stop tracks to release
            stream.getTracks().forEach(t => t.stop());
        } catch (err) {
            setMessage("Raw Access Failed: " + (err as Error).name + " - " + (err as Error).message);
        }
    };

    if (isFingerprintLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin" size={32} />
                    <p>Verifying Device...</p>
                </div>
            </div>
        );
    }

    if (!fingerprint) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl text-center max-w-sm">
                    <XCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h1 className="text-xl font-bold text-white mb-2">Device Not Identified</h1>
                    <p className="text-gray-300 mb-6">Could not identify your device. Please ensure you are not in Incognito mode and try refreshing.</p>
                    <Link href="/student" className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="p-4 flex items-center bg-gray-900 border-b border-gray-800">
                <Link href="/student" className="text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="text-lg font-semibold text-white ml-2">Scan Attendance</h1>
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6">

                {status === "scanning" && (
                    <div className="w-full max-w-md space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white">Scan QR Code</h2>
                            <p className="text-gray-400">Point your camera at the session QR code projected by the faculty.</p>
                        </div>
                        {message && (
                            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                                {message}
                            </div>
                        )}
                        <div className="text-center">
                            <button
                                onClick={testCamera}
                                className="text-xs text-blue-400 underline mb-4"
                            >
                                Test Camera Permissions
                            </button>
                        </div>
                        <QRScanner
                            onScan={handleScan}
                            onError={(err) => setMessage(err)}
                        />

                    </div>
                )}

                {status === "processing" && (
                    <div className="text-center space-y-4">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-semibold text-white">Verifying...</h2>
                        <p className="text-gray-400">Checking location and device signature.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="text-center space-y-6 max-w-xs animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                            <CheckCircle className="text-white" size={48} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Marked!</h2>
                            <p className="text-xl text-blue-400 font-medium">{subjectName}</p>
                            <p className="text-gray-400">{message}</p>
                        </div>
                        <Link href="/student" className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors">
                            Back to Dashboard
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="text-center space-y-6 max-w-xs animate-in fade-in zoom-in duration-300">
                        <div className="mx-auto w-24 h-24 bg-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                            <XCircle className="text-white" size={48} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Failed</h2>
                            <p className="text-red-400 font-medium text-lg">{message}</p>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={() => setStatus("scanning")}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                Try Again
                            </button>
                            <Link href="/student" className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors">
                                Cancel
                            </Link>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
