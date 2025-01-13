const mailSender = require('../utils/mailSender')
const emailTemplate = require('../mail/templates/emailVerificationTemplates')

const mongoose = require('mongoose')

const OTPSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true

    },
    otp:{
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
    }
})

// a function to send emails
async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(email, "Verification Email from StudyNotion", emailTemplate(otp))
        console.log("Email sent successfully: ", mailResponse)
    } catch (error) {
        console.log("Error occured while send verification email: ", error)
    }
}

OTPSchema.pre('save', async (next)=>{
    // this.email and this.otp pointing to the current doc saved in the Database.
    if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
    next()
})

module.exports = mongoose.model('OTP', OTPSchema)