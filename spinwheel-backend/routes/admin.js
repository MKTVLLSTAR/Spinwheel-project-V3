const express = require("express");
const { Admin } = require("../models");
const { verifyToken, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();

// Get all admins (SuperAdmin only)
router.get("/", verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.find()
      .select("-password")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { admins },
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching admins.",
    });
  }
});

// Create new admin (SuperAdmin only)
router.post("/", verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, password, role = "admin" } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters long.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Check if username already exists
    const existingAdmin = await Admin.findOne({
      username: username.toLowerCase(),
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Prevent creating multiple superadmins
    if (role === "superadmin") {
      const existingSuperAdmin = await Admin.findOne({ role: "superadmin" });
      if (existingSuperAdmin) {
        return res.status(400).json({
          success: false,
          message: "Only one SuperAdmin is allowed.",
        });
      }
    }

    // Create new admin
    const newAdmin = new Admin({
      username: username.toLowerCase(),
      password,
      role,
      createdBy: req.admin._id,
    });

    await newAdmin.save();

    // Return admin without password
    const adminResponse = {
      id: newAdmin._id,
      username: newAdmin.username,
      role: newAdmin.role,
      createdBy: req.admin.username,
      createdAt: newAdmin.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "Admin created successfully.",
      data: { admin: adminResponse },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error while creating admin.",
    });
  }
});

// Delete admin (SuperAdmin only)
router.delete("/:id", verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find admin to delete
    const adminToDelete = await Admin.findById(id);
    if (!adminToDelete) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // Prevent deleting SuperAdmin
    if (adminToDelete.role === "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete SuperAdmin.",
      });
    }

    // Prevent deleting oneself
    if (adminToDelete._id.toString() === req.admin._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete yourself.",
      });
    }

    await Admin.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Admin deleted successfully.",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting admin.",
    });
  }
});

// Update admin password (SuperAdmin only)
router.patch(
  "/:id/password",
  verifyToken,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long.",
        });
      }

      const admin = await Admin.findById(id);
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found.",
        });
      }

      admin.password = password;
      await admin.save();

      res.json({
        success: true,
        message: "Admin password updated successfully.",
      });
    } catch (error) {
      console.error("Update admin password error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating password.",
      });
    }
  }
);

module.exports = router;
