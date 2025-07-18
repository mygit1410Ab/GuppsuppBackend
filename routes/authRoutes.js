const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// @route   POST api/auth/signup
// @desc    Register user
router.post("/signup", authController.signup);

// @route   POST api/auth/login
// @desc    Login user
router.post("/login", authController.login);

router.post("/verify-otp", authController.verifyOTP);

module.exports = router;
