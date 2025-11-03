const Cheque = require('../models/cheque');

class ChequeController {
    static async createCheque(req, res, next) {
        try {
            const {
                cheque_number,
                amount,
                payer_name,
                cheque_date,
                expected_clear_date,
                invoice_reference,
                notes
            } = req.body;

            if (!cheque_number || !amount || !payer_name || !cheque_date) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Missing required fields: cheque_number, amount, payer_name, cheque_date',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }

            const existingCheque = await Cheque.findByChequeNumber(cheque_number);
            if (existingCheque) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Cheque number already exists',
                        code: 'DUPLICATE_CHEQUE'
                    }
                });
            }

            const result = await Cheque.create({
                cheque_number,
                amount: parseFloat(amount),
                payer_name,
                cheque_date,
                expected_clear_date,
                invoice_reference,
                notes
            });

            const newCheque = await Cheque.findById(result.id);

            res.status(201).json({
                data: newCheque,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllCheques(req, res, next) {
        try {
            const { status, page = 1, limit = 10 } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);

            let cheques;
            let totalCount;

            if (status) {
                cheques = await Cheque.findByStatus(status);
                totalCount = cheques.length;
                // Apply pagination to filtered results
                const startIndex = (pageNum - 1) * limitNum;
                const endIndex = startIndex + limitNum;
                cheques = cheques.slice(startIndex, endIndex);
            } else {
                cheques = await Cheque.findAll();
                totalCount = cheques.length;
                // Apply pagination to all results
                const startIndex = (pageNum - 1) * limitNum;
                const endIndex = startIndex + limitNum;
                cheques = cheques.slice(startIndex, endIndex);
            }

            const totalPages = Math.ceil(totalCount / limitNum);

            res.json({
                cheques: cheques,
                total: totalCount,
                page: pageNum,
                limit: limitNum,
                totalPages: totalPages
            });
        } catch (error) {
            next(error);
        }
    }

    static async getChequeById(req, res, next) {
        try {
            const { id } = req.params;
            const cheque = await Cheque.findById(id);

            if (!cheque) {
                return res.status(404).json({
                    data: null,
                    error: {
                        message: 'Cheque not found',
                        code: 'NOT_FOUND'
                    }
                });
            }

            res.json({
                data: cheque,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateCheque(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const existingCheque = await Cheque.findById(id);
            if (!existingCheque) {
                return res.status(404).json({
                    data: null,
                    error: {
                        message: 'Cheque not found',
                        code: 'NOT_FOUND'
                    }
                });
            }

            if (updateData.amount) {
                updateData.amount = parseFloat(updateData.amount);
            }

            const result = await Cheque.update(id, updateData);

            if (result.changes === 0) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'No changes made to the cheque',
                        code: 'NO_CHANGES'
                    }
                });
            }

            const updatedCheque = await Cheque.findById(id);

            res.json({
                data: updatedCheque,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateChequeStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !['pending', 'deposited', 'cleared', 'bounced'].includes(status)) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Invalid status. Must be one of: pending, deposited, cleared, bounced',
                        code: 'INVALID_STATUS'
                    }
                });
            }

            const existingCheque = await Cheque.findById(id);
            if (!existingCheque) {
                return res.status(404).json({
                    data: null,
                    error: {
                        message: 'Cheque not found',
                        code: 'NOT_FOUND'
                    }
                });
            }

            const result = await Cheque.updateStatus(id, status);

            if (result.changes === 0) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'No changes made to the cheque status',
                        code: 'NO_CHANGES'
                    }
                });
            }

            const updatedCheque = await Cheque.findById(id);

            res.json({
                data: updatedCheque,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteCheque(req, res, next) {
        try {
            const { id } = req.params;

            const existingCheque = await Cheque.findById(id);
            if (!existingCheque) {
                return res.status(404).json({
                    data: null,
                    error: {
                        message: 'Cheque not found',
                        code: 'NOT_FOUND'
                    }
                });
            }

            const result = await Cheque.delete(id);

            if (result.changes === 0) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Failed to delete cheque',
                        code: 'DELETE_FAILED'
                    }
                });
            }

            res.json({
                data: { message: 'Cheque deleted successfully' },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCalendarData(req, res, next) {
        try {
            const { month } = req.query;

            // Default to current month if not provided
            const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM format

            // Validate month format
            if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Invalid month format. Use YYYY-MM format',
                        code: 'INVALID_MONTH_FORMAT'
                    }
                });
            }

            const { db } = require('../database');

            // Query cheques for the specified month
            const cheques = await new Promise((resolve, reject) => {
                const query = `
                    SELECT
                        id,
                        cheque_number,
                        amount,
                        payer_name,
                        expected_clear_date,
                        status,
                        invoice_reference,
                        notes,
                        (julianday(expected_clear_date) - julianday('now')) as days_until_due
                    FROM CHEQUES
                    WHERE strftime('%Y-%m', expected_clear_date) = ?
                    ORDER BY expected_clear_date ASC
                `;

                db.all(query, [targetMonth], (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });

            // Group cheques by date
            const calendarData = {};

            cheques.forEach(cheque => {
                const date = cheque.expected_clear_date;

                if (!calendarData[date]) {
                    calendarData[date] = [];
                }

                // Calculate days until due (handle negative values for overdue)
                const daysUntilDue = Math.ceil(cheque.days_until_due);

                calendarData[date].push({
                    id: cheque.id,
                    cheque_number: cheque.cheque_number,
                    amount: parseFloat(cheque.amount),
                    payer_name: cheque.payer_name,
                    expected_clear_date: cheque.expected_clear_date,
                    status: cheque.status,
                    daysUntilDue: daysUntilDue,
                    invoice_reference: cheque.invoice_reference,
                    notes: cheque.notes
                });
            });

            res.json({
                data: calendarData,
                month: targetMonth,
                totalCheques: cheques.length,
                error: null
            });

        } catch (error) {
            console.error('Error in getCalendarData:', error);
            next(error);
        }
    }
}

module.exports = ChequeController;