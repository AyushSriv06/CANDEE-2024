const express = require('express');
const Razorpay = require('razorpay');
const { authMiddleware } = require('../controllers/authmiddleware');
const { Payment, user } = require('../models/user')
const { z } = require('zod');
const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const orderSchema = z.object({
    amount: z.number().positive(),
    currency: z.string(),
});

router.post('/order',authMiddleware, async (req, res) => {

    const validation = orderSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({ error: "Invalid request data", details: validation.error.errors });
    }

    const { amount, currency } = validation.data;

    const options = {
        amount: amount * 100, 
        currency: currency,
        receipt: `order_${Date.now()}`, 
        payment_capture: true, 
    };

    try {
        const response = await razorpay.orders.create(options);
        res.json({
            order_id: response.id,
            currency: response.currency,
            amount: response.amount * 100,
        });
    } catch (err) {
        console.error("Razorpay order creation failed", err);
        res.status(500).send('Unable to create order. Please try again later.');
    }
});

router.post('/confirm',authMiddleware, async (req, res) => {
    const user=req.user.userId
    const { orderId, paymentId, signature, amount, currency, status } = req.body;

    if (!orderId || !paymentId || !signature || !amount || !currency || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const payment = new Payment({
            user,
            orderId,
            paymentId,
            amount,
            currency,
            status,
            razorpaySignature: signature, 
        })

        await payment.save();
        res.status(200).json({ message: 'Payment details saved successfully' });
    } catch (err) {
        console.error('Error saving payment details:', err);
        res.status(500).json({ error: 'Failed to save payment details' });
    }

});

router.get('/paymentsdetails', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const payments = await Payment.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(10);  

        res.json(payments);
    } catch (err) {
        console.error('Error fetching payments:', err);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

module.exports = router;

