import {
    generateExcelBuffer,
    type ExcelColumn,
} from "../../utils/excelGenerator.js";

import {
    generatePdfBuffer,
    type PdfOptions,
} from "../../utils/pdfGenerator.js";

export async function exportToExcel<
    T extends Record<string, unknown>
>(
    rows: T[],
    columns: ExcelColumn<T>[],
    sheetName = "Report"
): Promise<Buffer> {
    return generateExcelBuffer(
        rows,
        columns,
        sheetName
    );
}

export async function exportToPdf(
    options: PdfOptions
): Promise<Buffer> {
    return generatePdfBuffer(options);
}