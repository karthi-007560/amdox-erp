import ExcelJS from "exceljs";

export interface ExcelColumn<T extends Record<string, unknown>> {
    header: string;
    key: keyof T & string;
    width?: number;
}

export async function generateExcelBuffer<
    T extends Record<string, unknown>
>(
    rows: T[],
    columns: ExcelColumn<T>[],
    sheetName = "Report"
): Promise<Buffer> {
    if (columns.length === 0) {
        throw new Error("At least one Excel column is required.");
    }

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Amdox ERP";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(
        sheetName.slice(0, 31)
    );

    worksheet.columns = columns.map((column) => ({
        header: column.header,
        key: column.key,
        width: column.width ?? 20,
    }));

    worksheet.addRows(rows);

    worksheet.getRow(1).font = {
        bold: true,
    };

    worksheet.views = [
        {
            state: "frozen",
            ySplit: 1,
        },
    ];

    const result = await workbook.xlsx.writeBuffer();

    return Buffer.from(result);
}