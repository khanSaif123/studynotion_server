const express = require('express')
const router = express()

// import category controllers;
const {createCategories, showAllCategories, categoryPageDetails} = require('../controllers/Category')

// import course routes
const {createCourse, getCourseDetails, deleteCourse, getAllCourse, getFullCourseDetails,
    getInstructorCourse, editCourse
} = require('../controllers/Course')

// import middleware.
const {auth, isAdmin, isInstructor, isStudent} = require('../middlewares/auth') 

// import Section controllers.
const {createSection, updateSection, deleteSection} = require('../controllers/Section')

// import Sub Section
const {createSubSection, updateSubSection, deleteSubSection} = require('../controllers/SubSection')

// import course progress
const {updateCourseProgress} = require('../controllers/courseProgress')

// import rating and reviews
const {createRating, getAllRatingReview, getAverageRating} = require('../controllers/RatingAndReview')

// course routes.
router.post('/create-course', auth, isInstructor, createCourse)
router.post("/edit-course", auth, isInstructor, editCourse)
router.post('/get-course-details', getCourseDetails)
router.delete('/delete-course', deleteCourse)
router.get('/get-all-course', getAllCourse)
router.post('/get-full-course', auth, getFullCourseDetails)
router.get('/get-instructor-course', auth, isInstructor, getInstructorCourse)

// category routes
router.post('/create-category',auth, isAdmin, createCategories)
router.get('/show-all-category', showAllCategories)
router.post('/category-page-details', categoryPageDetails)

// Section Routes.
router.post('/create-section',auth, isInstructor, createSection)
router.post('/update-section',auth, isInstructor, updateSection )
router.post('/delete-section', auth, isInstructor, deleteSection)

// subSection routes.
router.post('/create-sub-section',auth, isInstructor, createSubSection)
router.post('/update-sub-section', auth, isInstructor, updateSubSection )
router.post('/delete-sub-section', auth, isInstructor, deleteSubSection)

// course progress route
router.post('/update-course-progress', auth, isStudent, updateCourseProgress)

// rating and reviews route
router.post('/create-rating', auth, isStudent, createRating)
router.post('/get-all-rating-review', getAllRatingReview)
router.post('/get-average-rating', getAverageRating)

module.exports = router;