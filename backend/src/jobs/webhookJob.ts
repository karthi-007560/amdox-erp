import { deliverWebhookEvent } from "../services/notifications/webhookService.js";

export interface WebhookJobInput {
    tenantId: string;
    eventName: string;
    payload: Record<string, unknown>;
}

export interface WebhookJobResult {
    total: number;
    successful: number;
    failed: number;
    errors: string[];
}

export async function runWebhookJob(
    events: WebhookJobInput[]
): Promise<WebhookJobResult> {
    const result: WebhookJobResult = {
        total: events.length,
        successful: 0,
        failed: 0,
        errors: [],
    };

    for (const event of events) {
        try {
            await deliverWebhookEvent(
                event.tenantId,
                event.eventName,
                event.payload
            );

            result.successful++;
        } catch (error: unknown) {
            result.failed++;

            result.errors.push(
                `Webhook delivery failed for event ${event.eventName}, tenant ${event.tenantId}: ${
                    error instanceof Error
                        ? error.message
                        : String(error)
                }`
            );
        }
    }

    return result;
}