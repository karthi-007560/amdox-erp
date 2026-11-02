export interface ReportGenerationTask<T> {
    reportId: string;
    tenantId: string;
    userId: string;
    generate: () => Promise<T>;
}

export interface ReportGenerationJobResult<T> {
    total: number;
    successful: number;
    failed: number;
    results: T[];
    errors: string[];
}

export async function runReportGenerationJob<T>(
    tasks: ReportGenerationTask<T>[]
): Promise<ReportGenerationJobResult<T>> {
    const result: ReportGenerationJobResult<T> = {
        total: tasks.length,
        successful: 0,
        failed: 0,
        results: [],
        errors: [],
    };

    for (const task of tasks) {
        try {
            const generatedReport = await task.generate();

            result.results.push(generatedReport);
            result.successful++;
        } catch (error: unknown) {
            result.failed++;

            result.errors.push(
                `Report generation failed for report ${task.reportId}: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`
            );
        }
    }

    return result;
}