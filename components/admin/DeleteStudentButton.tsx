
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteUsers } from "@/actions/user";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface DeleteStudentButtonProps {
    userId: number;
    studentName: string;
}

export default function DeleteStudentButton({ userId, studentName }: DeleteStudentButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteUsers([userId], 'student');
            if (result.error) {
                alert(result.error);
            } else {
                router.refresh();
                setIsConfirmOpen(false);
            }
        } catch (error) {
            console.error("Failed to delete student:", error);
            alert("An error occurred while deleting the student.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isDeleting}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                title="Delete Student"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Delete Student"
                description={`Are you sure you want to delete "${studentName}"? This action cannot be undone and will permanently remove the student's data.`}
                confirmText="Delete Student"
                variant="danger"
                loading={isDeleting}
            />
        </>
    );
}
