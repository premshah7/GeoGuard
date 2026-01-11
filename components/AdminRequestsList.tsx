"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { approveDeviceReset, rejectDeviceReset } from "@/actions/requests";
import { Check, X, RefreshCw } from "lucide-react";

interface Request {
    id: number;
    user: {
        name: string;
        email: string;
    };
    rollNumber: string;
}

export default function AdminRequestsList({ requests }: { requests: Request[] }) {
    const router = useRouter();

    useEffect(() => {
        // Poll every 5 seconds to check for new requests
        const interval = setInterval(() => {
            router.refresh();
        }, 5000);

        return () => clearInterval(interval);
    }, [router]);

    if (requests.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>No pending requests.</p>
                <button
                    onClick={() => router.refresh()}
                    className="mt-4 text-xs text-blue-500 hover:text-blue-700 flex items-center justify-center gap-1 mx-auto"
                >
                    <RefreshCw size={12} /> Check Now
                </button>
            </div>
        );
    }

    return (
        <div className="divide-y dark:divide-gray-700">
            {requests.map((student) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{student.user.name}</p>
                        <p className="text-sm text-gray-500">{student.user.email}</p>
                        <p className="text-xs text-gray-400 mt-1">Roll: {student.rollNumber}</p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                await approveDeviceReset(student.id);
                                // router.refresh() is called in action, but we can also trigger here manually if needed? 
                                // Actually action `revalidatePath` handles it, but client might need a nudge if not using useFormState
                            }}
                            className="flex items-center gap-1 bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Check size={16} /> Approve
                        </button>

                        <button
                            onClick={async () => {
                                await rejectDeviceReset(student.id);
                            }}
                            className="flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                        >
                            <X size={16} /> Reject
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
