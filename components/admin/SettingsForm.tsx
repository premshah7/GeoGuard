"use client";

import { updateSystemSettings, getCurrentIp } from "@/actions/settings";
import { Loader2, Save, Globe, Wand2, Timer } from "lucide-react";
import { useState } from "react";

const PRESET_DURATIONS = [
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "1 hour", value: 60 },
    { label: "1.5 hrs", value: 90 },
    { label: "2 hours", value: 120 },
    { label: "3 hours", value: 180 },
];

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
    const [prefix, setPrefix] = useState(initialSettings.allowedIpPrefix || "");
    const [autoEndMinutes, setAutoEndMinutes] = useState<number>(
        initialSettings.sessionAutoEndMinutes ?? 60
    );

    const handleAutoConfig = async () => {
        try {
            const ip = await getCurrentIp();
            const parts = ip.split(".");
            if (parts.length === 4) {
                setPrefix(`${parts[0]}.${parts[1]}.${parts[2]}.`);
                setMessage({ text: "IP Detected & Applied!", ok: true });
            } else {
                setPrefix(ip);
            }
        } catch (error) {
            console.error("Failed to detect IP", error);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setMessage(null);
        // Inject the controlled numeric state since range inputs aren't
        // always picked up correctly from FormData in React controlled inputs.
        formData.set("sessionAutoEndMinutes", String(autoEndMinutes));
        const result = await updateSystemSettings(formData);
        setMessage(
            result.success
                ? { text: "Settings saved successfully.", ok: true }
                : { text: result.error ?? "Failed to update settings.", ok: false }
        );
        setLoading(false);
    };

    return (
        <form action={handleSubmit} className="space-y-8 max-w-lg">

            {/* ── IP Restriction ────────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-lg">
                    <Globe className="w-7 h-7 text-blue-600 shrink-0" />
                    <div>
                        <h3 className="text-base font-semibold text-foreground">IP Restriction</h3>
                        <p className="text-sm text-muted-foreground">Limit attendance to a specific network.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isIpCheckEnabled"
                        name="isIpCheckEnabled"
                        defaultChecked={initialSettings.isIpCheckEnabled}
                        className="w-5 h-5 rounded border-input bg-background text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isIpCheckEnabled" className="text-foreground font-medium">
                        Enable IP Check
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Allowed IP Prefix (e.g., 192.168.1.)
                    </label>
                    <div className="flex gap-2">
                        <input
                            name="allowedIpPrefix"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                            placeholder="192.168.1."
                            className="flex-1 bg-background border border-input rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                        />
                        <button
                            type="button"
                            onClick={handleAutoConfig}
                            className="px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg flex items-center gap-2 transition-colors border border-border"
                            title="Auto-detect current network"
                        >
                            <Wand2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Auto Config</span>
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Only students with IPs starting with this prefix can mark attendance.
                    </p>
                </div>
            </div>

            {/* ── Session Auto-End ──────────────────────────────────── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 border border-border rounded-lg">
                    <Timer className="w-7 h-7 text-amber-500 shrink-0" />
                    <div>
                        <h3 className="text-base font-semibold text-foreground">Session Auto-End</h3>
                        <p className="text-sm text-muted-foreground">
                            Automatically close active sessions if faculty forgets to end them.
                        </p>
                    </div>
                </div>

                {/* Quick preset buttons */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Quick Presets
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {PRESET_DURATIONS.map((preset) => (
                            <button
                                key={preset.value}
                                type="button"
                                onClick={() => setAutoEndMinutes(preset.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                    autoEndMinutes === preset.value
                                        ? "bg-amber-500 border-amber-500 text-white shadow"
                                        : "bg-background border-border text-muted-foreground hover:border-amber-400 hover:text-foreground"
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setAutoEndMinutes(0)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                autoEndMinutes === 0
                                    ? "bg-red-500 border-red-500 text-white shadow"
                                    : "bg-background border-border text-muted-foreground hover:border-red-400 hover:text-foreground"
                            }`}
                        >
                            Disabled
                        </button>
                    </div>
                </div>

                {/* Slider for fine-grained control */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">
                            Timeout Duration
                        </label>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                            autoEndMinutes === 0
                                ? "text-red-500 bg-red-500/10"
                                : "text-amber-500 bg-amber-500/10"
                        }`}>
                            {autoEndMinutes === 0
                                ? "Disabled"
                                : autoEndMinutes >= 60
                                    ? `${(autoEndMinutes / 60).toFixed(autoEndMinutes % 60 === 0 ? 0 : 1)} hr${autoEndMinutes === 60 ? "" : "s"}`
                                    : `${autoEndMinutes} min`}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={240}
                        step={5}
                        value={autoEndMinutes}
                        onChange={(e) => setAutoEndMinutes(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Off</span>
                        <span>1h</span>
                        <span>2h</span>
                        <span>3h</span>
                        <span>4h</span>
                    </div>
                </div>

                {/* Custom numeric input */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Or enter exact minutes
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={0}
                            max={480}
                            value={autoEndMinutes}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                setAutoEndMinutes(Number.isFinite(v) ? Math.max(0, Math.min(480, v)) : 0);
                            }}
                            className="w-28 bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring text-sm"
                        />
                        <span className="text-sm text-muted-foreground">minutes (0 = disabled)</span>
                    </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                    The cron job runs every minute on Vercel. A session started at 10:00 AM
                    with a 60-minute timeout will be auto-closed between 11:00 and 11:01 AM.
                </p>
            </div>

            {/* ── Status message ────────────────────────────────────── */}
            {message && (
                <div className={`p-3 rounded-lg text-sm border ${
                    message.ok
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
                }`}>
                    {message.text}
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
