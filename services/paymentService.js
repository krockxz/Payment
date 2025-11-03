const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a payment order with Razorpay
 * @param {number} amount - Amount in rupees
 * @param {string} invoiceReference - Invoice reference (optional)
 * @param {object} customerData - Customer information
 * @param {number} chequeId - Associated cheque ID (optional)
 * @returns {Promise<object>} - Order details or error
 */
async function createPaymentOrder(amount, invoiceReference = null, customerData = {}, chequeId = null) {
    try {
        // Validate inputs
        if (!amount || amount <= 0) {
            return { error: 'Invalid amount' };
        }

        // Convert amount to paise (Razorpay expects amount in smallest currency unit)
        const amountInPaise = Math.round(amount * 100);

        // Create order options
        const orderOptions = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: invoiceReference || `receipt_${Date.now()}`,
            payment_capture: 1, // Auto capture payment
            notes: {
                invoice_reference: invoiceReference,
                cheque_id: chequeId?.toString(),
                customer_name: customerData.name || 'Guest',
                customer_email: customerData.email || '',
                customer_phone: customerData.phone || ''
            }
        };

        // Create Razorpay order
        const order = await razorpay.orders.create(orderOptions);

        // Save order to database
        const savedOrder = await savePaymentOrder({
            order_id: order.id,
            amount: amountInPaise,
            currency: order.currency,
            status: 'created',
            invoice_reference: invoiceReference,
            cheque_id: chequeId,
            customer_data: JSON.stringify(customerData)
        });

        if (!savedOrder.success) {
            console.error('Failed to save payment order:', savedOrder.error);
            return { error: 'Failed to save payment order' };
        }

        console.log(`✅ Payment order created: ${order.id} for amount ₹${amount}`);

        return {
            success: true,
            order_id: order.id,
            amount: amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID,
            receipt: order.receipt
        };

    } catch (error) {
        console.error('Error creating payment order:', error);
        return {
            error: error.message || 'Failed to create payment order'
        };
    }
}

/**
 * Verify Razorpay payment signature
 * @param {object} payment - Payment verification data
 * @returns {Promise<object>} - Verification result
 */
async function verifyPaymentSignature(payment) {
    try {
        const { order_id, payment_id, signature } = payment;

        // Validate required fields
        if (!order_id || !payment_id || !signature) {
            return { valid: false, error: 'Missing required fields' };
        }

        // Generate expected signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${order_id}|${payment_id}`)
            .digest('hex');

        // Compare signatures
        const isValid = generatedSignature === signature;

        if (isValid) {
            // Update payment order status
            await updatePaymentOrderStatus(order_id, 'paid', payment_id);
            console.log(`✅ Payment verified: ${payment_id} for order ${order_id}`);
        } else {
            console.error(`❌ Payment verification failed for order: ${order_id}`);
        }

        return {
            valid: isValid,
            order_id,
            payment_id,
            signature
        };

    } catch (error) {
        console.error('Error verifying payment signature:', error);
        return {
            valid: false,
            error: error.message || 'Payment verification failed'
        };
    }
}

/**
 * Link payment to cheque and update status
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} chequeId - Cheque ID
 * @returns {Promise<object>} - Update result
 */
async function linkPaymentToCheque(paymentId, chequeId) {
    try {
        if (!paymentId || !chequeId) {
            return { success: false, error: 'Payment ID and Cheque ID are required' };
        }

        const { db } = require('../database');

        // Update cheque with payment ID and status
        const result = await new Promise((resolve, reject) => {
            const sql = `
                UPDATE CHEQUES
                SET payment_id = ?, status = 'paid', actual_clear_date = CURRENT_DATE
                WHERE id = ?
            `;

            db.run(sql, [paymentId, chequeId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        success: true,
                        changes: this.changes,
                        paymentId,
                        chequeId
                    });
                }
            });
        });

        if (result.success && result.changes > 0) {
            console.log(`✅ Payment linked to cheque: Payment ${paymentId} -> Cheque ${chequeId}`);
            return { success: true, paymentId, chequeId };
        } else {
            return { success: false, error: 'Cheque not found or already updated' };
        }

    } catch (error) {
        console.error('Error linking payment to cheque:', error);
        return {
            success: false,
            error: error.message || 'Failed to link payment to cheque'
        };
    }
}

