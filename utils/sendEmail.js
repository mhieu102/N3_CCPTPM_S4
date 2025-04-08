const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
    const msg = {
        to,
        from: 'vubatien20031410@gmail.com',
        subject,
        html
    };

    try {
        await sgMail.send(msg);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error.response?.body || error.message);
        throw new Error('Failed to send email');
    }
};

module.exports = sendEmail;