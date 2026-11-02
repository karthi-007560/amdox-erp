import nodemailer from "nodemailer";
import { getSMTPConfig } from "../../config/email";

interface EmailInput {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export const sendEmail = async (input: EmailInput) => {
    const config = getSMTPConfig();

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.password,
        },
    });

    const result = await transporter.sendMail({
        from: config.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
    });

    return {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
    };
};