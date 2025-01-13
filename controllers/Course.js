const Course = require('../models/Course')
const Category = require("../models/Category")
const User = require('../models/User')
const Section = require('../models/Section')
const {uploadImageToCloudinary} = require('../utils/imageUploader')
const SubSection = require('../models/SubSection')
const CourseProgress = require('../models/CourseProgress')
const { convertSecondsToDuration } = require('../utils/secToDuration')
require('dotenv').config()

// create course
exports.createCourse = async (req, res) => {
    try {
        // Fetch data
        const { courseName, courseDescription, whatYouWillLearn, price, category, status, tag } = req.body;
        const thumbnail = req.files.thumbnailImage;

        // Validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !tag) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check for instructor
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId, { accountType: "Instructor" });
        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor Details not found",
            });
        }

        // Check if the category is valid
        const categoryDetails = await Category.findById(category);
        if (!categoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Category Detail not found",
            });
        }

        // Upload image to Cloudinary
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);

        // Create an entry for the new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn,
            price,
            category: categoryDetails._id,
            thumbnail: thumbnailImage.secure_url,
            tag,
            status,
        });

        // Add the new course to the instructor's schema
        await User.findByIdAndUpdate(
            instructorDetails._id,
            { $push: { courses: newCourse._id } },
            { new: true }
        );

        // ✅ Update the Category schema with the new course
        await Category.findByIdAndUpdate(
            categoryDetails._id,
            { $push: { courses: newCourse._id } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Course created successfully",
            data: newCourse,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating the Course",
            error: error.message,
        });
    }
};


// Edit Course Details
exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
}

// get all courses
exports.getAllCourse = async (req, res)=>{
    try {
        // get the courses from DB.
        const allCourses = await Course.find({}, {
                                                courseName: true,
                                                price: true,
                                                thumbnail: true,
                                                instructor: true,
                                                ratingAndReviews: true,
                                                studentsEnrolled: true,
                                                }).populate("instructor").exec()
        return res.status(200).json({
            success:false,
            message: "Fetching data succussfully",
            data:allCourses
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: "Somthing went wrong while fetching the Course"
        })
    }
}

// getCourseDetails.
exports.getCourseDetails = async (req, res) =>{
    try {
        // get ID.
        const {courseId} = req.body;

        // find course details.
        const courseDetails = await Course.findOne(
            {_id:courseId},)
            .populate({
                path: "instructor",
                populate: {
                  path: "additionalDetails",
                },
              }).populate('category') // .populate("ratingAndReviews")
                .populate({
                    path:"courseContent",
                    populate:{
                        path:"subSection",
                        
                    }
                }).exec()

                

        if(!courseDetails){
            return res.status(400).json({
                success:false,
                message:`Could not find the course with this ${courseId}`
            })
        }

        return res.status(200).json({
            success:true,
            message:`Course Details fetched successfully`,
            data:courseDetails
        })

    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success:false,
            message:"Internal server Error, while getting course details"
        })
    }
}

// getFullCourseDetails
exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const userId = req.user.id
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      let courseProgressCount = await CourseProgress.findOne({
        courseID: courseId,
        userId: userId,
      })
  
      console.log("courseProgressCount : ", courseProgressCount)
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
          completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
      })
    } catch (error) {
        console.log("Error while getting the course detail for EDIT - ", error)
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
}

// get a list of course for a given Instructor.

exports.getInstructorCourse = async (req, res) => {
    try {
        // Get the instructor ID from the authenticated user
        const instructorId = req.user.id;

        // Find all courses belonging to the instructor
        const instructorCourses = await Course.find({ instructor: instructorId });

        // Validate
        if (!instructorCourses || instructorCourses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No courses found for the associated instructor ID.",
            });
        }

        // Return the instructor's courses
        return res.status(200).json({
            success: true,
            data: instructorCourses,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message,
        });
    }
};

// Delete course.
exports.deleteCourse = async (req, res) => {
    try {
      // Get the course ID
      const { courseId } = req.body;
  
      // Find the course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentsEnrolled || []; // Ensure it's an array
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        });
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent || []; // Ensure it's an array
      for (const sectionId of courseSections) {
        const section = await Section.findById(sectionId);
        if (section) {
          const subSections = section.subSection || []; // Ensure it's an array
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId);
          }
        }
  
        await Section.findByIdAndDelete(sectionId);
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId);
  
      return res.status(200).json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  };
  



