const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const HealthReport = require('../models/HealthReport');
const HealthAssessment = require('../models/HealthAssessment');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const router = express.Router();

// Helper function to list available models
async function listAvailableModels() {
  if (!process.env.GEMINI_API_KEY) return [];
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
      { timeout: 5000 }
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
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Please authenticate' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Please authenticate' });
  }
};

// Comprehensive rule-based fallback generator when AI is unavailable or rate-limited
function generateFallbackReportData(healthAssessment, aqiData, location) {
  const age = healthAssessment.age || 30;
  const aqi = aqiData.value || 50;
  const symptoms = healthAssessment.symptoms || [];
  const chronicDiseases = healthAssessment.chronicDiseases || [];
  const temp = aqiData.temperature;
  const tempStr = temp !== undefined ? `${temp}${aqiData.temperatureUnit || '°C'}` : 'moderate';

  const riskLevel = aqi > 150 || chronicDiseases.length > 2 ? 'High' : aqi > 100 || chronicDiseases.length > 0 ? 'Moderate' : 'Low';
  const ageGroup = age < 18 ? 'Child' : age < 60 ? 'Adult' : 'Senior';

  // Age specific recommendations
  const ageSpecificRecommendations = [
    `Daily Activities: ${
      age < 18
        ? aqi > 100
          ? "Limit strenuous outdoor play and prioritize indoor learning, games, and creative activities."
          : "Normal outdoor play is permissible, but avoid high pollution hours near traffic."
        : age < 60
        ? aqi > 100
          ? "Shift outdoor workouts, jogging, and commutes indoors or use filtered exercise spaces."
          : "Maintain routine physical activities while monitoring daily AQI levels."
        : aqi > 100
        ? "Stay indoors with windows closed and engage in low-impact indoor mobility exercises."
        : "Enjoy gentle morning walks while avoiding high-traffic times."
    }`,
    `Precautions: ${
      age < 18
        ? "Ensure good ventilation in school and living rooms; stay well-hydrated throughout the day."
        : age < 60
        ? "Use air purifiers at work and home; avoid exercising near major roadways."
        : "Keep rescue medications readily accessible and monitor respiratory comfort closely."
    }`,
    `Special Considerations: ${
      age < 18
        ? "Children breathe more air per pound of body weight; monitor for cough or wheezing promptly."
        : age < 60
        ? "Balance active lifestyle with environmental precautions on poor air quality days."
        : "Seniors with pre-existing conditions should seek early medical consultation if symptoms flare."
    }`
  ];

  // Symptom-specific recommendations
  const symptomAdviceMap = {
    'Cough': `Cough Management: Current air quality (AQI ${aqi}) contains particulates that irritate airway linings. Stay well hydrated, use warm steam inhalation, and keep indoor air purified. If cough persists or worsens, consult your doctor.`,
    'Shortness of breath': `Shortness of Breath: Elevated AQI (${aqi}) can significantly increase airway resistance. Keep rescue inhalers at hand, avoid all physical exertion, and seek immediate medical evaluation if breathing remains labored.`,
    'Wheezing': `Wheezing Guidance: Particulate pollution triggers bronchial constriction. Use prescribed bronchodilators, stay in climate-controlled rooms, and avoid exposure to smoke or cold air.`,
    'Chest pain': `Chest Pain Alert: Chest discomfort in combination with AQI ${aqi} requires urgent medical assessment. Rest in an upright position and contact emergency services if pain persists.`,
    'Fever': `Fever Management: Rest in a cool, filtered environment, maintain adequate fluid intake, and consult a physician if fever remains elevated.`,
    'Fever / High Fever': `High Fever: Rest in a well-ventilated, purified room, monitor temperature closely, and seek prompt medical attention.`,
    'Rapid Breathing': `Rapid Breathing: Elevated respiratory rate under AQI ${aqi} indicates lung stress. Rest immediately, use rescue medication if prescribed, and seek medical care if not quickly relieved.`,
    'Throat irritation': `Throat Irritation: Pollutants and dry air irritate the pharynx. Gargle with warm saline solution, use lozenges, and drink warm herbal tea.`,
    'Sore throat': `Sore Throat: Stay hydrated with warm fluids, avoid irritants like smoke, and run a room humidifier or air purifier.`,
    'Eye irritation': `Eye Irritation: Particulates and ozone cause conjunctival irritation. Use preservative-free lubricating artificial tears, avoid rubbing eyes, and wear sunglasses outdoors.`,
    'Headache': `Headache Relief: Elevated pollutant levels and sinus congestion can cause tension. Rest in a dark, quiet room with clean air, stay hydrated, and use approved pain relief if needed.`,
    'Nasal congestion': `Nasal Congestion: Use isotonic saline nasal rinses to flush airborne particulates and reduce mucosal swelling.`,
    'Fatigue': `Fatigue: Environmental pollutants increase physiological stress. Ensure 7-8 hours of quality sleep, gentle stretching, and balanced nutrition.`,
    'Coughing up blood': `Coughing up Blood: This is a critical medical warning sign requiring immediate emergency medical attention.`,
    'Night Sweats': `Night Sweats: Keep bedroom cool with HEPA-filtered airflow, stay hydrated, and discuss persistent night sweats with your physician.`
  };

  const healthSpecificRecommendations = symptoms.length > 0
    ? symptoms.map(s => {
        for (const [key, advice] of Object.entries(symptomAdviceMap)) {
          if (s.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(s.toLowerCase())) {
            return advice;
          }
        }
        return `${s}: The current AQI (${aqi}) may aggravate this symptom. Minimize exposure to outdoor air, maintain good hydration, and rest indoors.`;
      })
    : [`General Respiratory Care: Maintain clean indoor air, stay well-hydrated, and monitor local air quality trends.`];

  // Chronic disease analysis
  const chronicDiseaseAnalysis = chronicDiseases.map(disease => {
    const dLower = disease.toLowerCase();
    let diseaseRisk = aqi > 150 ? 'Severe' : aqi > 100 ? 'High' : 'Moderate';
    let recommendations = [
      `Monitor ${disease} symptoms closely with current AQI level of ${aqi}.`,
      `Ensure all prescribed controller and rescue medications are stocked and easily reachable.`,
      `Limit outdoor exposure during peak pollution hours.`
    ];
    let precautions = [
      `Keep indoor windows closed and run an air purifier.`,
      `Avoid secondary triggers such as smoke, aerosol sprays, and harsh chemicals.`
    ];
    let medicationAdjustments = `Continue taking prescribed maintenance medications for ${disease}. Consult your physician before making any dosage changes.`;

    if (dLower.includes('asthma')) {
      recommendations = [
        `Keep rescue inhaler (e.g. Albuterol) readily available at all times.`,
        `Avoid outdoor cardiovascular activities when AQI exceeds 100.`,
        `Monitor peak flow readings morning and evening.`
      ];
      precautions = [
        `Wear an N95 mask if outdoor transit is unavoidable.`,
        `Keep indoor humidity between 30% and 50% to prevent mold triggers.`
      ];
      medicationAdjustments = `Take controller inhalers as scheduled. Use rescue inhaler at first sign of chest tightness or wheezing.`;
    } else if (dLower.includes('copd')) {
      diseaseRisk = aqi > 100 ? 'Severe' : 'High';
      recommendations = [
        `Use prescribed bronchodilators and oxygen therapy as directed by your pulmonologist.`,
        `Practice pursed-lip breathing techniques to ease lung workload.`,
        `Stay strictly indoors during periods of elevated particulate matter.`
      ];
      precautions = [
        `Avoid temperature extremes and drafty areas.`,
        `Maintain HEPA air filtration in sleeping areas.`
      ];
      medicationAdjustments = `Do not alter your inhaler regimen without medical supervision. Contact your doctor if rescue frequency increases.`;
    } else if (dLower.includes('sinus')) {
      recommendations = [
        `Use saline nasal irrigation twice daily to clear trapped airborne particles.`,
        `Stay well-hydrated to keep mucosal secretions thin.`,
        `Consider a cool mist humidifier in dry conditions.`
      ];
    }

    return {
      diseaseName: disease,
      highlighted: true,
      riskLevel: diseaseRisk,
      aqiImpact: `Current air quality (AQI: ${aqi}) presents potential challenges for ${disease}. Particulates can trigger airway inflammation and increase symptom severity.`,
      recommendations,
      precautions,
      medicationAdjustments
    };
  });

  // Pollutant impacts
  const pollutantImpacts = {
    overall: `Current air quality index of ${aqi} (${aqiData.status || 'Active'}) presents elevated particulate concentrations that can irritate mucosal linings and aggravate cardiopulmonary systems.`,
    specificImpacts: (aqiData.pollutants || []).map(p => ({
      pollutant: p.label || p.name,
      impact: `${p.label || p.name} is measured at ${p.value} ${p.unit}. Fine particles penetrate deeply into lung alveoli and can enter circulation.`,
      mitigationSteps: `Use certified HEPA air purification indoors and wear an N95 mask when outdoors.`
    }))
  };

  // General recommendations
  const generalRecommendations = [
    `Indoor Air Quality: Keep windows closed during peak pollution hours, run HEPA air purifiers, and avoid indoor incense or smoking.`,
    `Activity Modifications: Shift strenuous workouts indoors and reduce workout duration on days with AQI over 100.`,
    `Preventive Measures: Stay well hydrated, consume an antioxidant-rich diet, and wash face and hands after returning from outdoors.`,
    `Emergency Protocols: Keep emergency contacts accessible and seek urgent medical evaluation if severe shortness of breath or chest pain occurs.`
  ];

  // Medication guidance
  const medicationGuidance = [
    `Current Medications: Continue all prescribed maintenance medications according to your healthcare provider's schedule.`,
    `Over-the-Counter: Saline nasal sprays and lubricating eye drops provide safe symptom relief from environmental irritants.`,
    `When to Seek Help: Seek immediate medical care for severe breathing difficulty, chest pain, coughing blood, or unresponsive fever.`,
    `Emergency Medications: Keep fast-acting rescue inhalers or emergency prescriptions in an easily accessible location at all times.`
  ];

  // Outdoor activity safety
  const isSafe = aqi <= 100 && chronicDiseases.length === 0;
  const outdoorActivitySafety = {
    isSafe,
    recommendation: aqi > 150
      ? `Air quality is unhealthy (AQI ${aqi}). Outdoor activities are strongly discouraged. Please remain indoors.`
      : aqi > 100
      ? `Air quality is elevated (AQI ${aqi}). Sensitive individuals and those with respiratory conditions should minimize outdoor exposure.`
      : `Air quality is acceptable (AQI ${aqi}). Normal outdoor activities can be enjoyed with basic awareness.`,
    timeRestrictions: "Air quality is typically best during early morning hours. Avoid busy traffic corridors during rush hours.",
    activityModifications: aqi > 100 ? "Replace outdoor jogging with indoor bodyweight or yoga exercises." : "Moderate outdoor activities are safe."
  };

  // Mask recommendations
  const isMaskRecommended = aqi > 100 || chronicDiseases.length > 0;
  const maskRecommendations = {
    isRecommended: isMaskRecommended,
    type: aqi > 150 ? 'N95 or KN95 respirator mask' : aqi > 100 ? 'N95, KN95, or multi-layer surgical mask' : 'Cloth mask or not strictly required',
    usage: isMaskRecommended
      ? `Wear a well-fitted mask covering both nose and mouth when outdoors. Ensure a snug seal without gaps.`
      : `Masks are optional under current conditions unless you feel individual sensitivity.`,
    maintenance: "Replace disposable masks daily or when damp. Store reusable respirators in clean, dry containers."
  };

  // Oxygen recommendations
  const hasSevereResp = chronicDiseases.some(d => {
    const l = d.toLowerCase();
    return l.includes('copd') || l.includes('severe asthma') || l.includes('lung') || l.includes('emphysema');
  });
  const isOxygenAdvised = hasSevereResp || (aqi > 200 && symptoms.some(s => s.toLowerCase().includes('breath')));
  const oxygenRecommendations = {
    isRecommended: isOxygenAdvised,
    recommendation: isOxygenAdvised
      ? `Due to elevated AQI and reported respiratory conditions, patients on prescribed supplemental oxygen should follow their clinical protocol closely and monitor pulse oximetry.`
      : `Supplemental oxygen is not routinely required for current conditions. Continue normal respiratory management.`,
    level: isOxygenAdvised
      ? "Maintain oxygen flow rate as strictly prescribed by your physician (typically 1-2 L/min via nasal cannula)."
      : "Standard room air is adequate under controlled indoor conditions."
  };

  return {
    userProfile: {
      name: healthAssessment.name,
      age: healthAssessment.age,
      ageGroup,
      riskLevel
    },
    ageSpecificRecommendations,
    healthSpecificRecommendations,
    chronicDiseaseAnalysis,
    pollutantImpacts,
    temperatureEffect: temp !== undefined
      ? `Current temperature is ${tempStr}. Extreme temperatures combined with particulate matter can place additional stress on the respiratory system.`
      : 'Temperature conditions are within moderate range. Monitor hydration accordingly.',
    generalRecommendations,
    medicationGuidance,
    outdoorActivitySafety,
    maskRecommendations,
    oxygenRecommendations
  };
}

