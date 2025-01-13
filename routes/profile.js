const express = require('express')
const router = express.Router()

const {auth,isInstructor} = require('../middlewares/auth')

const {updateDisplayPicture, updateProfile, getUserDetails, 
    deleteAccount, getEnrolledCourses, instructorDashboard} = require('../controllers/Profile')



router.put('/updateDisplayPicture',auth, updateDisplayPicture)
router.delete('/delete-user-profile', auth, deleteAccount)
router.put('/updateProfile', auth, updateProfile)
router.get('/getUserDeatil', auth ,getUserDetails)

// get Enrolled Courses
router.get("/get-enrolled-courses", auth, getEnrolledCourses)
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard)

module.exports = router