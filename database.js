const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'cheque_management.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});

const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS CHEQUES (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cheque_number TEXT UNIQUE NOT NULL,
                    amount REAL NOT NULL,
                    payer_name TEXT NOT NULL,
                    cheque_date TEXT NOT NULL,
                    expected_clear_date TEXT,
                    actual_clear_date TEXT,
                    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'deposited', 'cleared', 'bounced', 'paid')),
                    invoice_reference TEXT,
                    notes TEXT,
                    payment_id TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating CHEQUES table:', err.message);
                    reject(err);
                    return;
                }

                // Add payment_id column if it doesn't exist (for existing databases)
                db.run(`
                    ALTER TABLE CHEQUES ADD COLUMN payment_id TEXT
                `, (alterErr) => {
                    // Ignore error if column already exists
                    if (alterErr && !alterErr.message.includes('duplicate column name')) {
                        console.warn('Warning adding payment_id column:', alterErr.message);
                    }
                });
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS CASH_RECORDS (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    amount REAL NOT NULL,
                    date TEXT NOT NULL,
                    reference_person TEXT,
                    purpose TEXT,
                    invoice_reference TEXT,
                    notes TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating CASH_RECORDS table:', err.message);
                    reject(err);
                    return;
                }
            });

            db.run(`
                CREATE TABLE IF NOT EXISTS PAYMENT_ORDERS (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id TEXT UNIQUE NOT NULL,
                    amount INTEGER NOT NULL,
                    currency TEXT DEFAULT 'INR',
                    status TEXT DEFAULT 'created' CHECK(status IN ('created', 'paid', 'failed')),
                    invoice_reference TEXT,
                    cheque_id INTEGER,
                    payment_id TEXT,
                    customer_data TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (cheque_id) REFERENCES CHEQUES(id)
                )
            `, (err) => {
                if (err) {
                    console.error('Error creating PAYMENT_ORDERS table:', err.message);
                    reject(err);
                    return;
                }
            });

            db.run(`
                CREATE TRIGGER IF NOT EXISTS update_cheques_timestamp
                AFTER UPDATE ON CHEQUES
                BEGIN
                    UPDATE CHEQUES SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                END
            `, (err) => {
                if (err) {
                    console.error('Error creating trigger:', err.message);
                    reject(err);
                    return;
                }
                console.log('Database initialized successfully.');
                resolve();
            });
        });
    });
};

const closeDatabase = () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
    });
};

process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);

module.exports = {
    db,
    initializeDatabase,
    closeDatabase
};