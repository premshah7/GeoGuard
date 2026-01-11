import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import ProfileSettings from "@/components/ProfileSettings";
import SystemSettingsForm from "@/components/SystemSettingsForm";

export default async function AdminSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        redirect("/api/auth/signin");
    }

    return (
        <div className="space-y-8 pb-12">
            <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                <Shield className="text-blue-600" /> Admin Settings
            </h1>

            {/* System Settings (Network, etc.) */}
            <SystemSettingsForm />

            {/* My Profile Section */}
            <div>
                <h2 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
                    <Shield size={20} className="text-blue-500" /> My Admin Profile
                </h2>
                <ProfileSettings
                    initialName={session.user.name || ""}
                    email={session.user.email || ""}
                />
            </div>
        </div>
    );
}
