const mongoose = require('mongoose')

require('dotenv').config();

exports.connect = async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL).then(()=>{
            console.log('DB Connected Successfully')
        })
    }
    catch(error){
        console.log(`Database connection error: ${error.message}`);
        console.log('Error while connection the database')
        process.exit(1)
    }
    
}