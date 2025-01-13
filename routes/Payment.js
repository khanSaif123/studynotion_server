const express = require('express')
const router = express.Router()

const {capturePayment, verifyPayment, sendPaymentSuccessEmail} = require('../controllers/Payment')

//middleware.
const {auth, isAdmin, isInstructor, isStudent} = require("../middlewares/auth")

router.post("/capture-payment", auth, isStudent, capturePayment)
router.post("/verify-payment", auth, isStudent, verifyPayment)
router.post("/send-payment-successfullEmail", auth, isStudent, sendPaymentSuccessEmail)

module.exports = router