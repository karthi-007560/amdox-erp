export interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
}

export function getSMTPConfig(): SMTPConfig {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_USER,
        SMTP_PASSWORD,
        SMTP_FROM,
    } = process.env;

    if (
        !SMTP_HOST ||
        !SMTP_PORT ||
        !SMTP_USER ||
        !SMTP_PASSWORD ||
        !SMTP_FROM
    ) {
        throw new Error("Email service is not configured");
    }

    const port = Number(SMTP_PORT);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("Invalid SMTP_PORT configuration");
    }

    return {
        host: SMTP_HOST,
        port,
        secure: port === 465,
        user: SMTP_USER,
        password: SMTP_PASSWORD,
        from: SMTP_FROM,
    };
}