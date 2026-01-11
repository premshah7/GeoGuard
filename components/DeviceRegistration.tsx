"use client";

import { useFingerprint } from "@/components/FingerprintProvider";
import { registerDevice } from "@/actions/device";
import { requestDeviceReset } from "@/actions/requests";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, CheckCircle, AlertTriangle, RefreshCcw, Clock } from "lucide-react";

export default function DeviceRegistration({ existingHash, isResetRequested }: { existingHash: string | null, isResetRequested: boolean }) {
    const { fingerprint, isLoading } = useFingerprint();
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
    const [requestPending, setRequestPending] = useState(isResetRequested);

    const handleRegister = async () => {
        if (!fingerprint) return;

        const result = await registerDevice(fingerprint);
        if (result.success) {
            setStatus({ type: 'success', message: result.message! });
        } else {
            setStatus({ type: 'error', message: result.error! });
        }
    };

    const handleRequestReset = async () => {
        const result = await requestDeviceReset();
        if (result.success) {
            setRequestPending(true);
            setStatus({ type: 'success', message: result.message! });
        } else {
            setStatus({ type: 'error', message: result.error! });
        }
    };

    // Auto-refresh logic to check for Admin approval
    const router = useRouter(); // Import this
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (requestPending) {
            interval = setInterval(() => {
                router.refresh();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [requestPending, router]);

    if (isLoading) {
        return <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse">Loading device info...</div>;
    }

    const isRegistered = !!existingHash;
    const isMatch = existingHash === fingerprint;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden max-w-md">
            <div className="p-6 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Smartphone className="text-blue-500" />
                    Device Registration
                </h2>
            </div>

            <div className="p-6 space-y-4">
                {isRegistered ? (
                    <div className="space-y-4">
                        {isMatch ? (
                            <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-start gap-3">
                                <CheckCircle className="shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-medium">Device Verified</p>
                                    <p className="text-sm opacity-90">This device is registered for attendance.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-medium">Device Mismatch</p>
                                    <p className="text-sm opacity-90">This device does NOT match your registered device.</p>
                                </div>
                            </div>
                        )}

                        {/* Request Reset Section - Always visible if registered */}
                        {requestPending ? (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg flex items-start gap-3">
                                <Clock className="shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-medium">Request Pending</p>
                                    <p className="text-sm opacity-90">You have requested a device reset. Please wait for Admin approval.</p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleRequestReset}
                                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-2 rounded-lg transition-colors"
                            >
                                <RefreshCcw size={16} />
                                Request Device Reset
                            </button>
                        )}


                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-4 rounded-lg">
                            <p className="font-medium">No Device Registered</p>
                            <p className="text-sm opacity-90 mt-1">Please register this device to mark attendance. You can only register one device.</p>
                        </div>



                        <button
                            onClick={handleRegister}
                            disabled={!fingerprint}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors"
                        >
                            Register This Device
                        </button>
                    </div>
                )}

                {status.message && (
                    <div className={`p-3 rounded-lg text-sm ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </div>
    );
}
