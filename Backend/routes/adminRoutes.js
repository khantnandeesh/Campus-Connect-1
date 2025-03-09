import express from "express";
import {
  getAllApplications,
  updateApplicationStatus,
  getApplicationStats,
  adminLogin,
  adminSignout,
  verifyAdmin,
  getCollegeUsers,
  forwardMentor,
  getNonMentorUsers,
  createMentor,
  searchUsers,
  createAdmin
} from "../controllers/adminController.js";
import protectRoute from "../middlewares/protectRoute.js";
import Admin from "../models/admin.model.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Admin middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  console.log("inside isAdmin middleware");

  try {
    console.log("Checking admin status for user:", req.user);

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const admin = await Admin.findOne({
      userId: req.user._id,
      adminCode: req.user.adminCode,
      isActive: true
    });

    if (!admin) {
      console.log("Admin not found or inactive");
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    console.log("Admin verified:", admin);
    req.admin = admin; // Attach admin info to request
    next();
  } catch (error) {
    console.error("Error in admin middleware:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check if user is already logged in
const checkNotLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies.adminAuthToken;
    if (token) {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.isAdmin) {
        return res.status(400).json({
          message: "Already logged in as admin. Please sign out first."
        });
      }
    }
    next();
  } catch (error) {
    // If token is invalid or expired, allow access to login
    next();
  }
};

// Public routes
router.post("/login", checkNotLoggedIn, adminLogin);
router.post("/signout", adminSignout);
router.get("/verify", verifyAdmin);

// Protected routes
router.get("/applications", protectRoute, isAdmin, getAllApplications);
router.put(
  "/applications/status",
  protectRoute,
  isAdmin,
  updateApplicationStatus
);
router.get("/stats", protectRoute, isAdmin, getApplicationStats);
router.get("/college-users", protectRoute, getCollegeUsers);
router.post("/forward-mentor", protectRoute, forwardMentor);
router.get("/non-mentor-users", protectRoute, isAdmin, getNonMentorUsers);
router.post("/create-admin", protectRoute, isAdmin, createAdmin);
router.get("/search-users", protectRoute, isAdmin, searchUsers);

export default router;
