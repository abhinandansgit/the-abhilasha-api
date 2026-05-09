// backend/src/app.js
const express = require('express')
const cors = require('cors')
require('dotenv').config()

const paymentsRouter = require('./routes/payments')

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://theabhilasha.in',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}))

app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'The Abhilasha API', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api', paymentsRouter)

// 404
app.use((req, res) => res.status(404).json({ error: 'Route not found' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🎙️  The Abhilasha API running on port ${PORT}`)
})

module.exports = app
