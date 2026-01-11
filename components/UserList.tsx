"use client";

import { useState } from "react";
import { User, Student, Faculty } from "@prisma/client";
import { Trash2, RefreshCcw, Edit, User as UserIcon, Lock, Save, Loader2, X } from "lucide-react";
import { deleteUser, resetDevice, bulkDeleteUsers } from "@/actions/admin";
import { adminUpdateUser } from "@/actions/profile"; // Added usage here since modal is inlined

// --- Inlined AdminEditUserModal ---

interface AdminEditUserModalProps {
    user: { id: number; name: string; email: string };
    isOpen: boolean;
    onClose: () => void;
}

function AdminEditUserModal({ user, isOpen, onClose }: AdminEditUserModalProps) {
    const [name, setName] = useState(user.name);
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await adminUpdateUser(user.id, {
                name,
                password: password || undefined
            });
            onClose();
            alert("User updated successfully!");
        } catch (err) {
            alert("Failed to update user.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="font-bold text-lg dark:text-white">Edit User</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Read Only Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email (Read-Only)
                        </label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3 py-2 rounded-lg border bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 text-sm"
                        />
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name
                        </label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Reset Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="New password (optional)"
                                minLength={6}
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Leave blank to keep existing password.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- End Inlined Component ---



type StudentWithUser = Student & { user: User };
type FacultyWithUser = Faculty & { user: User };

// Discriminated Union for Props
type GenericUserListProps =
    | { type: "student"; users: StudentWithUser[]; }
    | { type: "faculty"; users: FacultyWithUser[]; };

export default function UserList(props: GenericUserListProps) {
    // Standardizing the user list for display
    // map data to common structure: id, name, email, extra info
    const displayData = props.users.map(u => {
        if (props.type === "student") {
            const student = u as StudentWithUser;
            return {
                id: student.id, // Entity ID (student.id)
                userId: student.user.id, // User ID
                name: student.user.name,
                email: student.user.email,
                details: `Roll: ${student.rollNumber} • Enroll: ${student.enrollmentNo}`,
                deviceHash: student.deviceHash,
                original: u
            };
        } else {
            const faculty = u as FacultyWithUser;
            return {
                id: faculty.id,
                userId: faculty.user.id,
                name: faculty.user.name,
                email: faculty.user.email,
                details: "Faculty Member",
                deviceHash: null,
                original: u
            };
        }
    });

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const toggleSelect = (userId: number, e: React.MouseEvent) => {
        // Shift + Click logic
        if (e.shiftKey && lastSelectedId !== null) {
            const start = displayData.findIndex(u => u.userId === lastSelectedId);
            const end = displayData.findIndex(u => u.userId === userId);

            if (start !== -1 && end !== -1) {
                const low = Math.min(start, end);
                const high = Math.max(start, end);
                const newSelected = new Set(selectedIds);
                for (let i = low; i <= high; i++) {
                    newSelected.add(displayData[i].userId);
                }
                setSelectedIds(newSelected);
                return;
            }
        }
        // Normal Click
        const newSelected = new Set(selectedIds);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedIds(newSelected);
        setLastSelectedId(userId);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === displayData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(displayData.map(d => d.userId)));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} users? This cannot be undone.`)) return;
        setIsDeleting(true);
        const ids = Array.from(selectedIds);
        await bulkDeleteUsers(ids);
        setSelectedIds(new Set());
        setLastSelectedId(null);
        setIsDeleting(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 overflow-hidden relative">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox" // Keep simple checkbox for select all
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={displayData.length > 0 && selectedIds.size === displayData.length}
                        onChange={handleSelectAll}
                    />
                    <h2 className="font-semibold text-gray-700 dark:text-gray-200">
                        Registered {props.type === "student" ? "Students" : "Faculty"} {selectedIds.size > 0 && <span className="text-sm font-normal text-blue-600 dark:text-blue-400">({selectedIds.size} selected)</span>}
                    </h2>
                </div>
                {selectedIds.size > 0 && (
                    <button
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-red-200 transition"
                    >
                        <Trash2 size={16} />
                        Delete ({selectedIds.size})
                    </button>
                )}
            </div>

            <div className="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {displayData.map((item) => {
                    const isSelected = selectedIds.has(item.userId);
                    return (
                        <div
                            key={item.userId}
                            onClick={(e) => {
                                if ((e.target as HTMLElement).closest('button')) return;
                                toggleSelect(item.userId, e);
                            }}
                            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition cursor-pointer select-none ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                        >
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={isSelected}
                                    onChange={() => { }}
                                    onClick={(e) => { e.stopPropagation(); toggleSelect(item.userId, e); }}
                                    readOnly
                                />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                    <p className="text-sm text-gray-500">{item.email}</p>
                                    <div className="flex gap-2 text-xs text-gray-400 mt-1">
                                        {item.details}
                                    </div>
                                    {item.deviceHash && (
                                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded inline-block mt-1">
                                            Device Registered
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingUser((item.original as any).user); }}
                                    className="text-blue-500 hover:text-blue-700 p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="Edit User"
                                >
                                    <Edit size={18} />
                                </button>

                                {props.type === "student" && (
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await resetDevice(item.id); // Note: resetDevice takes Student ID, not User ID
                                        }}
                                        className="text-orange-500 hover:text-orange-700 p-2 rounded-md hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                        title="Reset Device"
                                    >
                                        <RefreshCcw size={18} />
                                    </button>
                                )}

                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm("Delete user?")) return;
                                        await deleteUser(item.userId);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                    title="Delete User"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
                {displayData.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No {props.type === "student" ? "students" : "faculty"} found.</div>
                )}
            </div>

            {editingUser && (
                <AdminEditUserModal
                    user={{ id: editingUser.id, name: editingUser.name || "", email: editingUser.email }}
                    isOpen={!!editingUser}
                    onClose={() => setEditingUser(null)}
                />
            )}
        </div>
    );
}
