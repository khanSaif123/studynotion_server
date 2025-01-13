const cloudinary = require('cloudinary').v2;

exports.uploadImageToCloudinary  = async (file, folder, height, quality) => {
    let options = { folder };

    if (height) {
        options.height = height;
    }
    if (quality) {
        options.quality = quality;
    }

    
    options.resource_type = "auto"; // Automatically detects the file type (image, video, etc.)

    try {
        return await cloudinary.uploader.upload(file.tempFilePath, options);
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error.message);
        throw error; // Propagate the error to handle it at a higher level
    }
};
