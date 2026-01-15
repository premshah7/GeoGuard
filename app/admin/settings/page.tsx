import { getSystemSettings } from "@/actions/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
    const settings = await getSystemSettings();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">System Settings</h1>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <SettingsForm initialSettings={settings} />
            </div>
        </div>
    );
}
