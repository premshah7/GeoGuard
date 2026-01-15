"use client";

import { resetDevice } from "@/actions/admin";
import { RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DeviceResetButton({ studentId, hasDevice, isRequested }: { studentId: number; hasDevice: boolean; isRequested: boolean }) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleReset = async () => {
        setLoading(true);
        await resetDevice(studentId);
        setLoading(false);
        setShowConfirm(false);
    };

    if (!hasDevice) return null;

    if (isRequested) {
        return (
            <>
                <button
                    onClick={() => setShowConfirm(true)}
                    disabled={loading}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-full transition-colors flex items-center gap-1"
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Approve Reset
                </button>

                <ConfirmDialog
                    isOpen={showConfirm}
                    onClose={() => setShowConfirm(false)}
                    onConfirm={handleReset}
                    title="Approve Device Reset"
                    description="This will clear the current device binding for this student, allowing them to bind a new device. This action cannot be undone."
                    confirmText="Approve"
                    variant="success"
                    loading={loading}
                />
            </>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Reset Device
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleReset}
                title="Reset Device Binding"
                description="Are you sure you want to forcibly reset this student's device binding? They will need to re-bind their device to mark attendance."
                confirmText="Reset Device"
                variant="danger"
                loading={loading}
            />
        </>
    );
}
