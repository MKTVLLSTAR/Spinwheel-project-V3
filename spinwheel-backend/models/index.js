const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Admin Schema
const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Prize Schema
const prizeSchema = new mongoose.Schema(
  {
    position: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    probability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    color: {
      type: String,
      default: "#FFD700", // Gold color
    },
  },
  {
    timestamps: true,
  }
);

// Token Schema
const tokenSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpinResult",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for automatic cleanup of expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// SpinResult Schema
const spinResultSchema = new mongoose.Schema(
  {
    token: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token",
      required: true,
    },
    prizeWon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prize",
      required: true,
    },
    spinAngle: {
      type: Number,
      required: true,
    },
    clientInfo: {
      userAgent: String,
      ip: String,
    },
  },
  {
    timestamps: true,
  }
);

// System Settings Schema
const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create Models
const Admin = mongoose.model("Admin", adminSchema);
const Prize = mongoose.model("Prize", prizeSchema);
const Token = mongoose.model("Token", tokenSchema);
const SpinResult = mongoose.model("SpinResult", spinResultSchema);
const Settings = mongoose.model("Settings", settingsSchema);

module.exports = {
  Admin,
  Prize,
  Token,
  SpinResult,
  Settings,
};
