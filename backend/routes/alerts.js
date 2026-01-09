const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const auth = require('../middleware/auth');

// Get user's alerts
router.get('/my-alerts', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(100);

    // Get alert counts by severity
    const alertCounts = await Alert.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $gt: ['$aqiValue', 300] }, then: 'Hazardous' },
                { case: { $gt: ['$aqiValue', 200] }, then: 'Very Unhealthy' },
                { case: { $gt: ['$aqiValue', 150] }, then: 'Unhealthy' },
                { case: { $gt: ['$aqiValue', 100] }, then: 'Unhealthy for Sensitive Groups' },
                { case: { $gt: ['$aqiValue', 50] }, then: 'Moderate' },
                { case: { $gt: ['$aqiValue', 0] }, then: 'Good' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      alerts,
      alertCounts: alertCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
      error: error.message
    });
  }
});

// Get alert by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      alert
    });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alert',
      error: error.message
    });
  }
});

module.exports = router; 