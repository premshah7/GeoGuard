import Scanner from "@/components/student/Scanner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { getStudentStatus } from "@/actions/student";

export default async function ScanPage() {
    // Fetch status server-side to prevent unauthorized scanning
    const studentStatus = await getStudentStatus();

    // Default to false if fetch fails (safe fail?) - Or maybe true to block? 
    // If null, user might not be student, but middleware checks that.
    // If we can't get status, checking Scanner internal logic will handle deviceHash check.
    const isResetRequested = studentStatus?.isDeviceResetRequested || false;

    return (
        <div className="min-h-screen bg-gray-950 p-6 flex flex-col">
            <div className="mb-6">
                <Link href="/student" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Scan QR Code</h1>
                    <p className="text-gray-400">Point your camera at the session QR code</p>
                </div>

                <Scanner isDeviceResetRequested={isResetRequested} />
            </div>
        </div>
    );
}
