const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { Token, Admin } = require("../models");
const { verifyToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Generate random token code
const generateTokenCode = () => {
  return uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase();
};

// Create new token (Admin required)
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;

    // Validation
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 100.",
      });
    }

    const tokens = [];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 2); // 2 days from now

    // Generate multiple tokens
    for (let i = 0; i < quantity; i++) {
      let tokenCode;
      let attempts = 0;

      // Ensure unique token code
      do {
        tokenCode = generateTokenCode();
        attempts++;
        if (attempts > 10) {
          throw new Error("Failed to generate unique token code");
        }
      } while (await Token.findOne({ code: tokenCode }));

      const token = new Token({
        code: tokenCode,
        expiresAt,
        createdBy: req.admin._id,
      });

      await token.save();
      tokens.push({
        id: token._id,
        code: token.code,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      message: `${quantity} token(s) created successfully.`,
      data: { tokens },
    });
  } catch (error) {
    console.error("Create token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating token.",
    });
  }
});

// Get all tokens (Admin required)
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    let filter = {};
    const now = new Date();

    // Filter by status
    if (status === "used") {
      filter.isUsed = true;
    } else if (status === "unused") {
      filter.isUsed = false;
      filter.expiresAt = { $gt: now };
    } else if (status === "expired") {
      filter.isUsed = false;
      filter.expiresAt = { $lte: now };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [tokens, total] = await Promise.all([
      Token.find(filter)
        .populate("createdBy", "username")
        .populate("result")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Token.countDocuments(filter),
    ]);

    // Add status to each token
    const tokensWithStatus = tokens.map((token) => {
      let tokenStatus = "active";
      if (token.isUsed) {
        tokenStatus = "used";
      } else if (token.expiresAt <= now) {
        tokenStatus = "expired";
      }

      return {
        id: token._id,
        code: token.code,
        status: tokenStatus,
        isUsed: token.isUsed,
        usedAt: token.usedAt,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        createdBy: token.createdBy?.username || "Unknown",
        hasResult: !!token.result,
      };
    });

    res.json({
      success: true,
      data: {
        tokens: tokensWithStatus,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get tokens error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching tokens.",
    });
  }
});

// Get token statistics (Admin required)
router.get("/stats", verifyToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();

    const [totalTokens, usedTokens, expiredTokens, activeTokens] =
      await Promise.all([
        Token.countDocuments(),
        Token.countDocuments({ isUsed: true }),
        Token.countDocuments({
          isUsed: false,
          expiresAt: { $lte: now },
        }),
        Token.countDocuments({
          isUsed: false,
          expiresAt: { $gt: now },
        }),
      ]);

    res.json({
      success: true,
      data: {
        stats: {
          total: totalTokens,
          used: usedTokens,
          expired: expiredTokens,
          active: activeTokens,
        },
      },
    });
  } catch (error) {
    console.error("Get token stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching token statistics.",
    });
  }
});

// Delete expired tokens (Admin required)
router.delete("/expired", verifyToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const result = await Token.deleteMany({
      isUsed: false,
      expiresAt: { $lte: now },
    });

    res.json({
      success: true,
      message: `${result.deletedCount} expired tokens deleted.`,
    });
  } catch (error) {
    console.error("Delete expired tokens error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting expired tokens.",
    });
  }
});

// Validate token (Public endpoint)
router.post("/validate", async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Token code is required.",
      });
    }

    const token = await Token.findOne({
      code: code.toUpperCase().trim(),
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        message: "Invalid token code.",
      });
    }

    const now = new Date();

    if (token.isUsed) {
      return res.status(400).json({
        success: false,
        message: "Token has already been used.",
      });
    }

    if (token.expiresAt <= now) {
      return res.status(400).json({
        success: false,
        message: "Token has expired.",
      });
    }

    res.json({
      success: true,
      message: "Token is valid.",
      data: {
        token: {
          id: token._id,
          code: token.code,
          expiresAt: token.expiresAt,
        },
      },
    });
  } catch (error) {
    console.error("Validate token error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating token.",
    });
  }
});

module.exports = router;
