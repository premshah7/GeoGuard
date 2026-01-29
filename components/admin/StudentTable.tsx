
"use client";

import { useState } from "react";
import { User, Smartphone, Trash2, CheckSquare, Square, MinusSquare } from "lucide-react";
import DeviceResetButton from "@/components/admin/DeviceResetButton";
import EditStudentModal from "@/components/admin/EditStudentModal";
import DeleteStudentButton from "@/components/admin/DeleteStudentButton";
import { deleteUsers } from "@/actions/user";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/confirm-dialog";

interface Student {
    id: number;
    userId: number;
    rollNumber: string;
    enrollmentNo: string;
    batchId: number | null;
    semester: number;
    deviceHash: string | null;
    isDeviceResetRequested: boolean;
    user: {
        name: string;
        email: string;
    };
    batch?: {
        name: string;
    } | null;
}

interface StudentTableProps {
    students: Student[];
    batches: { id: number; name: string }[];
}

export default function StudentTable({ students, batches }: StudentTableProps) {
    const router = useRouter();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Toggle specific student selection
    const toggleSelect = (userId: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedIds(newSelected);
    };

    // Toggle Select All
    const toggleSelectAll = () => {
        if (selectedIds.size === students.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(students.map(s => s.userId)));
        }
    };

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true);
        try {
            const result = await deleteUsers(Array.from(selectedIds), 'student');
            if (result.error) {
                alert(result.error);
            } else {
                router.refresh();
                setSelectedIds(new Set()); // Clear selection
                setIsConfirmOpen(false);
            }
        } catch (error) {
            console.error("Bulk delete failed:", error);
            alert("Failed to delete selected students.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

    const isAllSelected = students.length > 0 && selectedIds.size === students.length;
    const isIndeterminate = selectedIds.size > 0 && selectedIds.size < students.length;

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            {/* Bulk Action Header */}
            {selectedIds.size > 0 && (
                <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center justify-between">
                    <span className="text-blue-700 font-medium">
                        {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''} selected
                    </span>
                    <button
                        onClick={() => setIsConfirmOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Selected
                    </button>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="p-4 w-12 text-center">
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {isAllSelected ? (
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                    ) : isIndeterminate ? (
                                        <MinusSquare className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <Square className="w-5 h-5" />
                                    )}
                                </button>
                            </th>
                            <th className="p-4 font-medium">Student</th>
                            <th className="p-4 font-medium">IDs</th>
                            <th className="p-4 font-medium">Sem</th>
                            <th className="p-4 font-medium">Batch</th>
                            <th className="p-4 font-medium">Device Status</th>
                            <th className="p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {students.map((student) => {
                            const isSelected = selectedIds.has(student.userId);
                            return (
                                <tr
                                    key={student.id}
                                    className={`transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
                                >
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => toggleSelect(student.userId)}
                                            className={`transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="w-5 h-5" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <User className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{student.user.name}</div>
                                                <div className="text-xs text-muted-foreground">{student.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Roll:</span> <span className="text-foreground">{student.rollNumber}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Enroll:</span> <span className="text-foreground">{student.enrollmentNo}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted border border-border text-foreground font-mono text-sm">
                                            {student.semester}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {student.batch ? (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200">
                                                {student.batch.name}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {student.deviceHash ? (
                                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                                                <Smartphone className="w-4 h-4" />
                                                Bound
                                                {student.isDeviceResetRequested && (
                                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full ml-2 border border-yellow-200">
                                                        Reset Requested
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground text-sm">No Device</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <EditStudentModal student={student} batches={batches} iconOnly />
                                            <DeviceResetButton
                                                studentId={student.id}
                                                hasDevice={!!student.deviceHash}
                                                isRequested={student.isDeviceResetRequested}
                                            />
                                            <DeleteStudentButton
                                                userId={student.userId}
                                                studentName={student.user.name}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    No students found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleBulkDelete}
                title={`Delete ${selectedIds.size} Students`}
                description={`Are you sure you want to delete these ${selectedIds.size} students? This action will permanently remove their accounts, attendance records, and everything associated with them.`}
                confirmText="Delete All"
                variant="danger"
                loading={isBulkDeleting}
            />
        </div>
    );
}
