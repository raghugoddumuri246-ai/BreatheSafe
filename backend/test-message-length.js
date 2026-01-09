// Test script to check SMS message length
require('dotenv').config();

// Mock the necessary functions and data
const location = "Mangalagiri, Guntur, Andhra Pradesh";
const time = new Date();
const aqi = 85;
const pollutants = { PM2_5: 35, PM10: 60, CO: 800, NO2: 40, SO2: 20, O3: 30 };
const symptoms = ["Cough", "Shortness of breath"];
const chronicDiseases = ["Asthma", "COPD"];
const age = 45;
const temperature = 28;

function testMessageLength() {
  try {
    // Try to use the imported function if available
    const scheduledAlerts = require('./scheduledAlerts');
    
    if (scheduledAlerts.createSMSMessage) {
      const message = scheduledAlerts.createSMSMessage(location, time, aqi, pollutants, symptoms, chronicDiseases, age, temperature);
      console.log("Message length:", message.length);
      console.log("Message content:");
      console.log(message);
      console.log("\nIs under 160 characters:", message.length <= 160);
      
      // Test with different AQI levels
      console.log("\n=== Testing different AQI levels ===\n");
      const testAqiLevels = [30, 85, 120, 180, 250, 350];
      
      for (const testAqi of testAqiLevels) {
        const testMessage = scheduledAlerts.createSMSMessage(location, time, testAqi, pollutants, symptoms, chronicDiseases, age, temperature);
        console.log(`AQI ${testAqi} - Length: ${testMessage.length}`);
        console.log(testMessage);
        console.log("---");
      }
    } else {
      console.log("createSMSMessage function not found in scheduledAlerts module");
    }
  } catch (error) {
    console.error("Error testing message length:", error);
  }
}

testMessageLength();
