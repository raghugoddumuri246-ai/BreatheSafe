const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const HealthReport = require('../models/HealthReport');
const HealthAssessment = require('../models/HealthAssessment');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to list available models (for debugging)
async function listAvailableModels() {
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    return response.data.models?.map(m => m.name) || [];
  } catch (error) {
    console.error('Error listing models:', error.message);
    return [];
  }
}

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Generate health report
router.post('/generate', auth, async (req, res) => {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service is not properly configured. Please contact support.'
      });
    }

    const { location, aqiData } = req.body;

    if (!location || !aqiData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data: location and aqiData are required'
      });
    }
    
    // Get latest health assessment with all user data
    const healthAssessment = await HealthAssessment.findOne({ userId: req.userId })
      .sort({ timestamp: -1 })
      .lean();

    if (!healthAssessment) {
      return res.status(400).json({
        success: false,
        message: 'Please complete a health assessment first'
      });
    }

    if (!healthAssessment.name || !healthAssessment.age || !healthAssessment.symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Your health assessment is incomplete. Please update it with all required information.'
      });
    }

    // Check if health assessment is recent (within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    if (new Date(healthAssessment.timestamp) < thirtyDaysAgo) {
      return res.status(400).json({
        success: false,
        message: 'Your health assessment is more than 30 days old. Please fill out a new health assessment form for accurate recommendations.'
      });
    }

    // Enhanced prompt for Gemini with detailed analysis and specific recommendations based on all inputs
    const prompt = `You are an advanced health advisor helping people understand how air quality affects their health. Use simple, clear language that anyone can understand. Focus on providing personalized recommendations based on all the input factors.

    Current Environmental Conditions:
    - AQI Value: ${aqiData.value}
    - Air Quality Level: ${aqiData.status}
    - Temperature: ${aqiData.temperature !== undefined ? `${aqiData.temperature}${aqiData.temperatureUnit || '°C'}` : 'Not available'}
    - Pollutants: ${aqiData.pollutants.map(p => `${p.label}: ${p.value} ${p.unit}`).join(', ')}
    - Time: ${new Date().toLocaleTimeString()}
    - Date: ${new Date().toLocaleDateString()}
    
    User's Health Profile:
    - Name: ${healthAssessment.name}
    - Age: ${healthAssessment.age} years
    - Health Symptoms: ${healthAssessment.symptoms.join(', ')}
    - Chronic Diseases: ${healthAssessment.chronicDiseases ? healthAssessment.chronicDiseases.join(', ') : 'None reported'}
    ${healthAssessment.other ? `- Other Health Info: ${healthAssessment.other}` : ''}
    
    I need you to provide a comprehensive health analysis that includes:

    1. SYMPTOM-SPECIFIC RECOMMENDATIONS:
    For each reported symptom, provide a detailed analysis of:
    - How the current air quality and temperature specifically affect this symptom
    - Clear guidance on what the user should do to manage this symptom
    - When they should be extra cautious based on AQI and temperature
    - Format each recommendation with the symptom name as a heading followed by the advice

    2. CHRONIC DISEASE RECOMMENDATIONS:
    For each chronic disease reported, provide detailed analysis of:
    - How the current air quality (AQI: ${aqiData.value}) affects this specific condition
    - How each pollutant (${aqiData.pollutants.map(p => p.name + ': ' + p.value + ' ' + p.unit).join(', ')}) impacts this disease
    - How current temperature (${aqiData.temperature}${aqiData.temperatureUnit}) might exacerbate or alleviate symptoms
    - Specific precautions to take for managing this condition in current air quality
    - Warning signs requiring immediate medical attention
    - Medication adjustments that might be necessary
    - HIGHLIGHT the disease name in all recommendations for better visibility

    3. AGE-SPECIFIC RECOMMENDATIONS:
    Based on the user's age (${healthAssessment.age}) and health profile, provide tailored advice that considers:
    - Age-appropriate activity modifications during current conditions
    - Special precautions based on age group, chronic diseases, and current AQI/temperature
    - Whether the user can go outside or should stay indoors
    - Make this practical and immediately actionable

    3. OUTDOOR ACTIVITY GUIDANCE:
    Provide clear guidance on outdoor activities that:
    - Explicitly states whether outdoor activities are safe or not
    - Explains in simple terms how current conditions affect outdoor safety
    - Suggests specific times of day that might be safer (if any)
    - Recommends alternative activities if outdoors is unsafe

    4. MASK RECOMMENDATIONS:
    Provide specific mask guidance that:
    - Clearly states whether masks are recommended based on AQI, temperature, and health conditions
    - Specifies exactly what type of mask would be most effective (N95, surgical, etc.)
    - Explains how temperature affects mask effectiveness and comfort
    - Provides practical advice on mask usage in current conditions

    5. OXYGEN SUPPORT GUIDANCE:
    Analyze whether the user might need oxygen support based on:
    - Their chronic diseases (especially respiratory conditions)
    - Current AQI level and pollutant concentrations
    - Provide a clear recommendation on whether oxygen support is advised
    - If recommended, suggest appropriate oxygen levels/flow rates
    - Use simple language that makes this seem like an ML-based recommendation

    6. MEDICATION GUIDANCE:
    Provide medication recommendations that:
    - Address each specific health symptom and chronic disease
    - Consider how current air quality and temperature might affect medication needs
    - Include both preventive and reactive medication options
    - Clearly state when to consult a doctor
    - Format as clear, separate recommendations for different medication types

    Return a JSON object with this EXACT structure. Do not include any text before or after the JSON object:
    {
      "userProfile": {
        "age": ${healthAssessment.age},
        "ageGroup": "${healthAssessment.age < 18 ? 'Child' : healthAssessment.age < 60 ? 'Adult' : 'Senior'}",
        "riskLevel": "${aqiData.value > 150 ? 'High' : aqiData.value > 100 ? 'Moderate' : 'Low'}"
      },
      "ageSpecificRecommendations": [
        "Age-specific daily activity recommendations considering chronic conditions and symptoms",
        "Age-specific precautions for current air quality and temperature",
        "Special considerations for this age group with these health conditions"
      ],
      "healthSpecificRecommendations": [
        "Symptom Name: Detailed recommendation for this symptom",
        "Another Symptom: How air quality affects this symptom and what to do"
      ],
      "chronicDiseaseAnalysis": [
        {
          "diseaseName": "Disease Name",
          "highlighted": true,
          "riskLevel": "Moderate",
          "NOTE: riskLevel MUST be one of: 'Low', 'Moderate', 'High', or 'Severe' (NOT 'Critical' or 'Medium')",
          "aqiImpact": "How current AQI affects this disease specifically",
          "recommendations": [
            "Specific recommendation for this disease in current air quality",
            "Medication adjustments if needed",
            "When to seek medical attention"
          ],
          "precautions": [
            "Indoor precautions for this condition",
            "Outdoor activity limitations"
          ],
          "medicationAdjustments": "Specific medication guidance for this condition"
        }
      ],
      "pollutantImpacts": {
        "overall": "Overall assessment of how current pollutants affect reported conditions",
        "specificImpacts": [
          {
            "pollutant": "PM2.5",
            "impact": "How this pollutant affects reported chronic diseases",
            "mitigationSteps": "Steps to reduce exposure and impact"
          }
        ]
      },
      "temperatureEffect": "Analysis of how current temperature affects reported chronic conditions",
      "generalRecommendations": [
        "Indoor Air Quality: Tips for maintaining good indoor air quality",
        "Activity Modifications: How to modify daily activities",
        "Preventive Measures: General preventive measures",
        "Emergency Protocols: What to do in case of severe symptoms"
      ],
      "medicationGuidance": [
        "Current Medications: Advice for current medications",
        "Over-the-Counter: Recommended OTC medications",
        "When to Seek Help: When to consult a doctor",
        "Emergency Medications: Emergency medication protocols"
      ],
      "outdoorActivitySafety": {
        "isSafe": ${aqiData.value < 100},
        "recommendation": "Clear advice about outdoor activities considering health conditions",
        "timeRestrictions": "Best and worst times for outdoor activities",
        "activityModifications": "How to modify outdoor activities"
      },
      "maskRecommendations": {
        "isRecommended": ${healthAssessment.chronicDiseases && healthAssessment.chronicDiseases.some(d => d.toLowerCase().includes('respiratory') || d.toLowerCase().includes('asthma') || d.toLowerCase().includes('copd') || d.toLowerCase().includes('lung')) || aqiData.value > 100},
        "type": "Recommended mask type based on conditions and health status",
        "usage": "How to use the mask in current temperature conditions",
        "maintenance": "Mask care and replacement guidelines"
      },
      "oxygenRecommendations": {
        "isRecommended": ${healthAssessment.chronicDiseases && healthAssessment.chronicDiseases.some(d => d.toLowerCase().includes('respiratory') || d.toLowerCase().includes('asthma') || d.toLowerCase().includes('copd') || d.toLowerCase().includes('lung')) || aqiData.value > 200},
        "recommendation": "Clear advice about oxygen support needs based on chronic diseases",
        "level": "Recommended oxygen level if needed based on condition severity"
      }
    }

    CRITICAL INSTRUCTIONS: 
    1. Return ONLY a complete, valid JSON object - NO text before or after
    2. The JSON MUST include ALL required fields and be properly closed with closing braces
    3. Ensure the JSON is complete and valid - do not truncate the response
    4. Base all recommendations on the current AQI value (${aqiData.value})
    5. Consider the user's age (${healthAssessment.age}) for all recommendations
    6. Include specific medication advice for each reported symptom
    7. Provide clear, actionable steps for each recommendation
    8. Ensure all JSON properties are properly formatted with no trailing commas
    9. Keep all text values concise and clear
    10. The response MUST end with a closing brace '}' for the root JSON object
    11. IMPORTANT: For chronicDiseaseAnalysis[].riskLevel, use ONLY: 'Low', 'Moderate', 'High', or 'Severe' (NOT 'Critical', 'Medium', or any other value)`;

    try {
      // Generate report using Gemini (Free tier)
      // Try multiple model names as fallback - using Gemini 2.5 models (1.5 is deprecated)
      const modelNames = [
        "gemini-2.5-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.5-pro-latest",
        "gemini-2.5-pro",
        "gemini-2.5-flash-lite",
        "gemini-pro", // Fallback to generic gemini-pro
        "gemini-1.0-pro" // Last resort fallback
      ];
      let result;
      let lastError;
      
      // First, try to list available models for debugging
      if (process.env.NODE_ENV !== 'production') {
        try {
          const availableModels = await listAvailableModels();
          if (availableModels.length > 0) {
            console.log('Available models:', availableModels);
            // Extract model names from full paths (e.g., "models/gemini-pro" -> "gemini-pro")
            const modelNamesFromAPI = availableModels
              .map(name => name.replace('models/', ''))
              .filter(name => name.startsWith('gemini'));
            if (modelNamesFromAPI.length > 0) {
              // Prepend API-discovered models to the list
              modelNames.unshift(...modelNamesFromAPI);
            }
          }
        } catch (listError) {
          console.log('Could not list available models:', listError.message);
        }
      }
      
      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192, // Increased to handle complete JSON response
            },
          });
          console.log(`Successfully used model: ${modelName}`);
          break; // Success, exit loop
        } catch (err) {
          lastError = err;
          console.log(`Model ${modelName} not available: ${err.message}`);
          if (modelNames.indexOf(modelName) === modelNames.length - 1) {
            // Last model failed, provide helpful error message
            const errorMsg = `All Gemini models failed. This usually means:
1. Your API key may not have access to Gemini models
2. The models may not be available in your region
3. Your API key might be invalid or expired
Please check your GEMINI_API_KEY in the .env file and ensure it has access to Gemini models.
Last error: ${err.message}`;
            throw new Error(errorMsg);
          }
          continue; // Try next model
        }
      }
      
      if (!result) {
        throw new Error(`No available Gemini models found. Last error: ${lastError?.message || 'Unknown error'}`);
      }
      
      const response = await result.response;
      const responseText = response.text();
      
      // Check if response was truncated
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('Warning: Response may have been truncated due to token limit');
      }
      
      // Log response length for debugging
      console.log(`AI Response length: ${responseText.length} characters`);
      
      let reportData;
      try {
        // Clean the response text to ensure it's valid JSON
        let cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
        
        // Additional cleaning to handle potential formatting issues
        const jsonStart = cleanedText.indexOf('{');
        const jsonEnd = cleanedText.lastIndexOf('}');
        
        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
          console.error('Invalid JSON response from AI - missing braces');
          console.error('Response preview:', responseText.substring(0, 500));
          throw new Error('Invalid JSON response from AI - response appears incomplete');
        }
        
        cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
        
        // Check if JSON appears incomplete (missing closing braces)
        const openBraces = (cleanedText.match(/{/g) || []).length;
        const closeBraces = (cleanedText.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
          console.error(`JSON appears incomplete - Open braces: ${openBraces}, Close braces: ${closeBraces}`);
          console.error('Response preview:', cleanedText.substring(0, 1000));
          throw new Error(`Incomplete JSON response - missing ${openBraces - closeBraces} closing brace(s)`);
        }
        
        // Remove any trailing commas before closing braces
        cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
        
        try {
          reportData = JSON.parse(cleanedText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError.message);
          console.error('Error at position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
          console.error('Cleaned text length:', cleanedText.length);
          console.error('Cleaned text preview (first 500 chars):', cleanedText.substring(0, 500));
          console.error('Cleaned text preview (last 500 chars):', cleanedText.substring(Math.max(0, cleanedText.length - 500)));
          throw new Error(`Failed to parse AI response as JSON: ${parseError.message}`);
        }

        // Validate required fields
        if (!reportData.healthSpecificRecommendations || !Array.isArray(reportData.healthSpecificRecommendations)) {
          throw new Error('Missing or invalid health-specific recommendations in AI response');
        }

        // Convert recommendations to strings if they're objects
        reportData.healthSpecificRecommendations = reportData.healthSpecificRecommendations.map(rec => {
          if (typeof rec === 'object') {
            return `${rec.issue}: ${rec.effect} ${rec.safetyMeasures} ${rec.extraCare} ${rec.medicationAdvice || ''}`;
          }
          return rec;
        });

        // Convert age-specific recommendations to strings
        if (reportData.ageSpecificRecommendations) {
          const ageRecs = reportData.ageSpecificRecommendations;
          reportData.ageSpecificRecommendations = [
            `Daily Activities: ${ageRecs.dailyActivities}`,
            `Precautions: ${ageRecs.precautions}`,
            `Special Considerations: ${ageRecs.specialConsiderations}`
          ];
        } else {
          const age = healthAssessment.age;
          reportData.ageSpecificRecommendations = [
            `Daily Activities: ${age < 18 
              ? "Limit outdoor activities and focus on indoor games and learning activities."
              : age < 60
              ? "Modify work and exercise routines based on air quality."
              : "Stay indoors during poor air quality and maintain gentle indoor exercises."}`,
            `Precautions: ${age < 18
              ? "Ensure proper ventilation in classrooms and homes."
              : age < 60
              ? "Use air purifiers at work and home."
              : "Keep emergency medications handy and maintain regular health check-ups."}`,
            `Special Considerations: ${age < 18
              ? "Monitor for any respiratory symptoms and maintain vaccination schedule."
              : age < 60
              ? "Balance work commitments with health precautions."
              : "Regular monitoring of existing conditions and medication adjustments if needed."}`
          ];
        }

        // Convert general recommendations to strings
        if (reportData.generalRecommendations) {
          const genRecs = reportData.generalRecommendations;
          reportData.generalRecommendations = [
            `Indoor Air Quality: ${genRecs.indoorAirQuality}`,
            `Activity Modifications: ${genRecs.activityModifications}`,
            `Preventive Measures: ${genRecs.preventiveMeasures}`,
            `Emergency Protocols: ${genRecs.emergencyProtocols}`
          ];
        } else {
          reportData.generalRecommendations = [
            "Indoor Air Quality: Use air purifiers, maintain proper ventilation, and keep windows closed during poor air quality.",
            "Activity Modifications: Reduce strenuous activities and take frequent breaks.",
            "Preventive Measures: Stay hydrated, maintain good nutrition, and get adequate rest.",
            "Emergency Protocols: Keep emergency contacts handy and seek medical help if symptoms worsen."
          ];
        }

        // Convert medication guidance to strings
        if (reportData.medicationGuidance) {
          const medGuidance = reportData.medicationGuidance;
          reportData.medicationGuidance = [
            `Current Medications: ${medGuidance.currentMedications}`,
            `Over-the-Counter: ${medGuidance.overTheCounter}`,
            `When to Seek Help: ${medGuidance.whenToSeekHelp}`,
            `Emergency Medications: ${medGuidance.emergencyMedications}`
          ];
        } else {
          reportData.medicationGuidance = [
            "Current Medications: Continue prescribed medications and consult doctor if symptoms worsen.",
            "Over-the-Counter: Consider OTC medications for symptom relief after consulting a doctor.",
            "When to Seek Help: Seek medical attention for severe symptoms or if existing conditions worsen.",
            "Emergency Medications: Keep rescue medications accessible and know how to use them."
          ];
        }

        // Process chronic disease analysis data
        if (reportData.chronicDiseaseAnalysis && Array.isArray(reportData.chronicDiseaseAnalysis)) {
          // The structure is already as expected, no need to transform
        } else if (reportData.chronicDiseaseRecommendations && Array.isArray(reportData.chronicDiseaseRecommendations)) {
          // Convert old format to new format
          reportData.chronicDiseaseAnalysis = reportData.chronicDiseaseRecommendations.map(rec => {
            // Extract disease name from the recommendation string
            const colonIndex = rec.indexOf(':');
            const diseaseName = colonIndex > 0 ? rec.substring(0, colonIndex).trim() : 'Chronic Disease';
            const recommendation = colonIndex > 0 ? rec.substring(colonIndex + 1).trim() : rec;
            
            return {
              diseaseName: diseaseName,
              highlighted: true,
              riskLevel: 'Moderate',
              aqiImpact: `The current air quality (AQI: ${aqiData.value}) may affect ${diseaseName} symptoms.`,
              recommendations: [recommendation],
              precautions: [
                `Monitor ${diseaseName} symptoms closely in current air quality conditions.`,
                `Consider staying indoors during peak pollution hours.`
              ],
              medicationAdjustments: `Consult your doctor about adjusting medications for ${diseaseName} if symptoms worsen.`
            };
          });
        } else {
          // Create default chronic disease analysis if none provided
          const chronicDiseases = healthAssessment.chronicDiseases || [];
          reportData.chronicDiseaseAnalysis = chronicDiseases.map(disease => ({
            diseaseName: disease,
            highlighted: true,
            riskLevel: aqiData.value > 150 ? 'High' : aqiData.value > 100 ? 'Moderate' : 'Low',
            aqiImpact: `The current air quality (AQI: ${aqiData.value}) may affect ${disease} symptoms.`,
            recommendations: [
              `Monitor ${disease} symptoms closely with current AQI level of ${aqiData.value}.`,
              `Keep medications readily available.`,
              `Consider limiting outdoor exposure during peak pollution hours.`
            ],
            precautions: [
              `Stay indoors when air quality is poor.`,
              `Use air purifiers to improve indoor air quality.`
            ],
            medicationAdjustments: `Consult your doctor about adjusting medications for ${disease} if symptoms worsen.`
          }));
        }
        
        // Process pollutant impacts data
        if (!reportData.pollutantImpacts) {
          reportData.pollutantImpacts = {
            overall: `The current pollutant levels may affect existing health conditions.`,
            specificImpacts: aqiData.pollutants.map(pollutant => ({
              pollutant: pollutant.name,
              impact: `${pollutant.name} at ${pollutant.value} ${pollutant.unit} may affect respiratory health.`,
              mitigationSteps: `Use air purifiers and limit outdoor exposure when ${pollutant.name} levels are high.`
            }))
          };
        }
        
        // Process temperature effect data
        if (!reportData.temperatureEffect) {
          reportData.temperatureEffect = aqiData.temperature ?
            `Current temperature of ${aqiData.temperature}${aqiData.temperatureUnit} may impact chronic conditions. Stay hydrated and avoid temperature extremes.` :
            'Temperature data not available. Monitor your symptoms and adjust activities accordingly.';
        }
        
        // Create default data if any required fields are missing
        if (!reportData.outdoorActivitySafety) {
          const aqi = aqiData.value;
          reportData.outdoorActivitySafety = {
            isSafe: aqi < 100,
            recommendation: aqi > 150 
              ? `The air quality is poor right now (AQI ${aqi}). It's best to stay inside.`
              : aqi > 100
              ? `The air quality is not great (AQI ${aqi}). Try to stay inside as much as possible.`
              : `The air quality is okay (AQI ${aqi}). You can go outside, but take it easy.`,
            timeRestrictions: "Early morning hours typically have better air quality.",
            activityModifications: "Reduce intensity and duration of outdoor activities."
          };
        }
        
        if (!reportData.maskRecommendations) {
          const aqi = aqiData.value;
          reportData.maskRecommendations = {
            isRecommended: aqi > 100,
            type: aqi > 150 ? 'N95 mask' : 'Regular mask',
            usage: aqi > 100 
              ? `Wear a mask when you go outside. Change it if it gets wet or dirty.`
              : `You don't need a mask right now, but keep one handy just in case.`,
            maintenance: "Replace masks daily or when they become damp or soiled."
          };
        }
      } catch (parseError) {
        console.error('Error processing AI response:', parseError);
        throw new Error('Failed to process AI response: ' + parseError.message);
      }

      // Prepare health report data
      const healthReportData = {
        userId: req.userId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          name: location.name
        },
        aqiData: {
          value: aqiData.value,
          status: aqiData.status,
          pollutants: aqiData.pollutants,
          temperature: aqiData.temperature,
          temperatureUnit: aqiData.temperatureUnit || '°C',
          timestamp: new Date()
        },
        healthData: {
          name: healthAssessment.name,
          age: healthAssessment.age,
          symptoms: healthAssessment.symptoms,
          chronicDiseases: (healthAssessment.chronicDiseases || []).map(disease => ({
            name: disease,
            severity: 'Moderate',
            diagnosisYear: new Date().getFullYear(),
            medications: [],
            notes: ''
          })),
          other: healthAssessment.other || '',
          assessmentDate: healthAssessment.timestamp
        },
        report: {
          userProfile: {
            ...reportData.userProfile,
            // Normalize riskLevel if needed (for consistency, even though it's not an enum)
            riskLevel: (() => {
              const rl = reportData.userProfile?.riskLevel || 'Moderate';
              const rlLower = rl.toLowerCase();
              if (rlLower === 'medium' || rlLower === 'mod') return 'Moderate';
              if (rlLower === 'critical' || rlLower === 'very high') return 'High';
              if (rlLower === 'low' || rlLower === 'minimal') return 'Low';
              if (rlLower === 'high') return 'High';
              return rl; // Return as-is if already valid
            })()
          },
          ageSpecificRecommendations: reportData.ageSpecificRecommendations,
          healthSpecificRecommendations: reportData.healthSpecificRecommendations,
          generalRecommendations: reportData.generalRecommendations,
          medicationGuidance: reportData.medicationGuidance,
          outdoorActivitySafety: reportData.outdoorActivitySafety,
          maskRecommendations: reportData.maskRecommendations,
          chronicDiseaseAnalysis: (reportData.chronicDiseaseAnalysis || []).map(disease => {
            // Normalize riskLevel to match enum values: ['Low', 'Moderate', 'High', 'Severe']
            let riskLevel = disease.riskLevel || 'Moderate';
            const riskLevelLower = riskLevel.toLowerCase();
            
            // Map invalid values to valid enum values
            if (riskLevelLower === 'critical' || riskLevelLower === 'very high' || riskLevelLower === 'extreme') {
              riskLevel = 'Severe';
            } else if (riskLevelLower === 'medium' || riskLevelLower === 'mod') {
              riskLevel = 'Moderate';
            } else if (riskLevelLower === 'low' || riskLevelLower === 'minimal') {
              riskLevel = 'Low';
            } else if (riskLevelLower === 'high') {
              riskLevel = 'High';
            } else if (riskLevelLower === 'severe') {
              riskLevel = 'Severe';
            } else {
              // Default to Moderate if unrecognized
              riskLevel = 'Moderate';
            }
            
            return {
              ...disease,
              riskLevel: riskLevel
            };
          }),
          timestamp: new Date()
        },
        oxygenRecommendations: reportData.oxygenRecommendations,
        airQualityImpact: {
          overallImpact: reportData.pollutantImpacts?.overall || `The current air quality (AQI: ${aqiData.value}) may affect your health conditions.`,
          chronicDiseaseImpacts: (healthAssessment.chronicDiseases || []).map(disease => ({
            diseaseName: disease,
            impactLevel: aqiData.value > 150 ? 'Significant' : aqiData.value > 100 ? 'Moderate' : 'Minimal',
            details: `${disease} may be affected by current air quality levels. Monitor symptoms closely.`
          })),
          temperatureEffect: reportData.temperatureEffect || `Current temperature conditions may impact your health.`
        }
      };

      // Create and save the health report
      const healthReport = new HealthReport(healthReportData);
      await healthReport.save();

      // Send response with user details
      const responseData = {
        success: true,
        message: 'Health report generated successfully',
        report: {
          _id: healthReport._id,
          timestamp: healthReport.timestamp,
          personalInfo: {
            name: healthAssessment.name,
            age: healthAssessment.age,
            ageGroup: reportData.userProfile.ageGroup,
            riskLevel: reportData.userProfile.riskLevel
          },
          location: healthReport.location,
          airQuality: {
            ...healthReport.aqiData,
            timestamp: new Date()
          },
          healthStatus: {
            reportedIssues: healthAssessment.symptoms,
            chronicDiseases: healthReport.healthData.chronicDiseases.map(disease => ({
              name: disease.name,
              severity: disease.severity,
              diagnosisYear: disease.diagnosisYear,
              highlighted: true
            })),
            additionalInfo: healthAssessment.other || '',
            lastAssessmentDate: healthAssessment.timestamp
          },
          recommendations: {
            healthSpecific: reportData.healthSpecificRecommendations,
            ageSpecific: reportData.ageSpecificRecommendations,
            general: reportData.generalRecommendations,
            medication: reportData.medicationGuidance
          },
          outdoorActivitySafety: {
            isSafe: reportData.outdoorActivitySafety.isSafe,
            recommendation: reportData.outdoorActivitySafety.recommendation,
            timeRestrictions: reportData.outdoorActivitySafety.timeRestrictions,
            activityModifications: reportData.outdoorActivitySafety.activityModifications
          },
          maskRecommendations: {
            isRecommended: reportData.maskRecommendations.isRecommended,
            type: reportData.maskRecommendations.type,
            usage: reportData.maskRecommendations.usage,
            maintenance: reportData.maskRecommendations.maintenance
          },
          oxygenRecommendations: reportData.oxygenRecommendations,
          chronicDiseaseAnalysis: {
            diseases: healthReport.healthData.chronicDiseases.map(disease => ({
              name: disease.name,
              highlighted: true,
              riskLevel: 'Moderate',
              aqiImpact: `The current air quality (AQI: ${healthReport.aqiData.value}) may affect ${disease.name} symptoms.`,
              recommendations: [
                `Monitor ${disease.name} symptoms closely with current AQI level of ${healthReport.aqiData.value}.`,
                `Keep medications readily available.`,
                `Consider limiting outdoor exposure during peak pollution hours.`
              ],
              pollutantImpacts: healthReport.aqiData.pollutants.map(pollutant => ({
                pollutantName: pollutant.name,
                impactLevel: 'Moderate',
                effect: `${pollutant.name} (${pollutant.value} ${pollutant.unit}) may exacerbate ${disease.name} symptoms.`
              }))
            })),
            temperatureEffect: healthReport.aqiData.temperature ? 
              `Current temperature of ${healthReport.aqiData.temperature}${healthReport.aqiData.temperatureUnit} may impact chronic conditions.` : 
              'Temperature data not available.'
          }
        }
      };

      res.status(200).json(responseData);
    } catch (geminiError) {
      console.error('Gemini API Error:', geminiError);
      
      // Check for specific API key related errors
      if (geminiError.message.includes('API key') || geminiError.message.includes('authentication')) {
        return res.status(500).json({
          success: false,
          message: 'Invalid API key. Please check your configuration.',
          error: 'API_KEY_ERROR'
        });
      }
      
      // Check for rate limiting or quota errors
      if (geminiError.message.includes('quota') || geminiError.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          message: 'AI service is currently busy. Please try again in a few minutes.',
          error: 'RATE_LIMIT_ERROR'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error generating health report with AI',
        error: geminiError.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating health report',
      error: error.message
    });
  }
});

