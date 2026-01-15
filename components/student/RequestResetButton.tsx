"use client";

import { requestDeviceReset } from "@/actions/student";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function RequestResetButton({ isRequested }: { isRequested: boolean }) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleRequest = async () => {
        setLoading(true);
        await requestDeviceReset();
        setLoading(false);
        setShowConfirm(false);
    };

    if (isRequested) {
        return (
            <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">
                Request Pending
            </span>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline disabled:opacity-50 mt-1"
            >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Request Change
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleRequest}
                title="Request Device Reset"
                description="Do you want to request a device reset? This will alert the admin to clear your current device binding. You will need admin approval."
                confirmText="Request Reset"
                variant="info"
                loading={loading}
            />
        </>
    );
}
