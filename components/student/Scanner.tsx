"use client";

import { useState, useEffect } from "react";
import { Scanner as QrReader } from "@yudiel/react-qr-scanner";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { markAttendance } from "@/actions/attendance";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

interface ScannerProps {
    isDeviceResetRequested?: boolean;
}

export default function Scanner({ isDeviceResetRequested = false }: ScannerProps) {
    const router = useRouter();
    const [deviceHash, setDeviceHash] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
    const [paused, setPaused] = useState(false);
    const [isIncognito, setIsIncognito] = useState(false);

    // Block immediately if reset is requested
    if (isDeviceResetRequested) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <Loader2 className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-blue-500">Device Reset Pending</h3>
                <p className="text-blue-400/80 text-sm">
                    Your request to reset your device is being reviewed by an admin.
                </p>
                <p className="text-zinc-400 text-xs mt-2">
                    You cannot mark attendance until this request is approved or rejected.
                </p>
                <button
                    onClick={() => router.push("/student")}
                    className="w-full py-2 mt-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    useEffect(() => {
        // 1. Initialize FingerprintJS (Browser Fingerprint)
        const setFp = async () => {
            const fp = await FingerprintJS.load();
            const { visitorId } = await fp.get();
            setDeviceHash(visitorId);
        };

        // 2. Initialize Sticky Device ID (LocalStorage UUID)
        const initDeviceId = () => {
            let id = localStorage.getItem("device_id");
            if (!id) {
                id = uuidv4();
                localStorage.setItem("device_id", id);
            }
            setDeviceId(id);
        };

        // 3. Detect Incognito Mode (Heuristic: Storage Quota)
        // Incognito mode generally has lower storage quotas or behaves differently API-wise.
        // This is a common, lightweight check for modern browsers.
        const checkIncognito = async () => {
            try {
                if ('storage' in navigator && 'estimate' in navigator.storage) {
                    const { quota } = await navigator.storage.estimate();
                    // Chrome Incognito typically caps quota at ~120MB (1.2e8 bytes) or less
                    // Regular mode is usually many GBs.
                    if (quota && quota < 120000000) {
                        setIsIncognito(true);
                    }
                }
            } catch (e) {
                // If checking fails, proceed but log it.
                console.error("Incognito check failed", e);
            }
        };

        setFp();
        initDeviceId();
        checkIncognito();
    }, []);

    const handleScan = async (detectedCodes: any[]) => {
        if (paused || loading || !deviceHash || !deviceId || detectedCodes.length === 0) return;

        if (isIncognito) {
            setResult({ error: "Restricted Mode Detected. Please disable Incognito/Private mode to mark attendance." });
            setPaused(true);
            return;
        }

        const token = detectedCodes[0].rawValue;
        if (!token) return;

        setPaused(true);
        setLoading(true);

        try {
            // Send BOTH the Fingerprint (Hardware hash) and the Sticky ID (Browser Profile ID)
            const res = await markAttendance(token, deviceHash, deviceId, navigator.userAgent);

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

    if (isIncognito) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-red-500/10 border border-red-500/20 rounded-2xl space-y-4 max-w-sm mx-auto">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-500">Restricted Mode Detected</h3>
                <p className="text-red-400/80 text-sm">
                    For security reasons, you cannot mark attendance in Incognito or Private mode.
                </p>
                <p className="text-zinc-400 text-xs mt-2">
                    Please switch to a normal browser window.
                </p>
            </div>
        );
    }

    if (!deviceHash || !deviceId) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-sm text-zinc-500 animate-pulse">Initializing Security...</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-sm mx-auto space-y-6">
            {!result ? (
                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-2xl bg-black">
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
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-10 flex-col gap-3">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <p className="text-blue-400 font-medium text-sm">Verifying Location & Device...</p>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                        <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] text-green-400 font-mono tracking-wider">SECURE LINK ACTIVED</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800 animate-in fade-in zoom-in duration-300 shadow-xl">
                    {result.success ? (
                        <>
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
                                <CheckCircle className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Attendance Marked</h2>
                            <p className="text-emerald-400/80 text-sm font-medium">Session Validated • Redirecting...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Verification Failed</h2>
                            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 mb-6">
                                <p className="text-red-300 text-sm font-mono leading-relaxed">{result.error}</p>
                            </div>
                            <button
                                onClick={resetScanner}
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all font-medium border border-zinc-700 hover:border-zinc-600 shadow-lg"
                            >
                                Try Again
                            </button>
                        </>
                    )}
                </div>
            )}

            <div className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Security Identity</p>
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                    <span>HW: {deviceHash.substring(0, 6)}</span>
                    <span className="text-zinc-700">|</span>
                    <span>ID: {deviceId.substring(0, 6)}</span>
                </div>
            </div>
        </div>
    );
}
