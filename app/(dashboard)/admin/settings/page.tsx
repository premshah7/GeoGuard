import { getSystemSettings } from "@/actions/settings";
import SettingsForm from "@/components/admin/SettingsForm";
import BulkSemesterForm from "@/components/admin/BulkSemesterForm";

export default async function SettingsPage() {
    const settings = await getSystemSettings();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-foreground">System Settings</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <SettingsForm initialSettings={settings} />
                </div>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <BulkSemesterForm />
                </div>
            </div>
        </div>
    );
}
