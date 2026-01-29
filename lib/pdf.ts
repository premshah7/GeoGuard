// @ts-ignore
import PDFParser from "pdf2json";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true); // 1 = text only

        pdfParser.on("pdfParser_dataError", (errData: any) => {
            console.error("PDF Parser Error:", errData.parserError);
            reject(new Error(errData.parserError));
        });

        pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
            try {
                // Config 1 gives simple text content
                const rawText = pdfParser.getRawTextContent();
                resolve(rawText);
            } catch (e) {
                reject(e);
            }
        });

        pdfParser.parseBuffer(buffer);
    });
}

export async function parsePdfToTable(buffer: Buffer): Promise<string[][]> {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on("pdfParser_dataError", (errorData: any) => {
            reject(new Error(errorData.parserError));
        });

        pdfParser.on("pdfParser_dataReady", (parsedPdfData: any) => {
            try {
                const allRows: string[][] = [];

                parsedPdfData.Pages.forEach((page: any) => {
                    const texts = page.Texts;
                    const rowsMap: Record<string, { x: number; text: string }[]> = {};
                    const tolerance = 0.5;

                    texts.forEach((textItem: any) => {
                        const yPosition = textItem.y;
                        const textContent = decodeURIComponent(textItem.R[0].T);
                        const existingRowY = Object.keys(rowsMap).find(key => Math.abs(parseFloat(key) - yPosition) < tolerance);
                        const rowY = existingRowY ?? yPosition.toString();

                        if (!rowsMap[rowY]) {
                            rowsMap[rowY] = [];
                        }

                        rowsMap[rowY].push({ x: textItem.x, text: textContent });
                    });

                    const sortedYPositions = Object.keys(rowsMap).sort((a, b) => parseFloat(a) - parseFloat(b));

                    sortedYPositions.forEach((yPosition) => {
                        const textItemsInRow = rowsMap[yPosition as keyof typeof rowsMap];
                        if (textItemsInRow) {
                            textItemsInRow.sort((a, b) => a.x - b.x);
                            allRows.push(textItemsInRow.map(item => item.text));
                        }
                    });
                });
                resolve(allRows);
            } catch (error) {
                reject(error);
            }
        });

        pdfParser.parseBuffer(buffer);
    });
}
