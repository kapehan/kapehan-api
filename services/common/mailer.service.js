// mailer.service.js
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

class MailerService {
    constructor() {
        this.mailerSend = new MailerSend({
            apiKey: process.env.SMTP_API_KEY,
        });

        this.sentFrom = new Sender(process.env.SMTP_EMAIL, process.env.SMTP_SENDER);
    }

    async sendEmail(to, name, subject, html, text) {
        if(process.env.SEND_EMAILS !== 'true') {
            console.log("Email sending is disabled. Skipping email to:", to);
            return { message: "Email sending is disabled." };
        }
        try {
            const recipients = [
                new Recipient(to, name)
            ];

            const emailParams = new EmailParams()
                .setFrom(this.sentFrom)
                .setTo(recipients)
                .setReplyTo(this.sentFrom)
                .setSubject(subject)
                .setHtml(html)
                .setText(text);

            const response = await this.mailerSend.email.send(emailParams);

            return response;
        } catch (error) {
            console.error("Mail sending failed:", error);
            throw error;
        }
    }
}

module.exports = new MailerService();
