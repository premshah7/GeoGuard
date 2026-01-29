"use client";

import { useState } from "react";
import { User, Trash2 } from "lucide-react";
import { deleteUsers } from "@/actions/user";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import EditFacultyModal from "@/components/admin/EditFacultyModal";
import { useRouter } from "next/navigation";
import FormattedTime from "@/components/FormattedTime";

// Define the type based on the Prisma query
interface FacultyMember {
    id: number;
    userId: number;
    user: {
        name: string;
        email: string;
        createdAt: string;
    };
    subjects: {
        id: number;
        name: string;
    }[];
    batches: {
        id: number;
        name: string;
    }[];
}

interface FacultyTableProps {
    initialFaculty: FacultyMember[];
    batches?: { id: number; name: string }[];
}

export default function FacultyTable({ initialFaculty, batches }: FacultyTableProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    // Toggle individual selection
    const toggleSelection = (userId: number) => {
        setSelectedIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    // Toggle all selection
    const toggleAll = () => {
        if (selectedIds.length === initialFaculty.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(initialFaculty.map((f) => f.userId));
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteUsers(selectedIds, 'faculty');

        if (result.success) {
            setSelectedIds([]);
            setIsDeleteDialogOpen(false);
            router.refresh();
        } else {
            alert("Failed to delete users");
            // Ideally use a toast notification here
        }
        setIsDeleting(false);
    };

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            {/* Bulk Action Header */}
            {selectedIds.length > 0 && (
                <div className="bg-blue-50 border-b border-blue-100 p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                    <span className="text-blue-700 font-medium">
                        {selectedIds.length} selected
                    </span>
                    <button
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors text-sm font-medium"
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
                            <th className="p-4 w-12">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === initialFaculty.length && initialFaculty.length > 0}
                                    onChange={toggleAll}
                                    className="rounded border-border bg-card text-primary focus:ring-ring"
                                />
                            </th>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Email</th>
                            <th className="p-4 font-medium">Subjects</th>
                            <th className="p-4 font-medium">Batches</th>
                            <th className="p-4 font-medium">Joined</th>
                            <th className="p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {initialFaculty.map((faculty) => (
                            <tr
                                key={faculty.id}
                                className={`hover:bg-muted/50 transition-colors ${selectedIds.includes(faculty.userId) ? 'bg-primary/5' : ''}`}
                            >
                                <td className="p-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(faculty.userId)}
                                        onChange={() => toggleSelection(faculty.userId)}
                                        className="rounded border-border bg-card text-primary focus:ring-ring"
                                    />
                                </td>
                                <td className="p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <User className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <span className="font-medium text-foreground">{faculty.user.name}</span>
                                </td>
                                <td className="p-4 text-muted-foreground">{faculty.user.email}</td>
                                <td className="p-4">
                                    {faculty.subjects.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {faculty.subjects.map((sub) => (
                                                <span
                                                    key={sub.id}
                                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded border border-blue-200"
                                                >
                                                    {sub.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">None</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {faculty.batches && faculty.batches.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {faculty.batches.map((b) => (
                                                <span key={b.id} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded border border-green-200">
                                                    {b.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">None</span>
                                    )}
                                </td>
                                <td className="p-4 text-muted-foreground">
                                    <FormattedTime date={faculty.user.createdAt} dateOnly />
                                </td>
                                <td className="p-4">
                                    <EditFacultyModal faculty={faculty} batches={batches} iconOnly />
                                </td>
                            </tr>
                        ))}
                        {initialFaculty.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                    No faculty members found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDelete}
                title="Delete Faculty Members"
                description={`Are you sure you want to delete ${selectedIds.length} faculty member(s)? This action cannot be undone.`}
                confirmText="Delete"
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
}
