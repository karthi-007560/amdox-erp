
import { processPayrollService } from "../services/hr/payrollEngine.js";

export type PayrollJobInput = Parameters<
    typeof processPayrollService
>[0];

export interface PayrollJobResult {
    total: number;
    successful: number;
    failed: number;
    results: Awaited<
        ReturnType<typeof processPayrollService>
    >[];
    errors: string[];
}

export async function runPayrollJob(
    payrolls: PayrollJobInput[]
): Promise<PayrollJobResult> {
    const result: PayrollJobResult = {
        total: payrolls.length,
        successful: 0,
        failed: 0,
        results: [],
        errors: [],
    };

    for (const payroll of payrolls) {
        try {
            const processedPayroll =
                await processPayrollService(payroll);

            result.results.push(processedPayroll);
            result.successful++;
        } catch (error: unknown) {
            result.failed++;

            result.errors.push(
                `Payroll failed for employee ${payroll.employeeId}: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`
            );
        }
    }

    return result;
}
