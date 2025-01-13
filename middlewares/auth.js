const JWT = require('jsonwebtoken')
require('dotenv').config()
const User = require('../models/User')

// auth
exports.auth = async (req, res, next) => {
    try {
        // Extract token from cookies
        const token = req.cookies.token || req.body.token || req.header("Authorization")?.replace("Bearer ", "");


        // Check if token exists
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing",
            });
        }

        // Verify token
        try {
            const payload = JWT.verify(token, process.env.JWT_SECRET);
            console.log("Decoded Payload:", payload); // Debugging
            req.user = payload; // Attach user to the request
        } catch (error) {
            console.error("JWT Verification Error:", error.message); // Debugging
            return res.status(401).json({
                success: false,
                message: "Token is Invalid",
            });
        }

        // Proceed to next middleware
        next();
    } catch (error) {
        console.error("Authentication Middleware Error:", error.message); // Debugging
        return res.status(500).json({
            success: false,
            message: "Something went wrong while validating the token",
        });
    }
};


// isStudent
exports.isStudent = async (req, res, next)=>{
    try {
        if(req.user.accountType !== "Student"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Students only"
            })
        }

        next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, please try again"
        })
    }
}


// isInstructor
exports.isInstructor = async (req, res, next)=>{
    try {
        if(req.user.accountType !== "Instructor"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Instructor only"
            })
        }

        next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"User role cannot be verified, please try again"
        })
    }
}

// isAdmin
exports.isAdmin = async (req, res, next)=>{
    
    try {
        if(req.user.accountType !== "Admin"){
            return res.status(401).json({
                success:false,
                message:"This is a protected route for Admin only"
            })
        }

        next()
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: "User role cannot be verified, please try again"
        })
    }
}