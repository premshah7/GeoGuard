"use client";

import { createContext, useContext, useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

interface FingerprintContextType {
    fingerprint: string | null;
    isLoading: boolean;
}

const FingerprintContext = createContext<FingerprintContextType>({
    fingerprint: null,
    isLoading: true,
});

export function FingerprintProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [fingerprint, setFingerprint] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const setFp = async () => {
            try {
                const fp = await FingerprintJS.load();
                const { visitorId } = await fp.get();
                setFingerprint(visitorId);
            } catch (error) {
                console.error("Failed to load fingerprint:", error);
            } finally {
                setIsLoading(false);
            }
        };

        setFp();
    }, []);

    return (
        <FingerprintContext.Provider value={{ fingerprint, isLoading }}>
            {children}
        </FingerprintContext.Provider>
    );
}

export const useFingerprint = () => useContext(FingerprintContext);
