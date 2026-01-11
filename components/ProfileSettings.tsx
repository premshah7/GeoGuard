"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/profile";
import { Save, User, Lock, Loader2 } from "lucide-react";

interface ProfileSettingsProps {
    initialName: string;
    email: string; // Read only
}

export default function ProfileSettings({ initialName, email }: ProfileSettingsProps) {
    const [name, setName] = useState(initialName);
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await updateProfile({ name, password });

            // Clear password field on success
            if (password) setPassword("");

            alert("Profile updated successfully!");
        } catch (err) {
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 max-w-2xl">
            <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
                <User className="text-blue-500" />
                Profile Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email (Read Only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Full Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                            minLength={6}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}
