const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({
            data: null,
            error: {
                message: 'Duplicate entry. This record already exists.',
                code: 'DUPLICATE_ENTRY'
            }
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return res.status(400).json({
            data: null,
            error: {
                message: 'Foreign key constraint violation.',
                code: 'FOREIGN_KEY_ERROR'
            }
        });
    }

    if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
        return res.status(400).json({
            data: null,
            error: {
                message: 'Required field cannot be empty.',
                code: 'REQUIRED_FIELD_MISSING'
            }
        });
    }

    if (err.message && err.message.includes('no such table')) {
        return res.status(500).json({
            data: null,
            error: {
                message: 'Database not initialized properly.',
                code: 'DATABASE_NOT_INITIALIZED'
            }
        });
    }

    res.status(500).json({
        data: null,
        error: {
            message: process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : err.message || 'Unknown error occurred',
            code: 'INTERNAL_ERROR'
        }
    });
};

module.exports = errorHandler;