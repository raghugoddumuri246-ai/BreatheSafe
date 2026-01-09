require('dotenv').config();

console.log('Checking Twilio environment variables:');
console.log('TWILIO_ACCOUNT_SID exists:', process.env.TWILIO_ACCOUNT_SID ? 'Yes' : 'No');
console.log('TWILIO_AUTH_TOKEN exists:', process.env.TWILIO_AUTH_TOKEN ? 'Yes' : 'No');
console.log('TWILIO_FROM_NUMBER exists:', process.env.TWILIO_FROM_NUMBER ? 'Yes' : 'No');

// Check if they're not empty strings
console.log('TWILIO_ACCOUNT_SID is not empty:', process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.trim() !== '' ? 'Yes' : 'No');
console.log('TWILIO_AUTH_TOKEN is not empty:', process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_AUTH_TOKEN.trim() !== '' ? 'Yes' : 'No');
console.log('TWILIO_FROM_NUMBER is not empty:', process.env.TWILIO_FROM_NUMBER && process.env.TWILIO_FROM_NUMBER.trim() !== '' ? 'Yes' : 'No');

// Check format of the from number
if (process.env.TWILIO_FROM_NUMBER) {
  console.log('TWILIO_FROM_NUMBER format:', process.env.TWILIO_FROM_NUMBER.startsWith('+') ? 'Has + prefix' : 'Missing + prefix');
}
