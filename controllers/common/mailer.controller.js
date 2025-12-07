// mailer.controller.js
const mailerService = require("../../services/common/mailer.service");

exports.sendMail = async (req, res) => {
    try {
        const { email, name, subject, message } = req.body;

        const response = await mailerService.sendEmail(
            email,
            name,
            subject,
            message,
            message // text version
        );

        res.status(200).json({
            success: true,
            message: "Email sent successfully",
            data: response,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send email",
            error: error.message,
        });
    }
};
