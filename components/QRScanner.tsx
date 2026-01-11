"use client";

import { Scanner } from '@yudiel/react-qr-scanner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: unknown) => void;
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
                    console.error(error);
                    if (onError) onError(error);
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
