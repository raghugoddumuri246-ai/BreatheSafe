const cron = require("node-cron");
const mongoose = require("mongoose");
const User = require("./models/User");
const Alert = require("./models/Alert");
const HealthAssessment = require("./models/HealthAssessment");
const sendSMS = require("./sendSMS");

// AQI Ranges for reference
const AQI_RANGES = {
  GOOD: { min: 0, max: 50, description: "Good - Air quality is satisfactory" },
  MODERATE: {
    min: 51,
    max: 100,
    description: "Moderate - Air quality is acceptable",
  },
  UNHEALTHY_SENSITIVE: {
    min: 101,
    max: 150,
    description: "Unhealthy for Sensitive Groups",
  },
  UNHEALTHY: { min: 151, max: 200, description: "Unhealthy" },
  VERY_UNHEALTHY: { min: 201, max: 300, description: "Very Unhealthy" },
  HAZARDOUS: { min: 301, max: 500, description: "Hazardous" },
};

// Function to get AQI description
const getAQIDescription = (aqi) => {
  for (const [key, range] of Object.entries(AQI_RANGES)) {
    if (aqi >= range.min && aqi <= range.max) {
      return range.description;
    }
  }
  return "Unknown";
};

// Function to format pollutants data
const formatPollutants = (pollutants) => {
  return Object.entries(pollutants)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");
};

// Function to store alert in database
const storeAlert = async (userId, location, aqi, pollutants, timestamp) => {
  try {
    const alert = new Alert({
      userId,
      location,
      aqiValue: aqi,
      pollutants,
      timestamp,
      smsSent: false,
    });
    await alert.save();
    return alert._id;
  } catch (error) {
    console.error("Error storing alert:", error);
    throw error;
  }
};

// Function to format time in 24-hour format
const formatTime = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  // Format hours in 24-hour format
  const formattedHours = String(hours).padStart(2, "0");
  const formattedMinutes = String(minutes).padStart(2, "0");

  // Convert to 12-hour format for display
  let twelveHour = hours;
  let ampm = "AM";
  if (hours === 0) {
    twelveHour = 12;
    ampm = "AM";
  } else if (hours > 12) {
    twelveHour = hours - 12;
    ampm = "PM";
  } else if (hours === 12) {
    ampm = "PM";
  }

  return `${year}-${month}-${day}, ${formattedHours}:${formattedMinutes} (${twelveHour}:${formattedMinutes} ${ampm})`;
};

// Function to fetch forecast data for a location
const fetchForecastData = async (location) => {
  try {
    // Clean and format location name
    const cleanLocation = location.trim().replace(/\s+/g, " ");
    
    // Extract just the city name (first part before any comma)
    const cityName = cleanLocation.split(',')[0].trim();
    console.log(`Original location: ${cleanLocation}, Using city name: ${cityName}`);

    // Use Open-Meteo's geocoding API to get coordinates for the location
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cityName
    )}&count=5&language=en`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();

    if (!geocodingData.results || geocodingData.results.length === 0) {
      console.error(`Location not found: ${cityName} (extracted from ${cleanLocation})`);
      throw new Error(
        `Location not found: ${cityName} (extracted from ${cleanLocation}). Please check the spelling or try a nearby major city.`
      );
    }

    // Find the best match for the location
    const bestMatch =
      geocodingData.results.find(
        (result) =>
          result.name.toLowerCase() === cityName.toLowerCase() ||
          result.admin1?.toLowerCase() === cityName.toLowerCase() ||
          result.country?.toLowerCase() === cityName.toLowerCase()
      ) || geocodingData.results[0];

    const { latitude, longitude } = bestMatch;

    // Get current time in UTC
    const now = new Date();

    // Fetch air quality data using the coordinates
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;

    const aqiResponse = await fetch(aqiUrl);
    const aqiData = await aqiResponse.json();

    if (!aqiData || !aqiData.hourly) {
      throw new Error(`No air quality data available for ${bestMatch.name}`);
    }

    // Fetch temperature data from Open Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&timezone=auto`;
    
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    if (!weatherData || !weatherData.hourly) {
      console.warn(`No temperature data available for ${bestMatch.name}`);
    }

    // Combine AQI and temperature data
    const combinedData = {
      ...aqiData,
      temperature: weatherData?.hourly?.temperature_2m || []
    };

    return combinedData;
  } catch (error) {
    console.error("Error fetching forecast data:", error);
    throw error;
  }
};

