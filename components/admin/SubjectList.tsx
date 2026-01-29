"use client";

import { useState } from "react";
import { Users, BookOpen, GraduationCap, Edit, Trash2 } from "lucide-react";
import SubjectEnrollment from "./SubjectEnrollment";
import EditSubjectModal from "./EditSubjectModal";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { deleteSubject } from "@/actions/subject";

type Subject = {
    id: number;
    name: string;
    faculty: {
        id: number;
        user: { name: string };
    };
    _count: {
        students: number;
    };
    batches?: {
        id: number;
        name: string;
        _count: {
            students: number;
        }
    }[];
};

type Faculty = {
    id: number;
    user: {
        name: string;
    };
};

export default function SubjectList({ subjects, facultyList }: { subjects: Subject[], facultyList: Faculty[] }) {
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    // State for delete confirmation
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = (subject: Subject) => {
        setSubjectToDelete(subject);
    };

    const confirmDelete = async () => {
        if (!subjectToDelete) return;

        setIsDeleting(true);
        const result = await deleteSubject(subjectToDelete.id);

        if (result?.error) {
            alert(result.error);
        }

        setIsDeleting(false);
        setSubjectToDelete(null);
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => (
                    <div
                        key={subject.id}
                        className="bg-card border border-border rounded-xl p-6 hover:border-sidebar-accent transition-colors group relative shadow-sm"
                    >
                        {/* Actions (Top Right) */}
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setEditingSubject(subject)}
                                className="p-2 bg-muted hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors border border-border"
                                title="Edit Subject"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDeleteClick(subject)}
                                className="p-2 bg-muted hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors border border-border"
                                title="Delete Subject"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-foreground mb-2 pr-12 truncate" title={subject.name}>{subject.name}</h3>

                        <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>Faculty: <span className="text-foreground font-medium">{subject.faculty.user.name}</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <GraduationCap className="w-4 h-4" />
                                <span>
                                    Students:
                                    <span className="text-foreground font-medium ml-1">
                                        {(subject._count.students + (subject.batches?.reduce((acc, b) => acc + b._count.students, 0) || 0))}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedSubject(subject)}
                            className="w-full py-2 bg-secondary hover:bg-muted text-secondary-foreground rounded-lg text-sm font-medium transition-colors border border-border"
                        >
                            Manage Enrollment
                        </button>
                    </div>
                ))}

                {subjects.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 border border-border border-dashed rounded-xl">
                        No subjects found. Create one to get started.
                    </div>
                )}
            </div>

            {selectedSubject && (
                <SubjectEnrollment
                    subjectId={selectedSubject.id}
                    subjectName={selectedSubject.name}
                    isOpen={!!selectedSubject}
                    onClose={() => setSelectedSubject(null)}
                />
            )}

            {editingSubject && (
                <EditSubjectModal
                    subject={editingSubject}
                    isOpen={!!editingSubject}
                    onClose={() => setEditingSubject(null)}
                    facultyList={facultyList}
                />
            )}

            <ConfirmDialog
                isOpen={!!subjectToDelete}
                onClose={() => setSubjectToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Subject"
                description={`Are you sure you want to delete "${subjectToDelete?.name}"? This will permanently delete all associated sessions and attendance records.`}
                confirmText="Delete Subject"
                loading={isDeleting}
                variant="danger"
            />
        </>
    );
}
