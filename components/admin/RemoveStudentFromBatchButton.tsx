"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserMinus } from "lucide-react";
import { removeStudentFromBatch } from "@/actions/admin";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface RemoveStudentFromBatchButtonProps {
    studentId: number;
    batchId: number;
    studentName: string;
}

export default function RemoveStudentFromBatchButton({
    studentId,
    batchId,
    studentName
}: RemoveStudentFromBatchButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleConfirm = async () => {
        startTransition(async () => {
            const result = await removeStudentFromBatch(studentId, batchId);
            if (result.error) {
                alert(result.error);
            } else {
                router.refresh();
                setIsModalOpen(false);
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                title="Remove from batch"
            >
                <UserMinus className="w-4 h-4" />
            </button>

            <ConfirmDialog
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                title="Remove Student?"
                description={`Are you sure you want to remove ${studentName} from this batch? This action will not delete the student account.`}
                confirmText="Remove User"
                loading={isPending}
            />
        </>
    );
}
