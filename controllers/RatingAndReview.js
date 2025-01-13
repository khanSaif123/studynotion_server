const RatingAndReview = require('../models/RatingAndReview')
const Course = require('../models/Course')
const { default: mongoose } = require('mongoose')

// create rating.
exports.createRating = async (req, res) => {
    try {
      const userId = req.user.id
      const { rating, review, courseId } = req.body
  
      // Check if the user is enrolled in the course
  
      const courseDetails = await Course.findOne({
        _id: courseId,
        studentsEnroled: { $elemMatch: { $eq: userId } },
      })
  
      if (!courseDetails) {
        return res.status(404).json({
          success: false,
          message: "Student is not enrolled in this course",
        })
      }
  
      // Check if the user has already reviewed the course
      const alreadyReviewed = await RatingAndReview.findOne({
        user: userId,
        course: courseId,
      })
  
      if (alreadyReviewed) {
        return res.status(403).json({
          success: false,
          message: "Course already reviewed by user",
        })
      }
  
      // Create a new rating and review
      const ratingReview = await RatingAndReview.create({
        rating,
        review,
        course: courseId,
        user: userId,
      })
  
      // Add the rating and review to the course
      const updatedCourseDetail = await Course.findByIdAndUpdate(courseId, {
        $push: {
          ratingAndReviews: ratingReview._id,
        },
      })

      console.log(updatedCourseDetail)
      await courseDetails.save()
  
      return res.status(201).json({
        success: true,
        message: "Rating and review created successfully",
        ratingReview,
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
}

// getAverageRating
exports.getAverageRating = async (req, res) =>{
    try {
        // get courseId
        const courseId = req.body.courseId

        // calculate the average rating.
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course: new mongoose.Types.ObjectId(String(courseId))
                }
            },
            {
              $group: {
                _id: null, // all enries group into single group
                averageRating: { $avg: "$rating" },
              },
            },
        ])

        if (result.length > 0) {
            return res.status(200).json({
              success: true,
              averageRating: result[0].averageRating,
            })
        }

        return res.status(200).json({ success: true, averageRating: 0 })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
        success: false,
        message: "Failed to retrieve the rating for the course",
        error: error.message,
        })
    }
}

// get all ratings
exports.getAllRatingReview = async (req, res) =>{
    try {
        await RatingAndReview.find({})
        .sort({rating: "desc"})
        .populate({
            path:"user",
            select:"firstName lastName email image"
        })
        .populate({
            path:"course",
            select:"courseName"
        }).exec()

        res.status(200).json({
            success: true,
            data: allReviews,
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
        success: false,
        message: "Failed to retrieve the rating and review for the course",
        error: error.message,
        })
    }
}


