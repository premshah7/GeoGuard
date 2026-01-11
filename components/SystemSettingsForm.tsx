"use client";

import { useState, useEffect } from "react";
import { getSystemSettings, updateSystemSettings } from "@/app/(dashboard)/admin/settings/actions";
import { Save, Wifi, Info, Loader2 } from "lucide-react";

export default function SystemSettingsForm() {
    const [ipPrefix, setIpPrefix] = useState("");
    const [enabled, setEnabled] = useState(false);
    const [currentIp, setCurrentIp] = useState("Loading...");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch Settings
        getSystemSettings().then(res => {
            setIpPrefix(res.allowedIpPrefix || "");
            setEnabled(res.isIpCheckEnabled);
            setLoading(false);
        });

        // Fetch Current IP (Client Side)
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setCurrentIp(data.ip))
            .catch(() => setCurrentIp("Unknown"));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await updateSystemSettings(ipPrefix, enabled);
        setSaving(false);
        alert("Settings Saved!");
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700 max-w-2xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white">
                <Wifi size={20} className="text-blue-500" /> Network Security
            </h2>

            <div className="space-y-6">
                {/* Enable Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium dark:text-gray-200">Enforce IP Restriction</p>
                        <p className="text-sm text-gray-500">Only allow attendance marking from allowed IP range.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* IP Configuration */}
                <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Allowed IP Prefix / Address</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={ipPrefix}
                            onChange={(e) => setIpPrefix(e.target.value)}
                            placeholder="e.g. 203.115.10."
                            className="flex-1 p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-600 dark:text-white"
                        />
                        <button
                            onClick={() => setIpPrefix(currentIp)}
                            className="text-sm text-blue-600 hover:underline px-2"
                        >
                            Use Current IP
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Info size={12} /> Your Current Public IP: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{currentIp}</span>
                    </p>
                </div>

                <div className="pt-4 border-t dark:border-gray-700">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
