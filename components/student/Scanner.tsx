"use client";

import { useState, useEffect } from "react";
import { Scanner as QrReader } from "@yudiel/react-qr-scanner";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { markAttendance } from "@/actions/attendance";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Scanner() {
    const router = useRouter();
    const [deviceHash, setDeviceHash] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        // Initialize FingerprintJS
        const setFp = async () => {
            const fp = await FingerprintJS.load();
            const { visitorId } = await fp.get();
            setDeviceHash(visitorId);
        };
        setFp();
    }, []);

    const handleScan = async (detectedCodes: any[]) => {
        if (paused || loading || !deviceHash || detectedCodes.length === 0) return;

        const token = detectedCodes[0].rawValue;
        if (!token) return;

        setPaused(true);
        setLoading(true);

        try {
            const res = await markAttendance(token, deviceHash);
            if (res.success) {
                setResult({ success: true });
                setTimeout(() => router.push("/student"), 2000);
            } else {
                setResult({ error: res.error });
            }
        } catch (err) {
            setResult({ error: "Failed to process attendance." });
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setResult(null);
        setPaused(false);
    };

    if (!deviceHash) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="w-full max-w-sm mx-auto space-y-6">
            {!result ? (
                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-2xl">
                    {/* The scanner library handles camera permissions */}
                    <QrReader
                        onScan={handleScan}
                        allowMultiple={true}
                        scanDelay={2000}
                        components={{
                            onOff: true,
                            torch: true,
                            zoom: true,
                            finder: true,
                        }}
                    />
                    {loading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-10">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800 animate-in fade-in zoom-in duration-300">
                    {result.success ? (
                        <>
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Attendance Marked!</h2>
                            <p className="text-gray-400 text-sm">Redirecting to dashboard...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Failed!</h2>
                            <p className="text-red-400 text-sm mb-6">{result.error}</p>
                            <button
                                onClick={resetScanner}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="text-center text-xs text-gray-500">
                Device ID: <span className="font-mono bg-gray-900 px-2 py-1 rounded">{deviceHash.substring(0, 8)}...</span>
            </div>
        </div>
    );
}
