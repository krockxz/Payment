const { db } = require('../database');

class Cheque {
    static async create(chequeData) {
        const {
            cheque_number,
            amount,
            payer_name,
            cheque_date,
            expected_clear_date,
            invoice_reference,
            notes
        } = chequeData;

        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO CHEQUES (
                    cheque_number, amount, payer_name, cheque_date,
                    expected_clear_date, invoice_reference, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            db.run(sql, [
                cheque_number,
                amount,
                payer_name,
                cheque_date,
                expected_clear_date,
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
            const sql = 'SELECT * FROM CHEQUES WHERE id = ?';
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
            const sql = 'SELECT * FROM CHEQUES ORDER BY created_at DESC';
            db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    static async updateStatus(id, status) {
        return new Promise((resolve, reject) => {
            let sql, params;

            if (status === 'cleared') {
                sql = 'UPDATE CHEQUES SET status = ?, actual_clear_date = CURRENT_DATE WHERE id = ?';
                params = [status, id];
            } else {
                sql = 'UPDATE CHEQUES SET status = ? WHERE id = ?';
                params = [status, id];
            }

            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ changes: this.changes });
            });
        });
    }

    static async update(id, updateData) {
        const {
            amount,
            payer_name,
            cheque_date,
            expected_clear_date,
            status,
            invoice_reference,
            notes
        } = updateData;

        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE CHEQUES SET
                    amount = ?, payer_name = ?, cheque_date = ?,
                    expected_clear_date = ?, status = ?,
                    invoice_reference = ?, notes = ?
                WHERE id = ?
            `;

            db.run(sql, [
                amount,
                payer_name,
                cheque_date,
                expected_clear_date,
                status,
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
            const sql = 'DELETE FROM CHEQUES WHERE id = ?';
            db.run(sql, [id], function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve({ changes: this.changes });
            });
        });
    }

    static async findByStatus(status) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM CHEQUES WHERE status = ? ORDER BY created_at DESC';
            db.all(sql, [status], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    static async findByChequeNumber(cheque_number) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM CHEQUES WHERE cheque_number = ?';
            db.get(sql, [cheque_number], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    }
}

module.exports = Cheque;