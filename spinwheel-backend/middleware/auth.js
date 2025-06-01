const jwt = require("jsonwebtoken");
const { Admin } = require("../models");

// Verify JWT Token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Admin not found.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during token verification.",
    });
  }
};

// Check if user is SuperAdmin
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. SuperAdmin privileges required.",
    });
  }
  next();
};

// Check if user is Admin or SuperAdmin
const requireAdmin = (req, res, next) => {
  if (!["admin", "superadmin"].includes(req.admin.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
};

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  const rateLimit = require("express-rate-limit");
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

module.exports = {
  verifyToken,
  requireSuperAdmin,
  requireAdmin,
  createRateLimiter,
};
