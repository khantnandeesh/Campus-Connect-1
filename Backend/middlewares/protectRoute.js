import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";

const protectRoute = async (req, res, next) => {
  try {
    // Check for admin token first, then user token
    const adminToken = req.cookies.adminAuthToken;
    const userToken = req.cookies.authToken;

    let token = null;
    let isAdminRequest = false;

    // Determine which token to use based on the route
    if (req.baseUrl.includes("/admin")) {
      if (!adminToken) {
        console.log("Admin route accessed without admin token");
        return res
          .status(401)
          .json({ error: "Unauthorized - Admin token required" });
      }
      token = adminToken;
      isAdminRequest = true;
    } else if (userToken) {
      token = userToken;
    } else {
      return res
        .status(401)
        .json({ error: "Unauthorized - No token provided" });
    }

    // console.log("Token type:", isAdminRequest ? "admin" : "user");
    // console.log("Token from cookies:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded token:", { id: decoded.id, isAdmin: decoded.isAdmin });

    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }

    // For admin routes, ensure the token is an admin token
    if (isAdminRequest) {
      if (!decoded.isAdmin) {
        console.log("Non-admin token used for admin route");
        return res
          .status(403)
          .json({ error: "Unauthorized - Admin access required" });
      }

      // Verify admin status in database
      const admin = await Admin.findOne({
        userId: decoded.id,
        adminCode: decoded.adminCode,
        isActive: true,
      });

      if (!admin) {
        console.log("Admin not found or inactive");
        return res
          .status(403)
          .json({ error: "Unauthorized - Invalid admin status" });
      }
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add user information from token to the request
    req.user = {
      ...user.toObject(),
      isAdmin: decoded.isAdmin || false,
      adminCode: decoded.adminCode,
      college: decoded.college,
    };

    console.log("User in protectRoute:", req.user);
    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Unauthorized - Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Unauthorized - Token expired" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export default protectRoute;
