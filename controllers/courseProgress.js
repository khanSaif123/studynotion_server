const CourseProgress = require("../models/CourseProgress")
const Subsection = require("../models/SubSection")

exports.updateCourseProgress = async (req, res) =>{
    // get courseId, userId, subSectionId.
    const {courseId, subSectionId} = req.body
    const userId = req.user.id

    try {
        // check if subSection is valid.
        const subsection = await Subsection.findById(subSectionId)

        if(!subsection){
            return res.status(404).json({
                error: "Invalid subSection"
            })
        }

        // find the course progress documebnt for the user and course.
        const courseProgress = await CourseProgress.findOne({
            courseID:courseId,
            userId:userId
        })
       
        // If course progress doesn't exist, create a new one
        if(!courseProgress){
            return res.status(404).json({
                success: false,
                message: "Course progress Does Not Exist",
              })
        }
        else if(courseProgress.completedViedos.includes(subSectionId)){
            return res.status(400).json({
                error:"SubSection already completed"
            })
        }

        // Push the subsection into the completedVideos array
        courseProgress.completedViedos.push(subSectionId)
        
        await courseProgress.save()

        return res.status(200).json({ message: "Course progress updated" })
       

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
}