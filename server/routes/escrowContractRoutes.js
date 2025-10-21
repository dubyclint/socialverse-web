const express = require('express')
const router = express.Router()
const {
  createDeal,
  releaseDeal,
  refundDeal,
  getDeal
} = require('../controllers/escrowContractController')

// ✅ Create a new escrow deal
router.post('/create', createDeal)

// ✅ Release escrow to seller
router.post('/release', releaseDeal)

// ✅ Refund escrow to buyer
router.post('/refund', refundDeal)

// ✅ Get deal info
router.get('/status', getDeal)

module.exports = router
