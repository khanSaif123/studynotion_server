const {contactUsEmail} = require('../mail/templates/contactFormRes')
const mailSender = require('../utils/mailSender')

exports.contactUsController = async (req, res)=>{
    const {email, firstname, lastname, message, phoneNo, countrycode} = req.body;
    console.log(req.body)
    try{
        
        const emailRes = await mailSender(
            email,
            'Your Data send successfully',
            contactUsEmail(email, firstname, lastname, message, phoneNo, countrycode)
        )
        console.log("emailRes", emailRes)
        return res.status(200).json({
            success:true,
            message:"Email sent successfully"
        })
    }catch(error){
        console.log("Error", error);
        console.log("error message : ", error.message)
        return res.status(500).json({
            success:false,
            message:"Internal server Error, while sending email"
        })
    }
}