const Profile = require('../models/Profile')
const Profle = require('../models/Profile')
const User = require('../models/User')
const Course = require('../models/Course')
const {uploadImageToCloudinary} = require('../utils/imageUploader')
require('dotenv').config()

// update profile. Because profile created all ready while signup with null value.
exports.updateProfile = async (req, res) => {
    try {
        // Get data.
        const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;

        // Log the body to check what is coming
        console.log("Request Body -> ",req.body);

        // Get userId.
        const userId = req.user.id;

        // Validate fields.
        if (!dateOfBirth || !contactNumber || !gender) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // Find user and profile.
        const userDetail = await User.findById(userId);
        console.log("User details -> ", userDetail);

        if (!userDetail || !userDetail.additionalDetails) {
            return res.status(404).json({
                success: false,
                message: "User or associated profile not found",
            });
        }

        const profileDetails = await Profile.findById(userDetail.additionalDetails);
        console.log("Profile Details -> ", profileDetails);

        if (!profileDetails) {
            return res.status(404).json({
                success: false,
                message: "Profile not found",
            });
        }

        // Update profile.
        profileDetails.dateOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.gender = gender;
        profileDetails.contactNumber = contactNumber;

        // Save updated profile.
        await profileDetails.save();

        // Fetch updated user details.
        const updatedUserDetails = await User.findById(userId)
            .populate('additionalDetails')
            .exec();
        console.log("Updated user details ->", updatedUserDetails);

        // Return response.
        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profile:updatedUserDetails,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};


// delete account
exports.deleteAccount = async (req, res) =>{
    try {
        const userId = req.user.id;

        // get user details.
        const userDetails = await User.findById(userId)

        if(!userDetails){
            return res.status(404).json({
                success:false,
                message:"User not found with the associated user id"
            })
        }

        // Delete profile if it exists
        if (userDetails.additionalDetails) {
            await Profle.findByIdAndDelete(userDetails.additionalDetails);
        }

        // TODO: unEnroll user from all enrolled courses

        // delete user.
        await User.findByIdAndDelete(userId)

        return res.status(200).json({
            success:true,
            message:"Your Account deleted successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:"Error Occured while deleting account, please try again"
        })
    }
}

// update display picture.
exports.updateDisplayPicture = async (req, res) => {
    try {
      // Validate if file exists
      if (!req.files || !req.files.displayPicture) {
        return res.status(400).json({
          success: false,
          message: "No display picture provided",
        });
      }
  
      const displayPicture = req.files.displayPicture;
      const userId = req.user.id;
      console.log("User Id -> ", userId)
  
      // Validate folder name
      if (!process.env.FOLDER_NAME) {
        return res.status(500).json({
          success: false,
          message: "Cloudinary folder name is not configured",
        });
      }
  
      // Upload to Cloudinary
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME
      );
  
      // Ensure Cloudinary upload succeeded
      if (!image || !image.secure_url) {
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to Cloudinary",
        });
      }
  
      // Update the user's profile
      const updatedProfile = await User.findByIdAndUpdate(
        userId,
        { image: image.secure_url },
        { new: true }
      );
  
      // Send success response
      return res.status(200).json({
        success: true,
        message: "Image updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      // Log the full error for debugging
      console.error("Error updating display picture:", error);
  
      // Return error response
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the display picture",
      });
    }
};

// get user details.
exports.getUserDetails = async (req, res) =>{
    try {
        const userId = req.user.id

        console.log(req.user)
        const userDetail = await User.findById(userId).populate('additionalDetails').exec()

        if(!userDetail){
            return res.status(404).json({
                success:false,
                message:"No user found for the accossiated userId"
            })
        }

        return res.status(200).json({
            success:false,
            message:"Fetch user data successfully",
            data:userDetail
        })

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success:false,
            message:"Error Occures while fetching the user data"
        })
    }



    console.log("userDetail -> ", userDetail)
}

exports.getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.user.id
        let userDetails = await User.findOne({
            _id:userId
        })
        .populate({
            path:"courses",
            populate: {
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            }
        }).exec()

        // if user not found
        if(!userDetails){
            return res.status(404).json({
                success: false,
                message: `Could not found the user with id: ${userDetails}`,
            });
        }

        console.log("User Deatils of EnrolledCourses -----> ", userDetails)
        
        return res.status(200).json({
            success: true,
            data: userDetails
        })

    } catch (error) {
        console.log("Error while fetching the enrolledCourses")
        return res.status(500).json({
            message:false,
            message: error.message
        })
    }
}

// instructor dashboard.
exports.instructorDashboard = async (req, res) => {
    try {
        // what user login is the instructor
      const courseDetails = await Course.find({ instructor: req.user.id })
  
      const courseData = courseDetails.map((course) => {
        const totalStudentsEnrolled = course.studentsEnroled.length
        const totalAmountGenerated = totalStudentsEnrolled * course.price
  
        // Create a new object with the additional fields
        const courseDataWithStats = {
          _id: course._id,
          courseName: course.courseName,
          courseDescription: course.courseDescription,
          // Include other course properties as needed
          totalStudentsEnrolled,
          totalAmountGenerated,
        }
  
        return courseDataWithStats
      })
  
      res.status(200).json({ courses: courseData })
    } catch (error) {
      console.error("Error while getting the instructor data for chart - ",error)
      res.status(500).json({ message: "Server Error" })
    }
}