// Function to determine mask recommendation based on AQI, health symptoms, chronic diseases, and temperature
const getMaskRecommendation = (aqi, symptoms = [], chronicDiseases = [], age = 30, temperature) => {
  // Default recommendation
  let recommendation = "recommended";
  let maskType = "N95 or KN95 mask";
  let additionalNote = "";
  
  // Base recommendation on AQI level
  if (aqi >= 300) {
    recommendation = "mandatory";
  } else if (aqi >= 200) {
    recommendation = "strongly recommended";
  } else if (aqi >= 150) {
    recommendation = "recommended";
  }
  
  // Check for respiratory symptoms
  const hasRespiratorySymptoms = symptoms.some(symptom => 
    ["cough", "shortness of breath", "wheezing", "chest pain"].includes(symptom.toLowerCase())
  );
  
  // Check for respiratory diseases
  const hasRespiratoryDisease = chronicDiseases.some(disease => 
    ["asthma", "copd", "bronchitis", "emphysema"].includes(disease.toLowerCase())
  );
  
  // Check for cardiovascular diseases
  const hasCardiovascularDisease = chronicDiseases.some(disease => 
    ["heart disease", "hypertension", "high blood pressure"].includes(disease.toLowerCase())
  );
  
  // Check for immune system issues
  const hasImmuneIssue = chronicDiseases.some(disease => 
    ["immunodeficiency", "diabetes", "cancer"].includes(disease.toLowerCase())
  );
  
  // Check for pregnancy
  const isPregnant = chronicDiseases.some(disease => 
    disease.toLowerCase().includes("pregnant") || disease.toLowerCase().includes("pregnancy")
  );
  
  // Adjust recommendation based on health factors
  if (hasRespiratorySymptoms || hasRespiratoryDisease) {
    // Respiratory issues - highest priority
    if (recommendation === "recommended") {
      recommendation = "strongly recommended";
    } else if (recommendation === "strongly recommended") {
      recommendation = "mandatory";
    }
    maskType = "N95 or KN95 mask with valve for easier breathing";
    additionalNote = "Consider using a bronchodilator before going outside if prescribed by your doctor. ";
  } 
  else if (hasCardiovascularDisease || hasImmuneIssue || isPregnant || age >= 65 || age <= 12) {
    // Other vulnerable conditions
    if (recommendation === "recommended") {
      recommendation = "strongly recommended";
    }
    additionalNote = "Limit outdoor exposure when possible. ";
  }
  
  // Adjust based on temperature
  if (temperature > 35) { // Hot weather
    return {
      status: recommendation,
      type: maskType,
      note: additionalNote + "Use a lightweight mask due to high temperature. Take frequent breaks in air-conditioned spaces."
    };
  } else if (temperature < 10) { // Cold weather
    return {
      status: recommendation,
      type: maskType,
      note: additionalNote + "Consider a mask with a heat exchanger for comfort in cold weather."
    };
  } else { // Moderate temperature
    return {
      status: recommendation,
      type: maskType,
      note: additionalNote + "Standard protection recommended."
    };
  }
};

// Function to create concise SMS message
const createSMSMessage = (location, time, aqi, pollutants, symptoms, chronicDiseases, age, temperature) => {
  // Extract just the city name for shorter location
  const cityName = location.split(',')[0].trim();
  
  // Format date more concisely
  const date = new Date(time);
  const shortTimeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  
  // Get mask recommendation
  const maskRec = getMaskRecommendation(aqi, symptoms, chronicDiseases, age, temperature);
  
  // Set AQI level description
  let aqiLevel = "";
  if (aqi <= 50) aqiLevel = "Good";
  else if (aqi <= 100) aqiLevel = "Moderate";
  else if (aqi <= 150) aqiLevel = "Sensitive Groups";
  else if (aqi <= 200) aqiLevel = "Unhealthy";
  else if (aqi <= 300) aqiLevel = "Very Unhealthy";
  else aqiLevel = "Hazardous";
  
  // Use the actual forecast time passed to the function
  // Format time in a readable way (e.g., "May 31, 10:30 AM")
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[time.getMonth()];
  const day = time.getDate();
  const hours = time.getHours();
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const readableTime = `${month} ${day}, ${hour12}:${minutes} ${ampm}`;
  
  // Create a more readable message with line breaks
  const message = `BreathSafe Alert for ${cityName}\n` +
                  `Forecast for: ${readableTime}\n` +
                  `AQI: ${Math.round(aqi)} (${aqiLevel})\n` +
                  `PM2.5: ${Math.round(pollutants.PM2_5)} μg/m³\n` +
                  `Temp: ${temperature ? Math.round(temperature) + '°C' : 'N/A'}\n` +
                  `Mask: ${maskRec.status}`;
  
  // Check length and truncate if necessary
  if (message.length > 150) {
    return message.substring(0, 147) + '...';
  }
  
  return message;
};

