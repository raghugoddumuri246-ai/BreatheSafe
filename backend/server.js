const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const healthAssessmentRoutes = require('./routes/healthAssessment');
const healthReportRoutes = require('./routes/healthReport');
const aqiTrackerRoutes = require('./routes/aqiTracker');
const alertsRoutes = require('./routes/alerts');
const contactRoutes = require('./routes/contact');
const { processAlerts, scheduleAlerts } = require('./scheduledAlerts');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/health-assessment', healthAssessmentRoutes);
app.use('/api/health-report', healthReportRoutes);
app.use('/api/aqi-tracker', aqiTrackerRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/contact', contactRoutes);

// Schedule alerts to run at 10 AM 
scheduleAlerts('0 10 * * *');

// MongoDB Connection with fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/breathsafe';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Initialize scheduled alerts after DB connection
    console.log('Initializing scheduled alerts...');
    console.log('Alerts will be checked daily at 10:00 AM');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});