const express = require("express");
const jwt = require("jsonwebtoken");
const { Admin } = require("../models");
const { verifyToken, createRateLimiter } = require("../middleware/auth");

const router = express.Router();

// Rate limiting for auth routes
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  "Too many authentication attempts. Please try again later."
);

// Login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Check password
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          role: admin.role,
          createdAt: admin.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

// Get current admin info
router.get("/me", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        admin: {
          id: req.admin._id,
          username: req.admin.username,
          role: req.admin.role,
          createdAt: req.admin.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Get admin info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching admin info.",
    });
  }
});

// Refresh token
router.post("/refresh", verifyToken, async (req, res) => {
  try {
    const newToken = jwt.sign(
      {
        id: req.admin._id,
        username: req.admin.username,
        role: req.admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Token refreshed successfully.",
      data: { token: newToken },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during token refresh.",
    });
  }
});

module.exports = router;
