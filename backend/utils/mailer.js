import { Resend } from "resend";

/*
  utils/mailer.js

  This is the ONLY file in the project that talks to Resend directly -
  same isolation pattern as utils/cloudinary.js and utils/groqClient.js.
  Everything else just calls sendMail() and has no idea which email
  provider is behind it.

  Resend is a plain HTTPS API (not old-school SMTP like Gmail/Nodemailer),
  so all we need is an API key - no App Passwords, no port configuration.

  Setup:
  1. Sign up free at resend.com
  2. Dashboard -> API Keys -> Create API Key
  3. Add to .env:
       RESEND_API_KEY=re_your_key_here
       RESEND_FROM_EMAIL=StoreDesk POS <onboarding@resend.dev>

  Note: until you verify your own domain on Resend, the sandbox sender
  "onboarding@resend.dev" can only deliver to the email address you
  signed up to Resend with. Verify a domain later for real multi-admin
  delivery.
*/

let resendClient = null;

const getResendClient = () => {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY?.trim();
        if (!apiKey) {
            return null;
        }

        resendClient = new Resend(apiKey);
    }

    return resendClient;
};

const sendMail = async ({ to, subject, html }) => {
    const resend = getResendClient();

    if (!resend) {
        console.error(
            "Resend email not sent because RESEND_API_KEY is not configured.",
        );
        return;
    }

    try {
        await resend.emails.send({
            from:
                process.env.RESEND_FROM_EMAIL?.trim() ||
                "StoreDesk POS <onboarding@resend.dev>",
            to, // array of email addresses
            subject,
            html,
        });
    } catch (error) {
        // We deliberately do NOT throw here. A failed email should never
        // crash a sale or whatever request triggered it - it just gets
        // logged so it can be investigated separately.
        console.error(
            "Failed to send email via Resend:",
            error?.message || error,
        );
    }
};

export { sendMail };