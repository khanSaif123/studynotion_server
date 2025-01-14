const Category = require('../models/Category')

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }
// create category handler.
exports.createCategories = async (req, res) => {
    try {
        // Fetch data from the request body
        const { name, description } = req.body;

        // Validate required fields
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Create new category in the DB
        const categoryDetails = await Category.create({
            name,
            description,
        });

        console.log("New Category", categoryDetails);

        // Return success response
        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: categoryDetails,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// get all category from db.
exports.showAllCategories = async (req, res) => {
    try {
        // Get all categories using the find method
        const allCategories = await Category.find({}, { name: true, description: true });

        // Convert names to lowercase and replace spaces with hyphens
        const formattedCategories = allCategories.map((category) => ({
            name: category.name.replace(/\s+/g, "-").toLowerCase(),
            description: category.description,
        }));

        console.log("All Categories:", formattedCategories);

        // Return success response
        return res.status(200).json({
            success: true,
            message: "Fetched category details from DB successfully",
            data: formattedCategories,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching category data from the DB.",
        });
    }
};


// user search for course
exports.categoryPageDetails = async (req, res) => {
    try {
        // Get courses for the specified category
        const {categoryId} = req.body

        // we want published courses
        const selectedCategoryCourse = await Category.findById(categoryId)
            .populate({
                path:"courses",
                match:{status: "Published"},
                populate:"ratingAndReviews"
            }).exec()

            console.log("SELECTED COURSE", selectedCategoryCourse)
            console.log("Selected Course courses", selectedCategoryCourse.courses)
            // validate.
            if(!selectedCategoryCourse){
                console.log("Category not found.")
                return res
                .status(404)
                .json({ success: false, message: "Category not found" }) 
            }

            // if no course for the selected category.
            if(selectedCategoryCourse.courses.length === 0){
                console.log("No courses found for the selected category.")
                return res.status(404).json({
                success: false,
                message: "No courses found for the selected category.",
                })
            }

            // Get courses for other categories also.
            const showOtherCategoryCourse = await Category.find(
                {_id: {$ne: categoryId}})
            
                const differentCategory = await Category.findOne(
                    showOtherCategoryCourse[getRandomInt(showOtherCategoryCourse.length)]
                  )
                  .populate({
                    path: "courses",
                    match: { status: "Published" },
                    populate: "ratingAndReviews",
                  }).exec()

            // Get top-selling courses across all categories
            const allCategories = await Category.find()
            .populate({
            path: "courses",
            match: { status: "Published" },
            })
            .exec()
            const allCourses = allCategories.flatMap((category) => category.courses)
            const mostSellingCourses = allCourses
                .sort((a, b) => b.sold - a.sold)
                .slice(0, 10)
            
            return res.status(200).json({
                success: true,
                data:{
                    selectedCategoryCourse,
                    differentCategory,
                    mostSellingCourses
                }
            })
    } catch (error) {
        console.log("Error While getting Category PAGE DETAILS - ", error)
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
          })
    }
}

