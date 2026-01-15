"use client";

import { createContext, useContext, useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

const FingerprintContext = createContext<string | null>(null);

export function useFingerprint() {
    return useContext(FingerprintContext);
}

export function FingerprintProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [visitorId, setVisitorId] = useState<string | null>(null);

    useEffect(() => {
        const setFp = async () => {
            const fp = await FingerprintJS.load();
            const { visitorId } = await fp.get();
            setVisitorId(visitorId);
        };

        setFp();
    }, []);

    return (
        <FingerprintContext.Provider value={visitorId}>
            {children}
        </FingerprintContext.Provider>
    );
}
