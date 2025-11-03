const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');

/**
 * POST /api/payments/create-order
 * Create a new payment order
 */
router.post('/create-order', async (req, res, next) => {
    try {
        const { amount, invoiceReference, chequeId, customerData } = req.body;

        // Validate required fields
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                data: null,
                error: {
                    message: 'Valid amount is required',
                    code: 'INVALID_AMOUNT'
                }
            });
        }

        // Create payment order
        const result = await paymentService.createPaymentOrder(
            parseFloat(amount),
            invoiceReference || null,
            customerData || {},
            chequeId ? parseInt(chequeId) : null
        );

        if (result.error) {
            return res.status(400).json({
                data: null,
                error: {
                    message: result.error,
                    code: 'ORDER_CREATION_FAILED'
                }
            });
        }

        res.status(201).json({
            data: result,
            error: null
        });

    } catch (error) {
        console.error('Error in create-order:', error);
        next(error);
    }
});

/**
 * POST /api/payments/verify
 * Verify payment signature and update records
 */
router.post('/verify', async (req, res, next) => {
    try {
        const { order_id, payment_id, signature, chequeId } = req.body;

        // Validate required fields
        if (!order_id || !payment_id || !signature) {
            return res.status(400).json({
                data: null,
                error: {
                    message: 'Order ID, Payment ID, and Signature are required',
                    code: 'MISSING_FIELDS'
                }
            });
        }

        // Verify payment signature
        const verification = await paymentService.verifyPaymentSignature({
            order_id,
            payment_id,
            signature
        });

        if (!verification.valid) {
            return res.status(400).json({
                data: null,
                error: {
                    message: verification.error || 'Invalid payment signature',
                    code: 'INVALID_SIGNATURE'
                }
            });
        }

        // If chequeId is provided, link payment to cheque
        let linkResult = null;
        if (chequeId) {
            linkResult = await paymentService.linkPaymentToCheque(
                payment_id,
                parseInt(chequeId)
            );
        }

        res.json({
            data: {
                success: true,
                verification: {
                    order_id: verification.order_id,
                    payment_id: verification.payment_id,
                    valid: verification.valid
                },
                chequeLink: linkResult
            },
            error: null
        });

    } catch (error) {
        console.error('Error in verify:', error);
        next(error);
    }
});

/**
 * GET /api/payments/orders
 * Get all payment orders with optional filtering
 */
router.get('/orders', async (req, res, next) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        // Build filters object
        const filters = {
            status: status || undefined,
            limit: parseInt(limit) || 50,
            offset: parseInt(offset) || 0
        };

        // Get payment orders
        const result = await paymentService.getPaymentOrders(filters);

        if (!result.success) {
            return res.status(500).json({
                data: null,
                error: {
                    message: result.error,
                    code: 'FETCH_ORDERS_FAILED'
                }
            });
        }

        res.json({
            data: {
                orders: result.orders,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    total: result.orders.length
                }
            },
            error: null
        });

    } catch (error) {
        console.error('Error in orders:', error);
        next(error);
    }
});

/**
 * GET /api/payments/orders/:orderId
 * Get specific payment order by ID
 */
router.get('/orders/:orderId', async (req, res, next) => {
    try {
        const { orderId } = req.params;

        if (!orderId) {
            return res.status(400).json({
                data: null,
                error: {
                    message: 'Order ID is required',
                    code: 'MISSING_ORDER_ID'
                }
            });
        }

        // Get payment order
        const result = await paymentService.getPaymentOrderById(orderId);

        if (!result.success) {
            return res.status(404).json({
                data: null,
                error: {
                    message: result.error,
                    code: 'ORDER_NOT_FOUND'
                }
            });
        }

        res.json({
            data: result.order,
            error: null
        });

    } catch (error) {
        console.error('Error in get order:', error);
        next(error);
    }
});

/**
 * POST /api/payments/webhook
 * Handle Razorpay webhooks (for production use)
 */
router.post('/webhook', async (req, res, next) => {
    try {
        const webhookSignature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        // Verify webhook signature
        if (!webhookSignature || !webhookSecret) {
            console.warn('Webhook signature or secret missing');
            return res.status(400).json({
                data: null,
                error: {
                    message: 'Webhook verification failed',
                    code: 'WEBHOOK_VERIFICATION_FAILED'
                }
            });
        }

        // For now, just acknowledge the webhook
        // In production, you would verify the signature and process events
        console.log('🔔 Webhook received:', req.body);

        res.json({
            data: { received: true },
            error: null
        });

    } catch (error) {
        console.error('Error in webhook:', error);
        next(error);
    }
});

/**
 * GET /api/payments/config
 * Get payment configuration (for frontend)
 */
router.get('/config', async (req, res, next) => {
    try {
        // Return only public configuration
        const config = {
            keyId: process.env.RAZORPAY_KEY_ID,
            currency: 'INR',
            companyName: 'Cheque Management System'
        };

        res.json({
            data: config,
            error: null
        });

    } catch (error) {
        console.error('Error in config:', error);
        next(error);
    }
});

module.exports = router;