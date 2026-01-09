const express = require("express");
const router = express.Router();
const AQITracker = require("../models/AQITracker");
const auth = require("../middleware/auth");

// Save AQI data
router.post("/save", auth, async (req, res) => {
  try {
    const { city, aqi, status, coordinates, pollutants } = req.body;

    // Don't store if city is Hyderabad (case insensitive)
    if (city.toLowerCase() === "hyderabad") {
      return res
        .status(200)
        .json({ message: "Skipped storing Hyderabad data" });
    }

    // Check if we already have an entry for this city in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingEntry = await AQITracker.findOne({
      userId: req.user.id,
      city: city,
      timestamp: { $gte: oneHourAgo },
    });

    if (existingEntry) {
      // Update the existing entry
      existingEntry.aqi = aqi;
      existingEntry.status = status;
      existingEntry.coordinates = coordinates;
      existingEntry.pollutants = pollutants;
      await existingEntry.save();
      return res.status(200).json(existingEntry);
    }

    // Create new entry
    const aqiData = new AQITracker({
      userId: req.user.id,
      city,
      aqi,
      status,
      coordinates,
      pollutants,
    });

    await aqiData.save();
    res.status(201).json(aqiData);
  } catch (error) {
    console.error("Error saving AQI data:", error);
    res.status(500).json({ message: "Error saving AQI data" });
  }
});

// Get user's AQI history
router.get("/history", auth, async (req, res) => {
  try {
    const aqiHistory = await AQITracker.find({
      userId: req.user.id,
      city: { $ne: "Hyderabad" }, // Exclude Hyderabad from history
    })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(aqiHistory);
  } catch (error) {
    console.error("Error fetching AQI history:", error);
    res.status(500).json({ message: "Error fetching AQI history" });
  }
});

// Get latest AQI data for a user
router.get("/latest", auth, async (req, res) => {
  try {
    const latestAQI = await AQITracker.findOne({
      userId: req.user.id,
      city: { $ne: "Hyderabad" }, // Exclude Hyderabad from latest
    }).sort({ timestamp: -1 });
    res.json(latestAQI);
  } catch (error) {
    console.error("Error fetching latest AQI data:", error);
    res.status(500).json({ message: "Error fetching latest AQI data" });
  }
});

// Get AQI searches count
router.get("/count", auth, async (req, res) => {
  try {
    const count = await AQITracker.countDocuments({
      userId: req.user.id,
      city: { $ne: "Hyderabad" }, // Exclude Hyderabad from count
    });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching AQI searches count:", error);
    res.status(500).json({ message: "Error fetching AQI searches count" });
  }
});

// Delete all AQI history entries
router.delete("/delete-all", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await AQITracker.deleteMany({ userId });
    console.log(`Deleted ${result.deletedCount} entries for user ${userId}`);
    res.json({
      success: true,
      message: "All AQI history entries deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting all AQI history entries:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete AQI history entries",
      });
  }
});

// Delete AQI history entry
router.delete("/:id", auth, async (req, res) => {
  try {
    const entry = await AQITracker.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!entry) {
      return res.status(404).json({ message: "AQI history entry not found" });
    }

    res.json({ message: "AQI history entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting AQI history entry:", error);
    res.status(500).json({ message: "Error deleting AQI history entry" });
  }
});

module.exports = router;
