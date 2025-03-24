import MentorApplication from "../models/MentorApplication.js";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";

// Remove the asyncHandler import and create a simple wrapper function
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const updateApplication = asyncHandler(async (req, res) => {
  const { skills, achievements, internships, spi } = req.body;
  const userId = req.user._id;

  console.log("Update request received:", {
    userId,
    skills,
    achievements,
    internships,
    spi
  });

  const allApplications = await MentorApplication.find({ studentId: userId });
  console.log("All applications for user:", allApplications);

  const application = await MentorApplication.findOne({
    studentId: userId,
    status: "pending"
  });

  if (!application) {
    console.log("No pending application found for user:", userId);
    return res.status(404).json({
      message: "No pending application found",
      details:
        "Please submit a new application or check your application status"
    });
  }

  console.log("Found application:", application);

  application.skills = skills;
  application.achievements = achievements;
  application.internships = internships;
  application.spi = spi;
  application.updatedAt = Date.now();

  const updatedApplication = await application.save();
  console.log("Application updated successfully:", updatedApplication);

  res.status(200).json({
    message: "Application updated successfully",
    application: updatedApplication
  });
});

export const getAllMentors = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const mentors = await Admin.find({
    college: user.collegename,
    isActive: true
  }).populate({
    path: "userId",
    select: "username email collegename"
  });

  const formattedMentors = mentors.map((mentor) => ({
    id: mentor._id,
    username: mentor.userId.username,
    email: mentor.userId.email,
    college: mentor.userId.collegename
  }));

  res.status(200).json(formattedMentors);
});

export const getMentorProfile = asyncHandler(async (req, res) => {
  const { mentorId } = req.params;

  const mentor = await Admin.findById(mentorId).populate({
    path: "userId",
    select: "username email collegename"
  });

  if (!mentor) {
    return res.status(404).json({ message: "Mentor not found" });
  }

  res.status(200).json({
    id: mentor._id,
    username: mentor.userId.username,
    email: mentor.userId.email,
    college: mentor.userId.collegename
  });
});

// @desc    Get all mentors from the same college
// @route   GET /api/mentors/college
// @access  Private
export const getMentorsFromCollege = asyncHandler(async (req, res) => {
  try {
    const { search } = req.body; // Get search from body
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // First find approved mentor applications from the same college
    let query = {
      status: "approved", // Only approved mentors
      studentId: { $ne: currentUser._id } // Exclude current user
    };

    // If search term exists, join with User model to search by email/username
    const mentorApplications = await MentorApplication.find(query).populate({
      path: "studentId",
      select: "username email collegename",
      match: search
        ? {
            $or: [
              { email: { $regex: search, $options: "i" } },
              { username: { $regex: search, $options: "i" } }
            ],
            collegename: currentUser.collegename
          }
        : { collegename: currentUser.collegename }
    });

    // Filter out applications where populate returned null (due to college mismatch)
    const mentors = mentorApplications
      .filter((app) => app.studentId !== null)
      .map((app) => ({
        _id: app.studentId._id,
        username: app.studentId.username,
        email: app.studentId.email,
        collegename: app.studentId.collegename,
        skills: app.skills,
        achievements: app.achievements,
        internships: app.internships,
        spi: app.spi,
        appliedAt: app.appliedAt,
        stars: app.stars,
        ratings: app.ratings,

      }));

    console.log("Mentors found:", mentors);
    res.status(200).json(mentors);
  } catch (error) {
    console.error("Error in getMentorsFromCollege:", error);
    res.status(500).json({ message: "Error fetching mentors" });
  }
});

export default {
  updateApplication,
  getAllMentors,
  getMentorProfile,
  getMentorsFromCollege
};
