const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendMail = require("../sendMail");
const auth = require("../middleware/auth");
const router = express.Router();

// Signup route
router.post("/signup", async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      location,
      city,
      aadharNumber,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !password ||
      !phone ||
      !location ||
      !city ||
      !aadharNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      phone,
      location,
      city,
      aadharNumber,
    });

    await user.save();

    // Send welcome email
    await sendMail(email, "signup", fullName);

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        city: user.city,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
});

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Send login notification email
    await sendMail(email, "login", user.fullName);

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
});

// Logout route
router.post("/logout", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
});

// Update user profile route
router.put("/update-profile", auth, async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      location,
      aadharNumber,
    } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
        });
      }
    }

    // Store old values for comparison
    const oldValues = {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      location: user.location,
      aadharNumber: user.aadharNumber,
    };

    // Update fields if provided
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (password) user.password = password;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (aadharNumber) user.aadharNumber = aadharNumber;

    // Save the updated user
    await user.save();

    // Send email notification with updated settings
    const updatedFields = [];
    if (fullName && fullName !== oldValues.fullName)
      updatedFields.push(`Full Name: ${fullName}`);
    if (email && email !== oldValues.email)
      updatedFields.push(`Email: ${email}`);
    if (phone && phone !== oldValues.phone)
      updatedFields.push(`Phone: ${phone}`);
    if (location && location !== oldValues.location)
      updatedFields.push(`Location: ${location}`);
    if (aadharNumber && aadharNumber !== oldValues.aadharNumber)
      updatedFields.push(`Aadhar Number: ${aadharNumber}`);

    if (updatedFields.length > 0) {
      await sendMail(user.email, "settings", {
        name: user.fullName,
        updatedFields: updatedFields.join("\n"),
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        aadharNumber: user.aadharNumber,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
});

// Get current user data
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        aadharNumber: user.aadharNumber,
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user data",
      error: error.message,
    });
  }
});

// Get total users count
router.get("/total-users", auth, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching total users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching total users count",
      error: error.message,
    });
  }
});

module.exports = router;
