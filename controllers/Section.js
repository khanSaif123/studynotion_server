const Course = require('../models/Course')
const Section = require('../models/Section')

// create section. HERE in this HOME Work is present.
exports.createSection = async (req, res) =>{
    try {
        // data fetch
        const {sectionName, courseId} = req.body;
       
        // validate
        if(!sectionName || !courseId){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }
       
        // create section
        const newSection = await Section.create({sectionName})

        // update course with section object id
        const updateCourseDetails = await Course.findByIdAndUpdate(courseId,
                                        {
                                            $push:{
                                                courseContent: newSection._id // here ids are visible
                                                // but we want exact object id
                                            }
                                        },
                                        {new:true}).populate('courseContent')
        
        // home work: use populate to replace section/sub-section both in the updatedCourseDetails
        console.log("Updated course detail -> ",updateCourseDetails)
        // return response
        return res.status(200).json({
            success:true,
            message:"Section created successfully",
            updateCourseDetails
        })

    } catch (error) {
        console.error(error.message)
        return res.status(500).json({
            success:false,
            message:"Somthing went wrong while creating section"
        })
    }
}

// UPDATE a section
exports.updateSection = async (req, res) => {
  try {
    const { sectionName, sectionId, courseId } = req.body
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    )
    const course = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec()
    console.log(course)
    res.status(200).json({
      success: true,
      message: section,
      data: course,
    })
  } catch (error) {
    console.error("Error updating section:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    })
  }
}
 
// delete section.
exports.deleteSection = async (req, res) => {
    try {
      // Extract sectionId and courseId from body

      const { sectionId, courseId } = req.body;
  
      // Validate input
      if (!sectionId || !courseId) {
        return res.status(400).json({
          success: false,
          message: "Section ID and Course ID are required",
        });
      }
  
      // Find the section
      const section = await Section.findById(sectionId);
  
      if (!section) {
        return res.status(404).json({
          success: false,
          message: "Section not found with associated sectionId",
        });
      }
  
      // Delete associated subsections
      await Section.deleteMany({ _id: { $in: section.subSection } });
  
      // Delete the section
      await Section.findByIdAndDelete(sectionId);
  
      // Update the course content
      await Course.findByIdAndUpdate(courseId, {
        $pull: {
          courseContent: sectionId,
        },
      });
  
      // Optional: Return updated course
      const updatedCourse = await Course.findById(courseId).populate("courseContent");
  
      // Return success response
      return res.status(200).json({
        success: true,
        message: "Section deleted successfully",
        updatedCourse,
      });
    } catch (error) {
      // Return error response
      return res.status(500).json({
        success: false,
        message: "Unable to delete the section. Please try again.",
        error: error.message,
      });
    }
  };
  