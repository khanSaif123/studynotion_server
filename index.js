const express = require('express')
const database = require('./config/database');
const cookieParser = require('cookie-parser');
const cloudinary = require('./config/cloudinary')
const fileUpload = require('express-fileupload')
const cors = require('cors')

require('dotenv').config()
const app = express()

const PORT = process.env.PORT || 5000;

// connecting to the data base.
database.connect()

// routes
const userRoutes = require('./routes/user')
const profileRoutes = require('./routes/profile')
const courseRoutes = require('./routes/Courses')
const contactusRoutes = require('./routes/Contact')
const paymentRoutes = require('./routes/Payment')

// middleWares
app.use(express.json())
app.use(cookieParser())
app.use(fileUpload({
    useTempFiles: true,
	tempFileDir: "/tmp/",
}))

app.use(
	cors({
		origin: "*",
		credentials: true,
	})
);


cloudinary.cloudinaryConnect()

// Setting up routes mounting
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes)
app.use("/api/v1/course", courseRoutes)
app.use("/api/v1/reach", contactusRoutes)
app.use("/api/v1/payment", paymentRoutes)

// default route
app.get('/', (req, res)=>{
    return res.json({
        success:true,
        message:"Your server up and running"
    })
})

app.listen(PORT , ()=>{
    console.log(`App is listening at ${PORT}`)
})