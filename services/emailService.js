const { Resend } = require('resend');

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send cheque reminder email
 * @param {Object} cheque - Cheque details object
 * @param {string} recipientEmail - Email address to send reminder to
 * @returns {Promise<Object>} - Result object with success status, messageId, or error
 */
async function sendChequeReminder(cheque, recipientEmail) {
    try {
        // Calculate days remaining until due date
        const today = new Date();
        const expectedClearDate = new Date(cheque.expected_clear_date);
        const daysRemaining = Math.ceil((expectedClearDate - today) / (1000 * 60 * 60 * 24));

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Reminder</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .cheque-details { background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th, .table td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
                .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; color: #6c757d; }
                .urgent { color: #dc3545; font-weight: bold; }
                .normal { color: #28a745; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>💳 Payment Reminder: Cheque ${cheque.cheque_number}</h2>
                    <p>This is an automated reminder about an upcoming cheque payment.</p>
                </div>

                <div class="cheque-details">
                    <h3>Cheque Details</h3>
                    <table class="table">
                        <tr>
                            <th>Cheque Number</th>
                            <td>${cheque.cheque_number}</td>
                        </tr>
                        <tr>
                            <th>Amount</th>
                            <td><strong>₹${Number(cheque.amount).toLocaleString('en-IN')}</strong></td>
                        </tr>
                        <tr>
                            <th>Payer Name</th>
                            <td>${cheque.payer_name || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Expected Clear Date</th>
                            <td>${expectedClearDate.toLocaleDateString('en-IN')}</td>
                        </tr>
                        <tr>
                            <th>Days Remaining</th>
                            <td class="${daysRemaining <= 3 ? 'urgent' : 'normal'}">
                                ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}
                            </td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center;">
                    <a href="http://localhost:5000/api/cheques/${cheque.id}" class="btn">
                        Update Status
                    </a>
                </div>

                <div class="footer">
                    <p><strong>Important:</strong> Please update the cheque status once the payment is cleared.</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const { data, error } = await resend.emails.send({
            from: 'Cheque Management System <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: `Payment Reminder: Cheque ${cheque.cheque_number}`,
            html: htmlContent,
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message, messageId: null };
        }

        console.log(`✅ Cheque reminder sent for cheque ${cheque.cheque_number} to ${recipientEmail}`);
        return { success: true, messageId: data.id, error: null };

    } catch (error) {
        console.error('Error in sendChequeReminder:', error);
        return { success: false, error: error.message, messageId: null };
    }
}

/**
 * Send cheque bounce alert email
 * @param {Object} cheque - Cheque details object
 * @param {string} recipientEmail - Email address to send alert to
 * @returns {Promise<Object>} - Result object with success status, messageId, or error
 */
async function sendBounceAlert(cheque, recipientEmail) {
    try {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cheque Bounce Alert</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .alert { background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                .cheque-details { background-color: #ffffff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th, .table td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
                .btn { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .footer { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; color: #6c757d; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="alert">
                    <h2>⚠️ Cheque Bounced: ${cheque.cheque_number}</h2>
                    <p><strong>Immediate action required!</strong> The following cheque has bounced.</p>
                </div>

                <div class="cheque-details">
                    <h3>Bounced Cheque Details</h3>
                    <table class="table">
                        <tr>
                            <th>Cheque Number</th>
                            <td>${cheque.cheque_number}</td>
                        </tr>
                        <tr>
                            <th>Amount</th>
                            <td style="color: #dc3545; font-weight: bold;">₹${Number(cheque.amount).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <th>Payer Name</th>
                            <td>${cheque.payer_name || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Expected Clear Date</th>
                            <td>${new Date(cheque.expected_clear_date).toLocaleDateString('en-IN')}</td>
                        </tr>
                        <tr>
                            <th>Status</th>
                            <td style="color: #dc3545; font-weight: bold;">BOUNCED</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center;">
                    <a href="http://localhost:5000/api/cheques/${cheque.id}" class="btn">
                        Take Action
                    </a>
                </div>

                <div class="footer">
                    <p><strong>Recommended Actions:</strong></p>
                    <ul>
                        <li>Contact the payer immediately</li>
                        <li>Arrange for alternative payment</li>
                        <li>Update the cheque status with relevant notes</li>
                    </ul>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const { data, error } = await resend.emails.send({
            from: 'Cheque Management System <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: `⚠️ Cheque Bounced: ${cheque.cheque_number}`,
            html: htmlContent,
        });

        if (error) {
            console.error('Bounce alert email send error:', error);
            return { success: false, error: error.message, messageId: null };
        }

        console.log(`🚨 Bounce alert sent for cheque ${cheque.cheque_number} to ${recipientEmail}`);
        return { success: true, messageId: data.id, error: null };

    } catch (error) {
        console.error('Error in sendBounceAlert:', error);
        return { success: false, error: error.message, messageId: null };
    }
}

/**
 * Send payment overdue alert email
 * @param {Object} cheque - Cheque details object
 * @param {string} recipientEmail - Email address to send alert to
 * @returns {Promise<Object>} - Result object with success status, messageId, or error
 */
async function sendPaymentOverdueAlert(cheque, recipientEmail) {
    try {
        // Calculate days overdue
        const today = new Date();
        const expectedClearDate = new Date(cheque.expected_clear_date);
        const daysOverdue = Math.ceil((today - expectedClearDate) / (1000 * 60 * 60 * 24));

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>URGENT: Overdue Payment</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .urgent-alert { background-color: #721c24; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; }
                .cheque-details { background-color: #ffffff; border: 2px solid #dc3545; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
                .table { width: 100%; border-collapse: collapse; }
                .table th, .table td { padding: 8px; text-align: left; border-bottom: 1px solid #dee2e6; }
                .table th { background-color: #f8f9fa; font-weight: bold; }
                .urgent-btn { display: inline-block; padding: 15px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
                .footer { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; color: #6c757d; }
                .overdue { color: #dc3545; font-weight: bold; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="urgent-alert">
                    <h2>🔴 URGENT: Overdue Payment</h2>
                    <p><strong>IMMEDIATE ATTENTION REQUIRED!</strong></p>
                </div>

                <div class="cheque-details">
                    <h3>Overdue Cheque Details</h3>
                    <table class="table">
                        <tr>
                            <th>Cheque Number</th>
                            <td>${cheque.cheque_number}</td>
                        </tr>
                        <tr>
                            <th>Amount</th>
                            <td class="overdue">₹${Number(cheque.amount).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                            <th>Payer Name</th>
                            <td>${cheque.payer_name || 'N/A'}</td>
                        </tr>
                        <tr>
                            <th>Was Due On</th>
                            <td>${expectedClearDate.toLocaleDateString('en-IN')}</td>
                        </tr>
                        <tr>
                            <th>Days Overdue</th>
                            <td class="overdue">${daysOverdue} day${daysOverdue !== 1 ? 's' : ''}</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center;">
                    <a href="http://localhost:5000/api/cheques/${cheque.id}" class="urgent-btn">
                        Take Immediate Action
                    </a>
                </div>

                <div class="footer">
                    <p><strong>URGENT: This payment is significantly overdue!</strong></p>
                    <p>Recommended immediate actions:</p>
                    <ul>
                        <li>Contact the payer immediately via phone and email</li>
                        <li>Request immediate payment or replacement cheque</li>
                        <li>Consider alternative payment methods</li>
                        <li>Document all communication attempts</li>
                    </ul>
                    <p>This is an automated urgent alert. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const { data, error } = await resend.emails.send({
            from: 'Cheque Management System <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: `🔴 URGENT: Overdue Payment - Cheque ${cheque.cheque_number}`,
            html: htmlContent,
        });

        if (error) {
            console.error('Overdue alert email send error:', error);
            return { success: false, error: error.message, messageId: null };
        }

        console.log(`🔴 Overdue alert sent for cheque ${cheque.cheque_number} to ${recipientEmail}`);
        return { success: true, messageId: data.id, error: null };

    } catch (error) {
        console.error('Error in sendPaymentOverdueAlert:', error);
        return { success: false, error: error.message, messageId: null };
    }
}

module.exports = {
    sendChequeReminder,
    sendBounceAlert,
    sendPaymentOverdueAlert
};