// Main function to process alerts
const processAlerts = async () => {
  try {
    const now = new Date();
    console.log("\n=== AQI Alert System Started ===");

    // Get all users with their locations
    const users = await User.find({
      phone: { $exists: true, $ne: null, $ne: "" },
      location: { $exists: true, $ne: null, $ne: "" },
    });

    let totalAlertsSent = 0;

    for (const user of users) {
      try {
        console.log("\n======user:" + user.fullName + "========");
        console.log("========location:" + user.location + "===");

        // Fetch forecast data for user's location
        const forecastData = await fetchForecastData(user.location);

        if (
          !forecastData ||
          !forecastData.hourly ||
          !forecastData.hourly.us_aqi
        ) {
          console.error(`No forecast data available for user ${user._id}`);
          continue;
        }

        let alertsSent = 0;

        // Find the current hour index in the forecast data
        const now = new Date();
        const currentHourIndex = forecastData.hourly.time.findIndex(timeStr => {
          const forecastTime = new Date(timeStr);
          return forecastTime.getDate() === now.getDate() && 
                 forecastTime.getHours() === now.getHours();
        });
        
        // If current hour not found, start from the first available hour
        const startIndex = currentHourIndex !== -1 ? currentHourIndex : 0;
        
        // Process next 24 hours of data from current hour
        console.log(`Processing forecast data starting from index ${startIndex} (${new Date(forecastData.hourly.time[startIndex]).toLocaleString()})`);
        
        for (let i = startIndex; i < startIndex + 24 && i < forecastData.hourly.time.length; i++) {
          const aqi = Math.round(forecastData.hourly.us_aqi[i]);
          const timestamp = new Date(forecastData.hourly.time[i]);
          const formattedTime = formatTime(timestamp);
          
          console.log(`Checking forecast for ${timestamp.toLocaleString()}, AQI: ${aqi}`);

          // Only process if AQI is above 150 (Unhealthy)
          if (aqi > 88) {
            const pollutants = {
              PM2_5: Math.round(forecastData.hourly.pm2_5[i]),
              PM10: Math.round(forecastData.hourly.pm10[i]),
              CO: Math.round(forecastData.hourly.carbon_monoxide[i]),
              NO2: Math.round(forecastData.hourly.nitrogen_dioxide[i]),
              SO2: Math.round(forecastData.hourly.sulphur_dioxide[i]),
              O3: Math.round(forecastData.hourly.ozone[i]),
            };

            // Get temperature for this hour if available
            const temperature = forecastData.temperature && forecastData.temperature[i] ? forecastData.temperature[i] : null;

            // Fetch user's latest health assessment data from the database
            let healthSymptoms = [];
            let chronicDiseases = [];
            let age = 30; // Default age if not found

            try {
              // Find the most recent health assessment for this user
              const latestHealthAssessment = await HealthAssessment.findOne(
                { userId: user._id },
                { symptoms: 1, chronicDiseases: 1, age: 1 }
              ).sort({ timestamp: -1 });

              if (latestHealthAssessment) {
                healthSymptoms = latestHealthAssessment.symptoms || [];
                chronicDiseases = latestHealthAssessment.chronicDiseases || [];
                age = latestHealthAssessment.age || 30;
                console.log(`Found health assessment for user ${user.fullName}`);
              } else {
                console.log(`No health assessment found for user ${user.fullName}, using default values`);
              }
            } catch (error) {
              console.error(`Error fetching health assessment for user ${user._id}:`, error);
            }

            // Create and send SMS with health assessment data and temperature
            const message = createSMSMessage(
              user.location,
              timestamp,
              aqi,
              pollutants,
              healthSymptoms,
              chronicDiseases,
              age,
              temperature
            );
            console.log("alert message detected:" + formattedTime);
            console.log(
              "alert message: AQI " + aqi + " (" + getAQIDescription(aqi) + ")"
            );
            console.log(
              "Temperature: " + (temperature ? Math.round(temperature) + "°C" : "N/A") + 
              ", Health Symptoms: " + (healthSymptoms.length > 0 ? healthSymptoms.join(", ") : "none") +
              ", Chronic Diseases: " + (chronicDiseases.length > 0 ? chronicDiseases.join(", ") : "none") +
              ", Age: " + age
            );

            await sendSMS(message, user.phone);
            console.log("message sent successfully");

            await storeAlert(
              user._id,
              user.location,
              aqi,
              pollutants,
              timestamp
            );

            await Alert.findOneAndUpdate(
              { userId: user._id, timestamp: timestamp },
              { smsSent: true, smsSentAt: new Date() }
            );
            alertsSent++;
            totalAlertsSent++;
          }
        }

        if (alertsSent === 0) {
          console.log("No alerts needed for this user");
        }

      } catch (error) {
        console.error(`Error processing alerts for user ${user._id}:`, error);
      }
    }
    console.log("\n=== Alert Processing Summary ===");
    console.log(`Total alerts sent across all users: ${totalAlertsSent}`);
    console.log("===============================\n");
  } catch (error) {
    console.error("Error in processAlerts:", error);
  }
};

// Schedule alerts to run at 10 AM daily
const scheduleAlerts = () => {
  const cronSchedule = "02 11 * * *"; // Run at 11:02 AM (24-hour format)
  cron.schedule(cronSchedule, async () => {
    console.log(`Running scheduled alerts check at ${new Date().toLocaleTimeString()}...`);
    await processAlerts();
  });
  console.log(`SMS alerts scheduled to run at ${cronSchedule} daily`);
};

// Export functions
module.exports = {
  processAlerts,
  scheduleAlerts,
  createSMSMessage
};
