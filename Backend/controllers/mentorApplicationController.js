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

// Update mentor application stars
export const updateApplicationStars = async (req, res) => {
  try {
    const { applicationId, stars } = req.body;
    const userId = req.user._id;
    const application = await MentorApplication.findOne({studentId:applicationId});
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }
    // Check if the user has already rated
    const existingRating = application.ratings.find(
      (rating) => rating.userId.toString() == userId.toString()
    );
    console.log("existingRating",existingRating);
    
    if (existingRating) {
      // existingRating.stars = stars; // Update the existing rating
      return res.status(400).json({ message: "You have already rated this mentor" });
    } else {
      application.ratings.push({ userId, stars }); // Add a new rating
    }

    let avgRating = 0;
    application.ratings.forEach(rating => {
      avgRating += rating.stars;
    });
    avgRating = avgRating / application.ratings.length;
    application.stars = avgRating/application.ratings.length;
    await application.save();
    res
      .status(200)
      .json({ message: "Stars updated successfully", application });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating stars", error: error.message });
  }
};
