const mongoose = require('mongoose');

const healthReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    name: String
  },
  aqiData: {
    value: Number,
    status: String,
    pollutants: [{
      name: String,
      label: String,
      value: Number,
      unit: String
    }],
    temperature: Number,
    temperatureUnit: String,
    timestamp: Date
  },
  healthData: {
    name: {
      type: String,
      required: true
    },
    age: {
      type: Number,
      required: true
    },
    chronicDiseases: [{
      name: {
        type: String,
        required: true
      },
      severity: {
        type: String,
        enum: ['Mild', 'Moderate', 'Severe'],
        default: 'Moderate'
      },
      diagnosisYear: Number,
      medications: [String],
      notes: String
    }],
    symptoms: [String],
    other: String,
    assessmentDate: Date
  },
  report: {
    userProfile: {
      name: String,
      age: Number,
      ageGroup: String,
      riskLevel: String
    },
    generalRecommendations: [String],
    ageSpecificRecommendations: [String],
    healthSpecificRecommendations: [String],
    chronicDiseaseAnalysis: [{
      diseaseName: String,
      highlighted: {
        type: Boolean,
        default: true
      },
      riskLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Severe'],
        default: 'Moderate'
      },
      aqiImpact: String,
      recommendations: [String],
      precautions: [String],
      medicationAdjustments: String,
      symptoms: [{
        name: String,
        severity: {
          type: String,
          enum: ['Mild', 'Moderate', 'Severe'],
          default: 'Moderate'
        },
        triggers: [String],
        managementTips: [String]
      }],
      lifestyleRecommendations: {
        diet: [String],
        exercise: [String],
        stressManagement: [String],
        sleep: [String]
      },
      emergencySigns: [String],
      followUpSchedule: {
        frequency: String,
        nextAppointment: Date,
        monitoringParameters: [String]
      }
    }],
    medicationGuidance: [String],
    medicationRecommendations: {
      general: String,
      specific: {
        type: Map,
        of: String
      },
      disclaimer: String
    },
    activityGuidelines: {
      outdoor: String,
      indoor: String,
      exercise: String
    },
    protectiveMeasures: [String],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  oxygenRecommendations: {
    isRecommended: Boolean,
    recommendation: String,
    level: String
  },
  airQualityImpact: {
    overallImpact: String,
    chronicDiseaseImpacts: [{
      diseaseName: String,
      impactLevel: {
        type: String,
        enum: ['Minimal', 'Moderate', 'Significant', 'Severe'],
        default: 'Moderate'
      },
      details: String
    }]
  }
});

// Add index for faster queries
healthReportSchema.index({ userId: 1, timestamp: -1 });

const HealthReport = mongoose.model('HealthReport', healthReportSchema);

module.exports = HealthReport; 