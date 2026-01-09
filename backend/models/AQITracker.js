const mongoose = require('mongoose');

const aqiTrackerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  city: {
    type: String,
    required: true
  },
  aqi: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  pollutants: {
    pm2_5: Number,
    pm10: Number,
    o3: Number,
    no2: Number,
    so2: Number,
    co: Number
  }
});

module.exports = mongoose.model('AQITracker', aqiTrackerSchema);