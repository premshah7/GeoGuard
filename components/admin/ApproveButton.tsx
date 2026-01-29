"use client";

import { approveStudent } from "@/actions/admin";
import { Check } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/confirm-dialog";

export default function ApproveButton({ userId }: { userId: number }) {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const handleApprove = async () => {
        setLoading(true);
        const res = await approveStudent(userId);
        if (res.error) {
            alert(res.error);
        }
        setLoading(false);
        setShowConfirm(false);
        router.refresh();
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="p-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors"
                title="Approve Account"
            >
                <Check className="w-5 h-5" />
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleApprove}
                title="Approve Student Account"
                description="Are you sure you want to approve this student? They will grant access to their dashboard."
                confirmText="Approve"
                variant="success"
                loading={loading}
            />
        </>
    );
}
