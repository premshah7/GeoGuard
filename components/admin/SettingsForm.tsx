"use client";

import { updateSystemSettings } from "@/actions/settings";
import { Loader2, Save, Globe } from "lucide-react";
import { useState } from "react";

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setMessage("");

        const result = await updateSystemSettings(formData);

        if (result.success) {
            setMessage("Settings updated successfully");
        } else {
            setMessage("Failed to update settings");
        }
        setLoading(false);
    };

    return (
        <form action={handleSubmit} className="space-y-6 max-w-lg">
            <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Globe className="w-8 h-8 text-blue-400" />
                <div>
                    <h3 className="text-lg font-medium text-white">IP Restriction</h3>
                    <p className="text-sm text-gray-400">Limit attendance to a specific network.</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="isIpCheckEnabled"
                    name="isIpCheckEnabled"
                    defaultChecked={initialSettings.isIpCheckEnabled}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isIpCheckEnabled" className="text-gray-300 font-medium">
                    Enable IP Check
                </label>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Allowed IP Prefix (e.g., 192.168.1.)
                </label>
                <input
                    name="allowedIpPrefix"
                    defaultValue={initialSettings.allowedIpPrefix}
                    placeholder="192.168.1."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Only students with IPs starting with this prefix will be able to mark attendance.
                </p>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes("success") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
            </button>
        </form>
    );
}
