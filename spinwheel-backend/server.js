const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

// Import models and routes
const { Admin, Prize } = require("./models");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const prizeRoutes = require("./routes/prizes");
const tokenRoutes = require("./routes/tokens");
const spinRoutes = require("./routes/spin");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SpinWheel API is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/prizes", prizeRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/spin", spinRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SpinWheel API Server",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      admin: "/api/admin",
      prizes: "/api/prizes",
      tokens: "/api/tokens",
      spin: "/api/spin",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  // MongoDB validation errors
  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  // MongoDB cast errors
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // JWT errors are handled in middleware
  if (
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError"
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// Initialize database and server
const initializeServer = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully");

    // Create SuperAdmin if it doesn't exist
    await createSuperAdmin();

    // Initialize default prizes if they don't exist
    await initializeDefaultPrizes();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
    });
  } catch (error) {
    console.error("❌ Server initialization failed:", error);
    process.exit(1);
  }
};

// Create SuperAdmin account
const createSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await Admin.findOne({ role: "superadmin" });

    if (!existingSuperAdmin) {
      const superAdmin = new Admin({
        username: process.env.SUPER_ADMIN_USERNAME || "superadmin",
        password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",
        role: "superadmin",
      });

      await superAdmin.save();
      console.log("✅ SuperAdmin account created");
      console.log(`   Username: ${superAdmin.username}`);
      console.log(
        `   Password: ${process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!"}`
      );
    } else {
      console.log("✅ SuperAdmin account already exists");
    }
  } catch (error) {
    console.error("❌ Error creating SuperAdmin:", error);
  }
};

// Initialize default prizes
const initializeDefaultPrizes = async () => {
  try {
    const existingPrizes = await Prize.countDocuments();

    if (existingPrizes === 0) {
      const defaultPrizes = [
        {
          position: 1,
          name: "รางวัลที่ 1",
          probability: 12.5,
          color: "#FF6B6B",
        },
        {
          position: 2,
          name: "รางวัลที่ 2",
          probability: 12.5,
          color: "#FFD700",
        },
        {
          position: 3,
          name: "รางวัลที่ 3",
          probability: 12.5,
          color: "#FF6B6B",
        },
        {
          position: 4,
          name: "รางวัลที่ 4",
          probability: 12.5,
          color: "#FFD700",
        },
        {
          position: 5,
          name: "รางวัลที่ 5",
          probability: 12.5,
          color: "#FF6B6B",
        },
        {
          position: 6,
          name: "รางวัลที่ 6",
          probability: 12.5,
          color: "#FFD700",
        },
        {
          position: 7,
          name: "รางวัลที่ 7",
          probability: 12.5,
          color: "#FF6B6B",
        },
        {
          position: 8,
          name: "รางวัลที่ 8",
          probability: 12.5,
          color: "#FFD700",
        },
      ];

      await Prize.insertMany(defaultPrizes);
      console.log("✅ Default prizes initialized");
    } else {
      console.log("✅ Prizes already configured");
    }
  } catch (error) {
    console.error("❌ Error initializing prizes:", error);
  }
};

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
initializeServer();
