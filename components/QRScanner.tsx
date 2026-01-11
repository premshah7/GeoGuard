"use client";

import { Scanner } from '@yudiel/react-qr-scanner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
    const [paused, setPaused] = useState(false);

    const handleScan = (result: any) => {
        if (result && !paused) {
            // @yudiel/react-qr-scanner returns an array of results or single object depending on version
            // The raw value is usually in result[0].rawValue if array
            const rawValue = Array.isArray(result) ? result[0]?.rawValue : result?.rawValue;

            if (rawValue) {
                setPaused(true); // Pause scanning to prevent multiple hits
                onScan(rawValue);
                // We don't automatically unpause, parent handles state change (e.g. navigation or success modal)
            }
        }
    };

    return (
        <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border dark:border-gray-700 bg-black relative">
            <Scanner
                onScan={handleScan}
                onError={(error) => {
                    console.error("Scanner Error:", error);
                    let errorMessage = "Camera error: " + (error as Error).message;

                    // Common camera error mapping
                    const errStr = (error as any)?.name || (error as any)?.toString() || "";
                    if (errStr.includes("NotAllowedError") || errStr.includes("PermissionDeniedError")) {
                        errorMessage = "Camera access denied. Please allow camera permissions in your browser settings.";
                    } else if (errStr.includes("NotFoundError") || errStr.includes("DevicesNotFoundError")) {
                        errorMessage = "No camera found on this device.";
                    } else if (errStr.includes("NotReadableError") || errStr.includes("TrackStartError")) {
                        errorMessage = "Camera is in use by another application.";
                    } else if (errStr.includes("OverconstrainedError")) {
                        errorMessage = "Camera settings not supported.";
                    } else if (errStr.includes("StreamApiNotSupportedError")) {
                        errorMessage = "Camera access not supported in this browser.";
                    }

                    if (onError) onError(errorMessage);
                }}
                // components={{
                //     audio: false,
                //     onOff: true,
                //     torch: true,
                //     zoom: true,
                //     finder: true
                // }}
                styles={{
                    container: { width: '100%', aspectRatio: '1/1' }
                }}
                constraints={{
                    facingMode: 'environment'
                }}
                allowMultiple={true} // We handle "pausing" manually via state
                scanDelay={500}
            />

            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                    Point camera at QR code
                </span>
            </div>
        </div>
    );
}
