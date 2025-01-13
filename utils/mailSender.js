const nodemailer = require('nodemailer')
require('dotenv').config()

const mailSender = async (email, title, body)=>{
    
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
              user: process.env.MAIL_USER,
              pass: process.env.MAIL_PASS,
            },
            secure: false,
          });

        const info = await transporter.sendMail({
        from: 'StudyNotion || CodeHelp - by Saif Khan', 
        to: `${email}`, 
        subject: `${title}`, 
        html: `${body}`, // html body
        });
    
        console.log("Message sent: %s", info.messageId);
        return info

    } catch (error) {
        console.log(error.message)
        return error.message
    }
      
}

module.exports = mailSender