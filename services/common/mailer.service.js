// mailer.service.js
const { Resend } = require('resend');

class MailerService {
    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);

        this.sentFrom = `${process.env.SMTP_SENDER} <${process.env.SMTP_EMAIL}>`;
    }

    async sendEmail(to, name, subject, html, text) {
        if (process.env.SEND_EMAILS !== 'true') {
            console.log("Email sending is disabled. Skipping email to:", to);
            return { message: "Email sending is disabled." };
        }

        try {
            const response = await this.resend.emails.send({
                from: this.sentFrom,
                to: [`${name ? `${name} <${to}>` : to}`],
                subject,
                html,
                text
            });
            console.log("Email sent successfully response:", response);
            return response;
        } catch (error) {
            console.error("Mail sending failed:", error);
            throw error;
        }
    }
}

module.exports = new MailerService();
