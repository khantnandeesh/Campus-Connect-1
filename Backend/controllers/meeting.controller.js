import Meeting from "../models/meeting.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../utils/emailUtils.js";

export const scheduleMeeting = async (req, res) => {
  try {
    const { senderId, receiverId, title, description, date, time } = req.body;

    if (!senderId || !receiverId || !title || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

 
    const meetingDate = new Date(`${date}T${time}`);
    if (isNaN(meetingDate.getTime())) {
      return res.status(400).json({ error: "Invalid date or time format" });
    }

    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "Sender or receiver not found" });
    }

    const meeting = new Meeting({
      title,
      description: description || "No description provided",
      date: meetingDate,
      senderId,
      receiverId,
      status: "pending"
    });

    await meeting.save();

    // Send email to receiver
    const emailHtml = `
      <h2>New Meeting Request</h2>
      <p>You have received a meeting request from ${
        sender.name || sender.email
      }</p>
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Description:</strong> ${
        description || "No description provided"
      }</p>
      <p><strong>Date & Time:</strong> ${meetingDate.toLocaleString()}</p>
    `;

    await sendEmail({
      to: receiver.email,
      subject: "New Meeting Request",
      html: emailHtml
    });

    res.status(201).json({
      meeting: {
        ...meeting.toObject(),
        date: date,
        time: time
      }
    });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    res.status(500).json({
      error: "Failed to schedule meeting",
      details: error.message
    });
  }
};

export const respondToMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId, accepted } = req.body;

    if (!meetingId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Update meeting status
    meeting.status = accepted ? "accepted" : "declined";
    meeting.responses = meeting.responses || [];
    meeting.responses.push({
      userId,
      accepted,
      respondedAt: new Date()
    });

    await meeting.save();

    // If accepted, send confirmation emails to both parties
    if (accepted) {
      const [sender, receiver] = await Promise.all([
        User.findById(meeting.senderId),
        User.findById(meeting.receiverId)
      ]);

      if (sender && receiver) {
        const confirmationHtml = `
          <h2>Meeting Confirmed</h2>
          <p>The meeting has been confirmed by all participants.</p>
          <p><strong>Title:</strong> ${meeting.title}</p>
          <p><strong>Description:</strong> ${
            meeting.description || "No description provided"
          }</p>
          <p><strong>Date & Time:</strong> ${meeting.date.toLocaleString()}</p>
        `;

        // Send confirmation emails to both sender and receiver
        await Promise.all([
          sendEmail({
            to: sender.email,
            subject: "Meeting Confirmed",
            html: confirmationHtml
          }),
          sendEmail({
            to: receiver.email,
            subject: "Meeting Confirmed",
            html: confirmationHtml
          })
        ]);
      }
    }

    res.json({
      meeting: {
        ...meeting.toObject(),
        date: meeting.date.toISOString().split("T")[0],
        time: meeting.date.toTimeString().split(" ")[0].slice(0, 5)
      }
    });
  } catch (error) {
    console.error("Error responding to meeting:", error);
    res.status(500).json({
      error: "Failed to respond to meeting",
      details: error.message
    });
  }
};

export const getMeetings = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find meetings where user is either sender or receiver
    const meetings = await Meeting.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ date: 1 });

    // Format the meetings to include separate date and time fields
    const formattedMeetings = meetings.map((meeting) => ({
      ...meeting.toObject(),
      date: meeting.date.toISOString().split("T")[0],
      time: meeting.date.toTimeString().split(" ")[0].slice(0, 5)
    }));

    res.json({ meetings: formattedMeetings });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({
      error: "Failed to fetch meetings",
      details: error.message
    });
  }
};
