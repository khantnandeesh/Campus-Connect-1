import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }


    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded",decoded);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// Export protect directly since it's the only middleware
export default protect;