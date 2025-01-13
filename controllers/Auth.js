const User = require('../models/User')
const OTP = require('../models/OTP')
const otpGenerator = require('otp-generator')
const bcrypt = require('bcrypt')
const Profile = require('../models/Profile')
const JWT = require('jsonwebtoken')
const mailSender = require('../utils/mailSender')
const passwordUpdate = require('../mail/templates/passwordUpdate')
const otpverification = require('../mail/templates/emailVerificationTemplates')
const validator = require('validator')
require('dotenv').config()


// sendOTP.
exports.sendOtp = async (req, res)=>{
    try {
        // fetch email from req body.
        const {email} = req.body;

        // validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format."
            });
        }

        // check if already exist.
        const checkUserPresent = await User.findOne({email})

        if(checkUserPresent){
            return res.status(401).json({
                success:false,
                message: "User already Registered. You can Login"
            })
        }

        // else generate OTP.
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false
        })
        console.log("Generated OTP -> ", otp)

        // check otp is unique. here scope for optimization.
        const otpExists = await OTP.findOne({otp: otp})
        console.log("otpExists -> ", otpExists)

        while(otpExists){
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false
            })

            otpExists = await OTP.findOne({otp})
        }

        // new otp created store it in the database.
        let otpPayload = {email, otp}
        let otpBody = await OTP.create(otpPayload)

        await mailSender(email, "OTP", `Enter this OTP ${otpverification(otp)}`)

        console.log("otpBody -> ", otpBody)

        return res.status(200).json({
            success:true,
            message: "OTP Sent Successfully...",
            otp:otp
        })
    } catch (error) {
        console.log("Error Occured while sending the OTP: ", error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Please try again later."
        });
    }
    

}

// signup
exports.signUp = async (req, res) => {
    try {
      // Fetch data from req body
      const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        accountType,
        contactNumber,
        otp,
      } = req.body;
  
      // Validate required fields
      if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !confirmPassword ||
        !otp
      ) {
        return res.status(403).json({
          success: false,
          message: "All fields are required",
        });
      }
  
      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Password and Confirm Password do not match",
        });
      }
  
      // Check if user already exists
      const isUserExists = await User.findOne({ email });
      if (isUserExists) {
        return res.status(400).json({
          success: false,
          message: "User already registered",
        });
      }
  
      // Find the most recent OTP for the user
      const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);
  
      // Validate OTP existence
      if (recentOtp.length === 0) {
        return res.status(400).json({
          success: false,
          message: "OTP not found",
        });
      }
  
      // Extract the OTP value
      const storedOtp = recentOtp[0]?.otp; // Safely access otp
      if (otp !== storedOtp) {
        return res.status(400).json({
          success: false,
          message: "Invalid OTP",
        });
      }
  
      // Encrypt the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create profile details
      const profileDetails = await Profile.create({
        gender: null,
        dateOfBirth: null,
        contactNumber: contactNumber || null, // Use provided contactNumber or null
        about: null,
      });
  
      // Create new user
      const newupdatedEnter = await User.create({
        firstName:firstName,
        lastName:lastName,
        email,
        password: hashedPassword,
        accountType,
        contactNumber,
        additionalDetails: profileDetails._id,
        image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`,
      });
  
      // Return success response
      return res.status(200).json({
        success: true,
        message: "User Registered Successfully",
        newupdatedEnter,
      });
    } catch (error) {
      console.error("Error occurred while registering the User:", error);
      return res.status(500).json({
        success: false,
        message: "User Cannot be registered. Please try again later.",
      });
    }
  };
  

// login
exports.login = async (req, res) =>{

    try {
        // fetch data from req body.
        const {email, password} = req.body;

        // validate.
        if(!email || !password){
            return res.status(401).json({
                success: false,
                message: "All fields are required"
            })
        }

        // check user registered or not.
        let user = await User.findOne({email}).populate('additionalDetails')

        if(!user){
            return res.status(403).json({
                success: false,
                message: "You are not registered, SinguP First..."
            })
        }

        // decrypt password and match.
        let isPassworedCorrect = await bcrypt.compare(password, user.password);

        if(!isPassworedCorrect){
            return res.status(401).json({
                success: false,
                message: "Wrong Password"
            })
        }

        

        // if correct then create JWT token.
        let JWTPayload = {
            id: user._id,
            email: user.email,
            accountType: user.accountType
        }

        let token = JWT.sign(JWTPayload, process.env.JWT_SECRET, {expiresIn:'2h'})

        user = user.toObject()
        user.token = token
        user.password = undefined

        console.log(user)

        // generate cookie
        const options ={
            expires: new Date(Date.now() + 3*24*60*60*1000), // expires in 3 days
            httpOnly: true
        }
        res.cookie('token', token, options).status(200).json({
            success:true,
            token,
            user,
            message: "Logged In successfully"
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Login Failed"
        })
    }
    
    
}

// change Password.
exports.changePassword = async (req, res) =>{
    try {
        // Get user data from req.user
        const userId = req.user.id
        
        const userDetails = await User.findById(userId)
        
        // Get old password, new password, and confirm new password from req.body
        const {oldPassword, newPassword} = req.body
       
        // Validate old password
        const isPasswordMatch = await bcrypt.compare(
            oldPassword, userDetails.password)

        // If old password does not match, return a 401 (Unauthorized) error
        if(!isPasswordMatch){
            return res.status(401).json({
                success:false,
                message:"You Enter wrong existing password, Please try again"
            })
        }

        // Update password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10)
        const updatePassword = await User.findByIdAndUpdate(
            {userId},
            {password: hashedNewPassword},
            {new:true}
        )

        // Send notification email
        const emailResponse = await mailSender(
            updatePassword.email,
            "Password for you account has been updated",
            passwordUpdate(
                `Password update successfully for ${updatePassword.firstName} ${updatePassword.last}`
            )  
        )
        console.log("Email sent successfully: ", emailResponse)
    } catch (error) {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error)
        return res.status(500).json({
          success: false,
          message: "Error occurred while sending email",
          error: error.message,
        })
    }

}