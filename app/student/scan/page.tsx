import Scanner from "@/components/student/Scanner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
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

                <Scanner />
            </div>
        </div>
    );
}
