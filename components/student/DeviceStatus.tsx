"use client";

import { useEffect, useState } from "react";
import { getStudentStatus } from "@/actions/student";
import { Smartphone } from "lucide-react";
import RequestResetButton from "@/components/student/RequestResetButton";
import { useRouter } from "next/navigation";

interface DeviceStatusProps {
    initialDeviceHash: string | null;
    initialIsRequested: boolean;
}

export default function DeviceStatus({ initialDeviceHash, initialIsRequested }: DeviceStatusProps) {
    const router = useRouter();
    const [deviceHash, setDeviceHash] = useState(initialDeviceHash);
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
                    const requestChanged = status.isDeviceResetRequested !== isRequested;

                    if (hashChanged || requestChanged) {
                        setDeviceHash(status.deviceHash);
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
    }, [deviceHash, isRequested, router]);

    return (
        <div className={`p-4 rounded-xl border ${deviceHash ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
            <div className="flex items-center gap-3">
                <Smartphone className={`w-5 h-5 ${deviceHash ? 'text-green-400' : 'text-yellow-400'}`} />
                <div>
                    <div className={`font-medium ${deviceHash ? 'text-green-400' : 'text-yellow-400'}`}>
                        {deviceHash ? 'Device Bound' : 'Device Not Bound'}
                    </div>
                    <div className="text-xs text-gray-400">
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
