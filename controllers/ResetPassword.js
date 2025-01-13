const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require('bcrypt')
const crypto = require("crypto")
const passwordReset = require('../mail/templates/passwordUpdate')

// reset password token.
exports.resetPasswordToken = async (req, res) =>{
    try {
        // get the email.
        const {email} = req.body;

        // validate.
        if(!email){
            return res.json({
                success: false,
                message:"Email is required to send the mail"
            })
        }

        // check user for this email.
        const user = await User.findOne({email})

        if(!user){
            return res.status(403).json({
                success: false,
                message:"User not registered, please SignUp first"
            })
        }

        // generate token.
        let token = crypto.randomBytes(20).toString(("hex"))

        // update user in DB by adding token and expiry time.
        const updateDetails = await User.findOneAndUpdate(
            {email:email},
            {
                token: token,
                resetPasswordExpires: Date.now() + 3600000 // 1 hours
            },
            {new:true}
        )

        console.log("update details -> ", updateDetails)

        // create url
        const url = `http://localhost:3000/update-password/${token}`

        // send mail.
        await mailSender(email,
            "Password Reset",
           `Your Link for email verification is ${url}. Please click this url to reset your password.`
        )

        return res.status(200).json({
            success: true,
            message: "Mail for Password Reset Send Successfully, Please Check your email"
        })


    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success: false,
            message: "Somthing went wrong while sending the reset-password-token password"
        })
    }
}

// Reset password
exports.resetPassword = async (req, res) =>{
    try {
        // fetch data
        const {password, confirmPassword, token} = req.body;
        console.log("Token -> ",token)

        // validate
        if(password !== confirmPassword){
            return res.json({
                success:false,
                message: "Please Enter Same Password Value in Both Field"
            })
        }

        // get userdetails from db usign token.
        const userDetails = await User.findOne({token:token})
        console.log("User Detail -> reset pass: ", userDetails)

        // if no entry - Invalid token.
        if(!userDetails){
            return res.json({
                success:false,
                message: "Token is Invalid"
            })
        }

        // token time check.
        if(userDetails.resetPasswordExpires < Date.now()){
            return res.json({
                success: false,
                message: "Token is expired, please regenerate your token"
            })
        }

        // hashed password.
        const hashedPassword = await bcrypt.hash(password, 10);

        // password update in DB
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true}
        )

        return res.status(200).json({
            success:true,
            message:"Password reset successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Somthing went wron while reset password"
        })
    }
}
