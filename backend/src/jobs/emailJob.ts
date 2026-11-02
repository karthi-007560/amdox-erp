import { sendEmail } from "../services/notifications/emailService.js";

export interface EmailJobInput {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export interface EmailJobResult {
    total: number;
    sent: number;
    failed: number;
    errors: string[];
}

export async function runEmailJob(
    emails: EmailJobInput[]
): Promise<EmailJobResult> {
    const result: EmailJobResult = {
        total: emails.length,
        sent: 0,
        failed: 0,
        errors: [],
    };

    for (const email of emails) {
        try {
            await sendEmail(email);
            result.sent++;
        } catch (error: unknown) {
            result.failed++;
            result.errors.push(
                `Failed to send email to ${email.to}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    return result;
}