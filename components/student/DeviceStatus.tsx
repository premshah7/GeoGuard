"use client";

import { useEffect, useState } from "react";
import { getStudentStatus } from "@/actions/student";
import { Smartphone } from "lucide-react";
import RequestResetButton from "@/components/student/RequestResetButton";
import { useRouter } from "next/navigation";

interface DeviceStatusProps {
    initialDeviceHash: string | null;
    initialDeviceId: string | null;
    initialIsRequested: boolean;
}

export default function DeviceStatus({ initialDeviceHash, initialDeviceId, initialIsRequested }: DeviceStatusProps) {
    const router = useRouter();
    const [deviceHash, setDeviceHash] = useState(initialDeviceHash);
    const [deviceId, setDeviceId] = useState(initialDeviceId);
    const [isRequested, setIsRequested] = useState(initialIsRequested);

    // Polling logic to check for status updates
    useEffect(() => {
        const interval = setInterval(async () => {
            // Only poll if tab is visible to save resources
            if (document.visibilityState === "visible") {
                const status = await getStudentStatus();
                if (status) {
                    // Check if state has changed from what we currently display
                    const hashChanged = status.deviceHash !== deviceHash;
                    const idChanged = status.deviceId !== deviceId;
                    const requestChanged = status.isDeviceResetRequested !== isRequested;

                    if (hashChanged || requestChanged || idChanged) {
                        setDeviceHash(status.deviceHash);
                        setDeviceId(status.deviceId);
                        setIsRequested(status.isDeviceResetRequested);

                        // If device became unbound (reset approved), refresh the whole page
                        // so the "Mark Attendance" button and other logic updates too
                        if (hashChanged) {
                            router.refresh();
                        }
                    }
                }
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [deviceHash, deviceId, isRequested, router]);

    return (
        <div className={`p-4 rounded-xl border ${deviceHash ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
            <div className="flex items-center gap-3">
                <Smartphone className={`w-5 h-5 ${deviceHash ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
                <div>
                    <div className={`font-medium ${deviceHash ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        {deviceHash ? 'Device Bound' : 'Device Not Bound'}
                    </div>
                    {deviceHash && deviceId && (
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5 mb-0.5">
                            ID: {deviceId.substring(0, 8)}...
                        </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                        {deviceHash ? 'You can mark attendance.' : 'Next scan will bind this device.'}
                    </div>
                    {deviceHash && (
                        <RequestResetButton isRequested={isRequested} />
                    )}
                </div>
            </div>
        </div>
    );
}
