import MentorApplication from "../models/MentorApplication.js";
import User from "../models/user.model.js";

// Submit mentor application
export const submitApplication = async (req, res) => {
  console.log("insided submit application");
  
  try {
    const { skills, achievements, internships, spi } = req.body;
    const userId = req.user._id; // From auth middleware
    const user = await User.findById(userId);
    console.log(user);
    
    // Check if user has already applied
    const existingApplication = await MentorApplication.findOne({
      studentId: userId
    });
    if (existingApplication) {
      return res
        .status(400)
        .json({ message: "You have already submitted an application" });
    }

    const application = new MentorApplication({
      studentId: userId,
      college: user.collegename,
      skills,
      achievements,
      internships,
      spi
    });

    await application.save();
    res
      .status(201)
      .json({ message: "Application submitted successfully", application });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error submitting application", error: error.message });
  }
};

// Get user's application status
export const getApplicationStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const application = await MentorApplication.findOne({ studentId: userId });
    if (!application) {
      return res.status(404).json({ message: "No application found" });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching application status",
      error: error.message
    });
  }
};
