const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ================= SIGNUP =================
exports.signup = async (req, res) => {
  try {
    const { name, username, phone, email, password } = req.body;
    if (!name || !username || !phone || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
   
    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message:
          "Username can only contain letters, numbers, and underscore",
      });
    }
    //  Phone validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits",
      });
    }
    // Email validation (NEW 🔥)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }
    //  Check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }, { username }],
    });

    if (existingUser) {
      let message = "User already exists";
      if (existingUser.email === email)
        message = "Email already in use";
      else if (existingUser.phone === phone)
        message = "Phone already in use";
      else if (existingUser.username === username)
        message = "Username already taken";

      return res.status(400).json({ message });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      username,
      phone,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Signup successful",
      userId: user._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Username already exists" });
    }
    res.status(500).json({ error: error.message });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { username: identifier },
      ],
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ================= SEND EMAIL OTP =================
exports.forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes</p>`,
    });

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= SEND PHONE OTP =================
exports.forgotPasswordPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Phone not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    // For now console log OTP (later connect MSG91/Twilio)
    console.log("Phone OTP:", otp);

    res.json({
      message: "OTP sent to phone",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= VERIFY OTP =================
exports.verifyResetOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
      otp,
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

