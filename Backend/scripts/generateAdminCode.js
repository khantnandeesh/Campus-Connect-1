import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from the Backend directory
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/collage";

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendAdminCodeEmail = async (email, adminCode, college) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Admin Access Code for Mentor Application System",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5, #3b82f6); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Admin Panel</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0;">Mentor Application System</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 30px 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                You have been granted admin access for <strong>${college}</strong>.
              </p>

              <!-- Credentials Card -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">Your Admin Credentials</h2>
                <div style="margin-bottom: 12px;">
                  <span style="color: #64748b; font-size: 14px;">Email:</span>
                  <strong style="color: #334155; display: block; margin-top: 4px;">${email}</strong>
                </div>
                <div>
                  <span style="color: #64748b; font-size: 14px;">Admin Code:</span>
                  <strong style="color: #334155; display: block; margin-top: 4px; font-family: monospace; font-size: 16px; background: #e2e8f0; padding: 8px; border-radius: 4px;">${adminCode}</strong>
                </div>
              </div>

              <!-- Instructions Card -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">Login Instructions</h2>
                <ol style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;">Navigate to the admin login page</li>
                  <li style="margin-bottom: 8px;">Enter your registered email address</li>
                  <li style="margin-bottom: 8px;">Enter your account password</li>
                  <li style="margin-bottom: 8px;">Enter the admin code shown above</li>
                </ol>
              </div>

              <!-- Security Notice -->
              <div style="background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">Important Security Notice</h2>
                <p style="color: #b91c1c; font-size: 14px; line-height: 1.6; margin: 0;">
                  Keep your admin code secure and confidential. Never share it with anyone. This code grants administrative access to the system.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Best regards,<br>
                <strong style="color: #334155;">Developer Team</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Admin code email sent successfully!");
  } catch (error) {
    console.error("Error sending admin code email:", error);
    throw error;
  }
};

const generateAdminCode = async () => {
  const args = process.argv.slice(2);
  const [email, college] = args;

  if (!email || !college) {
    console.error("Please provide both email and college");
    console.log("Usage: node generateAdminCode.js <email> <college>");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      console.error("User not found. Please ensure the user exists first.");
      process.exit(1);
    }

    // Check if user is already an admin
    const existingAdmin = await Admin.findOne({ userId: user._id });
    if (existingAdmin) {
      console.error("This user is already an admin.");
      process.exit(1);
    }

    // Generate unique admin code
    const adminCode = crypto.randomBytes(6).toString("hex");

    // Create admin entry
    const admin = await Admin.create({
      userId: user._id,
      college,
      adminCode
    });

    // Send email with admin code
    await sendAdminCodeEmail(email, adminCode, college);

    console.log("\n=== Admin Access Generated Successfully ===");
    console.log("Email:", email);
    console.log("College:", college);
    console.log("Admin Code:", adminCode);
    console.log("\nIMPORTANT: Admin code has been sent to the user's email");
    console.log("This code will be required for admin login\n");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("Error generating admin code:", error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

// Handle script termination
process.on("SIGINT", async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  process.exit(0);
});

generateAdminCode();
