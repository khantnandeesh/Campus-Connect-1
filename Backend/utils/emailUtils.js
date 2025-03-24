import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Meeting from "../models/meeting.model.js";
import User from "../models/user.model.js";
dotenv.config();

// Validate email configuration
const validateEmailConfig = () => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "⚠️ Email credentials not configured. Email notifications will be disabled."
    );
    return false;
  }
  return true;
};

// Create transporter only if credentials are available
const createTransporter = () => {
  if (!validateEmailConfig()) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const transporter = createTransporter();

export const sendEmail = async ({ to, subject, html }) => {
  try {
    // If transporter is not configured, log a message and return
    if (!transporter) {
      console.log("Email notification skipped: Email service not configured");
      return null;
    }

    if (!to || !subject || !html) {
      throw new Error("Missing required email parameters");
    }

    console.log("Sending email to:", to);
    console.log("Subject:", subject);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    // Don't throw the error, just log it and continue
    return null;
  }
};


export async function sendMeetingLinkEmail(meetingLink, to) {
  mee
  const subject = "Meeting Link";
  const html = `
    <p>Code for the meeting !</p>
   <p> THis is he meeting code for call 
  `;
  sendEmail({ to, subject, html });
}






