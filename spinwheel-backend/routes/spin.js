const express = require("express");
const { Token, Prize, SpinResult } = require("../models");
const {
  verifyToken,
  requireAdmin,
  createRateLimiter,
} = require("../middleware/auth");

const router = express.Router();

// Rate limiting for spin endpoint
const spinLimiter = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  5, // 5 spins per minute per IP
  "Too many spin attempts. Please wait before trying again."
);

// Select prize based on probability
const selectPrizeByProbability = (prizes) => {
  const random = Math.random() * 100;
  let cumulativeProbability = 0;

  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    if (random <= cumulativeProbability) {
      return prize;
    }
  }

  // Fallback to first prize if something goes wrong
  return prizes[0];
};

// Spin the wheel
router.post("/spin", spinLimiter, async (req, res) => {
  try {
    const { tokenCode } = req.body;

    if (!tokenCode) {
      return res.status(400).json({
        success: false,
        message: "Token code is required.",
      });
    }

    // Find and validate token
    const token = await Token.findOne({
      code: tokenCode.toUpperCase().trim(),
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

    // Get all prizes
    const prizes = await Prize.find().sort({ position: 1 });

    if (prizes.length !== 8) {
      return res.status(500).json({
        success: false,
        message:
          "Prize configuration is incomplete. Please contact administrator.",
      });
    }

    // Verify total probability equals 100%
    const totalProbability = prizes.reduce(
      (sum, prize) => sum + prize.probability,
      0
    );
    if (Math.abs(totalProbability - 100) > 0.01) {
      return res.status(500).json({
        success: false,
        message:
          "Prize probability configuration is invalid. Please contact administrator.",
      });
    }

    // Select winning prize based on probability
    const winningPrize = selectPrizeByProbability(prizes);

    // Create spin result (ไม่ต้องคำนวณ spinAngle แล้ว)
    const spinResult = new SpinResult({
      token: token._id,
      prizeWon: winningPrize._id,
      spinAngle: 0, // ไม่ใช้แล้ว แต่เก็บไว้เพื่อ backward compatibility
      clientInfo: {
        userAgent: req.get("User-Agent") || "",
        ip: req.ip || req.connection.remoteAddress || "",
      },
    });

    await spinResult.save();

    // Mark token as used
    token.isUsed = true;
    token.usedAt = now;
    token.result = spinResult._id;
    await token.save();

    res.json({
      success: true,
      message: "Spin completed successfully!",
      data: {
        result: {
          id: spinResult._id,
          prize: {
            id: winningPrize._id,
            name: winningPrize.name,
            position: winningPrize.position,
            color: winningPrize.color,
          },
          spunAt: spinResult.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Spin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during spin. Please try again.",
    });
  }
});

// Get spin results (Admin required)
router.get("/results", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [results, total] = await Promise.all([
      SpinResult.find()
        .populate("token", "code createdBy")
        .populate("prizeWon", "name position color")
        .populate({
          path: "token",
          populate: {
            path: "createdBy",
            select: "username",
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      SpinResult.countDocuments(),
    ]);

    const formattedResults = results.map((result) => ({
      id: result._id,
      tokenCode: result.token?.code || "Unknown",
      prize: {
        name: result.prizeWon?.name || "Unknown",
        position: result.prizeWon?.position || 0,
        color: result.prizeWon?.color || "#000000",
      },
      spinAngle: result.spinAngle,
      spunAt: result.createdAt,
      tokenCreatedBy: result.token?.createdBy?.username || "Unknown",
      clientInfo: result.clientInfo,
    }));

    res.json({
      success: true,
      data: {
        results: formattedResults,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get spin results error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching spin results.",
    });
  }
});

// Get spin statistics (Admin required)
router.get("/stats", verifyToken, requireAdmin, async (req, res) => {
  try {
    const [totalSpins, prizeStats] = await Promise.all([
      SpinResult.countDocuments(),
      SpinResult.aggregate([
        {
          $lookup: {
            from: "prizes",
            localField: "prizeWon",
            foreignField: "_id",
            as: "prize",
          },
        },
        {
          $unwind: "$prize",
        },
        {
          $group: {
            _id: "$prize.position",
            prizeName: { $first: "$prize.name" },
            count: { $sum: 1 },
            probability: { $first: "$prize.probability" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
    ]);

    // Calculate actual vs expected percentages
    const statsWithPercentages = prizeStats.map((stat) => ({
      position: stat._id,
      prizeName: stat.prizeName,
      count: stat.count,
      expectedProbability: stat.probability,
      actualPercentage:
        totalSpins > 0 ? ((stat.count / totalSpins) * 100).toFixed(2) : 0,
    }));

    res.json({
      success: true,
      data: {
        totalSpins,
        prizeDistribution: statsWithPercentages,
      },
    });
  } catch (error) {
    console.error("Get spin stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching spin statistics.",
    });
  }
});

module.exports = router;
