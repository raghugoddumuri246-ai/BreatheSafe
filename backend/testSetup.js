require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { processAlerts } = require('./scheduledAlerts');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/breathsafe')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function testDatabase() {
  try {
    // Fetch and display all users
    const users = await User.find();
    console.log('\n=== Database Users ===');
    console.log(`Total users found: ${users.length}`);
    
    if (users.length === 0) {
      console.log('No users found in database. Please add users first.');
      return;
    }

    console.log('\nUser Details:');
    users.forEach(user => {
      console.log('\n-------------------');
      console.log({
        id: user._id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        location: user.location
      });
    });

    console.log('\n=== Testing SMS Functionality ===');
    console.log('This will:');
    console.log('1. Fetch AQI data for each user\'s location');
    console.log('2. Send SMS if AQI > 200');
    console.log('3. Store alerts in database\n');
    
    await processAlerts();
    console.log('\nTest completed successfully');

  } catch (error) {
    console.error('\nTest failed with error:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    // Close the database connection
    try {
      await mongoose.connection.close();
      console.log('\nDatabase connection closed');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the test
console.log('Starting test...');
testDatabase(); 