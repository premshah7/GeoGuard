"use client";

import { createSession } from "@/actions/session";
import { Loader2, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StartSessionButton({ subjectId }: { subjectId: number }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleStart = async () => {
        setLoading(true);
        const result = await createSession(subjectId);
        if (result.success) {
            router.push(`/faculty/session/${result.sessionId}`);
        } else {
            alert(result.error);
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleStart}
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Start Session
        </button>
    );
}
