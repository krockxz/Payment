const { db } = require('../database');

class CashRecord {
    static async create(cashData) {
        const {
            amount,
            date,
            reference_person,
            purpose,
            invoice_reference,
            notes
        } = cashData;

        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO CASH_RECORDS (
                    amount, date, reference_person, purpose,
                    invoice_reference, notes
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;

            db.run(sql, [
                amount,
                date,
                reference_person,
                purpose,
                invoice_reference,
                notes
            ], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ id: this.lastID });
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM CASH_RECORDS WHERE id = ?';
            db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }

    static async findAll() {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM CASH_RECORDS ORDER BY date DESC, created_at DESC';
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    static async update(id, updateData) {
        const {
            amount,
            date,
            reference_person,
            purpose,
            invoice_reference,
            notes
        } = updateData;

        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE CASH_RECORDS SET
                    amount = ?, date = ?, reference_person = ?,
                    purpose = ?, invoice_reference = ?, notes = ?
                WHERE id = ?
            `;

            db.run(sql, [
                amount,
                date,
                reference_person,
                purpose,
                invoice_reference,
                notes,
                id
            ], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ changes: this.changes });
            });
        });
    }

    static async delete(id) {
        return new Promise((resolve, reject) => {
            const sql = 'DELETE FROM CASH_RECORDS WHERE id = ?';
            db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ changes: this.changes });
            });
        });
    }

    static async findByDateRange(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM CASH_RECORDS WHERE date BETWEEN ? AND ? ORDER BY date DESC';
            db.all(sql, [startDate, endDate], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    static async findByReferencePerson(reference_person) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM CASH_RECORDS WHERE reference_person = ? ORDER BY date DESC';
            db.all(sql, [reference_person], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    static async findAllPaginated(page = 1, limit = 10, startDate = null, endDate = null, reference_person = null) {
        return new Promise((resolve, reject) => {
            const offset = (page - 1) * limit;
            let sql, params, countSql, countParams;

            if (startDate && endDate && reference_person) {
                sql = `
                    SELECT * FROM CASH_RECORDS
                    WHERE date BETWEEN ? AND ? AND reference_person = ?
                    ORDER BY date DESC, created_at DESC
                    LIMIT ? OFFSET ?
                `;
                params = [startDate, endDate, reference_person, limit, offset];
                countSql = 'SELECT COUNT(*) as total FROM CASH_RECORDS WHERE date BETWEEN ? AND ? AND reference_person = ?';
                countParams = [startDate, endDate, reference_person];
            } else if (startDate && endDate) {
                sql = `
                    SELECT * FROM CASH_RECORDS
                    WHERE date BETWEEN ? AND ?
                    ORDER BY date DESC, created_at DESC
                    LIMIT ? OFFSET ?
                `;
                params = [startDate, endDate, limit, offset];
                countSql = 'SELECT COUNT(*) as total FROM CASH_RECORDS WHERE date BETWEEN ? AND ?';
                countParams = [startDate, endDate];
            } else if (reference_person) {
                sql = `
                    SELECT * FROM CASH_RECORDS
                    WHERE reference_person = ?
                    ORDER BY date DESC, created_at DESC
                    LIMIT ? OFFSET ?
                `;
                params = [reference_person, limit, offset];
                countSql = 'SELECT COUNT(*) as total FROM CASH_RECORDS WHERE reference_person = ?';
                countParams = [reference_person];
            } else {
                sql = `
                    SELECT * FROM CASH_RECORDS
                    ORDER BY date DESC, created_at DESC
                    LIMIT ? OFFSET ?
                `;
                params = [limit, offset];
                countSql = 'SELECT COUNT(*) as total FROM CASH_RECORDS';
                countParams = [];
            }

            db.get(countSql, countParams, (err, countRow) => {
                if (err) {
                    reject(err);
                    return;
                }

                const total = countRow.total;

                db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    resolve({
                        records: rows,
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    });
                });
            });
        });
    }

    static async getTotalAmount(startDate = null, endDate = null) {
        return new Promise((resolve, reject) => {
            let sql, params;

            if (startDate && endDate) {
                sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM CASH_RECORDS WHERE date BETWEEN ? AND ?';
                params = [startDate, endDate];
            } else {
                sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM CASH_RECORDS';
                params = [];
            }

            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row.total);
            });
        });
    }
}

module.exports = CashRecord;