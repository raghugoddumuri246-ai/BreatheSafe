const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  aqiValue: {
    type: Number,
    required: true
  },
  pollutants: {
    PM2_5: Number,
    PM10: Number,
    CO: Number,
    NO2: Number,
    SO2: Number,
    O3: Number
  },
  timestamp: {
    type: Date,
    required: true
  },
  smsSent: {
    type: Boolean,
    default: false
  },
  smsSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
alertSchema.index({ userId: 1, timestamp: -1 });
alertSchema.index({ aqiValue: 1 });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert; 