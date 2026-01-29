"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ColumnMappingStepProps {
    data: string[][]; // Raw data: headers + rows
    onMap: (mapping: Record<string, string>) => void;
    userType: "STUDENT" | "FACULTY";
}

const ALL_FIELDS = [
    { key: "name", label: "Name", required: true, types: ["STUDENT", "FACULTY"] },
    { key: "email", label: "Email", required: true, types: ["STUDENT", "FACULTY"] },
    { key: "roll", label: "Roll No", required: false, types: ["STUDENT"] },
    { key: "enrollment", label: "Enrollment No", required: false, types: ["STUDENT"] },
    { key: "batch", label: "Batch", required: false, types: ["STUDENT"] },
];

export default function ColumnMappingStep({ data, onMap, userType }: ColumnMappingStepProps) {
    const headers = data[0] || [];
    const previewRows = data.slice(1, 6);

    // Map: System Field Key -> Source Header Name
    const [mapping, setMapping] = useState<Record<string, string>>({});

    // Auto-guess mapping on mount
    useEffect(() => {
        const initialMapping: Record<string, string> = {};

        headers.forEach((header, index) => {
            const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");

            if (h.includes("name") && !initialMapping["name"]) initialMapping["name"] = header;
            else if (h.includes("email") && !initialMapping["email"]) initialMapping["email"] = header;
            else if ((h.includes("roll") || h === "id") && !initialMapping["roll"]) initialMapping["roll"] = header;
            else if (h.includes("enroll") && !initialMapping["enrollment"]) initialMapping["enrollment"] = header;
            else if (h.includes("batch") && !initialMapping["batch"]) initialMapping["batch"] = header;
        });

        setMapping(initialMapping);
        onMap(initialMapping);
    }, [headers]); // Only run when headers change

    const handleMappingChange = (systemKey: string, headerName: string) => {
        const newMapping = { ...mapping };
        if (headerName === "ignore") {
            delete newMapping[systemKey];
        } else {
            newMapping[systemKey] = headerName;
        }
        setMapping(newMapping);
        onMap(newMapping);
    };

    const fieldsToShow = ALL_FIELDS.filter(f => f.types.includes(userType));

    return (
        <div className="space-y-6">
            <div className="text-sm text-zinc-400">
                Map the columns from your file to the system fields.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldsToShow.map((field) => (
                    <Card key={field.key} className="p-4 border border-zinc-800 bg-zinc-900/50 shadow-sm">
                        <div className="flex flex-col space-y-3">
                            <Label className="font-semibold text-zinc-200">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </Label>

                            <select
                                className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                value={mapping[field.key] || "ignore"}
                                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                            >
                                <option value="ignore" className="text-zinc-500 bg-zinc-950">-- Ignore --</option>
                                {headers.map((h, i) => (
                                    <option key={i + h} value={h} className="bg-zinc-950">
                                        {h}
                                    </option>
                                ))}
                            </select>

                            {/* Preview Value */}
                            <div className="text-xs text-zinc-500 mt-1 truncate">
                                Preview: <span className="text-zinc-300">
                                    {mapping[field.key] ?
                                        (previewRows[0]?.[headers.indexOf(mapping[field.key])] || "-")
                                        : "Not mapped"}
                                </span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="mt-6 border border-zinc-800 bg-zinc-900/50 overflow-hidden">
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-950/50 text-zinc-400">
                            <tr>
                                {headers.map((h, i) => (
                                    <th key={i} className="px-4 py-3 font-medium border-b border-zinc-800 whitespace-nowrap">
                                        {h}
                                        {Object.entries(mapping).find(([k, v]) => v === h) && (
                                            <span className="block text-xs font-normal text-blue-500 mt-1">
                                                → {ALL_FIELDS.find(f => f.key === Object.entries(mapping).find(([k, v]) => v === h)?.[0])?.label}
                                            </span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {previewRows.map((row, i) => (
                                <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                                    {row.map((cell, j) => (
                                        <td key={j} className="px-4 py-3 text-zinc-300 max-w-[200px] truncate">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
