"use client";

import { useEffect, useState } from "react";

type Props = {
    date: Date | string;
    includeSeconds?: boolean;
    dateOnly?: boolean;
    className?: string;
};

export default function FormattedTime({ date, includeSeconds = false, dateOnly = false, className = "" }: Props) {
    const [formatted, setFormatted] = useState<string>("");

    useEffect(() => {
        if (!date) return;

        const parsedDate = new Date(date);

        if (dateOnly) {
            setFormatted(parsedDate.toLocaleDateString());
        } else {
            setFormatted(parsedDate.toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                second: includeSeconds ? 'numeric' : undefined,
            }));
        }
    }, [date, includeSeconds, dateOnly]);

    // Render a placeholder or empty string on server/initial render to avoid hydration mismatch
    // Or render the server time if we accept a small flash, but empty is safer for exact mismatch.
    if (!formatted) return <span className={`opacity-0 ${className}`}>--/--/----</span>;

    return <span className={className}>{formatted}</span>;
}
