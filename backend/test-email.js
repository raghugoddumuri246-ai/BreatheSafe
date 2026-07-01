require('dotenv').config();
const nodemailer = require('nodemailer');

console.log("Testing Email Setup...");
console.log("Using Email:", process.env.EMAIL_USER || "Fallback email in code");

// We only show the first 3 chars of the password for security/debugging
const pass = process.env.EMAIL_PASS || "";
console.log("Password length:", pass.length, "(Starts with:", pass.substring(0, 3) + "...)");

const transporter = nodemailer.createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function testEmail() {
    try {
        console.log("Attempting to connect to Gmail...");
        await transporter.verify();
        console.log("✅ SUCCESS! Connected to Gmail SMTP server perfectly.");
        
        // Optional: Actually send a test email to yourself
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // sending to yourself
            subject: "BreatheSafe Test Email",
            text: "If you receive this, your email configuration is working flawlessly!"
        };
        
        console.log("Attempting to send a test email to", process.env.EMAIL_USER, "...");
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ SUCCESS! Test email sent. Message ID:", info.messageId);

    } catch (error) {
        console.error("❌ ERROR FAILED TO CONNECT OR SEND:");
        console.error(error);
    }
}

testEmail();
