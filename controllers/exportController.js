const { db } = require('../database');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');

class ExportController {
    static async exportAllCheques(req, res, next) {
        try {
            const { format } = req.query;

            if (format !== 'csv') {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Only CSV format is supported',
                        code: 'UNSUPPORTED_FORMAT'
                    }
                });
            }

            const cheques = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        cheque_number,
                        amount,
                        payer_name,
                        cheque_date,
                        expected_clear_date,
                        actual_clear_date,
                        status,
                        invoice_reference,
                        notes,
                        created_at
                    FROM CHEQUES
                    ORDER BY created_at DESC
                `;

                db.all(sql, [], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `cheques_${timestamp}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const csvStream = csv.format({ headers: true });
            csvStream.pipe(res);

            cheques.forEach(cheque => {
                csvStream.write({
                    'Cheque Number': cheque.cheque_number || '',
                    'Amount': cheque.amount || 0,
                    'Payer Name': cheque.payer_name || '',
                    'Cheque Date': cheque.cheque_date || '',
                    'Expected Clear Date': cheque.expected_clear_date || '',
                    'Actual Clear Date': cheque.actual_clear_date || '',
                    'Status': cheque.status || '',
                    'Invoice Reference': cheque.invoice_reference || '',
                    'Notes': cheque.notes || ''
                });
            });

            csvStream.end();

        } catch (error) {
            next(error);
        }
    }

    static async exportCashRecords(req, res, next) {
        try {
            const { format, month } = req.query;

            if (format !== 'csv') {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Only CSV format is supported',
                        code: 'UNSUPPORTED_FORMAT'
                    }
                });
            }

            let sql = `
                SELECT
                    date,
                    amount,
                    reference_person,
                    purpose,
                    invoice_reference,
                    notes,
                    created_at
                FROM CASH_RECORDS
            `;
            let params = [];

            if (month) {
                sql += ` WHERE date LIKE ?`;
                params.push(`${month}%`);
            }

            sql += ` ORDER BY date DESC, created_at DESC`;

            const cashRecords = await new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = month
                ? `cash_records_${month}_${timestamp}.csv`
                : `cash_records_all_${timestamp}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const csvStream = csv.format({ headers: true });
            csvStream.pipe(res);

            cashRecords.forEach(record => {
                csvStream.write({
                    'Date': record.date || '',
                    'Amount': record.amount || 0,
                    'Reference Person': record.reference_person || '',
                    'Purpose': record.purpose || '',
                    'Invoice Reference': record.invoice_reference || '',
                    'Notes': record.notes || ''
                });
            });

            csvStream.end();

        } catch (error) {
            next(error);
        }
    }

    static async exportPendingCheques(req, res, next) {
        try {
            const { format } = req.query;

            if (format !== 'csv') {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Only CSV format is supported',
                        code: 'UNSUPPORTED_FORMAT'
                    }
                });
            }

            const pendingCheques = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        cheque_number,
                        amount,
                        payer_name,
                        cheque_date,
                        expected_clear_date,
                        invoice_reference,
                        notes,
                        created_at,
                        julianday(expected_clear_date) - julianday('now') as days_until_clear
                    FROM CHEQUES
                    WHERE status = 'pending'
                    ORDER BY expected_clear_date ASC
                `;

                db.all(sql, [], (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `pending_cheques_${timestamp}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const csvStream = csv.format({ headers: true });
            csvStream.pipe(res);

            pendingCheques.forEach(cheque => {
                csvStream.write({
                    'Cheque Number': cheque.cheque_number || '',
                    'Amount': cheque.amount || 0,
                    'Payer Name': cheque.payer_name || '',
                    'Cheque Date': cheque.cheque_date || '',
                    'Expected Clear Date': cheque.expected_clear_date || '',
                    'Days Until Clear': Math.round(cheque.days_until_clear || 0),
                    'Invoice Reference': cheque.invoice_reference || '',
                    'Notes': cheque.notes || ''
                });
            });

            csvStream.end();

        } catch (error) {
            next(error);
        }
    }

    static async exportSummaryReport(req, res, next) {
        try {
            const { format, month } = req.query;

            if (format !== 'csv') {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Only CSV format is supported',
                        code: 'UNSUPPORTED_FORMAT'
                    }
                });
            }

            let dateFilter = '';
            let params = [];

            if (month) {
                dateFilter = ` WHERE created_at LIKE ?`;
                params.push(`${month}%`);
            }

            const summaryData = await new Promise((resolve, reject) => {
                const sql = `
                    SELECT
                        'Total Cheques' as metric,
                        COUNT(*) as value,
                        '' as additional_info
                    FROM CHEQUES ${dateFilter}
                    UNION ALL
                    SELECT
                        'Total Cheques Amount' as metric,
                        COALESCE(SUM(amount), 0) as value,
                        '' as additional_info
                    FROM CHEQUES ${dateFilter}
                    UNION ALL
                    SELECT
                        'Pending Cheques' as metric,
                        COUNT(*) as value,
                        '' as additional_info
                    FROM CHEQUES WHERE status = 'pending'
                    UNION ALL
                    SELECT
                        'Cleared Cheques' as metric,
                        COUNT(*) as value,
                        '' as additional_info
                    FROM CHEQUES WHERE status = 'cleared'
                    UNION ALL
                    SELECT
                        'Bounced Cheques' as metric,
                        COUNT(*) as value,
                        '' as additional_info
                    FROM CHEQUES WHERE status = 'bounced'
                    UNION ALL
                    SELECT
                        'Total Cash Records' as metric,
                        COUNT(*) as value,
                        '' as additional_info
                    FROM CASH_RECORDS ${dateFilter.replace('created_at', 'date')}
                    UNION ALL
                    SELECT
                        'Total Cash Amount' as metric,
                        COALESCE(SUM(amount), 0) as value,
                        '' as additional_info
                    FROM CASH_RECORDS ${dateFilter.replace('created_at', 'date')}
                `;

                db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                });
            });

            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = month
                ? `summary_report_${month}_${timestamp}.csv`
                : `summary_report_${timestamp}.csv`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            const csvStream = csv.format({ headers: true });
            csvStream.pipe(res);

            csvStream.write({
                'Report Generated': timestamp,
                'Month Filter': month || 'All Time'
            });

            csvStream.write({}); // Empty row for separation

            summaryData.forEach(row => {
                csvStream.write({
                    'Metric': row.metric,
                    'Value': row.value,
                    'Additional Info': row.additional_info
                });
            });

            csvStream.end();

        } catch (error) {
            next(error);
        }
    }
}

module.exports = ExportController;