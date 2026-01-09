require("dotenv").config();

// Twilio Credentials
// To set up environmental variables, see http://twil.io/secure
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

// Verify Twilio credentials
if (!accountSid) {
    console.error('TWILIO_ACCOUNT_SID is missing in .env file');
    process.exit(1);
}
if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN is missing in .env file');
    process.exit(1);
}
if (!fromNumber) {
    console.error('TWILIO_FROM_NUMBER is missing in .env file');
    process.exit(1);
}


// require the Twilio module and create a REST client
const client = require('twilio')(accountSid, authToken);

const sendSMS = async (body, toNumber) => {
    if (!toNumber) {
        throw new Error('Phone number is required');
    }

    // Ensure phone number has country code
    const formattedNumber = toNumber.startsWith('+') ? toNumber : `+91${toNumber}`;

    // Format message to ensure it's not too long
    const formattedBody = body.length > 1600 ? body.substring(0, 1597) + '...' : body;

    let msgOptions = {
        from: fromNumber,
        to: formattedNumber,
        body: formattedBody,
    };

    try {
        console.log('\nSending SMS with details:');
        console.log('To:', formattedNumber);
        console.log('From:', fromNumber);
        console.log('Message length:', formattedBody.length);
        console.log('Message preview:', formattedBody.substring(0, 100) + '...');
        
        const message = await client.messages.create(msgOptions);
        console.log('\nSMS sent successfully!');
        console.log('Message SID:', message.sid);
        console.log('Status:', message.status);
        console.log('Error Code:', message.errorCode);
        console.log('Error Message:', message.errorMessage);
        
        return message;
    } catch (err) {
        console.error('\nError sending SMS:');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        console.error('More Info:', err.moreInfo);
        console.error('Status:', err.status);
        console.error('SMS Details:', {
            to: formattedNumber,
            from: fromNumber,
            bodyLength: formattedBody.length
        });
        throw err;
    }
};

module.exports = sendSMS;