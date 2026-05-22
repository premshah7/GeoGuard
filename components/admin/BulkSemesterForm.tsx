"use client";

import { useState } from "react";
import { GraduationCap, ArrowRight, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { bulkUpdateSemester } from "@/actions/admin";

export default function BulkSemesterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [fromSem, setFromSem] = useState("1");
    const [toSem, setToSem] = useState("2");
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (fromSem === toSem) {
            toast.error("Source and target semesters cannot be the same");
            return;
        }

        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            setShowConfirm(false);
            setMessage(null);

            const res = await bulkUpdateSemester(parseInt(fromSem), parseInt(toSem));

            if (res.error) {
                setMessage({ type: "error", text: res.error });
                toast.error(res.error);
            } else {
                const count = res.count ?? 0;
                setMessage({
                    type: "success",
                    text: `Successfully updated ${count} student${count === 1 ? "" : "s"} from Semester ${fromSem} to Semester ${toSem}.`
                });
                toast.success(`Successfully updated ${count} students`);
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to perform bulk semester update" });
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-lg">
            <div className="flex items-center gap-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <GraduationCap className="w-8 h-8 text-primary" />
                <div>
                    <h3 className="text-lg font-medium text-foreground">Bulk Semester Update</h3>
                    <p className="text-sm text-muted-foreground">Promote or reassign a group of students at once.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Source Semester
                        </label>
                        <select
                            value={fromSem}
                            onChange={(e) => setFromSem(e.target.value)}
                            disabled={isLoading}
                            className="w-full h-12 bg-background border border-input rounded-lg px-4 text-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring appearance-none"
                        >
                            {semesters.map((sem) => (
                                <option key={`from-${sem}`} value={sem}>
                                    Semester {sem}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="hidden sm:flex justify-center pt-8">
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Target Semester
                        </label>
                        <select
                            value={toSem}
                            onChange={(e) => setToSem(e.target.value)}
                            disabled={isLoading}
                            className="w-full h-12 bg-background border border-input rounded-lg px-4 text-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring appearance-none"
                        >
                            {semesters.map((sem) => (
                                <option key={`to-${sem}`} value={sem}>
                                    Semester {sem}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border">
                    <p>This action will change the semester field of all active students matching the Source Semester to the Target Semester.</p>
                </div>

                {message && (
                    <div
                        className={`flex gap-3 p-3 rounded-lg text-sm border ${
                            message.type === "success"
                                ? "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20"
                                : "bg-destructive/15 text-destructive border-destructive/20"
                        }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-destructive" />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || fromSem === toSem}
                    className="w-full px-6 py-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                        </>
                    ) : (
                        <>
                            <GraduationCap className="w-4 h-4" />
                            Update Semesters
                        </>
                    )}
                </button>
            </form>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md rounded-xl border border-destructive/20 shadow-lg overflow-hidden scale-in duration-200">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-destructive">
                                <div className="p-3 bg-destructive/10 rounded-full">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold">Confirm Semester Update</h3>
                            </div>

                            <div className="space-y-2">
                                <p className="text-muted-foreground">
                                    Are you sure you want to move all students from{" "}
                                    <strong className="text-foreground">Semester {fromSem}</strong> to{" "}
                                    <strong className="text-foreground">Semester {toSem}</strong>?
                                </p>
                                <p className="text-sm text-yellow-500/95 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                                    This operation will modify multiple student records in the database. Please double check that you have selected the correct semesters.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    Confirm Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
