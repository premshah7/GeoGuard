export function parseCSV(file: File): Promise<{ data: any[]; errors: string[] }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) {
                resolve({ data: [], errors: ["File is empty"] });
                return;
            }

            try {
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
                if (lines.length < 2) {
                    resolve({ data: [], errors: ["CSV file must have a header row and at least one data row"] });
                    return;
                }

                const headers = lines[0].split(",").map(header => header.trim().replace(/^"|"$/g, ''));
                const data: any[] = [];
                const errors: string[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    // Handle quoted values correctly (simple regex approach for standard CSVs)
                    // This regex matches: "quoted value" OR non-comma-value
                    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
                    const matches = [];
                    let match;
                    while ((match = regex.exec(line)) !== null) {
                        // The first match is the separator+value, capture group 1 is the value
                        if (match[1] !== undefined) {
                            matches.push(match[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
                        }
                    }

                    // Simple fallback if regex fails or for simple cases (split by comma)
                    const values = line.includes('"') ? matches : line.split(",");

                    if (values.length !== headers.length) {
                        // Attempt simple split if regex parsing didn't align (fallback)
                        const simpleValues = line.split(",").map(value => value.trim());
                        if (simpleValues.length === headers.length) {
                            const row: any = {};
                            headers.forEach((header, index) => {
                                row[header] = simpleValues[index];
                            });
                            data.push(row);
                            continue;
                        }

                        errors.push(`Row ${i + 1}: Column count mismatch (Expected ${headers.length}, got ${values.length})`);
                        continue;
                    }

                    const row: any = {};
                    headers.forEach((header, index) => {
                        let val = values[index];
                        if (typeof val === 'string') val = val.trim();
                        row[header] = val;
                    });
                    data.push(row);
                }

                resolve({ data, errors });
            } catch (err: any) {
                reject(err);
            }
        };

        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
    });
}
