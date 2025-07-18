const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// In-memory store for pending OTP verifications
const pendingUsers = new Map(); // email => { userData, otp }

// Utility: Generate OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Utility: Send OTP email
const sendOTPEmail = async (email, otp) => {
  console.log(otp);
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
    subject: "Your Verification OTP",
    text: `Your OTP is: ${otp}`,
  });
};

// Utility: Validate email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ✅ SIGNUP
exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ status: false, message: "All fields are required." });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid email format." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ status: false, message: "Passwords do not match." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.verified) {
      return res.status(400).json({
        status: false,
        message: "User already registered and verified.",
      });
    }

    if (pendingUsers.has(email)) {
      return res.status(400).json({
        status: false,
        message: "OTP already sent. Please check your email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    pendingUsers.set(email, {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      otp,
    });

    await sendOTPEmail(email, otp);

    return res
      .status(200)
      .json({ status: true, message: "OTP sent to email. Please verify." });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// ✅ VERIFY OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ status: false, message: "Email and OTP are required." });
    }

    const pending = pendingUsers.get(email);

    if (!pending) {
      return res.status(400).json({
        status: false,
        message: "No pending registration for this email.",
      });
    }

    if (pending.otp !== otp) {
      return res.status(400).json({ status: false, message: "Invalid OTP." });
    }

    // Prevent duplicate verified accounts
    let user = await User.findOne({ email });

    if (user && user.verified) {
      return res
        .status(400)
        .json({ status: false, message: "User already verified." });
    }

    if (!user) {
      user = new User({
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email,
        password: pending.password,
        verified: true,
      });
    } else {
      user.verified = true;
      user.password = pending.password; // update password if needed
    }

    await user.save();
    pendingUsers.delete(email);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    return res.status(200).json({
      status: true,
      message: "OTP verified. Account created.",
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          image: user.image,
          about: user.about,
          mobile: user.mobile,
        },
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// ✅ LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: false, message: "Email and password are required." });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid email format." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid credentials." });
    }

    console.log("User verified status:", user.verified);
    if (!user.verified) {
      return res.status(403).json({
        status: false,
        message: "Account not verified. Please check your email.",
        data: { email: user.email },
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    return res.status(200).json({
      status: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          image: user.image,
          about: user.about,
          mobile: user.mobile,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
