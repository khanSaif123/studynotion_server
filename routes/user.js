const express = require('express')
const router = express.Router()

const {signUp, login, sendOtp, changePassword} = require('../controllers/Auth')
const {resetPasswordToken, resetPassword} = require('../controllers/ResetPassword')

const {auth} = require('../middlewares/auth')

// Routes for Login, Signup, and Authentication

// ********************************************************************************************************
//                                      Authentication routes
// ********************************************************************************************************

// route for user login.

router.post("/signup", signUp)
router.post("/sendotp", sendOtp)
router.post("/login", login)
router.post("/changePassword", auth, changePassword)


// reset password routes.
router.post('/reset-password-token',resetPasswordToken)
router.post('/reset-password',resetPassword)

module.exports = router