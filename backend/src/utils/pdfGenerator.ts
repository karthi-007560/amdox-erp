import PDFDocument from "pdfkit";

export interface PdfOptions {
    title: string;
    subtitle?: string;
    content: string;
    footer?: string;
}

export function generatePdfBuffer(
    options: PdfOptions
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const document = new PDFDocument({
            size: "A4",
            margins: {
                top: 50,
                bottom: 50,
                left: 50,
                right: 50,
            },
            bufferPages: true,
        });

        const chunks: Buffer[] = [];

        document.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
        });

        document.on("end", () => {
            resolve(Buffer.concat(chunks));
        });

        document.on("error", (error: Error) => {
            reject(error);
        });

        document.fontSize(20)
            .font("Helvetica-Bold")
            .text(options.title, {
                align: "center",
            });

        if (options.subtitle) {
            document.moveDown(0.5);

            document.fontSize(11)
                .font("Helvetica")
                .text(options.subtitle, {
                    align: "center",
                });
        }

        document.moveDown(2);

        document.fontSize(11)
            .font("Helvetica")
            .text(options.content, {
                align: "left",
                lineGap: 4,
            });

        if (options.footer) {
            document.moveDown(2);

            document.fontSize(9)
                .text(options.footer, {
                    align: "center",
                });
        }

        document.end();
    });
}