/**
 * Save payment order to database
 * @param {object} orderData - Order data to save
 * @returns {Promise<object>} - Save result
 */
async function savePaymentOrder(orderData) {
    try {
        const { db } = require('../database');

        const result = await new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO PAYMENT_ORDERS
                (order_id, amount, currency, status, invoice_reference, cheque_id, customer_data)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                orderData.order_id,
                orderData.amount,
                orderData.currency,
                orderData.status,
                orderData.invoice_reference,
                orderData.cheque_id,
                orderData.customer_data
            ];

            db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        success: true,
                        id: this.lastID,
                        order_id: orderData.order_id
                    });
                }
            });
        });

        return result;

    } catch (error) {
        console.error('Error saving payment order:', error);
        return {
            success: false,
            error: error.message || 'Failed to save payment order'
        };
    }
}

/**
 * Update payment order status
 * @param {string} orderId - Razorpay order ID
 * @param {string} status - New status
 * @param {string} paymentId - Razorpay payment ID (optional)
 * @returns {Promise<object>} - Update result
 */
async function updatePaymentOrderStatus(orderId, status, paymentId = null) {
    try {
        const { db } = require('../database');

        const result = await new Promise((resolve, reject) => {
            const sql = `
                UPDATE PAYMENT_ORDERS
                SET status = ?, payment_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE order_id = ?
            `;

            db.run(sql, [status, paymentId, orderId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        success: true,
                        changes: this.changes,
                        orderId,
                        status
                    });
                }
            });
        });

        return result;

    } catch (error) {
        console.error('Error updating payment order status:', error);
        return {
            success: false,
            error: error.message || 'Failed to update payment order status'
        };
    }
}

/**
 * Get all payment orders
 * @param {object} filters - Optional filters (status, limit, offset)
 * @returns {Promise<object>} - Orders list or error
 */
async function getPaymentOrders(filters = {}) {
    try {
        const { db } = require('../database');
        const { status, limit = 50, offset = 0 } = filters;

        let sql = `
            SELECT
                po.*,
                c.cheque_number,
                c.payer_name,
                c.amount as cheque_amount
            FROM PAYMENT_ORDERS po
            LEFT JOIN CHEQUES c ON po.cheque_id = c.id
        `;

        const params = [];

        if (status) {
            sql += ' WHERE po.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY po.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const orders = await new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        return {
            success: true,
            orders: orders.map(order => ({
                ...order,
                customer_data: order.customer_data ? JSON.parse(order.customer_data) : null,
                amount: order.amount / 100 // Convert back to rupees
            }))
        };

    } catch (error) {
        console.error('Error getting payment orders:', error);
        return {
            success: false,
            error: error.message || 'Failed to get payment orders'
        };
    }
}

/**
 * Get payment order by order ID
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<object>} - Order details or error
 */
async function getPaymentOrderById(orderId) {
    try {
        const { db } = require('../database');

        const order = await new Promise((resolve, reject) => {
            const sql = `
                SELECT
                    po.*,
                    c.cheque_number,
                    c.payer_name,
                    c.amount as cheque_amount
                FROM PAYMENT_ORDERS po
                LEFT JOIN CHEQUES c ON po.cheque_id = c.id
                WHERE po.order_id = ?
            `;

            db.get(sql, [orderId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (!order) {
            return { success: false, error: 'Payment order not found' };
        }

        return {
            success: true,
            order: {
                ...order,
                customer_data: order.customer_data ? JSON.parse(order.customer_data) : null,
                amount: order.amount / 100 // Convert back to rupees
            }
        };

    } catch (error) {
        console.error('Error getting payment order:', error);
        return {
            success: false,
            error: error.message || 'Failed to get payment order'
        };
    }
}

module.exports = {
    createPaymentOrder,
    verifyPaymentSignature,
    linkPaymentToCheque,
    getPaymentOrders,
    getPaymentOrderById
};