// Generate health report
router.post('/generate', auth, async (req, res) => {
  try {
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

    if (!healthAssessment.name || !healthAssessment.age) {
      return res.status(400).json({
        success: false,
        message: 'Your health assessment is incomplete. Please update it with your name and age.'
      });
    }

    // Ensure symptoms is always an array
    if (!healthAssessment.symptoms) {
      healthAssessment.symptoms = [];
    }

    // Check if health assessment is recent (within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (new Date(healthAssessment.timestamp) < thirtyDaysAgo) {
      return res.status(400).json({
        success: false,
        message: 'Your health assessment is more than 30 days old. Please update your health assessment form for accurate recommendations.'
      });
    }

    let reportData = null;

    // Attempt AI Generation if GEMINI_API_KEY is present
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        const prompt = `You are an advanced health advisor helping people understand how air quality affects their health. Use simple, clear language that anyone can understand. Focus on providing personalized recommendations based on all the input factors.

Current Environmental Conditions:
- AQI Value: ${aqiData.value}
- Air Quality Level: ${aqiData.status}
- Temperature: ${aqiData.temperature !== undefined ? `${aqiData.temperature}${aqiData.temperatureUnit || '°C'}` : 'Not available'}
- Pollutants: ${(aqiData.pollutants || []).map(p => `${p.label || p.name}: ${p.value} ${p.unit}`).join(', ')}

User's Health Profile:
- Name: ${healthAssessment.name}
- Age: ${healthAssessment.age} years
- Health Symptoms: ${(healthAssessment.symptoms || []).join(', ') || 'None reported'}
- Chronic Diseases: ${(healthAssessment.chronicDiseases || []).join(', ') || 'None reported'}
${healthAssessment.other ? `- Other Health Info: ${healthAssessment.other}` : ''}

Return a valid JSON object with this EXACT structure (no markdown formatting, no text before or after):
{
  "userProfile": {
    "age": ${healthAssessment.age},
    "ageGroup": "${healthAssessment.age < 18 ? 'Child' : healthAssessment.age < 60 ? 'Adult' : 'Senior'}",
    "riskLevel": "${aqiData.value > 150 ? 'High' : aqiData.value > 100 ? 'Moderate' : 'Low'}"
  },
  "ageSpecificRecommendations": [
    "Daily Activities: Specific recommendation",
    "Precautions: Specific precautions",
    "Special Considerations: Specific considerations"
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
      "aqiImpact": "How current AQI affects this disease specifically",
      "recommendations": [
        "Specific recommendation for this disease in current air quality"
      ],
      "precautions": [
        "Indoor precautions for this condition"
      ],
      "medicationAdjustments": "Specific medication guidance for this condition"
    }
  ],
  "pollutantImpacts": {
    "overall": "Overall assessment of how current pollutants affect reported conditions",
    "specificImpacts": [
      {
        "pollutant": "PM2.5",
        "impact": "How this pollutant affects health",
        "mitigationSteps": "Steps to reduce exposure"
      }
    ]
  },
  "temperatureEffect": "Analysis of how current temperature affects health conditions",
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
    "isSafe": ${aqiData.value <= 100},
    "recommendation": "Clear advice about outdoor activities",
    "timeRestrictions": "Best and worst times for outdoor activities",
    "activityModifications": "How to modify outdoor activities"
  },
  "maskRecommendations": {
    "isRecommended": ${aqiData.value > 100 || (healthAssessment.chronicDiseases && healthAssessment.chronicDiseases.length > 0)},
    "type": "Recommended mask type",
    "usage": "How to use the mask in current conditions",
    "maintenance": "Mask care and replacement guidelines"
  },
  "oxygenRecommendations": {
    "isRecommended": ${aqiData.value > 200},
    "recommendation": "Advice on oxygen support needs",
    "level": "Recommended level if needed"
  }
}`;

        // Valid active Google Gemini models
        const modelNames = [
          "gemini-1.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-pro",
          "gemini-2.0-flash-lite",
          "gemini-1.5-flash-8b"
        ];

        // Discover any other active models from API
        try {
          const apiModels = await listAvailableModels();
          if (apiModels.length > 0) {
            const validApiModels = apiModels
              .map(name => name.replace('models/', ''))
              .filter(name => name.startsWith('gemini'));
            if (validApiModels.length > 0) {
              for (const m of validApiModels) {
                if (!modelNames.includes(m)) {
                  modelNames.unshift(m);
                }
              }
            }
          }
        } catch (listErr) {
          // Ignore listing errors and use defaults
        }

        const genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        let result = null;

        for (const modelName of modelNames) {
          try {
            const model = genAIInstance.getGenerativeModel({ model: modelName });
            result = await model.generateContent({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
              },
            });
            console.log(`Successfully generated report with model: ${modelName}`);
            break;
          } catch (modelErr) {
            console.log(`Model ${modelName} attempt failed: ${modelErr.message}`);
          }
        }

        if (result) {
          const response = await result.response;
          const responseText = response.text();
          let cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();

          const jsonStart = cleanedText.indexOf('{');
          const jsonEnd = cleanedText.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            cleanedText = cleanedText.substring(jsonStart, jsonEnd + 1);
            cleanedText = cleanedText.replace(/,(\s*[}\]])/g, '$1');
            const parsed = JSON.parse(cleanedText);
            if (parsed && typeof parsed === 'object') {
              reportData = parsed;
            }
          }
        }
      } catch (aiError) {
        console.warn('AI Generation encountered an issue, using intelligent fallback engine:', aiError.message);
      }
    }

    // If AI did not produce valid reportData, generate using the fallback engine
    if (!reportData) {
      console.log('Generating health report using intelligent clinical rule-based engine');
      reportData = generateFallbackReportData(healthAssessment, aqiData, location);
    }

    // Normalize and sanitize recommendation fields
    // 1. Age-specific recommendations
    if (Array.isArray(reportData.ageSpecificRecommendations)) {
      reportData.ageSpecificRecommendations = reportData.ageSpecificRecommendations
        .map(item => typeof item === 'string' ? item : JSON.stringify(item))
        .filter(item => item && !item.includes('undefined'));
      if (reportData.ageSpecificRecommendations.length === 0) {
        reportData.ageSpecificRecommendations = generateFallbackReportData(healthAssessment, aqiData, location).ageSpecificRecommendations;
      }
    } else if (typeof reportData.ageSpecificRecommendations === 'object' && reportData.ageSpecificRecommendations !== null) {
      const rec = reportData.ageSpecificRecommendations;
      reportData.ageSpecificRecommendations = [
        `Daily Activities: ${rec.dailyActivities || 'Maintain indoor focus during poor air quality periods.'}`,
        `Precautions: ${rec.precautions || 'Use air purifiers and stay hydrated.'}`,
        `Special Considerations: ${rec.specialConsiderations || 'Monitor symptoms and follow physician guidelines.'}`
      ];
    } else {
      reportData.ageSpecificRecommendations = generateFallbackReportData(healthAssessment, aqiData, location).ageSpecificRecommendations;
    }

    // 2. Health-specific recommendations
    if (Array.isArray(reportData.healthSpecificRecommendations)) {
      reportData.healthSpecificRecommendations = reportData.healthSpecificRecommendations
        .map(rec => {
          if (typeof rec === 'object' && rec !== null) {
            return `${rec.issue || rec.symptom || 'Symptom'}: ${rec.effect || ''} ${rec.safetyMeasures || rec.recommendation || ''} ${rec.medicationAdvice || ''}`.trim();
          }
          return typeof rec === 'string' ? rec : String(rec);
        })
        .filter(item => item && !item.includes('undefined'));
    }
    if (!reportData.healthSpecificRecommendations || reportData.healthSpecificRecommendations.length === 0) {
      reportData.healthSpecificRecommendations = generateFallbackReportData(healthAssessment, aqiData, location).healthSpecificRecommendations;
    }

    // 3. General recommendations
    if (Array.isArray(reportData.generalRecommendations)) {
      reportData.generalRecommendations = reportData.generalRecommendations
        .map(item => typeof item === 'string' ? item : JSON.stringify(item))
        .filter(item => item && !item.includes('undefined'));
    } else if (typeof reportData.generalRecommendations === 'object' && reportData.generalRecommendations !== null) {
      const rec = reportData.generalRecommendations;
      reportData.generalRecommendations = [
        `Indoor Air Quality: ${rec.indoorAirQuality || 'Use air purifiers and keep windows closed during poor air quality.'}`,
        `Activity Modifications: ${rec.activityModifications || 'Reduce strenuous physical activities and rest frequently.'}`,
        `Preventive Measures: ${rec.preventiveMeasures || 'Stay hydrated, maintain balanced nutrition, and get adequate rest.'}`,
        `Emergency Protocols: ${rec.emergencyProtocols || 'Keep emergency contacts handy and seek medical help if symptoms worsen.'}`
      ];
    }
    if (!reportData.generalRecommendations || reportData.generalRecommendations.length === 0) {
      reportData.generalRecommendations = generateFallbackReportData(healthAssessment, aqiData, location).generalRecommendations;
    }

    // 4. Medication guidance
    if (Array.isArray(reportData.medicationGuidance)) {
      reportData.medicationGuidance = reportData.medicationGuidance
        .map(item => typeof item === 'string' ? item : JSON.stringify(item))
        .filter(item => item && !item.includes('undefined'));
    } else if (typeof reportData.medicationGuidance === 'object' && reportData.medicationGuidance !== null) {
      const rec = reportData.medicationGuidance;
      reportData.medicationGuidance = [
        `Current Medications: ${rec.currentMedications || 'Continue prescribed medications and consult doctor if symptoms worsen.'}`,
        `Over-the-Counter: ${rec.overTheCounter || 'Consider OTC medications for symptom relief after consulting a doctor.'}`,
        `When to Seek Help: ${rec.whenToSeekHelp || 'Seek medical attention for severe symptoms or if existing conditions worsen.'}`,
        `Emergency Medications: ${rec.emergencyMedications || 'Keep rescue medications accessible and know how to use them.'}`
      ];
    }
    if (!reportData.medicationGuidance || reportData.medicationGuidance.length === 0) {
      reportData.medicationGuidance = generateFallbackReportData(healthAssessment, aqiData, location).medicationGuidance;
    }

    // 5. Chronic disease analysis
    if (!Array.isArray(reportData.chronicDiseaseAnalysis) || reportData.chronicDiseaseAnalysis.length === 0) {
      reportData.chronicDiseaseAnalysis = generateFallbackReportData(healthAssessment, aqiData, location).chronicDiseaseAnalysis;
    }

    // 6. Outdoor activity safety
    if (!reportData.outdoorActivitySafety) {
      reportData.outdoorActivitySafety = generateFallbackReportData(healthAssessment, aqiData, location).outdoorActivitySafety;
    }

    // 7. Mask recommendations
    if (!reportData.maskRecommendations) {
      reportData.maskRecommendations = generateFallbackReportData(healthAssessment, aqiData, location).maskRecommendations;
    }

    // 8. Oxygen recommendations
    if (!reportData.oxygenRecommendations) {
      reportData.oxygenRecommendations = generateFallbackReportData(healthAssessment, aqiData, location).oxygenRecommendations;
    }

    // Prepare health report data model
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
        pollutants: aqiData.pollutants || [],
        temperature: aqiData.temperature,
        temperatureUnit: aqiData.temperatureUnit || '°C',
        timestamp: new Date()
      },
      healthData: {
        name: healthAssessment.name,
        age: healthAssessment.age,
        symptoms: healthAssessment.symptoms || [],
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
          name: healthAssessment.name,
          age: healthAssessment.age,
          ageGroup: reportData.userProfile?.ageGroup || (healthAssessment.age < 18 ? 'Child' : healthAssessment.age < 60 ? 'Adult' : 'Senior'),
          riskLevel: (() => {
            const rl = (reportData.userProfile?.riskLevel || 'Moderate').toLowerCase();
            if (rl === 'critical' || rl === 'very high' || rl === 'extreme') return 'Severe';
            if (rl === 'high') return 'High';
            if (rl === 'low' || rl === 'minimal') return 'Low';
            return 'Moderate';
          })()
        },
        ageSpecificRecommendations: reportData.ageSpecificRecommendations,
        healthSpecificRecommendations: reportData.healthSpecificRecommendations,
        generalRecommendations: reportData.generalRecommendations,
        medicationGuidance: reportData.medicationGuidance,
        outdoorActivitySafety: reportData.outdoorActivitySafety,
        maskRecommendations: reportData.maskRecommendations,
        chronicDiseaseAnalysis: (reportData.chronicDiseaseAnalysis || []).map(disease => {
          let riskLevel = disease.riskLevel || 'Moderate';
          const riskLevelLower = String(riskLevel).toLowerCase();
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
            riskLevel = 'Moderate';
          }

          return {
            diseaseName: disease.diseaseName || 'Health Condition',
            highlighted: true,
            riskLevel,
            aqiImpact: disease.aqiImpact || `The current air quality (AQI: ${aqiData.value}) may affect symptoms.`,
            recommendations: Array.isArray(disease.recommendations) ? disease.recommendations : [disease.recommendations || 'Monitor symptoms regularly.'],
            precautions: Array.isArray(disease.precautions) ? disease.precautions : [disease.precautions || 'Stay indoors during poor air quality.'],
            medicationAdjustments: disease.medicationAdjustments || 'Continue prescribed medications and consult your physician.'
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

    // Send formatted response
    const responseData = {
      success: true,
      message: 'Health report generated successfully',
      report: {
        _id: healthReport._id,
        timestamp: healthReport.report.timestamp,
        personalInfo: {
          name: healthAssessment.name,
          age: healthAssessment.age,
          ageGroup: healthReportData.report.userProfile.ageGroup,
          riskLevel: healthReportData.report.userProfile.riskLevel
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
          healthSpecific: healthReportData.report.healthSpecificRecommendations,
          ageSpecific: healthReportData.report.ageSpecificRecommendations,
          general: healthReportData.report.generalRecommendations,
          medication: healthReportData.report.medicationGuidance
        },
        outdoorActivitySafety: healthReportData.report.outdoorActivitySafety,
        maskRecommendations: healthReportData.report.maskRecommendations,
        oxygenRecommendations: healthReportData.oxygenRecommendations,
        chronicDiseaseAnalysis: {
          diseases: healthReportData.report.chronicDiseaseAnalysis.map(disease => ({
            name: disease.diseaseName,
            highlighted: true,
            riskLevel: disease.riskLevel,
            aqiImpact: disease.aqiImpact,
            recommendations: disease.recommendations,
            pollutantImpacts: (healthReport.aqiData.pollutants || []).map(pollutant => ({
              pollutantName: pollutant.label || pollutant.name,
              impactLevel: 'Moderate',
              effect: `${pollutant.label || pollutant.name} (${pollutant.value} ${pollutant.unit}) may affect symptoms.`
            }))
          })),
          temperatureEffect: healthReport.aqiData.temperature !== undefined ?
            `Current temperature of ${healthReport.aqiData.temperature}${healthReport.aqiData.temperatureUnit} may impact health conditions.` :
            'Temperature data not available.'
        }
      }
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error generating health report:', error);
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

    const reportData = report.toObject();

    // Ensure outdoorActivitySafety is present
    if (!reportData.outdoorActivitySafety) {
      const aqi = reportData.aqiData?.value || 50;
      let outdoorRecommendation = '';
      if (aqi < 50) {
        outdoorRecommendation = `With the current excellent air quality (AQI ${aqi}), enjoy outdoor activities freely 🌳. Morning walks 🌅 and afternoon exercises 🏃‍♀️ are safe for respiratory health.`;
      } else if (aqi < 100) {
        outdoorRecommendation = `With moderate air quality (AQI ${aqi}), most outdoor activities remain safe 🌲. Consider early morning exercises when air quality is typically better.`;
      } else if (aqi < 150) {
        outdoorRecommendation = `With the current air quality (AQI ${aqi}), reduce prolonged outdoor exertion ⚠️. Keep windows closed during peak pollution hours.`;
      } else {
        outdoorRecommendation = `With poor air quality (AQI ${aqi}), minimize all outdoor activities 🚫. Stay indoors with windows closed as much as possible 🏠.`;
      }

      reportData.outdoorActivitySafety = {
        isSafe: aqi <= 100,
        recommendation: outdoorRecommendation
      };
    }

    // Ensure maskRecommendations is present
    if (!reportData.maskRecommendations) {
      const aqi = reportData.aqiData?.value || 50;
      let maskType = 'Not necessary';
      let maskUsage = 'Masks are optional under current conditions.';
      let isRecommended = false;

      if (aqi < 50) {
        isRecommended = false;
        maskType = 'Not necessary';
        maskUsage = `With excellent air quality (AQI ${aqi}), masks are generally not necessary 😊.`;
      } else if (aqi < 100) {
        isRecommended = reportData.healthData?.symptoms?.length > 0;
        maskType = 'Surgical or cloth mask';
        maskUsage = `With moderate air quality (AQI ${aqi}), consider wearing a mask if you have respiratory conditions 😷.`;
      } else if (aqi < 150) {
        isRecommended = true;
        maskType = 'N95 or KN95 mask for sensitive individuals';
        maskUsage = `With current air quality (AQI ${aqi}), wearing an N95 or KN95 mask outdoors is recommended 😷.`;
      } else {
        isRecommended = true;
        maskType = 'N95 or KN95 mask';
        maskUsage = `With poor air quality (AQI ${aqi}), N95 or KN95 masks are strongly recommended outdoors 😷.`;
      }

      reportData.maskRecommendations = {
        isRecommended,
        type: maskType,
        usage: maskUsage
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
