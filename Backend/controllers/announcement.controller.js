import Announcement from "../models/announcement.model.js";

// Create an announcement
export const createAnnouncement = async (req, res) => {
  try {
    const { content, isGlobal, category, expiryDate } = req.body;
    const userId = req.user.id;

    const announcement = new Announcement({
      sender: userId,
      content,
      isGlobal,
      category,
      expiryDate,
    });
    await announcement.save();
    res
      .status(201)
      .json({ message: "Announcement created successfully", announcement });
  } catch (error) {
    res.status(500).json({ message: "Error creating announcement", error });
  }
};

// Get all announcements
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate(
      "sender",
      "username avatar"
    );
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: "Error fetching announcements", error });
  }
};

// Delete an announcement
export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    await Announcement.findByIdAndDelete(announcementId);
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting announcement", error });
  }
};

// Update an announcement
export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const updates = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      announcementId,
      updates,
      { new: true }
    );
    res.json({ message: "Announcement updated successfully", announcement });
  } catch (error) {
    res.status(500).json({ message: "Error updating announcement", error });
  }
};
