const express = require("express");
const { Prize } = require("../models");
const { verifyToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all prizes
router.get("/", async (req, res) => {
  try {
    const prizes = await Prize.find().sort({ position: 1 });

    res.json({
      success: true,
      data: { prizes },
    });
  } catch (error) {
    console.error("Get prizes error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching prizes.",
    });
  }
});

// Update all prizes (Admin required)
router.put("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { prizes } = req.body;

    // Validation
    if (!Array.isArray(prizes) || prizes.length !== 8) {
      return res.status(400).json({
        success: false,
        message: "Must provide exactly 8 prizes.",
      });
    }

    // Validate each prize
    let totalProbability = 0;
    for (let i = 0; i < prizes.length; i++) {
      const prize = prizes[i];

      if (!prize.name || prize.name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Prize ${i + 1} name is required.`,
        });
      }

      if (
        typeof prize.probability !== "number" ||
        prize.probability < 0 ||
        prize.probability > 100
      ) {
        return res.status(400).json({
          success: false,
          message: `Prize ${i + 1} probability must be between 0 and 100.`,
        });
      }

      totalProbability += prize.probability;
    }

    // Check if total probability equals 100
    if (Math.abs(totalProbability - 100) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Total probability must equal 100%. Current total: ${totalProbability}%`,
      });
    }

    // Update prizes in database
    const updatedPrizes = [];
    for (let i = 0; i < prizes.length; i++) {
      const prize = prizes[i];
      const updatedPrize = await Prize.findOneAndUpdate(
        { position: i + 1 },
        {
          position: i + 1,
          name: prize.name.trim(),
          probability: prize.probability,
          color: prize.color || "#FFD700",
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );
      updatedPrizes.push(updatedPrize);
    }

    res.json({
      success: true,
      message: "Prizes updated successfully.",
      data: { prizes: updatedPrizes },
    });
  } catch (error) {
    console.error("Update prizes error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating prizes.",
    });
  }
});

// Initialize default prizes (Development only)
router.post("/initialize", async (req, res) => {
  try {
    // Check if prizes already exist
    const existingPrizes = await Prize.countDocuments();
    if (existingPrizes > 0) {
      return res.status(400).json({
        success: false,
        message: "Prizes already initialized.",
      });
    }

    // Default prizes with equal probability
    const defaultPrizes = [
      { position: 1, name: "รางวัลที่ 1", probability: 12.5, color: "#FF6B6B" },
      { position: 2, name: "รางวัลที่ 2", probability: 12.5, color: "#FFD700" },
      { position: 3, name: "รางวัลที่ 3", probability: 12.5, color: "#FF6B6B" },
      { position: 4, name: "รางวัลที่ 4", probability: 12.5, color: "#FFD700" },
      { position: 5, name: "รางวัลที่ 5", probability: 12.5, color: "#FF6B6B" },
      { position: 6, name: "รางวัลที่ 6", probability: 12.5, color: "#FFD700" },
      { position: 7, name: "รางวัลที่ 7", probability: 12.5, color: "#FF6B6B" },
      { position: 8, name: "รางวัลที่ 8", probability: 12.5, color: "#FFD700" },
    ];

    await Prize.insertMany(defaultPrizes);

    res.status(201).json({
      success: true,
      message: "Default prizes initialized successfully.",
      data: { prizes: defaultPrizes },
    });
  } catch (error) {
    console.error("Initialize prizes error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while initializing prizes.",
    });
  }
});

module.exports = router;
