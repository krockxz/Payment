const CashRecord = require('../models/cashRecord');

class CashController {
    static async createCashRecord(req, res, next) {
        try {
            const {
                amount,
                date,
                reference_person,
                purpose,
                invoice_reference,
                notes
            } = req.body;

            if (!amount || !date) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Missing required fields: amount, date',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }

            const result = await CashRecord.create({
                amount: parseFloat(amount),
                date,
                reference_person,
                purpose,
                invoice_reference,
                notes
            });

            const newRecord = await CashRecord.findById(result.id);

            res.status(201).json({
                data: newRecord,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllCashRecords(req, res, next) {
        try {
            const {
                page = 1,
                limit = 10,
                startDate,
                endDate,
                reference_person
            } = req.query;

            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);

            if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100',
                        code: 'VALIDATION_ERROR'
                    }
                });
            }

            const result = await CashRecord.findAllPaginated(
                pageNum,
                limitNum,
                startDate || null,
                endDate || null,
                reference_person || null
            );

            let totalAmount = 0;
            if (startDate && endDate) {
                totalAmount = await CashRecord.getTotalAmount(startDate, endDate);
            } else {
                totalAmount = await CashRecord.getTotalAmount();
            }

            res.json({
                records: result.records,
                total: result.total,
                totalAmount,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCashRecordById(req, res, next) {
        try {
            const { id } = req.params;
            const record = await CashRecord.findById(id);

            if (!record) {
                return res.status(404).json({
                    data: null,
                    error: {
                        message: 'Cash record not found',
                        code: 'NOT_FOUND'
                    }
                });
            }

            res.json({
                data: record,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateCashRecord(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const existingRecord = await CashRecord.findById(id);
            if (!existingRecord) {
                return res.status(404).json({
                    data: null,
                    error: {
                        message: 'Cash record not found',
                        code: 'NOT_FOUND'
                    }
                });
            }

            if (updateData.amount) {
                updateData.amount = parseFloat(updateData.amount);
            }

            const result = await CashRecord.update(id, updateData);

            if (result.changes === 0) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'No changes made to the cash record',
                        code: 'NO_CHANGES'
                    }
                });
            }

            const updatedRecord = await CashRecord.findById(id);

            res.json({
                data: updatedRecord,
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteCashRecord(req, res, next) {
        try {
            const { id } = req.params;

            const existingRecord = await CashRecord.findById(id);
            if (!existingRecord) {
                return res.status(404).json({
                    data: null,
                    error: {
                        message: 'Cash record not found',
                        code: 'NOT_FOUND'
                    }
                });
            }

            const result = await CashRecord.delete(id);

            if (result.changes === 0) {
                return res.status(400).json({
                    data: null,
                    error: {
                        message: 'Failed to delete cash record',
                        code: 'DELETE_FAILED'
                    }
                });
            }

            res.json({
                data: { message: 'Cash record deleted successfully' },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }

    static async getCashTotal(req, res, next) {
        try {
            const { start_date, end_date } = req.query;

            let total;
            if (start_date && end_date) {
                total = await CashRecord.getTotalAmount(start_date, end_date);
            } else {
                total = await CashRecord.getTotalAmount();
            }

            res.json({
                data: { total },
                error: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = CashController;