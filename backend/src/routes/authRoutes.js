const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  forgotPasswordEmail,
  forgotPasswordPhone,
  verifyResetOtp,
  resetPassword
} = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);

router.post("/forgot-password/email", forgotPasswordEmail);
router.post("/forgot-password/phone", forgotPasswordPhone);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
