
import twilio from "twilio";

interface SMSInput {
  to: string;
  message: string;
}

const getTwilioClient = () => {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
  } = process.env;

  if (
    !TWILIO_ACCOUNT_SID ||
    !TWILIO_AUTH_TOKEN ||
    !TWILIO_PHONE_NUMBER
  ) {
    throw new Error("SMS service is not configured");
  }

  return {
    client: twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
    from: TWILIO_PHONE_NUMBER,
  };
};

export const sendSMS = async (input: SMSInput) => {
  const { client, from } = getTwilioClient();

  const result = await client.messages.create({
    body: input.message,
    from,
    to: input.to,
  });

  return {
    messageId: result.sid,
    status: result.status,
    to: result.to,
  };
};
