import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import crypto from "crypto";

dotenv.config();

const createAdmin = async () => {
  const args = process.argv.slice(2);
  const [email, name, college, secretKey] = args;

  // Verify secret key
  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    console.error("Invalid secret key. Access denied.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = await User.create({
        email,
        name,
        college
        // Add other required fields from user schema
      });
    }

    // Generate unique admin code
    const adminCode = crypto.randomBytes(6).toString("hex");

    // Create admin entry
    const admin = await Admin.create({
      userId: user._id,
      college,
      adminCode
    });

    console.log("Admin created successfully!");
    console.log("Admin Code (keep this secure):", adminCode);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
