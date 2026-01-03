// utils/emailTemplates.js

function coffeeShopUnderReviewTemplate(coffeeShopName, submissionDate ) {

    const html = `
        <h2>☕ Coffee Shop Registration Under Review</h2>

        <p>Hello,</p>

        <p>Thank you for registering <strong>${coffeeShopName}</strong> on our platform.</p>

        <p>Your registration has been received and is currently under review.
        Our team is verifying the details you provided to ensure everything meets our platform requirements.
        This process typically takes <strong>1–3 business days</strong>.</p>

        <h3>📌 Submitted Information</h3>
        <ul>
            <li><strong>Coffee Shop Name:</strong> ${coffeeShopName}</li>
            <li><strong>Submission Date:</strong> ${submissionDate}</li>
        </ul>

        <p>You will receive another email once the review is complete.</p>

        <p>If you have any questions, feel free to contact our support team.</p>

        <p>Regards,<br>
        The CoffeeShop Platform Team</p>
    `;

    const text = `
Coffee Shop Registration Under Review

Hello,

Thank you for registering "${coffeeShopName}" on our platform.

Your registration is currently under review. Our team is verifying the submitted details, and this process typically takes 1–3 business days.

Submitted Information:
- Coffee Shop Name: ${coffeeShopName}
- Submission Date: ${submissionDate}

We will notify you once the review is complete.

If you have any questions, please contact our support team.

Regards,
The CoffeeShop Platform Team
    `.trim();

    return { html, text };
}

module.exports = {
    coffeeShopUnderReviewTemplate,
};
