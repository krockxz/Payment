const cron = require('node-cron');
const { db } = require('../database');
const emailService = require('../services/emailService');

// Configuration from environment variables
const REMINDER_DAYS_BEFORE = parseInt(process.env.REMINDER_DAYS_BEFORE) || 3;
const REMINDER_TIME = process.env.REMINDER_TIME || '09:00';
const ENABLE_REMINDERS = process.env.ENABLE_REMINDERS === 'true';
const REMINDER_EMAIL = process.env.REMINDER_EMAIL;

let scheduledTask = null;

/**
 * Process cheque reminders and send appropriate emails
 */
async function processReminders() {
    try {
        console.log('📧 Starting scheduled reminder processing...');

        if (!REMINDER_EMAIL) {
            console.error('❌ REMINDER_EMAIL not configured in environment variables');
            return;
        }

        // Get all pending cheques
        const pendingCheques = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM CHEQUES WHERE status = ?', ['pending'], (err, rows) => {
                if (err) {
                    console.error('❌ Error fetching pending cheques:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        if (pendingCheques.length === 0) {
            console.log('✅ No pending cheques found');
            return;
        }

        console.log(`📊 Found ${pendingCheques.length} pending cheques to process`);

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        let remindersSent = 0;
        let overdueAlertsSent = 0;
        let errors = 0;

        for (const cheque of pendingCheques) {
            try {
                const expectedClearDate = new Date(cheque.expected_clear_date);
                expectedClearDate.setHours(0, 0, 0, 0); // Set to start of day

                // Calculate difference in days
                const diffTime = expectedClearDate - today;
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                console.log(`📋 Processing cheque ${cheque.cheque_number}: ${daysRemaining} days remaining (due: ${expectedClearDate.toISOString().split('T')[0]})`);

                // Check if reminder is needed (due date is exactly REMINDER_DAYS_BEFORE days from now)
                if (daysRemaining === REMINDER_DAYS_BEFORE) {
                    console.log(`⏰ Sending reminder for cheque ${cheque.cheque_number} (${daysRemaining} days remaining)`);
                    const result = await emailService.sendChequeReminder(cheque, REMINDER_EMAIL);

                    if (result.success) {
                        remindersSent++;
                        console.log(`✅ Reminder sent for cheque ${cheque.cheque_number}`);
                    } else {
                        errors++;
                        console.error(`❌ Failed to send reminder for cheque ${cheque.cheque_number}: ${result.error}`);
                    }
                }

                // Check if payment is overdue (expected clear date is in the past)
                else if (daysRemaining < 0) {
                    console.log(`🔴 Payment overdue for cheque ${cheque.cheque_number} (${Math.abs(daysRemaining)} days overdue)`);
                    const result = await emailService.sendPaymentOverdueAlert(cheque, REMINDER_EMAIL);

                    if (result.success) {
                        overdueAlertsSent++;
                        console.log(`✅ Overdue alert sent for cheque ${cheque.cheque_number}`);
                    } else {
                        errors++;
                        console.error(`❌ Failed to send overdue alert for cheque ${cheque.cheque_number}: ${result.error}`);
                    }
                }

            } catch (error) {
                errors++;
                console.error(`❌ Error processing cheque ${cheque.cheque_number}:`, error);
            }
        }

        console.log(`📈 Reminder processing completed: ${remindersSent} reminders sent, ${overdueAlertsSent} overdue alerts sent, ${errors} errors`);

    } catch (error) {
        console.error('❌ Error in reminder processing:', error);
    }
}

/**
 * Parse time string (HH:MM) and convert to cron schedule
 * @param {string} timeString - Time in HH:MM format
 * @returns {string} - Cron schedule string
 */
function parseTimeToCron(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn(`⚠️ Invalid time format: ${timeString}. Using default 09:00`);
        return '0 9 * * *';
    }
    return `${minutes} ${hours} * * *`;
}

/**
 * Start the reminder job
 */
function start() {
    if (!ENABLE_REMINDERS) {
        console.log('⏸️ Email reminders are disabled (ENABLE_REMINDERS=false)');
        return;
    }

    if (scheduledTask) {
        console.log('⚠️ Reminder job is already running');
        return;
    }

    try {
        const cronSchedule = parseTimeToCron(REMINDER_TIME);
        console.log(`⏰ Starting reminder job - scheduled to run daily at ${REMINDER_TIME} (${cronSchedule})`);

        // Schedule the task to run daily at specified time
        scheduledTask = cron.schedule(cronSchedule, async () => {
            console.log(`🕐 Running scheduled reminder job at ${new Date().toISOString()}`);
            await processReminders();
        }, {
            scheduled: true,
            timezone: 'Asia/Kolkata' // IST timezone
        });

        console.log('✅ Email reminder job started successfully');

        // Run once at startup to check for any pending reminders
        console.log('🔄 Running initial reminder check at startup...');
        processReminders().catch(error => {
            console.error('❌ Error in initial reminder check:', error);
        });

    } catch (error) {
        console.error('❌ Failed to start reminder job:', error);
    }
}

/**
 * Stop the reminder job
 */
function stop() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        console.log('⏹️ Email reminder job stopped');
    } else {
        console.log('⚠️ No reminder job is currently running');
    }
}

/**
 * Get the current status of the reminder job
 * @returns {Object} - Status object
 */
function getStatus() {
    return {
        isRunning: scheduledTask !== null,
        schedule: REMINDER_TIME,
        cronSchedule: parseTimeToCron(REMINDER_TIME),
        reminderDaysBefore: REMINDER_DAYS_BEFORE,
        recipientEmail: REMINDER_EMAIL,
        enabled: ENABLE_REMINDERS
    };
}

/**
 * Manually trigger reminder processing (for testing)
 */
async function triggerManual() {
    console.log('🔄 Manual trigger of reminder processing...');
    await processReminders();
}

module.exports = {
    start,
    stop,
    getStatus,
    triggerManual,
    processReminders
};