// Get user's health reports
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await HealthReport.find({ userId: req.userId })
      .sort({ 'report.timestamp': -1 });
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reports',
      error: error.message
    });
  }
});

// Get specific health report
router.get('/reports/:id', auth, async (req, res) => {
  try {
    const report = await HealthReport.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Create a copy of the report to modify
    const reportData = report.toObject();
    
    // Ensure outdoorActivitySafety is present with detailed recommendations
    if (!reportData.outdoorActivitySafety) {
      const aqi = reportData.aqiData.value;
      let outdoorRecommendation = '';
      
      if (aqi < 50) {
        outdoorRecommendation = `With the current excellent air quality (AQI ${aqi}), enjoy outdoor activities freely 🌳. Morning walks 🌅 and afternoon exercises 🏃‍♀️ are perfectly safe for your respiratory health. Even extended outdoor activities like hiking 🥾 or cycling 🚴‍♀️ pose minimal risk. Keep windows open to allow fresh air circulation throughout your home 🏠.`;
      } else if (aqi < 100) {
        outdoorRecommendation = `With moderate air quality (AQI ${aqi}), most outdoor activities remain safe 🌲. Consider early morning exercises 🌄 when air quality is typically better. Limit strenuous activities like running 🏃‍♀️ to less than 60 minutes. If you experience any respiratory discomfort 😮‍💨, take breaks and move indoors.`;
      } else if (aqi < 150) {
        outdoorRecommendation = `With the current air quality (AQI ${aqi}), reduce prolonged outdoor exertion ⚠️. Morning hours 🌅 typically have better air quality for essential outdoor activities. Limit outdoor exercise to 30 minutes or less 🕐. Keep windows closed during peak pollution hours 🏙️ and use air purifiers indoors if available 🔄.`;
      } else {
        outdoorRecommendation = `With poor air quality (AQI ${aqi}), minimize all outdoor activities 🚫. Stay indoors with windows closed as much as possible 🏠. If you must go outside, limit your time to essential activities only ⏱️. Early morning hours 🌅 may have slightly better air quality if outdoor activity is unavoidable. Consider using air purifiers indoors 🔄.`;
      }
      
      reportData.outdoorActivitySafety = {
        isSafe: aqi < 100,
        recommendation: outdoorRecommendation
      };
    }
    
    // Ensure maskRecommendations is present with detailed recommendations
    if (!reportData.maskRecommendations) {
      const aqi = reportData.aqiData.value;
      let maskType = '';
      let maskUsage = '';
      let isRecommended = false;
      
      if (aqi < 50) {
        isRecommended = false;
        maskType = 'Not necessary';
        maskUsage = `With excellent air quality (AQI ${aqi}), masks are generally not necessary for most people 😊. If you have severe respiratory conditions, you might keep a cloth mask handy as a precaution 🧣. Focus instead on maintaining good indoor air quality with proper ventilation 🪟. Enjoy outdoor activities mask-free while maintaining good respiratory hygiene practices 🌬️.`;
      } else if (aqi < 100) {
        isRecommended = reportData.healthData && reportData.healthData.symptoms && reportData.healthData.symptoms.length > 0;
        maskType = 'Surgical or high-quality cloth mask';
        maskUsage = `With moderate air quality (AQI ${aqi}), consider wearing a mask if you have respiratory conditions 😷. Surgical or high-quality cloth masks are sufficient for brief outdoor activities 🚶‍♀️. Ensure your mask fits properly around your face without gaps 👌. Replace disposable masks daily or when they become damp or visibly soiled 📅.`;
      } else if (aqi < 150) {
        isRecommended = true;
        maskType = 'N95 or KN95 mask for sensitive individuals';
        maskUsage = `With the current air quality (AQI ${aqi}), wearing a mask outdoors is recommended, especially for sensitive individuals 😷. N95 or KN95 masks provide better filtration for pollution particles 🧫. Ensure a proper seal around your face for maximum protection 👍. Limit mask use to 4-6 hours per mask and avoid reusing disposable masks multiple times 🔄.`;
      } else {
        isRecommended = true;
        maskType = 'N95 or KN95 mask';
        maskUsage = `With poor air quality (AQI ${aqi}), N95 or KN95 masks are strongly recommended whenever outdoors 😷. These masks filter small particles effectively when properly fitted 🔍. Change your mask daily or when it becomes difficult to breathe through 📆. Even with a mask, minimize time outdoors and keep indoor air clean with air purifiers 🏠.`;
      }
      
      reportData.maskRecommendations = {
        isRecommended: isRecommended,
        type: maskType,
        usage: maskUsage
      };
    }
    
    // Add medication recommendations if not provided
    if (!reportData.medicationRecommendations) {
      const symptoms = reportData.healthData.symptoms || [];
      let specificAdvice = '';
      
      // Create specific advice based on reported symptoms
      if (symptoms.includes('Cough')) {
        specificAdvice += `For your cough, consider the following medications:
        - For dry cough: Dextromethorphan (Robitussin DM, Delsym)
        - For productive cough: Guaifenesin (Mucinex, Robitussin)
        - For cough with congestion: Pseudoephedrine + Guaifenesin (Mucinex D)
        - Natural remedies: Honey and lemon tea, Throat Coat tea
        Note: If cough persists beyond 7 days, consult a healthcare professional.`;
      }
      
      if (symptoms.includes('Shortness of breath')) {
        specificAdvice += `For shortness of breath:
        - Prescription inhalers: Albuterol (ProAir, Ventolin) for rescue
        - Long-acting bronchodilators: Salmeterol (Serevent), Formoterol (Foradil)
        - Inhaled corticosteroids: Fluticasone (Flovent), Budesonide (Pulmicort)
        - Combination inhalers: Fluticasone/Salmeterol (Advair), Budesonide/Formoterol (Symbicort)
        Note: Always keep rescue inhalers accessible and seek immediate medical attention for severe symptoms.`;
      }
      
      if (symptoms.includes('Wheezing')) {
        specificAdvice += `For wheezing:
        - Quick-relief inhalers: Albuterol (ProAir, Ventolin)
        - Long-term control: Montelukast (Singulair)
        - Inhaled corticosteroids: Fluticasone (Flovent), Budesonide (Pulmicort)
        - Combination medications: Fluticasone/Salmeterol (Advair)
        Note: Monitor peak flow readings if you have a meter and stay in air-conditioned environments during poor air quality.`;
      }
      
      if (symptoms.includes('Sore throat')) {
        specificAdvice += `For sore throat:
        - Pain relief: Acetaminophen (Tylenol), Ibuprofen (Advil)
        - Throat lozenges: Cepacol, Chloraseptic
        - Numbing sprays: Chloraseptic spray, Vicks VapoSpray
        - Natural remedies: Warm salt water gargles, Throat Coat tea
        Note: Avoid irritants like smoking and stay hydrated.`;
      }
      
      if (symptoms.includes('Nasal congestion')) {
        specificAdvice += `For nasal congestion:
        - Decongestants: Pseudoephedrine (Sudafed), Phenylephrine (Sudafed PE)
        - Nasal sprays: Oxymetazoline (Afrin), Fluticasone (Flonase)
        - Antihistamines: Loratadine (Claritin), Cetirizine (Zyrtec)
        - Saline rinses: NeilMed Sinus Rinse, Simply Saline
        Note: Limit decongestant use to 3 days to avoid rebound congestion.`;
      }
      
      if (symptoms.includes('Eye irritation')) {
        specificAdvice += `For eye irritation:
        - Artificial tears: Systane, Refresh, TheraTears
        - Antihistamine eye drops: Ketotifen (Zaditor), Naphazoline/Pheniramine (Visine-A)
        - Preservative-free options: Refresh Plus, TheraTears PF
        Note: Avoid rubbing eyes and consider wearing wraparound sunglasses outdoors.`;
      }
      
      if (symptoms.includes('Headache')) {
        specificAdvice += `For headaches:
        - Pain relievers: Acetaminophen (Tylenol), Ibuprofen (Advil), Aspirin
        - Combination medications: Acetaminophen/Aspirin/Caffeine (Excedrin)
        - Migraine specific: Sumatriptan (Imitrex), Rizatriptan (Maxalt)
        Note: Stay hydrated and rest in a dark, quiet room. Seek medical attention for severe or persistent headaches.`;
      }
      
      // If no specific symptoms or empty symptoms array
      if (specificAdvice === '') {
        specificAdvice = `Based on your health profile, focus on preventive measures:
        - General antihistamines: Loratadine (Claritin), Cetirizine (Zyrtec)
        - Vitamin supplements: Vitamin C, Vitamin D3
        - Antioxidant supplements: Quercetin, N-acetylcysteine
        Note: Always consult with a healthcare professional before starting any new medication.`;
      }
      
      // const disclaimer = "These medication recommendations are for informational purposes only and do not constitute medical advice. Always consult with a qualified healthcare professional before starting, stopping, or changing any medication regimen.";
      
      reportData.medicationRecommendations = {
        specific: specificAdvice,
        
      };
    }

    res.json({
      success: true,
      report: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report',
      error: error.message
    });
  }
});

// Get count of health reports for logged-in user
router.get('/count', auth, async (req, res) => {
  try {
    const count = await HealthReport.countDocuments({ userId: req.userId });
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching health reports count:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching health reports count',
      error: error.message
    });
  }
});

module.exports = router;
