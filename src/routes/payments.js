// backend/src/routes/payments.js
const express = require('express')
const crypto = require('crypto')
const Razorpay = require('razorpay')

const router = express.Router()

console.log('🚀 ROBUST_PAYMENT_V3_ACTIVE') // VERSION MARKER

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ─── POST /api/create-order ────────────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { amount, eventId } = req.body
    console.log('📦 Create Order Request:', { amount, eventId })

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    // SHORT RECEIPT (Max 40 chars)
    const receipt = `rcpt_${Date.now()}`
    
    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt,
      notes: { eventId, platform: 'The Abhilasha' },
    }

    const order = await razorpay.orders.create(options)
    console.log('✅ Order Created:', order.id)

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      version: 'V3'
    })
  } catch (err) {
    console.error('❌ Create Order Error:', err)
    res.status(500).json({ 
      error: 'Order creation failed', 
      details: err.error?.description || err.message 
    })
  }
})

// ─── POST /api/verify-payment ──────────────────────────────────────────────
router.post('/verify-payment', async (req, res) => {
  try {
    console.log('🛡️ Verification Request Received')
    
    // Look everywhere for the fields
    const orderId = req.body.razorpay_order_id || req.body.orderId || req.body.order_id
    const paymentId = req.body.razorpay_payment_id || req.body.paymentId || req.body.payment_id
    const signature = req.body.razorpay_signature || req.body.signature || req.body.razorpaySignature

    if (!orderId || !paymentId || !signature) {
      console.error('❌ Missing Fields:', { orderId:!!orderId, paymentId:!!paymentId, signature:!!signature })
      return res.status(400).json({ 
        error: 'Missing verification fields',
        details: 'Server did not receive signature from Razorpay. This happens if the order was not properly linked.'
      })
    }

    const body = `${orderId}|${paymentId}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.error('❌ Signature Mismatch!')
      return res.status(400).json({ error: 'Invalid payment signature' })
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let ticketId = 'ABH-'
    for (let i = 0; i < 8; i++) ticketId += chars[Math.floor(Math.random() * chars.length)]

    console.log('✅ Payment Verified!')
    res.json({ success: true, ticketId })
  } catch (err) {
    console.error('❌ Verify Error:', err)
    res.status(500).json({ error: 'Verification system error' })
  }
})

module.exports = router
