import MentorApplication from "../models/MentorApplication.js";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/emailUtils.js";

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password, adminCode } = req.body;
    console.log("Admin login attempt for:", email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    try {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        console.log("Invalid password for user:", email);
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (passwordError) {
      console.error("Password match error:", passwordError);
      return res.status(500).json({ message: "Error verifying credentials" });
    }

    // Check if user is an admin
    const admin = await Admin.findOne({
      userId: user._id,
      adminCode,
      isActive: true
    });

    if (!admin) {
      console.log("Invalid admin credentials for user:", email);
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    console.log("Admin found:", admin);

    // Create token
    const token = jwt.sign(
      {
        id: user._id,
        isAdmin: true,
        college: admin.college,
        adminCode: admin.adminCode
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie with appropriate settings for local development
    res.cookie("adminAuthToken", token, {
      httpOnly: true,
      secure: false, // Set to false for local development
      sameSite: "lax", // Changed to lax for local development
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    console.log("Login successful, sending response");
    res.status(200).json({
      message: "Login successful",
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        college: admin.college
      }
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res
      .status(500)
      .json({ message: "Error during login", error: error.message });
  }
};

// Admin Signout
export const adminSignout = async (req, res) => {
  try {
    // Clear the admin auth cookie
    res.cookie("adminAuthToken", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });

    res.status(200).json({ message: "Admin signed out successfully" });
  } catch (error) {
    console.error("Admin signout error:", error);
    res.status(500).json({ message: "Error during signout" });
  }
};

// Get all mentor applications (college-specific)
export const getAllApplications = async (req, res) => {
  try {
    // Verify admin
    console.log("Getting applications for admin:", {
      userId: req.user._id,
      adminCode: req.user.adminCode,
      college: req.user.college
    });

    const admin = await Admin.findOne({
      userId: req.user._id,
      adminCode: req.user.adminCode,
      isActive: true
    });

    if (!admin) {
      console.log("Admin not found or inactive");
      return res.status(403).json({ message: "Not authorized" });
    }

    console.log("Admin verified:", {
      college: admin.college,
      isActive: admin.isActive
    });

    // First get all applications without filtering
    const allApplications = await MentorApplication.find();

    // Now get applications with population
    const applications = await MentorApplication.find()
      .populate({
        path: "studentId",
        select: "name email college isActive"
      })
      .select("studentId skills spi status createdAt feedback college")
      .sort({ createdAt: -1 });

    console.log("Applications after population:", applications);

    // Filter applications by college
    const collegeApplications = applications.filter((app) => {
      const isValid = app.studentId && app.college == admin.college;
      if (!isValid) {
        console.log("Filtered out application:", {
          id: app._id,
          reason: !app.studentId ? "No studentId" : "College mismatch",
          studentCollege: app.studentId?.college,
          adminCollege: admin.college
        });
      }
      return isValid;
    });

    console.log("Final college-specific applications:", {
      total: collegeApplications.length,
      college: admin.college,
      applications: collegeApplications.map((app) => ({
        id: app._id,
        status: app.status,
        studentName: app.studentId.name,
        college: app.studentId.college
      }))
    });

    res.status(200).json(collegeApplications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      message: "Error fetching applications",
      error: error.message
    });
  }
};

// Update application status (approve/reject)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId, status, feedback } = req.body;
    console.log("Processing application status update:", {
      applicationId,
      status
    });

    // Verify admin with detailed logging
    const admin = await Admin.findOne({
      userId: req.user._id,
      adminCode: req.user.adminCode,
      isActive: true
    });

    console.log("Admin check:", {
      found: !!admin,
      adminCollege: admin?.college,
      isActive: admin?.isActive
    });

    if (!admin) {
      return res.status(401).json({ message: "Admin verification failed" });
    }

    // Find application with detailed logging
    const application = await MentorApplication.findById(
      applicationId
    ).populate({
      path: "studentId",
      select: "name email college"
    });

    console.log("Application found:", {
      found: !!application,
      applicationId,
      studentCollege: application?.studentId?.college,
      adminCollege: admin.college,
      studentId: application?.studentId?._id
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Debug college comparison
    console.log("College comparison:", {
      studentCollege: application.studentId?.college,
      adminCollege: admin.college,
      match: application.studentId?.college === admin.college,
      studentCollegeType: typeof application.studentId?.college,
      adminCollegeType: typeof admin.college
    });

    // Updated college comparison with trimming and case normalization
    console.log("collge is -", admin.college);
    console.log("collge is -", application);

    const studentCollege = application.college?.trim().toLowerCase();
    const adminCollege = admin.college?.trim().toLowerCase();

    if (studentCollege != adminCollege) {
      console.log("College mismatch:", {
        studentCollege,
        adminCollege
      });
      return res.status(403).json({
        message: "Not authorized to update this application",
        debug: {
          studentCollege,
          adminCollege
        }
      });
    }

    // Update application
    application.status = status;
    if (feedback) {
      application.feedback = feedback;
    }
    application.updatedAt = Date.now();

    const updatedApplication = await application.save();

    // Send email notification
    let emailSent = false;
    try {
      // Create a more detailed and formatted email
      const emailSubject = `Mentor Application ${
        status === "approved" ? "Approved! 🎉" : "Status Update"
      }`;

      const emailBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                .header {
                    background-color: ${
                      status === "approved" ? "#4CAF50" : "#f44336"
                    };
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px;
                }
                .content {
                    background-color: white;
                    padding: 20px;
                    border-radius: 5px;
                    margin-top: 20px;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Application ${status.toUpperCase()}</h1>
                </div>
                <div class="content">
                    <p>Dear ${application.studentId.name},</p>
                    
                    ${
                      status === "approved"
                        ? `
                        <p>Congratulations! 🎉 Your mentor application has been approved. We're excited to have you join our mentorship program.</p>
                        <p>As a mentor, you will have the opportunity to guide and support other students in their academic journey.</p>
                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>You will receive additional information about your mentorship responsibilities</li>
                            <li>Watch for upcoming mentor orientation details</li>
                            <li>Prepare to connect with your assigned mentees</li>
                        </ul>
                    `
                        : `
                        <p>Thank you for your interest in our mentorship program. After careful review, we regret to inform you that your application has not been approved at this time.</p>
                        <p>We encourage you to:</p>
                        <ul>
                            <li>Continue developing your academic and leadership skills</li>
                            <li>Consider applying again in the future</li>
                            <li>Seek other opportunities to contribute to our academic community</li>
                        </ul>
                    `
                    }
                    
                    ${
                      feedback
                        ? `
                        <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #2196F3;">
                            <p><strong>Feedback from the Review Committee:</strong></p>
                            <p>${feedback}</p>
                        </div>
                    `
                        : ""
                    }
                    
                    <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
                </div>
                <div class="footer">
                    <p>Best regards,</p>
                    <p>The Mentorship Program Team</p>
                    <p>${application.studentId.college}</p>
                </div>
            </div>
        </body>
        </html>
    `;

      await sendEmail(application.studentId.email, emailSubject, emailBody);
      emailSent = true;
      console.log(
        "Status update email sent successfully to:",
        application.studentId.email
      );
    } catch (emailError) {
      console.error("Failed to send status update email:", emailError);
      // Continue with the response even if email fails
    }

    res.status(200).json({
      message: `Application ${status} successfully${
        emailSent
          ? " and notification email sent"
          : " (email notification failed)"
      }`,
      application: updatedApplication,
      emailSent
    });
  } catch (error) {
    console.error("Application status update error:", error);
    res.status(500).json({
      message: "Failed to update application status",
      error: error.message
    });
  }
};

// Get application statistics (college-specific)
export const getApplicationStats = async (req, res) => {
  try {
    // Verify admin
    console.log("Getting stats for admin:", {
      userId: req.user._id,
      adminCode: req.user.adminCode,
      college: req.user.college
    });

    const admin = await Admin.findOne({
      userId: req.user._id,
      adminCode: req.user.adminCode,
      isActive: true
    });

    if (!admin) {
      console.log("Admin not found or inactive");
      return res.status(403).json({ message: "Not authorized" });
    }

    console.log("Admin verified:", {
      college: admin.college,
      isActive: admin.isActive
    });

    const applications = await MentorApplication.find().populate(
      "studentId",
      "college"
    );

    console.log("Total applications found:", applications.length);

    // Filter applications by college
    const collegeApplications = applications.filter(
      (app) => app.studentId.college === admin.college
    );

    console.log("College-specific applications:", {
      total: collegeApplications.length,
      college: admin.college
    });

    // Calculate stats for college-specific applications
    const stats = collegeApplications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    console.log("Calculated stats:", stats);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching application stats:", error);
    res.status(500).json({
      message: "Error fetching application statistics",
      error: error.message
    });
  }
};

// Verify admin authentication
export const verifyAdmin = async (req, res) => {
  try {
    // Get token from cookies
    const token = req.cookies.adminAuthToken;
    console.log("Verifying admin token:", token ? "Token exists" : "No token");

    if (!token) {
      console.log("No admin token found");
      return res.status(401).json({ isAuthenticated: false });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", {
      id: decoded.id,
      isAdmin: decoded.isAdmin,
      college: decoded.college
    });

    if (!decoded || !decoded.isAdmin) {
      console.log("Token invalid or not admin token");
      return res.status(401).json({ isAuthenticated: false });
    }

    // Check if admin still exists and is active
    const admin = await Admin.findOne({
      userId: decoded.id,
      adminCode: decoded.adminCode,
      isActive: true
    }).populate("userId", "name email");

    if (!admin) {
      console.log("Admin not found or inactive");
      return res.status(401).json({ isAuthenticated: false });
    }

    console.log("Admin verified successfully:", {
      college: admin.college,
      isActive: admin.isActive
    });

    res.status(200).json({
      isAuthenticated: true,
      admin: {
        id: decoded.id,
        name: admin.userId.name,
        email: admin.userId.email,
        college: admin.college,
        adminCode: decoded.adminCode
      }
    });
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(401).json({ isAuthenticated: false });
  }
};

// Get users from the same college
export const getCollegeUsers = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      userId: req.user._id,
      isActive: true
    });

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get users from the same college who aren't already mentors
    const users = await User.find({
      college: admin.college,
      _id: {
        $nin: await Admin.distinct("userId") // Exclude existing mentors
      }
    }).select("name email spi college");

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching college users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Forward a user to become a mentor
export const forwardMentor = async (req, res) => {
  try {
    const { userId } = req.body;

    const admin = await Admin.findOne({
      userId: req.user._id,
      isActive: true
    });

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify same college
    if (user.college !== admin.college) {
      return res
        .status(403)
        .json({ message: "Can only forward users from your college" });
    }

    // Generate admin code
    const adminCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create new admin
    const newAdmin = new Admin({
      userId: user._id,
      college: user.college,
      adminCode,
      isActive: true
    });

    await newAdmin.save();

    // Send email to new mentor
    const emailSubject = "You've Been Made a Mentor! 🎉";
    const emailBody = `
            <h2>Congratulations ${user.name}!</h2>
            <p>You have been selected as a admin for your college.</p>
            <p>Your admin code is: <strong>${adminCode}</strong></p>
            <p>Please use this code to log in to the admin portal.</p>
        `;

    await sendEmail(user.email, emailSubject, emailBody);

    res.status(200).json({
      message: "Successfully created new mentor",
      name: user.name
    });
  } catch (error) {
    console.error("Error forwarding mentor:", error);
    res.status(500).json({ message: "Error creating mentor" });
  }
};

// Get all non-mentor users from the same college
export const getNonMentorUsers = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      userId: req.user._id,
      isActive: true
    });

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const existingAdminIds = await Admin.distinct("userId");

    const users = await User.find({
      _id: { $nin: existingAdminIds },
      collegename: admin.college
    }).select("username email collegename");

    console.log("Non-admin users found:", users.length);
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching non-admin users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Create a new mentor
export const createMentor = async (req, res) => {
  try {
    const { userId, email } = req.body;

    // Verify admin
    const admin = await Admin.findOne({
      userId: req.user._id,
      isActive: true
    });

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Generate admin code
    const adminCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create new admin
    const newAdmin = new Admin({
      userId,
      adminCode,
      isActive: true
    });

    await newAdmin.save();

    // Send email to new mentor
    const emailSubject = "You've Been Made a Mentor! 🎉";
    const emailBody = `
            <h2>Congratulations!</h2>
            <p>You have been selected as a mentor.</p>
            <p>Your admin code is: <strong>${adminCode}</strong></p>
            <p>Please use this code to log in to the mentor portal.</p>
        `;

    await sendEmail(email, emailSubject, emailBody);

    res.status(200).json({
      message: "Successfully created new mentor and sent notification email",
      adminCode
    });
  } catch (error) {
    console.error("Error creating mentor:", error);
    res.status(500).json({ message: "Error creating mentor" });
  }
};

// Update the searchUsers function
export const searchUsers = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    console.log("Searching users by email:", searchTerm);

    const admin = await Admin.findOne({
      userId: req.user._id,
      isActive: true
    });

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Get all existing admin IDs
    const existingAdminIds = await Admin.distinct("userId");

    // Create search query
    const searchQuery = {
      _id: { $nin: existingAdminIds }, // Exclude existing admins
      collegename: admin.college, // Match college
      email: { $regex: searchTerm, $options: "i" } // Case-insensitive email search
    };

    const users = await User.find(searchQuery)
      .select("username email collegename") // Updated fields
      .limit(5); // Increased limit for better results

    console.log(
      `Found ${users.length} non-admin users matching email:`,
      searchTerm
    );

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Error searching users" });
  }
};

// Add this export function
export const createAdmin = async (req, res) => {
  try {
    const { userId, email } = req.body;

    // Verify admin
    const admin = await Admin.findOne({
      userId: req.user._id,
      isActive: true
    });

    if (!admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Check if user already is an admin
    const existingAdmin = await Admin.findOne({ userId });
    if (existingAdmin) {
      return res.status(400).json({ message: "User is already an admin" });
    }

    // Generate admin code
    const adminCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create new admin
    const newAdmin = new Admin({
      userId,
      adminCode,
      isActive: true,
      college: admin.college
    });

    await newAdmin.save();

    // Send email with professional template
    const emailSubject = "Administrative Access Granted 🎉";
    const emailBody = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f9f9f9;
                    }
                    .header {
                        background-color: #4CAF50;
                        color: white;
                        padding: 20px;
                        text-align: center;
                        border-radius: 5px;
                        margin-bottom: 20px;
                    }
                    .content {
                        background-color: white;
                        padding: 30px;
                        border-radius: 5px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    .credentials-box {
                        background-color: #f8f9fa;
                        border-left: 4px solid #4CAF50;
                        padding: 20px;
                        margin: 20px 0;
                        border-radius: 0 5px 5px 0;
                    }
                    .steps {
                        background-color: #fff;
                        padding: 20px;
                        border-radius: 5px;
                        margin: 20px 0;
                    }
                    .step {
                        margin: 10px 0;
                        padding: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        padding: 20px;
                        color: #666;
                        border-top: 1px solid #eee;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 24px;
                        background-color: #4CAF50;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .important-note {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 0 5px 5px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to the Administrative Team! 🎉</h1>
                    </div>
                    <div class="content">
                        <p>Dear Administrator,</p>
                        
                        <p>Congratulations! You have been granted administrative access to the Mentorship Portal. This role comes with important responsibilities and privileges to help manage and oversee the mentorship program at your institution.</p>

                        <div class="credentials-box">
                            <h2 style="color: #2c3e50; margin-top: 0;">Your Administrative Credentials</h2>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Admin Code:</strong> <span style="color: #4CAF50; font-weight: bold; font-size: 1.1em;">${adminCode}</span></p>
                            <p><strong>College:</strong> ${admin.college}</p>
                        </div>

                        <div class="steps">
                            <h3 style="color: #2c3e50;">Getting Started</h3>
                            <div class="step">
                                <p>1. Visit the admin login page</p>
                            </div>
                            <div class="step">
                                <p>2. Enter your registered email address</p>
                            </div>
                            <div class="step">
                                <p>3. Use your existing password</p>
                            </div>
                            <div class="step">
                                <p>4. Enter your admin code when prompted</p>
                            </div>
                        </div>

                        <div class="important-note">
                            <h3 style="color: #856404; margin-top: 0;">Important Security Notice</h3>
                            <p>Please keep your admin code secure and confidential. This code grants administrative access to the portal.</p>
                        </div>

                        <h3 style="color: #2c3e50;">Your Administrative Capabilities</h3>
                        <ul style="color: #555;">
                            <li>Review and manage mentor applications</li>
                            <li>Access detailed statistics and reports</li>
                            <li>Forward admin access to other qualified users</li>
                            <li>Monitor and manage mentorship activities</li>
                        </ul>

                        <p style="margin-top: 20px;">For any questions or assistance, please don't hesitate to contact the system administrator.</p>

                        <a href="/admin/login" class="button">
                            Access Admin Portal
                        </a>
                    </div>
                    <div class="footer">
                        <p>Best regards,</p>
                        <p>The Mentorship Portal Team</p>
                        <p>${admin.college}</p>
                        <p style="font-size: 0.8em; color: #999; margin-top: 20px;">
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

    await sendEmail(email, emailSubject, emailBody);

    res.status(200).json({
      message: "Successfully created new admin and sent notification email",
      adminCode
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Error creating admin" });
  }
};
