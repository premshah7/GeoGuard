import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileSettings from "@/components/ProfileSettings";

export default async function FacultySettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "FACULTY") {
        redirect("/api/auth/signin");
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
            <ProfileSettings
                initialName={session.user.name || ""}
                email={session.user.email || ""}
            />
        </div>
    );
}
