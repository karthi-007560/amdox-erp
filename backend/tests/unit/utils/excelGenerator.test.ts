import ExcelJS from "exceljs";

import {
    generateExcelBuffer,
} from "../../../src/utils/excelGenerator";

describe("Excel Generator Utility", () => {
    const columns = [
        { header: "Employee ID", key: "employeeId" as const },
        { header: "Name", key: "name" as const },
        { header: "Salary", key: "salary" as const },
    ];

    const rows = [
        { employeeId: "EMP001", name: "Pritam", salary: 25000 },
        { employeeId: "EMP002", name: "Rahul", salary: 30000 },
    ];

    async function readWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        return workbook;
    }

    it("should generate a valid Excel buffer", async () => {
        const buffer = await generateExcelBuffer(rows, columns);

        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(0);
    });

    it("should create a worksheet named Report by default", async () => {
        const buffer = await generateExcelBuffer(rows, columns);
        const workbook = await readWorkbook(buffer);

        expect(workbook.worksheets).toHaveLength(1);
        expect(workbook.worksheets[0].name).toBe("Report");
    });

    it("should use a custom worksheet name", async () => {
        const buffer = await generateExcelBuffer(
            rows,
            columns,
            "Employee Report"
        );

        const workbook = await readWorkbook(buffer);

        expect(workbook.worksheets[0].name).toBe("Employee Report");
    });

    it("should limit worksheet names to 31 characters", async () => {
        const longName = "A".repeat(40);

        const buffer = await generateExcelBuffer(
            rows,
            columns,
            longName
        );

        const workbook = await readWorkbook(buffer);

        expect(workbook.worksheets[0].name).toBe("A".repeat(31));
    });

    it("should create the correct column headers", async () => {
        const buffer = await generateExcelBuffer(rows, columns);
        const workbook = await readWorkbook(buffer);
        const worksheet = workbook.worksheets[0];

        expect(worksheet.getRow(1).values).toEqual([
            undefined,
            "Employee ID",
            "Name",
            "Salary",
        ]);
    });

    it("should write all supplied rows", async () => {
        const buffer = await generateExcelBuffer(rows, columns);
        const workbook = await readWorkbook(buffer);
        const worksheet = workbook.worksheets[0];

        expect(worksheet.rowCount).toBe(3);

        expect(worksheet.getRow(2).values).toEqual([
            undefined,
            "EMP001",
            "Pritam",
            25000,
        ]);

        expect(worksheet.getRow(3).values).toEqual([
            undefined,
            "EMP002",
            "Rahul",
            30000,
        ]);
    });

    it("should make the header row bold", async () => {
        const buffer = await generateExcelBuffer(rows, columns);
        const workbook = await readWorkbook(buffer);
        const worksheet = workbook.worksheets[0];

        expect(worksheet.getRow(1).font.bold).toBe(true);
    });

    it("should freeze the header row", async () => {
        const buffer = await generateExcelBuffer(rows, columns);
        const workbook = await readWorkbook(buffer);
        const worksheet = workbook.worksheets[0];

        expect(worksheet.views[0]).toMatchObject({
            state: "frozen",
            ySplit: 1,
        });
    });

    it("should use the default width of 20 when width is omitted", async () => {
        const buffer = await generateExcelBuffer(rows, columns);
        const workbook = await readWorkbook(buffer);
        const worksheet = workbook.worksheets[0];

        expect(worksheet.getColumn(1).width).toBe(20);
        expect(worksheet.getColumn(2).width).toBe(20);
        expect(worksheet.getColumn(3).width).toBe(20);
    });

    it("should respect custom column widths", async () => {
        const customColumns = [
            { header: "ID", key: "employeeId" as const, width: 15 },
            { header: "Name", key: "name" as const, width: 35 },
            { header: "Salary", key: "salary" as const, width: 18 },
        ];

        const buffer = await generateExcelBuffer(rows, customColumns);
        const workbook = await readWorkbook(buffer);
        const worksheet = workbook.worksheets[0];

        expect(worksheet.getColumn(1).width).toBe(15);
        expect(worksheet.getColumn(2).width).toBe(35);
        expect(worksheet.getColumn(3).width).toBe(18);
    });

    it("should generate a workbook with no data rows", async () => {
        const buffer = await generateExcelBuffer([], columns);
        const workbook = await readWorkbook(buffer);
        const worksheet = workbook.worksheets[0];

        expect(worksheet.rowCount).toBe(1);
        expect(worksheet.getRow(1).getCell(1).value).toBe("Employee ID");
    });

    it("should reject an empty columns array", async () => {
        await expect(
            generateExcelBuffer(rows, [])
        ).rejects.toThrow("At least one Excel column is required.");
    });

    it("should preserve null and zero values in rows", async () => {
        const testRows = [
            { employeeId: "EMP003", name: null, salary: 0 },
        ];

        const buffer = await generateExcelBuffer(
            testRows,
            columns
        );

        const workbook = await readWorkbook(buffer);
        const worksheet = workbook.worksheets[0];

        expect(worksheet.getRow(2).getCell(2).value).toBeNull();
        expect(worksheet.getRow(2).getCell(3).value).toBe(0);
    });
});
