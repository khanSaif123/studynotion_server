const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const { uploadImageToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

// create subSection. here in this HOME WORK present
exports.createSubSection = async (req, res) => {
  try {
    // Extract necessary information from the request body
    const { sectionId, title, description } = req.body;
    const video = req.files.video;

    // Check if all necessary fields are provided
    if (!sectionId || !title || !description || !video) {
      return res
        .status(404)
        .json({ success: false, message: "All Fields are Required" });
    }
    console.log(video);

    // Upload the video file to Cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    console.log("Upload details", uploadDetails);
    // Create a new sub-section with the necessary information
    const SubSectionDetails = await SubSection.create({
      title: title,
      timeDuration: `${uploadDetails.duration}`,
      description: description,
      videoUrl: `${uploadDetails.secure_url}`,
    });

    // Update the corresponding section with the newly created sub-section
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      { $push: { subSection: SubSectionDetails._id } },
      { new: true }
    ).populate("subSection");

    // Return the updated section in the response
    return res.status(200).json({ success: true, data: updatedSection });
  } catch (error) {
    // Handle any errors that may occur during the process
    console.error("Error creating new sub-section:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// update SubSection.
exports.updateSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId, title, description } = req.body;

    // Find the subsection by ID
    const subSection = await SubSection.findById(subSectionId);
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "Subsection not found",
        });
    }

    // Update title and description if provided
    if (title !== undefined) {
      subSection.title = title;
    }

    if (description !== undefined) {
      subSection.description = description;
    }

    // Update video if provided
    if (req.files && req.files.lectureVideo) {
      const video = req.files.lectureVideo;

      // Upload video to Cloudinary or other storage
      const uploadDetails = await uploadImageToCloudinary(
        video,
        process.env.FOLDER_NAME
      );

      // Update the video details in the subsection
      subSection.videoUrl = uploadDetails.secure_url;
      subSection.timeDuration = `${uploadDetails.duration}`;
    }

    // Save the updated subsection
    await subSection.save();

    // Fetch the updated section to return in the response
    const updatedSection = await Section.findById(sectionId)
      .populate({
        path: "subSection",
        select: "title description videoUrl timeDuration",
      })
      .exec();

    console.log("Updated Section:", updatedSection);

    // Send response
    return res.json({
      success: true,
      message: "Subsection updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the subsection",
    });
  }
};

// delete SubSection.
exports.deleteSubSection = async (req, res) => {
  try {
    const { sectionId, subSectionId } = req.body;

    // goto Section and delete the required subSectionId.
    await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $pull: {
          subSection: subSectionId,
        },
      }
    );

    // find the subSection through subSectionId and delete it.
    const subSection = await SubSection.findByIdAndDelete({
      _id: subSectionId,
    });

    if (!subSection) {
      return res.status(404).json({
        success: false,
        message: "SubSection not found",
      });
    }

    // find updated section and return it
    const updatedSection = await Section.findById(sectionId).populate(
      "subSection"
    );

    return res.json({
      success: true,
      message: "SubSection deleted successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the SubSection",
    });
  }
};
