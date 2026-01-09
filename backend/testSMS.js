require('dotenv').config();
const sendSMS = require('./sendSMS');

async function testSMS() {
    try {
        const message = "Test message from BreathSafe - " + new Date().toLocaleString();
        const phoneNumber = "9346011828"; // Your phone number
        
        console.log('Testing SMS functionality...');
        await sendSMS(message, phoneNumber);
        console.log('Test completed');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testSMS(); 