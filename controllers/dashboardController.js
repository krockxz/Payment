const { db } = require('../database');

class DashboardController {
    static async getSummary(req, res, next) {
        try {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

            const summary = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        -- Pending cheques summary
                        (SELECT COUNT(*) FROM CHEQUES WHERE status = 'pending') as pending_cheques_count,
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES WHERE status = 'pending') as pending_cheques_amount,

                        -- Cleared cheques summary
                        (SELECT COUNT(*) FROM CHEQUES WHERE status = 'cleared') as cleared_cheques_count,
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES WHERE status = 'cleared') as cleared_cheques_amount,

                        -- Bounced cheques summary
                        (SELECT COUNT(*) FROM CHEQUES WHERE status = 'bounced') as bounced_cheques_count,
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES WHERE status = 'bounced') as bounced_cheques_amount,

                        -- Cash collected today
                        (SELECT COALESCE(SUM(amount), 0) FROM CASH_RECORDS WHERE date = '${today}') as cash_today,

                        -- Cash collected this month
                        (SELECT COALESCE(SUM(amount), 0) FROM CASH_RECORDS WHERE date LIKE '${currentMonth}%') as total_cash_collected_month,

                        -- Overdue cheques (past expected clear date and still pending)
                        (SELECT COUNT(*) FROM CHEQUES
                         WHERE status = 'pending'
                         AND expected_clear_date < '${today}') as overdue_cheques
                `;

                db.get(sql, [], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });

            // Transform the response to match frontend's DashboardSummary interface
            const transformedSummary = {
                pendingCheques: {
                    count: summary.pending_cheques_count || 0,
                    totalAmount: summary.pending_cheques_amount || 0
                },
                clearedCheques: {
                    count: summary.cleared_cheques_count || 0,
                    totalAmount: summary.cleared_cheques_amount || 0
                },
                bouncedCheques: {
                    count: summary.bounced_cheques_count || 0,
                    totalAmount: summary.bounced_cheques_amount || 0
                },
                cashToday: summary.cash_today || 0
            };

            res.json(transformedSummary);
        } catch (error) {
            next(error);
        }
    }

    
    static async getPendingCheques(req, res, next) {
        try {
            const pendingCheques = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        id,
                        cheque_number,
                        amount,
                        payer_name,
                        expected_clear_date,
                        invoice_reference,
                        notes,
                        created_at,
                        updated_at,
                        julianday(expected_clear_date) - julianday('now') as days_until_clear
                    FROM CHEQUES
                    WHERE status = 'pending'
                    ORDER BY expected_clear_date ASC
                    LIMIT 20
                `;

                db.all(sql, [], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            res.json(pendingCheques);
        } catch (error) {
            next(error);
        }
    }

    static async getBouncedCheques(req, res, next) {
        try {
            const bouncedCheques = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        id,
                        cheque_number,
                        amount,
                        payer_name,
                        cheque_date,
                        expected_clear_date,
                        actual_clear_date as bounce_date,
                        invoice_reference,
                        notes,
                        created_at,
                        updated_at
                    FROM CHEQUES
                    WHERE status = 'bounced'
                    ORDER BY actual_clear_date DESC, created_at DESC
                `;

                db.all(sql, [], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            res.json(bouncedCheques);
        } catch (error) {
            next(error);
        }
    }

    static async getCashToday(req, res, next) {
        try {
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

            const cashToday = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        COALESCE(SUM(amount), 0) as total_amount,
                        COUNT(*) as entry_count
                    FROM CASH_RECORDS
                    WHERE date = '${today}'
                `;

                db.get(sql, [], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });

            res.json({
                data: {
                    total_cash_collected: cashToday.total_amount,
                    number_of_entries: cashToday.entry_count,
                    date: today
                },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async getPaymentStatus(req, res, next) {
        try {
            const { invoice_id } = req.query;

            if (!invoice_id) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'invoice_id parameter is required',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }

            const paymentStatus = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        ? as invoice_id,
                        -- Get cheque payments for this invoice
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES
                         WHERE invoice_reference = ? AND status IN ('cleared', 'deposited')) as cheques_received,
                        (SELECT COUNT(*) FROM CHEQUES
                         WHERE invoice_reference = ? AND status IN ('cleared', 'deposited')) as cheques_count,

                        -- Get cash payments for this invoice
                        (SELECT COALESCE(SUM(amount), 0) FROM CASH_RECORDS
                         WHERE invoice_reference = ?) as cash_received,
                        (SELECT COUNT(*) FROM CASH_RECORDS
                         WHERE invoice_reference = ?) as cash_count,

                        -- Get expected amount (assuming it's stored somewhere or we need to calculate it)
                        -- For now, we'll calculate based on cleared payments
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES
                         WHERE invoice_reference = ? AND status IN ('cleared', 'deposited')) +
                        (SELECT COALESCE(SUM(amount), 0) FROM CASH_RECORDS
                         WHERE invoice_reference = ?) as total_received
                `;

                db.get(sql, [invoice_id, invoice_id, invoice_id, invoice_id, invoice_id, invoice_id, invoice_id], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });

            // Determine payment status
            let payment_status = 'pending';
            if (paymentStatus.total_received > 0) {
                // For demonstration, we'll assume complete if any payment is received
                // In a real scenario, you'd compare against an expected amount
                payment_status = 'complete';
            }

            const response = {
                ...paymentStatus,
                payment_status
            };

            res.json({
                data: response,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async getMonthlyStats(req, res, next) {
        try {
            const { year = new Date().getFullYear() } = req.query;

            const monthlyStats = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        strftime('%m', created_at) as month,
                        COUNT(*) as cheque_count,
                        COALESCE(SUM(amount), 0) as cheque_amount,
                        (SELECT COUNT(*) FROM CASH_RECORDS
                         WHERE strftime('%m', date) = strftime('%m', CHEQUES.created_at)
                         AND strftime('%Y', date) = ?) as cash_count,
                        (SELECT COALESCE(SUM(amount), 0) FROM CASH_RECORDS
                         WHERE strftime('%m', date) = strftime('%m', CHEQUES.created_at)
                         AND strftime('%Y', date) = ?) as cash_amount
                    FROM CHEQUES
                    WHERE strftime('%Y', created_at) = ?
                    GROUP BY strftime('%m', created_at)
                    ORDER BY month
                `;

                db.all(sql, [year, year, year], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            res.json({
                data: monthlyStats,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    // Analytics: Get trends data for last N months
    static async getTrends(req, res, next) {
        try {
            const { months = 6 } = req.query;
            const monthsCount = parseInt(months) || 6;

            const trends = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        strftime('%Y-%m', expected_clear_date) as month,
                        COALESCE(SUM(CASE WHEN status = 'cleared' THEN amount ELSE 0 END), 0) as clearedAmount,
                        COALESCE(SUM(CASE WHEN status = 'bounced' THEN amount ELSE 0 END), 0) as bouncedAmount,
                        COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bouncedCount,
                        COUNT(*) as totalCheques
                    FROM CHEQUES
                    WHERE expected_clear_date >= date('now', '-${monthsCount} months')
                    GROUP BY strftime('%Y-%m', expected_clear_date)
                    ORDER BY month ASC
                `;

                db.all(sql, [], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            // Transform data to the expected format
            const monthsArray = trends.map(row => row.month);
            const clearedAmount = trends.map(row => parseFloat(row.clearedAmount));
            const bouncedCount = trends.map(row => row.bouncedCount);
            const totalCheques = trends.map(row => row.totalCheques);

            res.json({
                data: {
                    months: monthsArray,
                    clearedAmount,
                    bouncedCount,
                    totalCheques
                },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    // Analytics: Get status breakdown
    static async getStatusBreakdown(req, res, next) {
        try {
            const statusBreakdown = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        status,
                        COUNT(*) as count,
                        COALESCE(SUM(amount), 0) as amount
                    FROM CHEQUES
                    GROUP BY status
                `;

                db.all(sql, [], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            // Transform to object format
            const breakdown = {};
            statusBreakdown.forEach(row => {
                breakdown[row.status] = {
                    count: row.count,
                    amount: parseFloat(row.amount)
                };
            });

            res.json({
                data: breakdown,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    // Analytics: Get top payers
    static async getTopPayers(req, res, next) {
        try {
            const { limit = 5 } = req.query;
            const limitCount = parseInt(limit) || 5;

            const topPayers = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        payer_name,
                        COALESCE(SUM(amount), 0) as total_amount,
                        COUNT(*) as cheque_count
                    FROM CHEQUES
                    WHERE payer_name IS NOT NULL AND payer_name != ''
                    GROUP BY payer_name
                    ORDER BY total_amount DESC
                    LIMIT ?
                `;

                db.all(sql, [limitCount], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            // Transform data
            const transformedPayers = topPayers.map(row => ({
                payer_name: row.payer_name,
                total_amount: parseFloat(row.total_amount),
                cheque_count: row.cheque_count
            }));

            res.json({
                data: transformedPayers,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    // Analytics: Get key metrics
    static async getKeyMetrics(req, res, next) {
        try {
            const metrics = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        -- Total collected (cleared cheques + cash records)
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES WHERE status = 'cleared') +
                        (SELECT COALESCE(SUM(amount), 0) FROM CASH_RECORDS) as totalCollected,

                        -- Total expected (all cheques amount)
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES) as totalExpected,

                        -- Average clearance days (time between cheque date and clear date for cleared cheques)
                        (SELECT AVG(julianday(actual_clear_date) - julianday(cheque_date))
                         FROM CHEQUES
                         WHERE status = 'cleared'
                         AND actual_clear_date IS NOT NULL
                         AND cheque_date IS NOT NULL) as averageClearanceDays,

                        -- Count of bounced cheques
                        (SELECT COUNT(*) FROM CHEQUES WHERE status = 'bounced') as bouncedCount,

                        -- Count of pending cheques
                        (SELECT COUNT(*) FROM CHEQUES WHERE status = 'pending') as pendingCount,

                        -- Total pending amount
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES WHERE status = 'pending') as pendingAmount,

                        -- Total bounced amount
                        (SELECT COALESCE(SUM(amount), 0) FROM CHEQUES WHERE status = 'bounced') as bouncedAmount
                `;

                db.get(sql, [], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(row);
                });
            });

            // Calculate collection rate
            const collectionRate = metrics.totalExpected > 0
                ? ((metrics.totalCollected / metrics.totalExpected) * 100).toFixed(2)
                : 0;

            // Transform and round values
            const transformedMetrics = {
                totalCollected: parseFloat(metrics.totalCollected || 0),
                totalExpected: parseFloat(metrics.totalExpected || 0),
                collectionRate: parseFloat(collectionRate),
                averageClearanceDays: Math.round(parseFloat(metrics.averageClearanceDays || 0)),
                bouncedCount: metrics.bouncedCount || 0,
                pendingCount: metrics.pendingCount || 0,
                pendingAmount: parseFloat(metrics.pendingAmount || 0),
                bouncedAmount: parseFloat(metrics.bouncedAmount || 0)
            };

            res.json({
                data: transformedMetrics,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = DashboardController;