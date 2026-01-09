const express = require('express');
const router = express.Router();
const sendMail = require('../sendMail');

router.post('/submit', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        // Validate required fields
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Send email to admin
        const emailSent = await sendMail('gr3129223@gmail.com', 'contact', {
            name,
            email,
            message
        });

        if (emailSent) {
            res.json({
                success: true,
                message: 'Message sent successfully'
            });
        } else {
            throw new Error('Failed to send email');
        }
    } catch (error) {
        console.error('Contact form submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
});

module.exports = router; 