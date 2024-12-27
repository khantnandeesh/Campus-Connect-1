import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/user.model.js";
import CollegeDomain from "../models/collegeDomain.js";

const router = express.Router();
let otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: "uzed ejob wfrv ylgd",
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/signup", async (req, res) => {
  const { username, password, email, collagename } = req.body;

  if (!username || !password || !email || !collagename) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password.length !== 8) {
    return res
      .status(400)
      .json({ message: "Password must be 8 characters long" });
  }

  try {
    const college = await CollegeDomain.findOne({ collagename });
    if (!college) {
      return res.status(400).json({ message: "College name is not valid" });
    }

    const domain = email.split("@")[1];
    if (domain !== college.domainname) {
      return res
        .status(400)
        .json({ message: `Email must end with @${college.domainname}` });
    }

    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "Username or email already taken" });
    }

    const otp = generateOTP();
    otpStore[email] = otp;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP is: ${otp}`,
    });

    res
      .status(200)
      .json({ message: "OTP sent to email. Verify to complete signup." });
  } catch (error) {
    res.status(500).json({ message: "Error during signup", error });
  }
});

router.post("/verify-signup", async (req, res) => {
  const { username, password, email, collagename, otp } = req.body;

  if (!otp || otpStore[email] !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      collagename,
    });

    await newUser.save();
    delete otpStore[email];

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving user", error });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const otp = generateOTP();
    otpStore[user.email] = otp;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Login OTP Verification",
      text: `Your OTP is: ${otp}`,
    });

    res.status(200).json({ message: "OTP sent to email. Verify to login." });
  } catch (error) {
    res.status(500).json({ message: "Error during login", error });
  }
});

router.post("/verify-login", async (req, res) => {
  const { username, otp } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user || otpStore[user.email] !== otp) {
      return res.status(400).json({ message: "Invalid OTP or user" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    delete otpStore[user.email];

    res.cookie("authToken", token, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error during OTP verification", error });
  }
});

const authenticateUser = (req, res, next) => {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

router.post("/api/auth/logout", (req, res) => {
  res.clearCookie("authToken", { httpOnly: true, sameSite: "Strict" });
  res.status(200).json({ message: "Logged out successfully" });
});

router.get("/dashboard", authenticateUser, async (req, res) => {
  try {
    res
      .status(200)
      .json({ message: "Welcome to the dashboard", user: req.user });
  } catch (error) {
    res.status(500).json({ message: "Error loading dashboard", error });
  }
});

export default router;
