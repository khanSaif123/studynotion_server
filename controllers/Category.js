const Category = require('../models/Category')

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }
// create category handler.
exports.createCategories = async (req, res) =>{
    try {
        // fetch data.
        const {name, description} = req.body;

        // validate.
        if(!name || !description){
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        // create new entry in the db.
        const CategorysDetails = await Category.create({
            name,
            description
        })

        console.log("New Category", CategorysDetails)

        // return success response.
        return res.status(400).json({
            success:true,
            message:"Category created successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}

// get all category from db.
exports.showAllCategories = async (req, res) =>{
    try {
        // get all using find method
        const allCategorys = await Category.find({}, {name:true, description:true})
        console.log("allCategorys", allCategorys)

        return res.status(200).json({
            success: true,
            message:"Fetching category detail form DB successfully",
            data:allCategorys
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message: "Somthing went wrong while fetching the category data from DB."
        })
    }
}

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

