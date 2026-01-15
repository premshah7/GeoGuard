import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
                <p className="text-gray-400 mb-8">
                    You don't have permission to access this resource. Please contact your
                    administrator if you believe this is a mistake.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors"
                >
                    Return Home
                </Link>
                <div className="mt-4 flex justify-center">
                    <LogoutButton className="w-auto justify-center" />
                </div>
            </div>
        </div >
    );
}
